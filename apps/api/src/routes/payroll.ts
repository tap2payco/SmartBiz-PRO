import { Hono } from 'hono';
import { db } from '@smartbiz/db';
import {
    payrollRuns,
    payrollItems,
    payrollRunLines,
    taxTables
} from '@smartbiz/db';
import { employees } from '@smartbiz/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';

const app = new Hono<{
    Variables: {
        userId: string;
        organizationId: string;
        role: string;
    };
}>();

app.use('*', authMiddleware as any);

// ==========================================
// PAYROLL RUNS
// ==========================================

const payrollRunSchema = z.object({
    periodStart: z.string(), // ISO date
    periodEnd: z.string(),   // ISO date
});

app.get('/runs', async (c) => {
    const orgId = c.get('organizationId');
    const runs = await db
        .select()
        .from(payrollRuns)
        .where(eq(payrollRuns.organizationId, orgId));

    return c.json(runs);
});

// Generate a payroll run
app.post('/runs/generate', zValidator('json', payrollRunSchema), async (c) => {
    const orgId = c.get('organizationId');
    const data = c.req.valid('json');

    // 1. Fetch all active employees
    const staff = await db
        .select()
        .from(employees)
        .where(eq(employees.organizationId, orgId));

    if (staff.length === 0) {
        return c.json({ error: 'No employees found to generate payroll.' }, 400);
    }

    // 2. Create the run record
    const [run] = await db
        .insert(payrollRuns)
        .values({
            organizationId: orgId,
            periodStart: new Date(data.periodStart),
            periodEnd: new Date(data.periodEnd),
            status: 'DRAFT',
            totalAmount: '0',
        })
        .returning();

    let totalRunAmount = 0;

    // 3. Generate lines for each employee
    for (const emp of staff) {
        const base = Number(emp.baseSalary);

        // For Phase 3 MVP: simple fixed deductions
        // In a full implementation, this reads from `taxTables` and `advances` within the date range.
        const allowances = 0; // Placeholder for Phase 3
        let deductions = 0;

        // Simple mock PAYE calculation (e.g. 15% tax over 270,000 TZS)
        const taxable = base + allowances;
        if (taxable > 270000) {
            deductions = (taxable - 270000) * 0.15;
        }

        const netPay = base + allowances - deductions;
        totalRunAmount += netPay;

        await db.insert(payrollRunLines).values({
            runId: run.id,
            employeeId: emp.id,
            baseSalary: base.toString(),
            allowances: allowances.toString(),
            deductions: deductions.toString(),
            netPay: netPay.toString(),
        });
    }

    // 4. Update run total
    const [updatedRun] = await db.update(payrollRuns)
        .set({ totalAmount: totalRunAmount.toString(), updatedAt: new Date() })
        .where(eq(payrollRuns.id, run.id))
        .returning();

    return c.json(updatedRun, 201);
});

app.patch('/runs/:id/approve', async (c) => {
    const orgId = c.get('organizationId');
    const id = c.req.param('id');

    const [run] = await db
        .update(payrollRuns)
        .set({ status: 'APPROVED', updatedAt: new Date() })
        .where(and(eq(payrollRuns.id, id), eq(payrollRuns.organizationId, orgId)))
        .returning();

    if (!run) return c.json({ error: 'Run not found' }, 404);
    return c.json(run);
});

// ==========================================
// PAYROLL ITEMS (Allowances/Deductions mapping)
// ==========================================
app.get('/items', async (c) => {
    const orgId = c.get('organizationId');
    const items = await db
        .select()
        .from(payrollItems)
        .where(eq(payrollItems.organizationId, orgId));

    return c.json(items);
});

export default app;
