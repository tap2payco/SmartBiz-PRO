import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, pgEnum, date } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './auth'
import { stakeholders } from './stakeholders'
import { items } from './inventory'

// Enums
export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', [
    'DRAFT',
    'PENDING_APPROVAL',
    'ISSUED',           // Sent to supplier
    'PARTIAL_RECEIVED',
    'COMPLETED',        // Fully received
    'CANCELLED'
])

export const grnStatusEnum = pgEnum('grn_status', [
    'DRAFT',
    'VERIFIED',         // Stock updated
    'CANCELLED'
])

export const invoiceStatusEnum = pgEnum('invoice_status', [
    'DRAFT',
    'PENDING',          // Validated but unpaid
    'PARTIAL_PAID',
    'PAID',
    'OVERDUE',
    'CANCELLED'
])

// Purchase Orders
export const purchaseOrders = pgTable('purchase_orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    supplierId: uuid('supplier_id').notNull().references(() => stakeholders.id), // Logic must ensure type='SUPPLIER'
    orderNumber: varchar('order_number', { length: 50 }).notNull(), // PO-2024-001
    issueDate: date('issue_date').notNull().defaultNow(),
    expectedDeliveryDate: date('expected_delivery_date'),
    status: purchaseOrderStatusEnum('status').notNull().default('DRAFT'),
    totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    notes: text('notes'),
    termsAndConditions: text('terms_and_conditions'),

    // Audit
    createdBy: uuid('created_by').notNull(),
    approvedBy: uuid('approved_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const purchaseOrderLines = pgTable('purchase_order_lines', {
    id: uuid('id').primaryKey().defaultRandom(),
    purchaseOrderId: uuid('purchase_order_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id').notNull().references(() => items.id),

    quantity: integer('quantity').notNull(),
    receivedQuantity: integer('received_quantity').notNull().default(0),
    unitCost: decimal('unit_cost', { precision: 15, scale: 2 }).notNull(),
    totalCost: decimal('total_cost', { precision: 15, scale: 2 }).notNull(), // quantity * unitCost

    createdAt: timestamp('created_at').notNull().defaultNow()
})

// Goods Received Notes (GRN)
export const grns = pgTable('grns', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id), // Can be standalone?
    supplierId: uuid('supplier_id').notNull().references(() => stakeholders.id),

    grnNumber: varchar('grn_number', { length: 50 }).notNull(), // GRN-2024-001
    deliveryNoteNumber: varchar('delivery_note_number', { length: 100 }), // Supplier's doc ref
    receivedDate: date('received_date').notNull().defaultNow(),
    status: grnStatusEnum('status').notNull().default('DRAFT'),
    notes: text('notes'),

    receivedBy: uuid('received_by').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const grnLines = pgTable('grn_lines', {
    id: uuid('id').primaryKey().defaultRandom(),
    grnId: uuid('grn_id').notNull().references(() => grns.id, { onDelete: 'cascade' }),
    purchaseOrderLineId: uuid('po_line_id').references(() => purchaseOrderLines.id), // Link for tracking
    itemId: uuid('item_id').notNull().references(() => items.id),

    quantityReceived: integer('quantity_received').notNull(),
    notes: text('notes'), // Damaged items comments etc.

    createdAt: timestamp('created_at').notNull().defaultNow()
})

// Supplier Invoices (Bills)
export const supplierInvoices = pgTable('supplier_invoices', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    supplierId: uuid('supplier_id').notNull().references(() => stakeholders.id),
    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id),
    grnId: uuid('grn_id').references(() => grns.id), // Direct GRN link if 1-to-1

    invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(), // Supplier's invoice #
    invoiceDate: date('invoice_date').notNull(),
    dueDate: date('due_date'),
    status: invoiceStatusEnum('status').notNull().default('DRAFT'),

    subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
    taxTotal: decimal('tax_total', { precision: 15, scale: 2 }).notNull().default('0'),
    totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),

    paidAmount: decimal('paid_amount', { precision: 15, scale: 2 }).notNull().default('0'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Payment Method Enum for Purchases
export const purchasePaymentMethodEnum = pgEnum('purchase_payment_method', [
    'CASH',
    'BANK_TRANSFER',
    'CHEQUE',
    'MOBILE_MONEY',
    'OTHER'
])

// Purchase Payments (Outgoing Payments to Suppliers)
export const purchasePayments = pgTable('purchase_payments', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    supplierInvoiceId: uuid('supplier_invoice_id').notNull().references(() => supplierInvoices.id),
    supplierId: uuid('supplier_id').notNull().references(() => stakeholders.id),

    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    paymentMethod: purchasePaymentMethodEnum('payment_method').notNull(),
    paymentDate: date('payment_date').notNull().defaultNow(),
    reference: varchar('reference', { length: 100 }), // Cheque #, Transaction ID, etc.
    notes: text('notes'),

    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow()
})

