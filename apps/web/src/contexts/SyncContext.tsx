'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { processOutbox } from '@/lib/db/sync'

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const { user, getToken } = useAuth()

    useEffect(() => {
        if (!user) return

        // Initial sync
        processOutbox(getToken)

        // Set up interval for background sync (every 30 seconds)
        const interval = setInterval(() => {
            processOutbox(getToken)
        }, 30000)

        return () => clearInterval(interval)
    }, [user, getToken])

    return <>{children}</>
}
