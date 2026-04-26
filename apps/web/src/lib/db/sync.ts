import { db } from './index'
import { SyncStatus } from './types'

const SYNC_TIMESTAMP_KEY = 'smartbiz_last_pulled_at'

export async function processOutbox(getToken: () => Promise<string | null>) {
    await processPush(getToken)
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

    // Group changes by table (Industrial Batching)
    const changes: any = {}
    const entriesToUpdate: number[] = []

    for (const entry of pending) {
        const key = entry.table === 'bank_transactions' ? 'bankTransactions' : 
                    entry.table === 'stock_movements' ? 'stockMovements' : 
                    entry.table === 'invoice_payments' ? 'payments' : 
                    entry.table === 'hr_leaves' ? 'leaves' : entry.table;

        if (!changes[key]) changes[key] = { created: [], deleted: [] }
        
        if (entry.type === 'DELETE') {
            changes[key].deleted.push(entry.localId || entry.data.id)
        } else {
            changes[key].created.push(entry.data)
        }
        entriesToUpdate.push(entry.id!)
    }

    try {
        await db.outbox.bulkUpdate(entriesToUpdate.map(id => ({ key: id, changes: { status: SyncStatus.SYNCING } })))

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sync/push`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ changes })
        })

        const resData = await response.json()
        if (response.ok && resData.success) {
            await db.outbox.bulkDelete(entriesToUpdate)
            console.log('[Sync] Push successful', resData.data.results)
        } else {
            throw new Error(resData.message || 'Sync push failed')
        }
    } catch (error: any) {
        console.error('Sync push failed:', error)
        await db.outbox.bulkUpdate(entriesToUpdate.map(id => ({ 
            key: id, 
            changes: { 
                status: SyncStatus.FAILED, 
                lastError: error.message,
                retryCount: 1 // Simple increment for now
            } 
        })))
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

        const resData = await res.json()
        if (!res.ok || !resData.success) throw new Error(resData.message || 'Failed to pull changes')

        const data = resData.data
        const changes = data.changes

        // Industrial Multi-Table Transaction
        await db.transaction('rw', db.tables, async () => {
            const tableMap: Record<string, any> = {
                items: db.items,
                categories: db.categories,
                customers: db.customers,
                suppliers: db.suppliers,
                sales: db.sales,
                saleItems: db.saleItems,
                expenses: db.expenses,
                expenseCategories: db.expenseCategories,
                quotations: db.quotations,
                quotationItems: db.quotationItems,
                returns: db.returns,
                returnItems: db.returnItems,
                bankAccounts: db.bankAccounts,
                bankTransactions: db.bankTransactions,
                stockMovements: db.stockMovements,
                projects: db.projects,
                leaveRequests: db.leaveRequests,
                purchases: db.purchases,
                purchaseItems: db.purchaseItems
            }

            for (const [key, table] of Object.entries(tableMap)) {
                const entityChanges = changes[key]
                if (entityChanges) {
                    // 1. Process Deletions
                    if (entityChanges.deleted?.length > 0) {
                        await table.bulkDelete(entityChanges.deleted)
                    }
                    // 2. Process Updates
                    if (entityChanges.updated?.length > 0) {
                        await table.bulkPut(entityChanges.updated)
                    }
                }
            }
        })

        localStorage.setItem(SYNC_TIMESTAMP_KEY, data.timestamp.toString())
        console.log(`[Sync] Pulled changes successfully. Timestamp: ${data.timestamp}`)
    } catch (error) {
        console.error('[Sync] Pull failed:', error)
    }
}
