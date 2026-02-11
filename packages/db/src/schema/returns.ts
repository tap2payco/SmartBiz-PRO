import { pgTable, uuid, text, timestamp, decimal, pgEnum, integer, boolean, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './auth';
import { sales } from './sales';
import { items } from './inventory';
import { stakeholders } from './stakeholders';

// Enums
export const returnStatusEnum = pgEnum('return_status', ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']);
export const returnConditionEnum = pgEnum('return_condition', ['GOOD', 'DAMAGED', 'EXPIRED', 'OTHER']);
export const refundStatusEnum = pgEnum('refund_status', ['PENDING', 'PARTIAL', 'REFUNDED', 'CREDITED']);

// Returns Table
export const returns = pgTable('returns', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    saleId: uuid('sale_id').notNull().references(() => sales.id),
    customerId: uuid('customer_id').references(() => stakeholders.id),
    returnNumber: varchar('return_number', { length: 50 }).notNull(),

    status: returnStatusEnum('status').notNull().default('PENDING'),
    refundStatus: refundStatusEnum('refund_status').notNull().default('PENDING'),

    totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    refundedAmount: decimal('refunded_amount', { precision: 15, scale: 2 }).notNull().default('0'),

    reason: text('reason'),
    notes: text('notes'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    createdBy: uuid('created_by'),
    approvedBy: uuid('approved_by'),
});

// Return Items Table
export const returnItems = pgTable('return_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    returnId: uuid('return_id').notNull().references(() => returns.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id').notNull().references(() => items.id),

    quantity: integer('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
    total: decimal('total', { precision: 15, scale: 2 }).notNull(),

    condition: returnConditionEnum('condition').notNull().default('GOOD'),
    restock: boolean('restock').notNull().default(true), // Whether to add back to inventory
    reason: text('reason'),
});

// Relations
export const returnsRelations = relations(returns, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [returns.organizationId],
        references: [organizations.id],
    }),
    sale: one(sales, {
        fields: [returns.saleId],
        references: [sales.id],
    }),
    customer: one(stakeholders, {
        fields: [returns.customerId],
        references: [stakeholders.id],
    }),
    items: many(returnItems),
}));

export const returnItemsRelations = relations(returnItems, ({ one }) => ({
    return: one(returns, {
        fields: [returnItems.returnId],
        references: [returns.id],
    }),
    item: one(items, {
        fields: [returnItems.itemId],
        references: [items.id],
    }),
}));

// Types
export type Return = typeof returns.$inferSelect;
export type NewReturn = typeof returns.$inferInsert;
export type ReturnItem = typeof returnItems.$inferSelect;
export type NewReturnItem = typeof returnItems.$inferInsert;
