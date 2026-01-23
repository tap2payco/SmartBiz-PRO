import { pgTable, uuid, varchar, text, decimal, timestamp, pgEnum, date, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './auth'

// Expense Category Enum
export const expenseCategoryTypeEnum = pgEnum('expense_category_type', [
    'OPERATING',      // Day-to-day operations
    'ADMINISTRATIVE', // Admin and office
    'MARKETING',      // Marketing and advertising
    'PAYROLL',        // Salaries and wages
    'UTILITIES',      // Electricity, water, internet
    'RENT',           // Rent and lease
    'OTHER'           // Miscellaneous
])

// Expense Categories Table
export const expenseCategories = pgTable('expense_categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    type: expenseCategoryTypeEnum('type').notNull().default('OTHER'),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow()
})

// Expenses Table
export const expenses = pgTable('expenses', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => expenseCategories.id),

    description: text('description').notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    expenseDate: date('expense_date').notNull().defaultNow(),
    reference: varchar('reference', { length: 100 }), // Receipt #, Invoice #
    paymentMethod: varchar('payment_method', { length: 50 }), // Cash, Bank, Mobile Money
    notes: text('notes'),

    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Relations
export const expenseCategoriesRelations = relations(expenseCategories, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [expenseCategories.organizationId],
        references: [organizations.id]
    }),
    expenses: many(expenses)
}))

export const expensesRelations = relations(expenses, ({ one }) => ({
    organization: one(organizations, {
        fields: [expenses.organizationId],
        references: [organizations.id]
    }),
    category: one(expenseCategories, {
        fields: [expenses.categoryId],
        references: [expenseCategories.id]
    })
}))

// Types
export type ExpenseCategory = typeof expenseCategories.$inferSelect
export type NewExpenseCategory = typeof expenseCategories.$inferInsert

export type Expense = typeof expenses.$inferSelect
export type NewExpense = typeof expenses.$inferInsert
