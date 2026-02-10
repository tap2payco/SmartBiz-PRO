import { Hono } from 'hono';
import { db } from '@smartbiz/db';
import {
    sales,
    saleItems,
    expenses,
    items
} from '@smartbiz/db';
import { eq, and, sql, gte, lte, desc } from 'drizzle-orm';
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

// GET /reports/dashboard — Dashboard summary stats
app.get('/dashboard', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    try {
        // Total revenue (all time, completed sales)
        const [revenueResult] = await db
            .select({ total: sql<string>`sum(${sales.totalAmount})` })
            .from(sales)
            .where(and(
                eq(sales.organizationId, profile.organizationId),
                eq(sales.status, 'COMPLETED')
            ));

        // Total number of orders
        const [orderCountResult] = await db
            .select({ count: sql<string>`count(*)` })
            .from(sales)
            .where(and(
                eq(sales.organizationId, profile.organizationId),
                eq(sales.status, 'COMPLETED')
            ));

        // Today's revenue
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [todayResult] = await db
            .select({ total: sql<string>`sum(${sales.totalAmount})` })
            .from(sales)
            .where(and(
                eq(sales.organizationId, profile.organizationId),
                eq(sales.status, 'COMPLETED'),
                gte(sales.createdAt, todayStart)
            ));

        return c.json({
            totalRevenue: parseFloat(revenueResult?.total || '0'),
            totalOrders: parseInt(orderCountResult?.count || '0'),
            todayRevenue: parseFloat(todayResult?.total || '0'),
        });
    } catch (error) {
        console.error('Dashboard Report Error:', error);
        return c.json({ error: 'Failed to generate dashboard report' }, 500);
    }
});

// GET /reports/sales-chart?range=7d|30d|90d — Daily revenue for chart
app.get('/sales-chart', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    const range = c.req.query('range') || '7d';
    const days = range === '90d' ? 90 : range === '30d' ? 30 : 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    try {
        const results = await db
            .select({
                date: sql<string>`DATE(${sales.createdAt})`,
                revenue: sql<string>`sum(${sales.totalAmount})`,
            })
            .from(sales)
            .where(and(
                eq(sales.organizationId, profile.organizationId),
                eq(sales.status, 'COMPLETED'),
                gte(sales.createdAt, startDate)
            ))
            .groupBy(sql`DATE(${sales.createdAt})`)
            .orderBy(sql`DATE(${sales.createdAt})`);

        // Fill in days with zero revenue so the chart has no gaps
        const chartData: { date: string; revenue: number }[] = [];
        const revenueMap = new Map(results.map(r => [r.date, parseFloat(r.revenue || '0')]));

        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            chartData.push({
                date: dateStr,
                revenue: revenueMap.get(dateStr) || 0,
            });
        }

        return c.json(chartData);
    } catch (error) {
        console.error('Sales Chart Error:', error);
        return c.json({ error: 'Failed to generate sales chart' }, 500);
    }
});

// GET /reports/top-products?limit=5 — Top selling products
app.get('/top-products', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    const limit = parseInt(c.req.query('limit') || '5');

    try {
        const results = await db
            .select({
                itemId: saleItems.itemId,
                name: items.name,
                totalQuantity: sql<string>`sum(${saleItems.quantity})`,
                totalRevenue: sql<string>`sum(${saleItems.quantity} * ${saleItems.unitPrice})`,
            })
            .from(saleItems)
            .innerJoin(sales, eq(saleItems.saleId, sales.id))
            .innerJoin(items, eq(saleItems.itemId, items.id))
            .where(and(
                eq(sales.organizationId, profile.organizationId),
                eq(sales.status, 'COMPLETED')
            ))
            .groupBy(saleItems.itemId, items.name)
            .orderBy(desc(sql`sum(${saleItems.quantity})`))
            .limit(limit);

        return c.json(results.map(r => ({
            itemId: r.itemId,
            name: r.name,
            totalQuantity: parseInt(r.totalQuantity || '0'),
            totalRevenue: parseFloat(r.totalRevenue || '0'),
        })));
    } catch (error) {
        console.error('Top Products Error:', error);
        return c.json({ error: 'Failed to generate top products report' }, 500);
    }
});

export default app;
