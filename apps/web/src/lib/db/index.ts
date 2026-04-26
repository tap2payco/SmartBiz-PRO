
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
    customers!: Table<any, string>
    suppliers!: Table<any, string>
    items!: Table<any, string>
    categories!: Table<any, string>
    sales!: Table<any, string>
    saleItems!: Table<any, string>
    expenses!: Table<any, string>
    expenseCategories!: Table<any, string>
    quotations!: Table<any, string>
    quotationItems!: Table<any, string>
    returns!: Table<any, string>
    returnItems!: Table<any, string>
    bankAccounts!: Table<any, string>
    bankTransactions!: Table<any, string>
    stockMovements!: Table<any, string>
    projects!: Table<any, string>
    leaveRequests!: Table<any, string>
    purchases!: Table<any, string>
    purchaseItems!: Table<any, string>

    // Metadata Cache
    metadata!: Table<any, string>

    constructor() {
        super('SmartBizDB')

        this.version(11).stores({
            // Sync Infrastructure
            outbox: '++id, status, localId, createdAt',
            syncState: 'id, lastSyncAt',
            conflicts: '++id, table, localId, resolved',
            metadata: 'id', // To store global stats, org info, etc.

            // Entity Caches
            organizations: 'id, slug',
            customers: 'id, organizationId, name, isDeleted',
            suppliers: 'id, organizationId, name, isDeleted',
            items: 'id, organizationId, sku, name, categoryId, isDeleted',
            categories: 'id, organizationId, name, isDeleted',
            sales: 'id, organizationId, customerId, createdAt, isDeleted',
            saleItems: 'id, saleId, itemId',
            expenses: 'id, organizationId, categoryId, date, isDeleted',
            expenseCategories: 'id, organizationId, name, isDeleted',
            quotations: 'id, organizationId, customerId, isDeleted',
            quotationItems: 'id, quotationId, itemId',
            returns: 'id, organizationId, saleId, isDeleted',
            returnItems: 'id, returnId, itemId',
            bankAccounts: 'id, organizationId, name, isDeleted',
            bankTransactions: 'id, organizationId, accountId, date, isDeleted',
            stockMovements: 'id, organizationId, itemId, createdAt',
            projects: 'id, organizationId, status, isDeleted',
            leaveRequests: 'id, organizationId, employeeId, isDeleted',
            purchases: 'id, organizationId, supplierId, isDeleted',
            purchaseItems: 'id, purchaseId, itemId'
        })
    }
}

export const db = new SmartBizDatabase()
