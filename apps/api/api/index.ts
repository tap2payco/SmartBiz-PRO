import { handle } from 'hono/vercel'

export const config = {
    runtime: 'nodejs'
}

/**
 * ULTRA-RESILIENT VERCEL HANDLER
 * This handler is designed to catch EVERY possible error during boot,
 * including missing modules, and report them with proper CORS headers.
 */
export default async function (req: any, res: any) {
    // Manually set CORS headers for the raw Node.js response
    // This ensures that even if Hono fails to load, the browser can see the 500 JSON
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    try {
        // Step 1: Try to load Hono dependencies
        const { Hono } = await import('hono');
        const { cors } = await import('hono/cors');

        try {
            // Step 2: Try to load the actual application logic
            // We use a relative path that should work in Vercel's environment
            const { app } = await import('../src/index');

            // If everything is fine, let Hono handle it
            return handle(app)(req, res);

        } catch (appErr: any) {
            console.error('API_BOOT_ERROR (Application Logic):', appErr);

            // Fallback app if only the main logic failed
            const fallback = new Hono();
            fallback.use('*', cors({ origin: (o) => o || '*', credentials: true }));
            fallback.all('*', (c) => c.json({
                error: 'API_BOOT_FAILURE',
                message: appErr?.message || 'Failed to initialize application logic',
                hint: 'Does apps/api have all dependencies in package.json? Is @smartbiz/db reachable?',
                details: process.env.NODE_ENV !== 'production' ? appErr?.stack : undefined
            }, 500));

            return handle(fallback)(req, res);
        }
    } catch (infraErr: any) {
        console.error('API_BOOT_ERROR (Infrastructure):', infraErr);

        // Critical failure: Even Hono didn't load
        res.status(500).json({
            error: 'API_INFRA_FAILURE',
            message: infraErr?.message || 'Failed to load Hono infrastructure',
            hint: 'This usually means "hono" or "hono/vercel" is missing from package.json',
            details: infraErr?.stack
        });
    }
}
