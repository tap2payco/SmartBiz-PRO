import 'dotenv/config';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { authMiddleware } from './middleware/auth';

import { User } from '@supabase/supabase-js';
import { Profile } from '@smartbiz/shared';

// Define context variables
type Variables = {
    user: User;
    profile: Profile | null;
    organizationId: string | null;
};

import { requestId } from 'hono/request-id';
import { timing } from 'hono/timing';

const app = new Hono<Variables>();

// Middleware
// 1. Request ID and Timing (Industrial traceability)
app.use('*', requestId());
app.use('*', timing());

// 1.5 Rate Limiting (Industrial protection)
const rateLimitMap = new Map<string, { count: number, reset: number }>();
app.use('*', async (c, next) => {
    const ip = c.req.header('x-forwarded-for') || 'local';
    const now = Date.now();
    const limit = 100; // 100 requests per minute
    const window = 60 * 1000;

    const record = rateLimitMap.get(ip) || { count: 0, reset: now + window };
    
    if (now > record.reset) {
        record.count = 1;
        record.reset = now + window;
    } else {
        record.count++;
    }
    
    rateLimitMap.set(ip, record);

    if (record.count > limit) {
        return c.json({ success: false, error: 'Too Many Requests', message: 'Rate limit exceeded' }, 429);
    }
    
    await next();
});

// 2. CORS MUST be first to handle OPTIONS preflight
app.use('*', cors({
    origin: (origin) => {
        if (!origin) return 'https://smartbiz-pro.onrender.com';
        if (origin === 'https://smart-biz-pro-web.vercel.app' ||
            origin?.endsWith('.vercel.app') ||
            origin?.endsWith('.onrender.com') ||
            origin?.includes('localhost')) {
            return origin;
        }
        return 'https://smartbiz-pro.onrender.com';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
    exposeHeaders: ['Content-Length', 'X-Request-ID'],
    maxAge: 600,
    credentials: true,
}));

// 3. Handle OPTIONS globally
app.options('*', (c) => c.body(null, 204));

// 4. Industrial Logger & Response Wrapper
app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    const reqId = c.get('requestId');
    
    // Log the request
    console.log(`[${new Date().toISOString()}] ${reqId} ${c.req.method} ${c.req.url} - ${c.res.status} (${ms}ms)`);

    // Standardize JSON Responses (Industrial Envelope)
    if (c.res.status < 400 && c.res.headers.get('Content-Type')?.includes('application/json')) {
        const body = await c.res.json();
        return c.json({
            success: true,
            data: body,
            requestId: reqId,
            timestamp: new Date().toISOString()
        }, c.res.status as any);
    }
});

app.use('*', prettyJSON());

// Health check
app.get('/', (c) => c.json({ status: 'ok', message: 'SmartBiz Pro API Industrial v1', version: '1.2.0' }));
app.get('/health', (c) => c.json({ status: 'healthy', uptime: process.uptime() }));

// Global Error Handler
app.onError((err, c) => {
    console.error('GLOBAL ERROR:', err);
    const status = (err as any).status || 500;
    return c.json({
        success: false,
        error: err.name || 'Internal Server Error',
        message: err.message,
        requestId: c.get('requestId'),
        code: (err as any).code || 'INTERNAL_ERROR'
    }, status);
});

// Import Routes
import auth from './routes/auth';
import organizations from './routes/organizations';
import stakeholders from './routes/stakeholders';
import items from './routes/items';
import categories from './routes/categories';
import stockMovements from './routes/stock-movements';
import sales from './routes/sales';
import reports from './routes/reports';
import locations from './routes/locations';
import purchases from './routes/purchases';
import finance from './routes/finance';
import expensesRoute from './routes/expenses';
import banking from './routes/banking';
import returns from './routes/returns';
import quotations from './routes/quotations';
import transfers from './routes/transfers';
import projects from './routes/projects';
import hr from './routes/hr';
import payroll from './routes/payroll';
import sync from './routes/sync';

// Public Routes
app.route('/auth', auth);

// Protected Routes (Industrial Multi-Tenancy)
const protectedRoutes = [
    { path: '/organizations', route: organizations },
    { path: '/stakeholders', route: stakeholders },
    { path: '/items', route: items },
    { path: '/categories', route: categories },
    { path: '/stock-movements', route: stockMovements },
    { path: '/sales', route: sales },
    { path: '/reports', route: reports },
    { path: '/locations', route: locations },
    { path: '/purchases', route: purchases },
    { path: '/finance', route: finance },
    { path: '/expenses', route: expensesRoute },
    { path: '/banking', route: banking },
    { path: '/returns', route: returns },
    { path: '/quotations', route: quotations },
    { path: '/transfers', route: transfers },
    { path: '/projects', route: projects },
    { path: '/hr', route: hr },
    { path: '/payroll', route: payroll },
    { path: '/sync', route: sync }
];

protectedRoutes.forEach(({ path, route }) => {
    app.use(`${path}`, authMiddleware);
    app.use(`${path}/*`, authMiddleware);
    app.route(path, route);
});

import { serve } from '@hono/node-server'

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    // Run migrations before starting
    import('@smartbiz/db').then(async ({ getDb, runMigrations }) => {
        try {
            const db = getDb();
            await runMigrations(db);

            console.log(`Server is running on port ${port}`)
            serve({
                fetch: app.fetch,
                port
            })
        } catch (error) {
            console.error('Failed to start server due to migration error:', error);
            process.exit(1);
        }
    });
}

export default app



// Force redeploy: Verifying CORS and DB connection fixes
