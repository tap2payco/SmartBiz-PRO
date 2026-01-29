import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'

export const config = {
    runtime: 'nodejs'
}

let appToHandle: Hono<any>;

try {
    // Try to import the main app
    // We use require to avoid top-level crash if something is missing
    const imported = require('../src/index')
    appToHandle = imported.app || imported.default?.app || imported.default
} catch (e: any) {
    console.error('CRITICAL: Failed to load application:', e)

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

    fallbackApp.all('*', (c) => {
        return c.json({
            error: 'API Initialization Failed',
            message: e?.message || 'Unknown error',
            hint: 'Check Vercel logs and ensure all dependencies are in package.json',
            code: 'INIT_FAILURE',
            stack: e?.stack
        }, 500)
    })
    appToHandle = fallbackApp
}

export default handle(appToHandle)
