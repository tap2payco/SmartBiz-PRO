
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@smartbiz/db';
import { stakeholders, sales } from '@smartbiz/db/src/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

const stakeholdersApp = new Hono<{ Variables: { user: any; organizationId: string } }>();

// Schema for creating/updating a stakeholder
const stakeholderSchema = z.object({
    type: z.enum(['CUSTOMER', 'SUPPLIER']),
    stakeholderType: z.enum(['INDIVIDUAL', 'BUSINESS']).optional().default('INDIVIDUAL'),
    name: z.string().min(2),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().length(2).optional(),
    taxId: z.string().optional(),
    creditLimit: z.number().optional(),
    paymentTerms: z.number().int().optional(),
});

// GET /stakeholders - List all (filtered by type)
stakeholdersApp.get('/', async (c) => {
    const type = c.req.query('type') as 'CUSTOMER' | 'SUPPLIER' | undefined;
    const organizationId = c.get('organizationId');

    let query = db
        .select()
        .from(stakeholders)
        .where(
            and(
                eq(stakeholders.organizationId, organizationId),
                type ? eq(stakeholders.type, type) : undefined,
                eq(stakeholders.isActive, true)
            )
        )
        .orderBy(desc(stakeholders.createdAt));

    const results = await query;
    return c.json({ stakeholders: results });
});

// GET /stakeholders/:id - Get single
stakeholdersApp.get('/:id', async (c) => {
    const id = c.req.param('id');
    const organizationId = c.get('organizationId');

    // 1. Get Stakeholder
    const result = await db
        .select()
        .from(stakeholders)
        .where(
            and(
                eq(stakeholders.id, id),
                eq(stakeholders.organizationId, organizationId)
            )
        )
        .limit(1);

    if (result.length === 0) {
        return c.json({ error: 'Stakeholder not found' }, 404);
    }

    const stakeholder = result[0];

    // 2. Calculate Outstanding Debt
    // Sum of (totalAmount - paidAmount) for all sales that are NOT 'PAID'
    const salesDebt = await db
        .select({
            totalDebt: sql<string>`sum(${sales.totalAmount} - ${sales.paidAmount})`,
            overdueDebt: sql<string>`sum(CASE WHEN ${sales.dueDate} < NOW() THEN (${sales.totalAmount} - ${sales.paidAmount}) ELSE 0 END)`
        })
        .from(sales)
        .where(
            and(
                eq(sales.customerId, id),
                eq(sales.organizationId, organizationId),
                sql`${sales.paymentStatus} != 'PAID'`
            )
        );

    const outstandingDebt = parseFloat(salesDebt[0]?.totalDebt || '0');
    const overdueAmount = parseFloat(salesDebt[0]?.overdueDebt || '0');

    // 3. Calculate Available Credit
    let availableCredit = 0;
    if (stakeholder.creditLimit) {
        availableCredit = Math.max(0, parseFloat(stakeholder.creditLimit) - outstandingDebt);
    }

    return c.json({
        stakeholder: {
            ...stakeholder,
            outstandingDebt,
            overdueAmount,
            availableCredit
        }
    });
});

// POST /stakeholders - Create new
stakeholdersApp.post('/', zValidator('json', stakeholderSchema), async (c) => {
    const data = c.req.valid('json');
    const user = c.get('user');
    const organizationId = c.get('organizationId');

    // Generate a simple code if not provided (e.g. CUST-001)
    // Simplified for now: Timestamp based
    const code = `${data.type.substring(0, 3)}-${Date.now().toString().slice(-6)}`;

    try {
        const [newStakeholder] = await db
            .insert(stakeholders)
            .values({
                ...data,
                organizationId,
                code,
                createdBy: user.id, // user.id is the ID from Supabase
                updatedBy: user.id,
                creditLimit: data.creditLimit ? String(data.creditLimit) : null, // Drizzle expects string for decimal
            })
            .returning();

        return c.json({ stakeholder: newStakeholder }, 201);
    } catch (error) {
        console.error('Error creating stakeholder:', error);
        return c.json({ error: 'Failed to create stakeholder' }, 500);
    }
});

// PATCH /stakeholders/:id - Update
stakeholdersApp.patch('/:id', zValidator('json', stakeholderSchema.partial()), async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const user = c.get('user');
    const organizationId = c.get('organizationId');

    try {
        const [updatedStakeholder] = await db
            .update(stakeholders)
            .set({
                ...data,
                updatedBy: user.id,
                updatedAt: new Date(),
                creditLimit: data.creditLimit ? String(data.creditLimit) : undefined,
            })
            .where(
                and(
                    eq(stakeholders.id, id),
                    eq(stakeholders.organizationId, organizationId)
                )
            )
            .returning();

        if (!updatedStakeholder) {
            return c.json({ error: 'Stakeholder not found' }, 404);
        }

        return c.json({ stakeholder: updatedStakeholder });
    } catch (error) {
        console.error('Error updating stakeholder:', error);
        return c.json({ error: 'Failed to update stakeholder' }, 500);
    }
});

// DELETE /stakeholders/:id - Soft delete
stakeholdersApp.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const organizationId = c.get('organizationId');
    const user = c.get('user');

    try {
        const [deleted] = await db
            .update(stakeholders)
            .set({
                isActive: false,
                deletedAt: new Date(),
                updatedBy: user.id
            })
            .where(
                and(
                    eq(stakeholders.id, id),
                    eq(stakeholders.organizationId, organizationId)
                )
            )
            .returning();

        if (!deleted) {
            return c.json({ error: 'Stakeholder not found' }, 404);
        }

        return c.json({ message: 'Stakeholder deleted successfully' });
    } catch (error) {
        return c.json({ error: 'Failed to delete stakeholder' }, 500);
    }
});

export default stakeholdersApp;
