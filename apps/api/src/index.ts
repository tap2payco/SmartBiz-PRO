import 'dotenv/config';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { authMiddleware } from './middleware/auth';
import organizations from './routes/organizations';
import { User } from '@supabase/supabase-js';
import { Profile } from '@smartbiz/shared';

// Define context variables
type Variables = {
    user: User;
    profile: Profile | null;
    organizationId: string | null;
};

export const app = new Hono<{ Variables: Variables }>();

// Middleware
// 1. CORS MUST be first to handle OPTIONS preflight
app.use('*', cors({
    origin: (origin) => {
        // Allow Vercel production, preview and local development
        if (origin === 'https://smart-biz-pro-web.vercel.app' ||
            origin?.endsWith('.vercel.app') ||
            origin?.includes('localhost')) {
            return origin;
        }
        return 'https://smart-biz-pro-web.vercel.app'; // Default fallback
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
}));

// 2. Handle OPTIONS globally to ensure preflight success immediately
app.options('*', (c) => {
    return c.body(null, 204);
});

app.use('*', logger());
app.use('*', prettyJSON());

// Health check
app.get('/', (c) => {
    return c.json({
        status: 'ok',
        message: 'SmartBiz Pro API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health', (c) => {
    return c.json({
        status: 'healthy',
        uptime: process.uptime(),
    });
});

app.get('/debug-env', (c) => {
    const keys = [
        'DATABASE_URL',
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'NEXT_PUBLIC_API_URL',
        'NODE_ENV'
    ];

    const status: Record<string, boolean> = {};
    keys.forEach(key => {
        status[key] = !!process.env[key];
    });

    return c.json({
        env_status: status,
        vercel_region: process.env.VERCEL_REGION || 'local'
    });
});

// Global Error Handler
app.onError((err, c) => {
    console.error('GLOBAL ERROR:', err);

    const isConfigError = err.message.includes('configuration missing');

    return c.json({
        error: isConfigError ? 'Configuration Error' : 'Internal Server Error',
        message: err.message,
        code: isConfigError ? 'CONFIG_MISSING' : 'INTERNAL_ERROR',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, 500);
});

// Auth Routes
import auth from './routes/auth';

// Apply auth middleware to all routes except public health check
app.use('/auth', authMiddleware);
app.use('/auth/*', authMiddleware);
app.route('/auth', auth);

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

// Mount routes
app.route('/auth', auth);

app.use('/organizations', authMiddleware);
app.use('/organizations/*', authMiddleware);
app.route('/organizations', organizations);

app.use('/stakeholders', authMiddleware);
app.use('/stakeholders/*', authMiddleware);
app.route('/stakeholders', stakeholders);

app.use('/items', authMiddleware);
app.use('/items/*', authMiddleware);
app.route('/items', items);

app.use('/categories', authMiddleware);
app.use('/categories/*', authMiddleware);
app.route('/categories', categories);

app.use('/stock-movements', authMiddleware);
app.use('/stock-movements/*', authMiddleware);
app.route('/stock-movements', stockMovements);

app.use('/sales', authMiddleware);
app.use('/sales/*', authMiddleware);
app.route('/sales', sales);

app.use('/reports', authMiddleware);
app.use('/reports/*', authMiddleware);
app.route('/reports', reports);

app.use('/locations', authMiddleware);
app.use('/locations/*', authMiddleware);
app.route('/locations', locations);

app.use('/purchases', authMiddleware);
app.use('/purchases/*', authMiddleware);
app.route('/purchases', purchases);

app.use('/finance', authMiddleware);
app.use('/finance/*', authMiddleware);
app.route('/finance', finance);

app.use('/expenses', authMiddleware);
app.use('/expenses/*', authMiddleware);
app.route('/expenses', expensesRoute);

app.use('/banking', authMiddleware);
app.use('/banking/*', authMiddleware);
app.route('/banking', banking);

export default {
    port: 3003,
    fetch: app.fetch,
};


