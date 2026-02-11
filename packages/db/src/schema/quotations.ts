import { pgTable, uuid, varchar, timestamp, decimal, text, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './auth';
import { stakeholders } from './stakeholders';
import { items } from './inventory';
import { sales } from './sales';

export const quotationStatusEnum = pgEnum('quotation_status',
    ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED']
);

export const quotations = pgTable('quotations', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => stakeholders.id),
    quotationNumber: varchar('quotation_number', { length: 50 }).notNull(),
    status: quotationStatusEnum('status').notNull().default('DRAFT'),
    validUntil: timestamp('valid_until'),
    subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull().default('0'),
    taxTotal: decimal('tax_total', { precision: 15, scale: 2 }).notNull().default('0'),
    totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    notes: text('notes'),
    terms: text('terms'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    convertedSaleId: uuid('converted_sale_id').references(() => sales.id), // Link to sale if converted
});

export const quotationItems = pgTable('quotation_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    quotationId: uuid('quotation_id').notNull().references(() => quotations.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id').references(() => items.id),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
    unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
    taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
    taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0'),
    total: decimal('total', { precision: 15, scale: 2 }).notNull(),
    notes: text('notes'),
});

// Relations
export const quotationsRelations = relations(quotations, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [quotations.organizationId],
        references: [organizations.id],
    }),
    customer: one(stakeholders, {
        fields: [quotations.customerId],
        references: [stakeholders.id],
    }),
    items: many(quotationItems),
    convertedSale: one(sales, {
        fields: [quotations.convertedSaleId],
        references: [sales.id],
    }),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
    quotation: one(quotations, {
        fields: [quotationItems.quotationId],
        references: [quotations.id],
    }),
    item: one(items, {
        fields: [quotationItems.itemId],
        references: [items.id],
    }),
}));
