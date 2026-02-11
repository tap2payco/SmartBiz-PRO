import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@smartbiz/db'
import { stockTransfers, stockTransferItems, items, locations } from '@smartbiz/db/src/schema/inventory'
import { stockMovements } from '@smartbiz/db/src/schema/inventory'
import { eq, and, desc, inArray, sql } from 'drizzle-orm'

const app = new Hono<{ Variables: { user: any, organizationId: string } }>()

// Schemas
const createTransferSchema = z.object({
    sourceLocationId: z.string().uuid(),
    destinationLocationId: z.string().uuid(),
    items: z.array(z.object({
        itemId: z.string().uuid(),
        quantity: z.number().int().positive()
    })).min(1),
    notes: z.string().optional(),
    driverName: z.string().optional(),
    vehicleNumber: z.string().optional()
}).refine(data => data.sourceLocationId !== data.destinationLocationId, {
    message: "Source and destination must be different",
    path: ["destinationLocationId"]
})

const receiveTransferSchema = z.object({
    items: z.array(z.object({
        itemId: z.string().uuid(),
        quantityReceived: z.number().int().nonnegative()
    }))
})

// GET / - List transfers
app.get('/', async (c) => {
    const organizationId = c.get('organizationId')
    if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

    try {
        const results = await db.query.stockTransfers.findMany({
            where: eq(stockTransfers.organizationId, organizationId),
            with: {
                sourceLocation: true,
                destinationLocation: true,
                items: {
                    with: {
                        item: true
                    }
                }
            },
            orderBy: desc(stockTransfers.createdAt),
            limit: 50
        })

        return c.json(results)
    } catch (error) {
        console.error('Error fetching transfers:', error)
        return c.json({ error: 'Failed to fetch transfers' }, 500)
    }
})

// GET /:id - Get transfer details
app.get('/:id', async (c) => {
    const organizationId = c.get('organizationId')
    const id = c.req.param('id')

    try {
        const transfer = await db.query.stockTransfers.findFirst({
            where: and(
                eq(stockTransfers.id, id),
                eq(stockTransfers.organizationId, organizationId)
            ),
            with: {
                sourceLocation: true,
                destinationLocation: true,
                items: {
                    with: {
                        item: true
                    }
                }
            }
        })

        if (!transfer) return c.json({ error: 'Transfer not found' }, 404)
        return c.json(transfer)
    } catch (error) {
        return c.json({ error: 'Failed to fetch transfer' }, 500)
    }
})

// POST / - Create Transfer (Draft)
app.post('/', async (c) => {
    const user = c.get('user')
    const organizationId = c.get('organizationId')

    try {
        const body = await c.req.json()
        const validated = createTransferSchema.parse(body)

        // Generate number
        const count = await db.$count(stockTransfers, eq(stockTransfers.organizationId, organizationId))
        const transferNumber = `TRF-${1001 + count}`

        await db.transaction(async (tx) => {
            // Create Header
            const [transfer] = await tx.insert(stockTransfers).values({
                organizationId,
                transferNumber,
                sourceLocationId: validated.sourceLocationId,
                destinationLocationId: validated.destinationLocationId,
                status: 'DRAFT', // Starts as draft
                notes: validated.notes,
                driverName: validated.driverName,
                vehicleNumber: validated.vehicleNumber,
                createdBy: user.id
            }).returning()

            // Create Items
            if (validated.items.length > 0) {
                await tx.insert(stockTransferItems).values(
                    validated.items.map(item => ({
                        transferId: transfer.id,
                        itemId: item.itemId,
                        quantitySent: item.quantity,
                        // quantityReceived is null initially
                    }))
                )
            }
        })

        return c.json({ message: 'Transfer created successfully' }, 201)
    } catch (error) {
        if (error instanceof z.ZodError) return c.json({ error: error.flatten() }, 400)
        console.error('Create transfer error:', error)
        return c.json({ error: 'Failed to create transfer' }, 500)
    }
})

// POST /:id/send - Mark as In-Transit
app.post('/:id/send', async (c) => {
    const user = c.get('user')
    const organizationId = c.get('organizationId')
    const id = c.req.param('id')

    try {
        const transfer = await db.query.stockTransfers.findFirst({
            where: and(eq(stockTransfers.id, id), eq(stockTransfers.organizationId, organizationId)),
            with: { items: true }
        })

        if (!transfer) return c.json({ error: 'Transfer not found' }, 404)
        if (transfer.status !== 'DRAFT') return c.json({ error: 'Transfer already sent' }, 400)

        await db.transaction(async (tx) => {
            // Update status
            await tx.update(stockTransfers)
                .set({ status: 'IN_TRANSIT', sentAt: new Date() })
                .where(eq(stockTransfers.id, id))

            // Deduct stock from source
            for (const item of transfer.items) {
                await tx.insert(stockMovements).values({
                    organizationId,
                    itemId: item.itemId,
                    locationId: transfer.sourceLocationId,
                    type: 'TRANSFER_OUT',
                    quantity: -item.quantitySent, // Negative for stock out
                    referenceType: 'transfer',
                    referenceId: transfer.id,
                    createdAt: new Date(),
                    createdBy: user.id,
                    notes: `Transfer Out: ${transfer.transferNumber}`
                })
            }
        })

        return c.json({ message: 'Transfer marked as in-transit' })
    } catch (error) {
        return c.json({ error: 'Failed to send transfer' }, 500)
    }
})

// POST /:id/receive - Mark as Completed (Receive Stock)
app.post('/:id/receive', async (c) => {
    const user = c.get('user')
    const organizationId = c.get('organizationId')
    const id = c.req.param('id')

    try {
        const body = await c.req.json()
        const validated = receiveTransferSchema.parse(body)

        const transfer = await db.query.stockTransfers.findFirst({
            where: and(eq(stockTransfers.id, id), eq(stockTransfers.organizationId, organizationId)),
        })

        if (!transfer) return c.json({ error: 'Transfer not found' }, 404)
        if (transfer.status !== 'IN_TRANSIT') return c.json({ error: 'Transfer not in transit' }, 400)

        await db.transaction(async (tx) => {
            // Update status
            await tx.update(stockTransfers)
                .set({ status: 'COMPLETED', receivedAt: new Date() })
                .where(eq(stockTransfers.id, id))

            // Add stock to destination
            for (const item of validated.items) {
                // Update received quantity
                await tx.update(stockTransferItems)
                    .set({ quantityReceived: item.quantityReceived })
                    .where(and(
                        eq(stockTransferItems.transferId, id),
                        eq(stockTransferItems.itemId, item.itemId)
                    ))

                // Create stock movement (IN)
                await tx.insert(stockMovements).values({
                    organizationId,
                    itemId: item.itemId,
                    locationId: transfer.destinationLocationId,
                    type: 'TRANSFER_IN',
                    quantity: item.quantityReceived, // Positive for stock in
                    referenceType: 'transfer',
                    referenceId: transfer.id,
                    createdAt: new Date(),
                    createdBy: user.id,
                    notes: `Transfer In: ${transfer.transferNumber}`
                })
            }
        })

        return c.json({ message: 'Transfer received successfully' })
    } catch (error) {
        return c.json({ error: 'Failed to receive transfer' }, 500)
    }
})

export default app
