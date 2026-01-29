import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'

export const config = {
    runtime: 'nodejs'
}

let appToHandle: Hono<any>;

try {
    // Dynamic import to catch errors
    const { app } = require('../src/index')
    appToHandle = app
} catch (e: any) {
    console.error('CRITICAL: Failed to import app:', e)

    // Create a minimal app that reports the error AND has CORS
    const fallbackApp = new Hono()

    // Enable CORS for fallback app so preflight works even during failure
    fallbackApp.use('*', cors({
        origin: 'https://smart-biz-pro-web.vercel.app',
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
    }))

    // Handle preflight explicitly
    fallbackApp.options('*', (c) => c.body(null, 204))

    fallbackApp.all('*', (c) => {
        return c.json({
            error: 'Server Initialization Failed',
            message: e?.message || 'Unknown import error',
            code: 'IMPORT_FAILURE',
            stack: process.env.NODE_ENV === 'development' ? e?.stack : undefined
        }, 500)
    })

    appToHandle = fallbackApp
}

export default handle(appToHandle)
