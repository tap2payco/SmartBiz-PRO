
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { SyncStatus } from '@/lib/db/types'
import { syncEngine } from '@/lib/sync/engine'
import { useState, useEffect } from 'react'

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(true)

    // Monitor online status
    useEffect(() => {
        setIsOnline(navigator.onLine)

        const handleOnline = () => {
            setIsOnline(true)
            syncEngine.push() // Auto-trigger sync when back online
        }

        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Monitor pending operations count
    const pendingCount = useLiveQuery(
        () => db.outbox.where('status').equals(SyncStatus.PENDING).count(),
        []
    ) || 0

    // Monitor syncing operations count (active)
    const syncingCount = useLiveQuery(
        () => db.outbox.where('status').equals(SyncStatus.SYNCING).count(),
        []
    ) || 0

    return {
        isOnline,
        pendingCount,
        isSyncing: syncingCount > 0,
        manualSync: () => syncEngine.push()
    }
}
