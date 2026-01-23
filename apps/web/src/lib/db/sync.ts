
import { db } from './index'
import { SyncStatus } from './types'

export async function processOutbox(getToken: () => Promise<string | null>) {
    const pending = await db.outbox
        .where('status')
        .equals(SyncStatus.PENDING)
        .sortBy('createdAt')

    if (pending.length === 0) return

    const token = await getToken()
    if (!token) return

    for (const entry of pending) {
        try {
            await db.outbox.update(entry.id!, { status: SyncStatus.SYNCING })

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${entry.table}`, {
                method: entry.type === 'CREATE' ? 'POST' : (entry.type === 'UPDATE' ? 'PATCH' : 'DELETE'),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(entry.data)
            })

            if (response.ok) {
                const serverData = await response.json()

                // Update local status
                await db.outbox.update(entry.id!, { status: SyncStatus.COMPLETED })

                // Update local entity with server version (e.g. real IDs, syncedAt timestamp)
                await db.table(entry.table).update(entry.localId || entry.data.id, {
                    ...serverData,
                    syncedAt: Date.now()
                })
            } else {
                const error = await response.text()
                throw new Error(error || 'Sync failed')
            }
        } catch (error: any) {
            console.error(`Sync failed for ${entry.table}:`, error)
            await db.outbox.update(entry.id!, {
                status: SyncStatus.FAILED,
                lastError: error.message,
                retryCount: (entry.retryCount || 0) + 1,
                updatedAt: Date.now()
            })
        }
    }
}
