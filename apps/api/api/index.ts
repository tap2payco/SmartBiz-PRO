export const config = {
    runtime: 'nodejs'
}

export default async function (req: any, res: any) {
    try {
        // We load EVERYTHING dynamically to catch top-level crash
        const { Hono } = await import('hono')
        const { handle } = await import('hono/vercel')
        const { cors } = await import('hono/cors')

        try {
            const { app } = await import('../src/index')
            return handle(app)(req, res)
        } catch (appErr: any) {
            console.error('CRITICAL: App Logic Load Error:', appErr)

            const fallbackApp = new Hono()
            fallbackApp.use('*', cors({
                origin: (origin) => origin || '*',
                allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
                credentials: true,
            }))
            fallbackApp.options('*', (c) => c.body(null, 204))
            fallbackApp.all('*', (c) => c.json({
                error: 'Application Initialization Failed',
                message: appErr.message,
                stack: appErr.stack,
                hint: 'Check if workspace dependencies (@smartbiz/db) are accessible.'
            }, 500))

            return handle(fallbackApp)(req, res)
        }
    } catch (infraErr: any) {
        console.error('FATAL: Infrastructure Load Error:', infraErr)
        res.status(500).json({
            error: 'Infrastructure Error',
            message: infraErr.message,
            hint: 'This means even Hono failed to load. Check package.json dependencies.'
        })
    }
}
