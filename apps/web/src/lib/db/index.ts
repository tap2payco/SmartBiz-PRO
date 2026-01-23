
import Dexie, { Table } from 'dexie'
import {
    OutboxEntry,
    SyncState,
    ConflictEntry,
    LocalOrganization,
    LocalProduct,
    LocalCustomer,
    LocalSale,
    LocalSaleItem,
    LocalItem,
    LocalCategory,
    LocalStockMovement
} from './types'

export class SmartBizDatabase extends Dexie {
    // Sync Infrastructure
    outbox!: Table<OutboxEntry, number>
    syncState!: Table<SyncState, string>
    conflicts!: Table<ConflictEntry, number>

    // Entity Cache
    organizations!: Table<LocalOrganization, string>
    products!: Dexie.Table<LocalProduct, string>
    customers!: Dexie.Table<LocalCustomer, string>
    suppliers!: Dexie.Table<LocalCustomer, string> // Reuse LocalCustomer type (same structure)
    sales!: Dexie.Table<LocalSale, string>
    saleItems!: Dexie.Table<LocalSaleItem, string>
    items!: Dexie.Table<LocalItem, string>
    categories!: Dexie.Table<LocalCategory, string>
    stockMovements!: Dexie.Table<LocalStockMovement, string>

    constructor() {
        super('SmartBizDB')

        this.version(8).stores({
            // Sync Infrastructure
            outbox: '++id, status, localId, createdAt',
            syncState: 'id, lastSyncAt',
            conflicts: '++id, table, localId, resolved',

            // Entity Caches
            organizations: 'id, slug',
            products: 'id, organizationId, sku, name',
            customers: 'id, organizationId, name',
            suppliers: 'id, organizationId, name',
            sales: 'id, organizationId, customerId, createdAt',

            // Inventory & Sales
            items: 'id, organizationId, sku, name, categoryId, type, imageUrl',
            categories: 'id, organizationId, name',
            stockMovements: 'id, itemId, createdAt',
            saleItems: 'id, saleId, itemId'
        })
    }
}

export const db = new SmartBizDatabase()
