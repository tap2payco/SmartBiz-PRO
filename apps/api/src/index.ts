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
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors());

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

// Auth Routes
import auth from './routes/auth';

// Mount routes
// Apply middleware to all routes except public ones (like login/register if they existed, but here we use Supabase client mostly)
// For internal auth routes:
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
app.use('/organizations/*', authMiddleware);
app.route('/organizations', organizations);
app.use('/stakeholders/*', authMiddleware);
app.route('/stakeholders', stakeholders);
app.use('/items/*', authMiddleware);
app.route('/items', items);
app.use('/categories/*', authMiddleware);
app.route('/categories', categories);
app.use('/stock-movements/*', authMiddleware);
app.route('/stock-movements', stockMovements);
app.use('/sales/*', authMiddleware);
app.route('/sales', sales);
app.use('/reports/*', authMiddleware);
app.route('/reports', reports);
app.use('/locations/*', authMiddleware);
app.route('/locations', locations);
app.use('/purchases/*', authMiddleware);
app.route('/purchases', purchases);
app.use('/finance/*', authMiddleware);
app.route('/finance', finance);
app.use('/expenses/*', authMiddleware);
app.route('/expenses', expensesRoute);
app.use('/banking/*', authMiddleware);
app.route('/banking', banking);

export default {
    port: 3003,
    fetch: app.fetch,
};


