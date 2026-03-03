
export enum SyncStatus {
    PENDING = 'PENDING',
    SYNCING = 'SYNCING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CONFLICT = 'CONFLICT'
}

export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE'

export interface OutboxEntry {
    id?: number // Auto-incremented by Dexie
    type: OperationType
    table: string,
    localId: string,
    data: any
    status: SyncStatus
    retryCount: number
    lastError?: string
    createdAt: number
    updatedAt: number
}

export interface SyncState {
    id: string // entity table name
    lastSyncAt: number
    cursor?: string
}

export interface ConflictEntry {
    id?: number
    table: string
    localId: string
    serverData: any
    localData: any
    resolved: boolean
    createdAt: number
}

// Local Cache Types (Mirroring shared types but optimizing for local query)
export interface LocalOrganization {
    id: string
    name: string
    slug: string
    currency: string
    industry: string
    syncedAt: number
}

export interface LocalProduct {
    id: string
    organizationId: string
    name: string
    sku: string
    barcode?: string
    price: number
    category: string
    stockLevel: number
    syncedAt: number
}

export interface LocalCustomer {
    id: string
    organizationId: string
    type?: 'CUSTOMER' | 'SUPPLIER'
    stakeholderType?: 'INDIVIDUAL' | 'BUSINESS'
    name: string
    contactPerson?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    taxId?: string
    creditLimit?: number
    balance: number
    loyaltyPoints?: number
    syncedAt: number
}

export interface LocalSale {
    id: string
    organizationId: string
    saleNumber: string
    customerId?: string
    status: 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'RETURNED'
    paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED'
    subtotal: number
    taxTotal: number
    discountTotal: number
    totalAmount: number
    paidAmount: number
    notes?: string
    createdAt: number
    syncedAt: number
}

export interface LocalSaleItem {
    id: string
    saleId: string
    itemId: string
    quantity: number
    unitPrice: number
    discount: number
    tax: number
    total: number
    createdAt: number
}

export interface LocalItem {
    id: string
    organizationId: string
    name: string
    sku: string
    barcode?: string
    description?: string
    categoryId?: string
    unit: string
    type: 'good' | 'service'
    costPrice: number
    sellingPrice: number
    reorderPoint?: number
    reorderQuantity?: number
    imageUrl?: string
    isActive: boolean
    syncedAt: number
    currentStock?: number
}

export interface LocalCategory {
    id: string
    organizationId: string
    name: string
    description?: string
    parentId?: string
    isActive: boolean
    syncedAt: number
}

export interface LocalStockMovement {
    id: string
    organizationId: string
    itemId: string
    locationId?: string
    type: 'GRN' | 'SALE' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'RETURN' | 'DAMAGE' | 'THEFT'
    quantity: number
    referenceType?: string
    referenceId?: string
    notes?: string
    createdBy?: string
    createdAt: string
    syncedAt?: number
}

