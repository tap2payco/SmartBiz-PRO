import { Hono } from 'hono';
import { db } from '@smartbiz/db';
import {
    purchaseOrders,
    purchaseOrderLines,
    stakeholders,
    items,
    grns,
    grnLines,
    stockMovements
} from '@smartbiz/db';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { User } from '@supabase/supabase-js';
import { Profile } from '@smartbiz/shared';

type Variables = {
    user: User;
    profile: Profile | null;
    organizationId: string | null;
};

const app = new Hono<{ Variables: Variables }>();

// GET /purchases/orders - List Purchase Orders
app.get('/orders', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    try {
        const orders = await db.query.purchaseOrders.findMany({
            where: and(
                eq(purchaseOrders.organizationId, profile.organizationId)
            ),
            with: {
                supplier: true,
                lines: true
            },
            orderBy: [desc(purchaseOrders.createdAt)]
        });

        return c.json(orders);
    } catch (error) {
        console.error('List POs Error:', error);
        return c.json({ error: 'Failed to fetch purchase orders' }, 500);
    }
});

// GET /purchases/orders/:id - Get Single PO
app.get('/orders/:id', async (c) => {
    const profile = c.get('profile');
    const id = c.req.param('id');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    try {
        const order = await db.query.purchaseOrders.findFirst({
            where: and(
                eq(purchaseOrders.id, id),
                eq(purchaseOrders.organizationId, profile.organizationId)
            ),
            with: {
                supplier: true,
                lines: {
                    with: {
                        item: true
                    }
                },
                grns: true,
                invoices: true
            }
        });

        if (!order) return c.json({ error: 'Purchase Order not found' }, 404);

        return c.json(order);
    } catch (error) {
        return c.json({ error: 'Failed to fetch purchase order' }, 500);
    }
});

// POST /purchases/orders - Create PO
app.post('/orders', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const { supplierId, items: orderItems, notes, expectedDeliveryDate } = body;

    if (!supplierId || !orderItems || !Array.isArray(orderItems)) {
        return c.json({ error: 'Invalid data' }, 400);
    }

    try {
        // Generate PO Number
        const [countResult] = await db
            .select({ count: count() })
            .from(purchaseOrders)
            .where(eq(purchaseOrders.organizationId, profile.organizationId));

        const nextNum = (countResult?.count || 0) + 1;
        const orderNumber = `PO-${new Date().getFullYear()}-${nextNum.toString().padStart(4, '0')}`;

        // Calculate totals
        let totalAmount = 0;
        const linesToInsert: any[] = [];

        for (const item of orderItems) {
            const lineTotal = Number(item.quantity) * Number(item.unitCost);
            totalAmount += lineTotal;
            linesToInsert.push({
                itemId: item.itemId,
                quantity: item.quantity,
                unitCost: item.unitCost,
                totalCost: lineTotal
            });
        }

        const result = await db.transaction(async (tx) => {
            const [newOrder] = await tx.insert(purchaseOrders).values({
                organizationId: profile.organizationId,
                supplierId,
                orderNumber,
                expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
                totalAmount: totalAmount.toString(),
                notes,
                status: 'DRAFT',
                createdBy: profile.id
            }).returning();

            if (linesToInsert.length > 0) {
                await tx.insert(purchaseOrderLines).values(
                    linesToInsert.map(line => ({
                        ...line,
                        purchaseOrderId: newOrder.id,
                        totalCost: line.totalCost.toString(),
                        unitCost: line.unitCost.toString()
                    }))
                );
            }

            return newOrder;
        });

        return c.json(result, 201);
    } catch (error) {
        console.error('Create PO Error:', error);
        return c.json({ error: 'Failed to create purchase order' }, 500);
    }
});

// PATCH /purchases/orders/:id/status
app.patch('/orders/:id/status', async (c) => {
    const profile = c.get('profile');
    const id = c.req.param('id');
    const { status } = await c.req.json();

    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);

    try {
        await db.update(purchaseOrders)
            .set({
                status,
                updatedAt: new Date(),
                ...(status === 'ISSUED' ? { issueDate: new Date().toISOString() } : {})
            })
            .where(and(
                eq(purchaseOrders.id, id),
                eq(purchaseOrders.organizationId, profile.organizationId)
            ));

        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Failed to update status' }, 500);
    }
});

// POST /purchases/orders/:id/receive - Receive Stock (Create GRN)
app.post('/orders/:id/receive', async (c) => {
    const profile = c.get('profile');
    const id = c.req.param('id');
    const { items: receivedItems } = await c.req.json();

    if (!profile?.organizationId) return c.json({ error: 'Unauthorized' }, 401);
    if (!receivedItems || !Array.isArray(receivedItems) || receivedItems.length === 0) {
        return c.json({ error: 'Invalid items data' }, 400);
    }

    try {
        await db.transaction(async (tx) => {
            // 1. Get PO
            const order = await tx.query.purchaseOrders.findFirst({
                where: and(eq(purchaseOrders.id, id), eq(purchaseOrders.organizationId, profile.organizationId)),
                with: { lines: true }
            });

            if (!order) throw new Error('Order not found');

            // 2. Create GRN Header
            const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const grnNumber = `GRN-${order.orderNumber.split('-').slice(1).join('-')}-${randomSuffix}`;

            const [grn] = await tx.insert(grns).values({
                organizationId: profile.organizationId,
                purchaseOrderId: id,
                supplierId: order.supplierId,
                grnNumber,
                status: 'VERIFIED',
                receivedBy: profile.id
            }).returning();

            // 3. Process Items
            for (const item of receivedItems) {
                const poLine = order.lines.find(l => l.id === item.lineId);
                if (!poLine) continue;

                const qty = Number(item.quantity);

                // Create GRN Line
                await tx.insert(grnLines).values({
                    grnId: grn.id,
                    purchaseOrderLineId: poLine.id,
                    itemId: poLine.itemId,
                    quantityReceived: qty
                });

                // Update PO Line Received Qty
                await tx.update(purchaseOrderLines)
                    .set({
                        receivedQuantity: sql`${purchaseOrderLines.receivedQuantity} + ${qty}`
                    })
                    .where(eq(purchaseOrderLines.id, poLine.id));

                // Create Stock Movement
                await tx.insert(stockMovements).values({
                    organizationId: profile.organizationId,
                    itemId: poLine.itemId,
                    type: 'GRN',
                    quantity: qty,
                    referenceType: 'purchase_order',
                    referenceId: order.id,
                    notes: `Received via ${grnNumber}`,
                    createdBy: profile.id
                });

                // Update Item Cost Price
                await tx.update(items)
                    .set({ costPrice: poLine.unitCost.toString() })
                    .where(eq(items.id, poLine.itemId));
            }

            // 4. Update PO Status
            const updatedLines = await tx.query.purchaseOrderLines.findMany({
                where: eq(purchaseOrderLines.purchaseOrderId, id)
            });

            const allReceived = updatedLines.every(l => l.receivedQuantity >= l.quantity);
            const newStatus = allReceived ? 'COMPLETED' : 'PARTIAL_RECEIVED';

            if (order.status !== newStatus && order.status !== 'COMPLETED') {
                await tx.update(purchaseOrders)
                    .set({ status: newStatus, updatedAt: new Date() })
                    .where(eq(purchaseOrders.id, id));
            }
        });

        return c.json({ success: true, message: 'Stock received successfully' });
    } catch (error: any) {
        console.error('Receive Stock Error:', error);
        return c.json({ error: error.message || 'Failed to receive stock' }, 500);
    }
});

export default app;