// Relations
export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [purchaseOrders.organizationId],
        references: [organizations.id]
    }),
    supplier: one(stakeholders, {
        fields: [purchaseOrders.supplierId],
        references: [stakeholders.id]
    }),
    lines: many(purchaseOrderLines),
    grns: many(grns),
    invoices: many(supplierInvoices)
}))

export const purchaseOrderLinesRelations = relations(purchaseOrderLines, ({ one }) => ({
    purchaseOrder: one(purchaseOrders, {
        fields: [purchaseOrderLines.purchaseOrderId],
        references: [purchaseOrders.id]
    }),
    item: one(items, {
        fields: [purchaseOrderLines.itemId],
        references: [items.id]
    })
}))

export const grnsRelations = relations(grns, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [grns.organizationId],
        references: [organizations.id]
    }),
    purchaseOrder: one(purchaseOrders, {
        fields: [grns.purchaseOrderId],
        references: [purchaseOrders.id]
    }),
    supplier: one(stakeholders, {
        fields: [grns.supplierId],
        references: [stakeholders.id]
    }),
    lines: many(grnLines),
    invoices: many(supplierInvoices)
}))

export const grnLinesRelations = relations(grnLines, ({ one }) => ({
    grn: one(grns, {
        fields: [grnLines.grnId],
        references: [grns.id]
    }),
    item: one(items, {
        fields: [grnLines.itemId],
        references: [items.id]
    }),
    poLine: one(purchaseOrderLines, {
        fields: [grnLines.purchaseOrderLineId],
        references: [purchaseOrderLines.id]
    })
}))

export const supplierInvoicesRelations = relations(supplierInvoices, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [supplierInvoices.organizationId],
        references: [organizations.id]
    }),
    supplier: one(stakeholders, {
        fields: [supplierInvoices.supplierId],
        references: [stakeholders.id]
    }),
    purchaseOrder: one(purchaseOrders, {
        fields: [supplierInvoices.purchaseOrderId],
        references: [purchaseOrders.id]
    }),
    grn: one(grns, {
        fields: [supplierInvoices.grnId],
        references: [grns.id]
    }),
    payments: many(purchasePayments)
}))

export const purchasePaymentsRelations = relations(purchasePayments, ({ one }) => ({
    organization: one(organizations, {
        fields: [purchasePayments.organizationId],
        references: [organizations.id]
    }),
    supplierInvoice: one(supplierInvoices, {
        fields: [purchasePayments.supplierInvoiceId],
        references: [supplierInvoices.id]
    }),
    supplier: one(stakeholders, {
        fields: [purchasePayments.supplierId],
        references: [stakeholders.id]
    })
}))

// Types
export type PurchaseOrder = typeof purchaseOrders.$inferSelect
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert
export type PurchaseOrderLine = typeof purchaseOrderLines.$inferSelect
export type NewPurchaseOrderLine = typeof purchaseOrderLines.$inferInsert

export type GRN = typeof grns.$inferSelect
export type NewGRN = typeof grns.$inferInsert
export type GRNLine = typeof grnLines.$inferSelect
export type NewGRNLine = typeof grnLines.$inferInsert

export type SupplierInvoice = typeof supplierInvoices.$inferSelect
export type NewSupplierInvoice = typeof supplierInvoices.$inferInsert

export type PurchasePayment = typeof purchasePayments.$inferSelect
export type NewPurchasePayment = typeof purchasePayments.$inferInsert
