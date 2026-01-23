
import { db } from '../db'
import { SyncStatus, OutboxEntry } from '../db/types'

export class SyncEngine {
    private isSyncing = false

    async push() {
        if (this.isSyncing) return
        this.isSyncing = true

        try {
            // Get all pending items ordered by simple time
            const pending = await db.outbox
                .where('status')
                .equals(SyncStatus.PENDING)
                .sortBy('createdAt')

            if (pending.length === 0) return

            console.log(`[Sync] Found ${pending.length} pending operations`)

            for (const entry of pending) {
                await this.processEntry(entry)
            }
        } catch (error) {
            console.error('[Sync] Push failed:', error)
        } finally {
            this.isSyncing = false
        }
    }

    private async processEntry(entry: OutboxEntry) {
        // Mark as syncing
        await db.outbox.update(entry.id!, { status: SyncStatus.SYNCING })

        try {
            // TODO: Replace with actual API call
            console.log(`[Sync] Processing ${entry.type} on ${entry.table}`, entry.data)

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500))

            // On success, delete from outbox (or mark completed if we want history)
            // Deleting keeps database small
            await db.outbox.delete(entry.id!)

            console.log(`[Sync] Entry ${entry.id} synced successfully`)
        } catch (error) {
            console.error(`[Sync] Failed to sync entry ${entry.id}:`, error)
            await db.outbox.update(entry.id!, {
                status: SyncStatus.FAILED,
                lastError: (error as Error).message,
                retryCount: (entry.retryCount || 0) + 1
            })
        }
    }
}

export const syncEngine = new SyncEngine()
