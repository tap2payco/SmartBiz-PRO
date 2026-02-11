
import { db } from './index'
import { SyncStatus } from './types'

// Key for storing the last sync timestamp in localStorage
const SYNC_TIMESTAMP_KEY = 'smartbiz_last_pulled_at'

export async function processOutbox(getToken: () => Promise<string | null>) {
    // 1. Process local changes (Push)
    await processPush(getToken)

    // 2. Fetch remote changes (Pull)
    await processPull(getToken)
}

async function processPush(getToken: () => Promise<string | null>) {
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
                // If it was a DELETE, we don't update anything
                if (entry.type !== 'DELETE') {
                    await db.table(entry.table).update(entry.localId || entry.data.id, {
                        ...serverData,
                        syncedAt: Date.now()
                    })
                }
            } else {
                const error = await response.text()
                throw new Error(error || 'Sync failed')
            }
        } catch (error: any) {
            console.error(`Sync push failed for ${entry.table}:`, error)
            await db.outbox.update(entry.id!, {
                status: SyncStatus.FAILED,
                lastError: error.message,
                retryCount: (entry.retryCount || 0) + 1,
                updatedAt: Date.now()
            })
        }
    }
}

async function processPull(getToken: () => Promise<string | null>) {
    const token = await getToken()
    if (!token) return

    const lastPulledAt = localStorage.getItem(SYNC_TIMESTAMP_KEY) || '0'

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sync/pull?lastPulledAt=${lastPulledAt}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!res.ok) throw new Error('Failed to pull changes')

        const data = await res.json()
        const changes = data.changes

        await db.transaction('rw', [db.items, db.categories, db.sales, db.customers], async () => {
            // Bulk put (create/update) items
            if (changes.items?.updated?.length > 0) {
                await db.items.bulkPut(changes.items.updated)
            }
            // Bulk put categories
            if (changes.categories?.updated?.length > 0) {
                await db.categories.bulkPut(changes.categories.updated)
            }
            // Bulk put sales
            if (changes.sales?.updated?.length > 0) {
                await db.sales.bulkPut(changes.sales.updated)
            }
            // Bulk put customers
            if (changes.customers?.updated?.length > 0) {
                await db.customers.bulkPut(changes.customers.updated)
            }
        })

        // Update timestamp
        localStorage.setItem(SYNC_TIMESTAMP_KEY, data.timestamp.toString())
        console.log(`[Sync] Pulled changes since ${new Date(parseInt(lastPulledAt)).toLocaleString()}`)

    } catch (error) {
        console.error('[Sync] Pull failed:', error)
    }
}
