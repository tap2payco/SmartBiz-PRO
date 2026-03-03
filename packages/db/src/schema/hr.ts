import { pgTable, uuid, text, timestamp, integer, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from './auth';

export const leaveStatusEnum = pgEnum('leave_status', ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);
export const advanceStatusEnum = pgEnum('advance_status', ['PENDING', 'APPROVED', 'REJECTED', 'PAID', 'REPAID']);

export const employees = pgTable('employees', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    role: text('role').notNull(),
    department: text('department'),
    baseSalary: decimal('base_salary', { precision: 12, scale: 2 }).notNull().default('0'),
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const leaveRequests = pgTable('leave_requests', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
        .notNull()
        .references(() => employees.id, { onDelete: 'cascade' }),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    type: text('type').notNull(), // e.g., ANNUAL, SICK, MATERNITY
    status: leaveStatusEnum('status').notNull().default('PENDING'),
    reason: text('reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const advances = pgTable('advances', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
        .notNull()
        .references(() => employees.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    reason: text('reason'),
    status: advanceStatusEnum('status').notNull().default('PENDING'),
    repaymentDate: timestamp('repayment_date'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
