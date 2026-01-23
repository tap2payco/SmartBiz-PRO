import { pgTable, uuid, varchar, text, decimal, timestamp, pgEnum, date, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './auth'

// Enums
export const bankAccountTypeEnum = pgEnum('bank_account_type', [
    'CASH',
    'BANK',
    'MOBILE_MONEY'
])

export const transactionTypeEnum = pgEnum('bank_transaction_type', [
    'DEPOSIT',
    'WITHDRAWAL'
])

export const transactionReferenceTypeEnum = pgEnum('bank_transaction_reference_type', [
    'SALE',
    'PURCHASE',
    'EXPENSE',
    'TRANSFER',
    'ADJUSTMENT'
])

// Bank Accounts Table
export const bankAccounts = pgTable('bank_accounts', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    type: bankAccountTypeEnum('type').notNull(),
    accountNumber: varchar('account_number', { length: 50 }),
    bankName: varchar('bank_name', { length: 100 }), // e.g. CRDB, NMB, M-Pesa
    currency: varchar('currency', { length: 10 }).default('TZS').notNull(),
    currentBalance: decimal('current_balance', { precision: 15, scale: 2 }).notNull().default('0'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Bank Transactions Table
export const bankTransactions = pgTable('bank_transactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id').notNull().references(() => bankAccounts.id),

    type: transactionTypeEnum('type').notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    transactionDate: date('transaction_date').notNull().defaultNow(),
    description: text('description'),

    referenceType: transactionReferenceTypeEnum('reference_type').notNull().default('ADJUSTMENT'),
    referenceId: uuid('reference_id'), // Link to Sale, PO, etc.
    transferId: uuid('transfer_id'), // If transfer, links the two legs

    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow()
})

// Relations
export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [bankAccounts.organizationId],
        references: [organizations.id]
    }),
    transactions: many(bankTransactions)
}))

export const bankTransactionsRelations = relations(bankTransactions, ({ one }) => ({
    organization: one(organizations, {
        fields: [bankTransactions.organizationId],
        references: [organizations.id]
    }),
    account: one(bankAccounts, {
        fields: [bankTransactions.accountId],
        references: [bankAccounts.id]
    })
}))

// Types
export type BankAccount = typeof bankAccounts.$inferSelect
export type NewBankAccount = typeof bankAccounts.$inferInsert

export type BankTransaction = typeof bankTransactions.$inferSelect
export type NewBankTransaction = typeof bankTransactions.$inferInsert
