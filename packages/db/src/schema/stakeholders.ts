import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, varchar, decimal, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './auth';

// Stakeholder type enum
export const stakeholderTypeEnum = pgEnum('stakeholder_type', ['CUSTOMER', 'SUPPLIER']);

// Stakeholder sub-type enum (Individual vs Business)
export const stakeholderSubTypeEnum = pgEnum('stakeholder_sub_type', ['INDIVIDUAL', 'BUSINESS']);

// Stakeholders table (Customers and Suppliers)
export const stakeholders = pgTable('stakeholders', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    type: stakeholderTypeEnum('type').notNull(),
    stakeholderType: stakeholderSubTypeEnum('stakeholder_type').default('INDIVIDUAL'),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    country: varchar('country', { length: 2 }),
    taxId: varchar('tax_id', { length: 50 }),
    creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }),
    paymentTerms: integer('payment_terms'), // days
    loyaltyPoints: decimal('loyalty_points', { precision: 15, scale: 2 }).default('0'),
    isActive: boolean('is_active').notNull().default(true),
    isDeleted: boolean('is_deleted').notNull().default(false),
    customFields: jsonb('custom_fields'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
    deletedAt: timestamp('deleted_at'),
    version: integer('version').notNull().default(1),
}, (table) => {
    return {
        orgIdx: index('stakeholders_org_idx').on(table.organizationId),
        typeIdx: index('stakeholders_type_idx').on(table.type),
        codeIdx: index('stakeholders_code_idx').on(table.code),
    };
});

// Stakeholder contacts
export const stakeholderContacts = pgTable('stakeholder_contacts', {
    id: uuid('id').primaryKey().defaultRandom(),
    stakeholderId: uuid('stakeholder_id').notNull().references(() => stakeholders.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    position: varchar('position', { length: 100 }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Stakeholder interactions (calls, emails, notes)
export const stakeholderInteractions = pgTable('stakeholder_interactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    stakeholderId: uuid('stakeholder_id').notNull().references(() => stakeholders.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(), // CALL, EMAIL, MEETING, NOTE
    subject: varchar('subject', { length: 255 }),
    notes: text('notes'),
    interactionDate: timestamp('interaction_date').notNull().defaultNow(),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
    return {
        stakeholderIdx: index('stakeholder_interactions_stakeholder_idx').on(table.stakeholderId),
        typeIdx: index('stakeholder_interactions_type_idx').on(table.type),
    };
});

// Relations
export const stakeholdersRelations = relations(stakeholders, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [stakeholders.organizationId],
        references: [organizations.id],
    }),
    contacts: many(stakeholderContacts),
    interactions: many(stakeholderInteractions),
}));

export const stakeholderContactsRelations = relations(stakeholderContacts, ({ one }) => ({
    stakeholder: one(stakeholders, {
        fields: [stakeholderContacts.stakeholderId],
        references: [stakeholders.id],
    }),
}));

export const stakeholderInteractionsRelations = relations(stakeholderInteractions, ({ one }) => ({
    stakeholder: one(stakeholders, {
        fields: [stakeholderInteractions.stakeholderId],
        references: [stakeholders.id],
    }),
}));

// Types
export type Stakeholder = typeof stakeholders.$inferSelect;
export type NewStakeholder = typeof stakeholders.$inferInsert;

export type StakeholderContact = typeof stakeholderContacts.$inferSelect;
export type NewStakeholderContact = typeof stakeholderContacts.$inferInsert;

export type StakeholderInteraction = typeof stakeholderInteractions.$inferSelect;
export type NewStakeholderInteraction = typeof stakeholderInteractions.$inferInsert;
