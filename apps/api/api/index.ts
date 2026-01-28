import { Hono } from 'hono'
import { handle } from 'hono/vercel'

export const config = {
    runtime: 'nodejs'
}

// Wrap in try-catch to catch import errors
let appToHandle: Hono<any>;

try {
    // Dynamic import to catch errors
    const { app } = require('../src/index')
    appToHandle = app
} catch (e: any) {
    console.error('CRITICAL: Failed to import app:', e)
    // Create a minimal app that reports the error
    const fallbackApp = new Hono()
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
