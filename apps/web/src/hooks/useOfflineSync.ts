import { useState, useCallback, useEffect } from 'react'
import { processOutbox } from '../db/sync'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function useOfflineSync() {
    const { getToken, user } = useAuth()
    const [isSyncing, setIsSyncing] = useState(false)
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

    // Load last sync time from local storage
    useEffect(() => {
        const stored = localStorage.getItem('smartbiz_last_pulled_at')
        if (stored) {
            setLastSyncTime(new Date(parseInt(stored)))
        }
    }, [])

    const syncNow = useCallback(async () => {
        if (!user) return
        if (isSyncing) return

        setIsSyncing(true)
        try {
            await processOutbox(getToken)
            setLastSyncTime(new Date())
            toast.success('Sync completed')
        } catch (error) {
            console.error('Sync failed:', error)
            toast.error('Sync failed. Will retry later.')
        } finally {
            setIsSyncing(false)
        }
    }, [user, getToken, isSyncing])

    // Auto-sync every 5 minutes
    useEffect(() => {
        if (!user) return

        // Initial sync on mount
        syncNow()

        const interval = setInterval(() => {
            syncNow()
        }, 5 * 60 * 1000)

        return () => clearInterval(interval)
    }, [user, syncNow])

    return {
        isSyncing,
        lastSyncTime,
        syncNow
    }
}
