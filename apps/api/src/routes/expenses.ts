import { Hono } from 'hono';
import { db } from '@smartbiz/db';
import {
    expenses,
    expenseCategories
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
const createCategorySchema = z.object({
    name: z.string().min(1),
    type: z.enum(['OPERATING', 'ADMINISTRATIVE', 'MARKETING', 'PAYROLL', 'UTILITIES', 'RENT', 'OTHER']).default('OTHER'),
    description: z.string().optional()
});

const createExpenseSchema = z.object({
    categoryId: z.string().uuid().optional(),
    description: z.string().min(1),
    amount: z.number().positive(),
    expenseDate: z.string(),
    reference: z.string().optional(),
    paymentMethod: z.string().optional(),
    notes: z.string().optional()
});

// GET /expenses/categories - List expense categories
app.get('/categories', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    try {
        const categories = await db.query.expenseCategories.findMany({
            where: and(
                eq(expenseCategories.organizationId, profile.organizationId),
                eq(expenseCategories.isActive, true)
            )
        });
        return c.json(categories);
    } catch (error) {
        console.error('List Expense Categories Error:', error);
        return c.json({ error: 'Failed to fetch categories' }, 500);
    }
});

// POST /expenses/categories - Create expense category
app.post('/categories', zValidator('json', createCategorySchema), async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    const data = c.req.valid('json');

    try {
        const [category] = await db.insert(expenseCategories).values({
            organizationId: profile.organizationId,
            name: data.name,
            type: data.type,
            description: data.description || null
        }).returning();

        return c.json(category, 201);
    } catch (error) {
        console.error('Create Expense Category Error:', error);
        return c.json({ error: 'Failed to create category' }, 500);
    }
});

// GET /expenses - List all expenses
app.get('/', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    try {
        const expensesList = await db.query.expenses.findMany({
            where: eq(expenses.organizationId, profile.organizationId),
            with: {
                category: true
            },
            orderBy: [desc(expenses.expenseDate)]
        });

        return c.json(expensesList);
    } catch (error) {
        console.error('List Expenses Error:', error);
        return c.json({ error: 'Failed to fetch expenses' }, 500);
    }
});

// GET /expenses/summary - Get expense summary
app.get('/summary', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    try {
        // Total by category
        const byCategory = await db
            .select({
                categoryName: expenseCategories.name,
                total: sql<string>`sum(${expenses.amount})`
            })
            .from(expenses)
            .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
            .where(eq(expenses.organizationId, profile.organizationId))
            .groupBy(expenseCategories.name);

        // Total this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

        const [monthlyTotal] = await db
            .select({
                total: sql<string>`sum(${expenses.amount})`
            })
            .from(expenses)
            .where(and(
                eq(expenses.organizationId, profile.organizationId),
                sql`${expenses.expenseDate} >= ${startOfMonth}`
            ));

        return c.json({
            byCategory,
            monthlyTotal: monthlyTotal?.total || '0'
        });
    } catch (error) {
        console.error('Expense Summary Error:', error);
        return c.json({ error: 'Failed to get summary' }, 500);
    }
});

// POST /expenses - Create expense
app.post('/', zValidator('json', createExpenseSchema), async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    const data = c.req.valid('json');

    try {
        const [expense] = await db.insert(expenses).values({
            organizationId: profile.organizationId,
            categoryId: data.categoryId || null,
            description: data.description,
            amount: data.amount.toString(),
            expenseDate: data.expenseDate,
            reference: data.reference || null,
            paymentMethod: data.paymentMethod || null,
            notes: data.notes || null,
            createdBy: profile.id
        }).returning();

        return c.json(expense, 201);
    } catch (error) {
        console.error('Create Expense Error:', error);
        return c.json({ error: 'Failed to create expense' }, 500);
    }
});

// DELETE /expenses/:id - Delete expense
app.delete('/:id', async (c) => {
    const profile = c.get('profile');
    const id = c.req.param('id');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    try {
        await db.delete(expenses).where(and(
            eq(expenses.id, id),
            eq(expenses.organizationId, profile.organizationId)
        ));

        return c.json({ success: true });
    } catch (error) {
        console.error('Delete Expense Error:', error);
        return c.json({ error: 'Failed to delete expense' }, 500);
    }
});

export default app;
