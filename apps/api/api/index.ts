import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'

export const config = {
    runtime: 'nodejs'
}

// Fallback app to report the error instead of FUNCTION_INVOCATION_FAILED
const fallbackApp = new Hono()

fallbackApp.use('*', cors({
    origin: (origin) => {
        if (origin === 'https://smart-biz-pro-web.vercel.app' ||
            origin?.endsWith('.vercel.app') ||
            origin?.includes('localhost')) {
            return origin;
        }
        return 'https://smart-biz-pro-web.vercel.app';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
}))

fallbackApp.options('*', (c) => c.body(null, 204))

// We wrap the entire execution in a handler that tries to load the real app
export default async function (req: any, res: any) {
    try {
        // Dynamic import is safer for ES modules on Vercel
        const { app } = await import('../src/index')
        return handle(app)(req, res)
    } catch (e: any) {
        console.error('CRITICAL: Failed to load application:', e)

        fallbackApp.all('*', (c) => {
            return c.json({
                error: 'API Initialization Failed',
                message: e?.message || 'Unknown error',
                hint: 'Check Vercel logs and ensure all dependencies are in package.json',
                code: 'INIT_FAILURE',
                stack: e?.stack
            }, 500)
        })

        return handle(fallbackApp)(req, res)
    }
}
