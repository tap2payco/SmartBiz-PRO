import { pgTable, uuid, text, timestamp, boolean, integer, varchar, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './auth';
import { items } from './inventory';
import { stakeholders } from './stakeholders';

// Sales Status Enum
export const saleStatusEnum = pgEnum('sale_status', ['DRAFT', 'COMPLETED', 'CANCELLED', 'RETURNED']);
// Payment Status Enum
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'PARTIAL', 'PAID', 'REFUNDED']);
// Payment Method Enum
export const paymentMethodEnum = pgEnum('payment_method', ['CASH', 'MOBILE_MONEY', 'CARD', 'BANK_TRANSFER', 'CREDIT']);

// Sales table
export const sales = pgTable('sales', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => stakeholders.id),
    saleNumber: varchar('sale_number', { length: 50 }).notNull(),
    status: saleStatusEnum('status').notNull().default('COMPLETED'),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('PENDING'),

    subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull().default('0'),
    taxTotal: decimal('tax_total', { precision: 15, scale: 2 }).notNull().default('0'),
    discountTotal: decimal('discount_total', { precision: 15, scale: 2 }).notNull().default('0'),
    totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    paidAmount: decimal('paid_amount', { precision: 15, scale: 2 }).notNull().default('0'),

    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    createdBy: uuid('created_by'),
});

// Sale Items table
export const saleItems = pgTable('sale_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    saleId: uuid('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id').notNull().references(() => items.id),

    quantity: decimal('quantity', { precision: 15, scale: 2 }).notNull(),
    unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
    discount: decimal('discount', { precision: 15, scale: 2 }).default('0'),
    tax: decimal('tax', { precision: 15, scale: 2 }).default('0'),
    total: decimal('total', { precision: 15, scale: 2 }).notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Payments table
export const payments = pgTable('payments', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    saleId: uuid('sale_id').references(() => sales.id, { onDelete: 'cascade' }),

    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    method: paymentMethodEnum('method').notNull(),
    reference: varchar('reference', { length: 100 }), // Trans ID, Receipt No, etc.
    notes: text('notes'),

    paymentDate: timestamp('payment_date').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by'),
});

// Relations
export const salesRelations = relations(sales, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [sales.organizationId],
        references: [organizations.id],
    }),
    customer: one(stakeholders, {
        fields: [sales.customerId],
        references: [stakeholders.id],
    }),
    items: many(saleItems),
    payments: many(payments),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
    sale: one(sales, {
        fields: [saleItems.saleId],
        references: [sales.id],
    }),
    item: one(items, {
        fields: [saleItems.itemId],
        references: [items.id],
    }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
    organization: one(organizations, {
        fields: [payments.organizationId],
        references: [organizations.id],
    }),
    sale: one(sales, {
        fields: [payments.saleId],
        references: [sales.id],
    }),
}));

// Types
export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
export type SaleItem = typeof saleItems.$inferSelect;
export type NewSaleItem = typeof saleItems.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
