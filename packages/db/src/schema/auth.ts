import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, varchar, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', [
    'ADMIN',
    'OWNER',
    'ACCOUNTANT',
    'STOREKEEPER',
    'PROCUREMENT',
    'HR',
    'PAYROLL',
    'PROJECT_MANAGER',
    'SALES',
]);

export const industryEnum = pgEnum('industry', [
    'RETAIL',
    'WHOLESALE',
    'HEALTHCARE',
    'EDUCATION',
    'NGO',
    'MANUFACTURING',
]);

// Organizations table
export const organizations = pgTable('organizations', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    industry: industryEnum('industry').notNull(),
    country: varchar('country', { length: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('TZS'),
    timezone: varchar('timezone', { length: 50 }).notNull().default('Africa/Dar_es_Salaam'),
    settings: jsonb('settings').notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Profiles table (extends Supabase auth.users)
export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().unique(), // References auth.users
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    avatar: text('avatar'),
    role: userRoleEnum('role').notNull().default('SALES'),
    permissions: jsonb('permissions').notNull().default([]),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
    deletedAt: timestamp('deleted_at'),
    version: integer('version').notNull().default(1),
});

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    action: varchar('action', { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, LOGIN, etc.
    entity: varchar('entity', { length: 50 }).notNull(), // table name
    entityId: uuid('entity_id'),
    changes: jsonb('changes'), // before/after values
    metadata: jsonb('metadata'), // IP, device, etc.
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Operations log (for idempotency)
export const operationsLog = pgTable('operations_log', {
    id: uuid('id').primaryKey(), // This IS the idempotency key
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    deviceId: varchar('device_id', { length: 100 }).notNull(),
    table: varchar('table', { length: 50 }).notNull(),
    action: varchar('action', { length: 10 }).notNull(), // CREATE, UPDATE, DELETE
    entityId: uuid('entity_id').notNull(),
    payload: jsonb('payload').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('APPLIED'), // APPLIED, CONFLICT, FAILED
    error: text('error'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    processedAt: timestamp('processed_at').notNull().defaultNow(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
    profiles: many(profiles),
    auditLogs: many(auditLogs),
    operationsLog: many(operationsLog),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
    organization: one(organizations, {
        fields: [profiles.organizationId],
        references: [organizations.id],
    }),
}));

// Types
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type OperationLog = typeof operationsLog.$inferSelect;
export type NewOperationLog = typeof operationsLog.$inferInsert;
