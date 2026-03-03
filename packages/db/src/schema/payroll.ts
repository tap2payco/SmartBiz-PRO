import { pgTable, uuid, text, timestamp, decimal, pgEnum, boolean, jsonb } from 'drizzle-orm/pg-core';
import { organizations } from './auth';
import { employees } from './hr';

export const payrollRunStatusEnum = pgEnum('payroll_run_status', ['DRAFT', 'APPROVED', 'PROCESSED']);
export const payrollItemTypeEnum = pgEnum('payroll_item_type', ['EARNING', 'DEDUCTION']);

export const payrollRuns = pgTable('payroll_runs', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    status: payrollRunStatusEnum('status').notNull().default('DRAFT'),
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const payrollItems = pgTable('payroll_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    type: payrollItemTypeEnum('type').notNull(),
    name: text('name').notNull(),
    defaultAmount: decimal('default_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    isTaxable: boolean('is_taxable').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const payrollRunLines = pgTable('payroll_run_lines', {
    id: uuid('id').defaultRandom().primaryKey(),
    runId: uuid('run_id')
        .notNull()
        .references(() => payrollRuns.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
        .notNull()
        .references(() => employees.id, { onDelete: 'cascade' }),
    baseSalary: decimal('base_salary', { precision: 12, scale: 2 }).notNull().default('0'),
    allowances: decimal('allowances', { precision: 12, scale: 2 }).notNull().default('0'),
    deductions: decimal('deductions', { precision: 12, scale: 2 }).notNull().default('0'),
    netPay: decimal('net_pay', { precision: 12, scale: 2 }).notNull().default('0'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const taxTables = pgTable('tax_tables', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // e.g., 'TZ PAYE 2024'
    rulesJson: jsonb('rules_json').notNull(), // { brackets: [{ min, max, rate, baseTax }] }
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
