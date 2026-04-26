import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, pgEnum, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './auth'

// Enums
export const stockMovementTypeEnum = pgEnum('stock_movement_type', [
    'GRN',           // Goods Received Note (stock in from supplier)
    'SALE',          // Stock out from sale
    'ADJUSTMENT',    // Manual adjustment (+ or -)
    'TRANSFER_IN',   // Transfer from another location
    'TRANSFER_OUT',  // Transfer to another location
    'RETURN',        // Customer return (stock in)
    'DAMAGE',        // Damaged goods (stock out)
    'THEFT'          // Theft/loss (stock out)
])

export const locationTypeEnum = pgEnum('location_type', [
    'WAREHOUSE',
    'STORE',
    'OTHER'
])

// Item Categories Table
export const itemCategories = pgTable('item_categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    parentId: uuid('parent_id'), // For subcategories
    isActive: boolean('is_active').notNull().default(true),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Items (Products) Table
export const items = pgTable('items', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }).notNull(),
    barcode: varchar('barcode', { length: 100 }),
    description: text('description'),
    categoryId: uuid('category_id').references(() => itemCategories.id),
    unit: varchar('unit', { length: 50 }).notNull().default('pcs'), // pcs, kg, liter, etc.
    type: varchar('type', { length: 20 }).notNull().default('good'), // 'good' | 'service'
    costPrice: decimal('cost_price', { precision: 10, scale: 2 }).notNull().default('0'),
    sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }).notNull().default('0'),
    reorderPoint: integer('reorder_point').default(0),
    reorderQuantity: integer('reorder_quantity').default(0),
    imageUrl: text('image_url'),
    isActive: boolean('is_active').notNull().default(true),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => {
    return {
        orgIdx: index('items_org_idx').on(table.organizationId),
        categoryIdx: index('items_category_idx').on(table.categoryId),
        skuIdx: index('items_sku_idx').on(table.sku),
    };
})

// Locations Table
export const locations = pgTable('locations', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    type: locationTypeEnum('type').notNull().default('STORE'),
    address: text('address'),
    isActive: boolean('is_active').notNull().default(true),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow()
})

// Stock Movements Table (Event-Sourced)
export const stockMovements = pgTable('stock_movements', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').references(() => locations.id),
    type: stockMovementTypeEnum('type').notNull(),
    quantity: integer('quantity').notNull(), // Positive for in, negative for out
    referenceType: varchar('reference_type', { length: 50 }), // 'sale', 'purchase', 'adjustment'
    referenceId: uuid('reference_id'), // ID of the related document
    notes: text('notes'),
    createdBy: uuid('created_by'), // User who created the movement
    createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => {
    return {
        orgIdx: index('stock_movements_org_idx').on(table.organizationId),
        itemIdx: index('stock_movements_item_idx').on(table.itemId),
        locationIdx: index('stock_movements_location_idx').on(table.locationId),
    };
})

// Relations
export const itemCategoriesRelations = relations(itemCategories, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [itemCategories.organizationId],
        references: [organizations.id]
    }),
    parent: one(itemCategories, {
        fields: [itemCategories.parentId],
        references: [itemCategories.id]
    }),
    items: many(items)
}))

export const itemsRelations = relations(items, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [items.organizationId],
        references: [organizations.id]
    }),
    category: one(itemCategories, {
        fields: [items.categoryId],
        references: [itemCategories.id]
    }),
    stockMovements: many(stockMovements)
}))

export const locationsRelations = relations(locations, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [locations.organizationId],
        references: [organizations.id]
    }),
    stockMovements: many(stockMovements)
}))

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
    organization: one(organizations, {
        fields: [stockMovements.organizationId],
        references: [organizations.id]
    }),
    item: one(items, {
        fields: [stockMovements.itemId],
        references: [items.id]
    }),
    location: one(locations, {
        fields: [stockMovements.locationId],
        references: [locations.id]
    })
}))

export const stockTransferStatusEnum = pgEnum('stock_transfer_status', [
    'DRAFT',      // Created but not yet sent
    'IN_TRANSIT', // Stock deducted from source, on its way
    'COMPLETED',  // Stock added to destination
    'CANCELLED'   // Cancelled before being sent
])

// Stock Transfers Table (Head)
export const stockTransfers = pgTable('stock_transfers', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    transferNumber: varchar('transfer_number', { length: 50 }).notNull(), // e.g., TRF-1001
    sourceLocationId: uuid('source_location_id').notNull().references(() => locations.id),
    destinationLocationId: uuid('destination_location_id').notNull().references(() => locations.id),
    status: stockTransferStatusEnum('status').notNull().default('DRAFT'),
    sentAt: timestamp('sent_at'),
    receivedAt: timestamp('received_at'),
    notes: text('notes'),
    driverName: varchar('driver_name', { length: 100 }),
    vehicleNumber: varchar('vehicle_number', { length: 50 }),
    createdBy: uuid('created_by'),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Stock Transfer Items (Lines)
export const stockTransferItems = pgTable('stock_transfer_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    transferId: uuid('transfer_id').notNull().references(() => stockTransfers.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id').notNull().references(() => items.id),
    quantitySent: integer('quantity_sent').notNull(),
    quantityReceived: integer('quantity_received'), // Null until received
    notes: text('notes')
})

export const stockTransfersRelations = relations(stockTransfers, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [stockTransfers.organizationId],
        references: [organizations.id]
    }),
    sourceLocation: one(locations, {
        fields: [stockTransfers.sourceLocationId],
        references: [locations.id],
        relationName: 'sourceLocation'
    }),
    destinationLocation: one(locations, {
        fields: [stockTransfers.destinationLocationId],
        references: [locations.id],
        relationName: 'destinationLocation'
    }),
    items: many(stockTransferItems)
}))

export const stockTransferItemsRelations = relations(stockTransferItems, ({ one }) => ({
    transfer: one(stockTransfers, {
        fields: [stockTransferItems.transferId],
        references: [stockTransfers.id]
    }),
    item: one(items, {
        fields: [stockTransferItems.itemId],
        references: [items.id]
    })
}))

// TypeScript Types
export type ItemCategory = typeof itemCategories.$inferSelect
export type NewItemCategory = typeof itemCategories.$inferInsert

export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert

export type Location = typeof locations.$inferSelect
export type NewLocation = typeof locations.$inferInsert

export type StockMovement = typeof stockMovements.$inferSelect
export type NewStockMovement = typeof stockMovements.$inferInsert

export type StockTransfer = typeof stockTransfers.$inferSelect
export type NewStockTransfer = typeof stockTransfers.$inferInsert

export type StockTransferItem = typeof stockTransferItems.$inferSelect
export type NewStockTransferItem = typeof stockTransferItems.$inferInsert
