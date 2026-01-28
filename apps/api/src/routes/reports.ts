import { Hono } from 'hono';
import { db } from '@smartbiz/db';
import {
    sales,
    saleItems,
    expenses,
    items
} from '@smartbiz/db';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { User } from '@supabase/supabase-js';
import { Profile } from '@smartbiz/shared';

type Variables = {
    user: User;
    profile: Profile | null;
    organizationId: string | null;
};

const app = new Hono<{ Variables: Variables }>();

// GET /reports/pnl
app.get('/pnl', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    // Default to this month if not specified
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    // Ensure end date includes the full day
    end.setHours(23, 59, 59, 999);

    try {
        // 1. Calculate Revenue (Total Sales)
        // Note: We use 'paidAmount' for cash basis or 'totalAmount' for accrual. 
        // Standard P&L is usually Accrual (Revenue recognized when sale made).
        const [revenueResult] = await db
            .select({ total: sql<string>`sum(${sales.totalAmount})` })
            .from(sales)
            .where(and(
                eq(sales.organizationId, profile.organizationId),
                gte(sales.createdAt, start),
                lte(sales.createdAt, end),
                eq(sales.status, 'COMPLETED') // Only completed sales
            ));

        const revenue = parseFloat(revenueResult?.total || '0');

        // 2. Calculate Expenses
        const [expensesResult] = await db
            .select({ total: sql<string>`sum(${expenses.amount})` })
            .from(expenses)
            .where(and(
                eq(expenses.organizationId, profile.organizationId),
                gte(expenses.expenseDate, start.toISOString().split('T')[0]), // expenseDate is the correct column
                lte(expenses.expenseDate, end.toISOString().split('T')[0])
            ));

        const totalExpenses = parseFloat(expensesResult?.total || '0');

        // 3. Calculate COGS (Cost of Goods Sold)
        // Join saleItems with items to get costPrice
        // MVP: Using current item.costPrice * quantitySold
        const [cogsResult] = await db
            .select({
                total: sql<string>`sum(${saleItems.quantity} * ${items.costPrice})`
            })
            .from(saleItems)
            .innerJoin(sales, eq(saleItems.saleId, sales.id))
            .innerJoin(items, eq(saleItems.itemId, items.id))
            .where(and(
                eq(sales.organizationId, profile.organizationId),
                gte(sales.createdAt, start),
                lte(sales.createdAt, end),
                eq(sales.status, 'COMPLETED')
            ));

        const cogs = parseFloat(cogsResult?.total || '0');

        // 4. Calculate Summary
        const grossProfit = revenue - cogs;
        const netProfit = grossProfit - totalExpenses;
        const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        return c.json({
            period: { start, end },
            revenue,
            cogs,
            grossProfit,
            expenses: totalExpenses,
            netProfit,
            margin
        });
    } catch (error) {
        console.error('P&L Report Error:', error);
        return c.json({ error: 'Failed to generate report' }, 500);
    }
});

export default app;
