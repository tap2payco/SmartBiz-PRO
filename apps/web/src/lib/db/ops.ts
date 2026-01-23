
import { db } from './index'
import { OperationType, SyncStatus } from './types'

/**
 * Queues an operation for sync and updates local cache atomically.
 * This is the core "Offline-First" modify function.
 */
export async function queueOperation(
    table: string,
    type: OperationType,
    data: any,
    localId: string
) {
    return db.transaction('rw', [db.outbox, db.table(table)], async () => {
        // 1. Add to Outbox for future sync
        await db.outbox.add({
            type,
            table,
            localId,
            data,
            status: SyncStatus.PENDING,
            retryCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        })

        // 2. Update Local Cache immediately (Optimistic UI)
        const localTable = db.table(table)

        switch (type) {
            case 'CREATE':
                // Ensure data has the localId
                await localTable.put({ ...data, id: localId, syncedAt: 0 })
                break
            case 'UPDATE':
                await localTable.update(localId, { ...data, syncedAt: 0 })
                break
            case 'DELETE':
                await localTable.delete(localId)
                break
        }
    })
}

/**
 * Helper to get unsynced count
 */
export async function getPendingCount() {
    return await db.outbox
        .where('status')
        .equals(SyncStatus.PENDING)
        .count()
}
