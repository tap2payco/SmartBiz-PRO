import { Hono } from 'hono';
import { db } from '@smartbiz/db';
import {
    bankAccounts,
    bankTransactions
} from '@smartbiz/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { User } from '@supabase/supabase-js';
import { Profile } from '@smartbiz/shared';

type Variables = {
    user: User;
    profile: Profile | null;
    organizationId: string | null;
};

const app = new Hono<{ Variables: Variables }>();

// Validation schemas
const createAccountSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['CASH', 'BANK', 'MOBILE_MONEY']),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    currency: z.string().default('TZS'),
    initialBalance: z.number().default(0)
});

const transferSchema = z.object({
    fromAccountId: z.string().uuid(),
    toAccountId: z.string().uuid(),
    amount: z.number().positive(),
    date: z.string(),
    description: z.string().optional()
});

const adjustSchema = z.object({
    accountId: z.string().uuid(),
    type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
    amount: z.number().positive(),
    date: z.string(),
    description: z.string().optional()
});

// GET /banking/accounts - List all accounts
app.get('/accounts', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    try {
        const accounts = await db.query.bankAccounts.findMany({
            where: and(
                eq(bankAccounts.organizationId, profile.organizationId),
                eq(bankAccounts.isActive, true)
            ),
            orderBy: [desc(bankAccounts.createdAt)]
        });
        return c.json(accounts);
    } catch (error) {
        console.error('List Accounts Error:', error);
        return c.json({ error: 'Failed to fetch accounts' }, 500);
    }
});

// POST /banking/accounts - Create new account
app.post('/accounts', zValidator('json', createAccountSchema), async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    const data = c.req.valid('json');

    try {
        const [account] = await db.insert(bankAccounts).values({
            organizationId: profile.organizationId,
            name: data.name,
            type: data.type,
            accountNumber: data.accountNumber,
            bankName: data.bankName,
            currency: data.currency,
            currentBalance: data.initialBalance.toString()
        }).returning();

        // If initial balance > 0, create an opening balance transaction
        if (data.initialBalance > 0) {
            await db.insert(bankTransactions).values({
                organizationId: profile.organizationId,
                accountId: account.id,
                type: 'DEPOSIT',
                amount: data.initialBalance.toString(),
                description: 'Opening Balance',
                referenceType: 'ADJUSTMENT',
                createdBy: profile.id
            });
        }

        return c.json(account, 201);
    } catch (error) {
        console.error('Create Account Error:', error);
        return c.json({ error: 'Failed to create account' }, 500);
    }
});

// GET /banking/accounts/:id/transactions - Get transaction history
app.get('/accounts/:id/transactions', async (c) => {
    const profile = c.get('profile');
    const accountId = c.req.param('id');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    try {
        const transactions = await db.query.bankTransactions.findMany({
            where: and(
                eq(bankTransactions.organizationId, profile.organizationId),
                eq(bankTransactions.accountId, accountId)
            ),
            orderBy: [desc(bankTransactions.transactionDate), desc(bankTransactions.createdAt)],
            limit: 100
        });

        return c.json(transactions);
    } catch (error) {
        console.error('List Transactions Error:', error);
        return c.json({ error: 'Failed to fetch transactions' }, 500);
    }
});

// POST /banking/transfer - Transfer money between accounts
app.post('/transfer', zValidator('json', transferSchema), async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    const data = c.req.valid('json');

    try {
        await db.transaction(async (tx: any) => {
            // 1. Get Source Account
            const [sourceAccount] = await tx
                .select()
                .from(bankAccounts)
                .where(and(eq(bankAccounts.id, data.fromAccountId), eq(bankAccounts.organizationId, profile.organizationId!)));

            if (!sourceAccount) throw new Error('Source account not found');
            if (parseFloat(sourceAccount.currentBalance) < data.amount) {
                throw new Error('Insufficient funds');
            }

            // 2. Get Target Account
            const [targetAccount] = await tx
                .select()
                .from(bankAccounts)
                .where(and(eq(bankAccounts.id, data.toAccountId), eq(bankAccounts.organizationId, profile.organizationId!)));

            if (!targetAccount) throw new Error('Target account not found');

            const transferId = crypto.randomUUID();

            // 3. Create Withdrawal Transaction
            await tx.insert(bankTransactions).values({
                organizationId: profile.organizationId!,
                accountId: data.fromAccountId,
                type: 'WITHDRAWAL',
                amount: data.amount.toString(),
                transactionDate: data.date,
                description: `Transfer to ${targetAccount.name}` + (data.description ? ` - ${data.description}` : ''),
                referenceType: 'TRANSFER',
                transferId: transferId,
                createdBy: profile.id
            });

            // 4. Update Source Balance
            await tx
                .update(bankAccounts)
                .set({
                    currentBalance: sql`${bankAccounts.currentBalance} - ${data.amount}`,
                    updatedAt: new Date()
                })
                .where(eq(bankAccounts.id, data.fromAccountId));

            // 5. Create Deposit Transaction
            await tx.insert(bankTransactions).values({
                organizationId: profile.organizationId!,
                accountId: data.toAccountId,
                type: 'DEPOSIT',
                amount: data.amount.toString(),
                transactionDate: data.date,
                description: `Transfer from ${sourceAccount.name}` + (data.description ? ` - ${data.description}` : ''),
                referenceType: 'TRANSFER',
                transferId: transferId,
                createdBy: profile.id
            });

            // 6. Update Target Balance
            await tx
                .update(bankAccounts)
                .set({
                    currentBalance: sql`${bankAccounts.currentBalance} + ${data.amount}`,
                    updatedAt: new Date()
                })
                .where(eq(bankAccounts.id, data.toAccountId));
        });

        return c.json({ success: true });
    } catch (error: any) {
        console.error('Transfer Error:', error);
        return c.json({ error: error.message || 'Failed to process transfer' }, 400); // Bad Request for insufficient funds
    }
});

// POST /banking/adjust - Manual adjustment
app.post('/adjust', zValidator('json', adjustSchema), async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    const data = c.req.valid('json');

    try {
        await db.transaction(async (tx: any) => {
            const [account] = await tx
                .select()
                .from(bankAccounts)
                .where(and(eq(bankAccounts.id, data.accountId), eq(bankAccounts.organizationId, profile.organizationId!)));

            if (!account) throw new Error('Account not found');

            // Validation: Cannot withdraw more than balance
            if (data.type === 'WITHDRAWAL' && parseFloat(account.currentBalance) < data.amount) {
                throw new Error('Insufficient funds');
            }

            // Create Transaction
            await tx.insert(bankTransactions).values({
                organizationId: profile.organizationId!,
                accountId: data.accountId,
                type: data.type,
                amount: data.amount.toString(),
                transactionDate: data.date,
                description: data.description || 'Manual Adjustment',
                referenceType: 'ADJUSTMENT',
                createdBy: profile.id
            });

            // Update Balance
            const balanceChange = data.type === 'DEPOSIT' ? data.amount : -data.amount;
            await tx
                .update(bankAccounts)
                .set({
                    currentBalance: sql`${bankAccounts.currentBalance} + ${balanceChange}`,
                    updatedAt: new Date()
                })
                .where(eq(bankAccounts.id, data.accountId));
        });

        return c.json({ success: true });
    } catch (error: any) {
        console.error('Adjustment Error:', error);
        return c.json({ error: error.message || 'Failed to process adjustment' }, 400);
    }
});


export default app;
