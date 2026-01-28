import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@smartbiz/db'
import { stockMovements, items } from '@smartbiz/db/src/schema/inventory'
import { eq, and, desc } from 'drizzle-orm'

const app = new Hono<{ Variables: { user: any, organizationId: string } }>()

// Validation Schema
const stockMovementSchema = z.object({
    itemId: z.string().uuid(),
    type: z.enum([
        'GRN', 'SALE', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT',
        'RETURN', 'DAMAGE', 'THEFT'
    ]),
    quantity: z.number().int(),
    notes: z.string().optional(),
    locationId: z.string().uuid().optional(),
    referenceType: z.enum(['sale', 'purchase', 'adjustment']).optional(),
    referenceId: z.string().uuid().optional(),
})

// GET /stock-movements - List stock movements (filtered by item)
app.get('/', async (c) => {
    try {
        const { itemId } = c.req.query()
        const user = c.get('user')
        const organizationId = c.get('organizationId')

        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const filters = [eq(stockMovements.organizationId, organizationId)]

        if (itemId) {
            filters.push(eq(stockMovements.itemId, itemId))
        }

        const query = db
            .select()
            .from(stockMovements)
            .where(and(...filters))
            .orderBy(desc(stockMovements.createdAt))

        const result = await query.limit(10000) // Temporary increase for MVP

        return c.json(result)
    } catch (error) {
        console.error('Error fetching stock movements:', error)
        return c.json({ error: 'Failed to fetch stock movements' }, 500)
    }
})

// POST /stock-movements - Create a new stock movement (adjustment)
app.post('/', async (c) => {
    try {
        const user = c.get('user')
        const organizationId = c.get('organizationId')

        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const body = await c.req.json()
        const validated = stockMovementSchema.parse(body)

        // Verify item exists and belongs to organization
        const item = await db.query.items.findFirst({
            where: eq(items.id, validated.itemId),
        })

        if (!item || item.organizationId !== organizationId) {
            return c.json({ error: 'Item not found' }, 404)
        }

        // Create the movement
        const [movement] = await db.insert(stockMovements)
            .values({
                organizationId,
                itemId: validated.itemId,
                type: validated.type,
                quantity: validated.quantity,
                notes: validated.notes,
                locationId: validated.locationId,
                referenceType: validated.referenceType || 'adjustment',
                referenceId: validated.referenceId,
                createdBy: user.id
            })
            .returning()

        return c.json(movement, 201)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400)
        }
        console.error('Error creating stock movement:', error)
        return c.json({ error: 'Failed to create stock movement' }, 500)
    }
})

// POST /stock-movements/transfer - Transfer stock between locations
app.post('/transfer', async (c) => {
    const user = c.get('user')
    const organizationId = c.get('organizationId')

    if (!organizationId) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
        const body = await c.req.json()
        const transferSchema = z.object({
            itemId: z.string().uuid(),
            fromLocationId: z.string().uuid(),
            toLocationId: z.string().uuid(),
            quantity: z.number().int().positive(),
            notes: z.string().optional(),
        })

        const validated = transferSchema.parse(body)

        if (validated.fromLocationId === validated.toLocationId) {
            return c.json({ error: 'Cannot transfer to the same location' }, 400)
        }

        // Transactionally create movements
        await db.transaction(async (tx: any) => {
            // OUT from source
            await tx.insert(stockMovements).values({
                organizationId,
                itemId: validated.itemId,
                type: 'TRANSFER_OUT',
                quantity: -validated.quantity,
                locationId: validated.fromLocationId,
                referenceType: 'transfer',
                notes: validated.notes ? `Transfer Out: ${validated.notes}` : 'Stock Transfer',
                createdBy: user.id
            })

            // IN to destination
            await tx.insert(stockMovements).values({
                organizationId,
                itemId: validated.itemId,
                type: 'TRANSFER_IN',
                quantity: validated.quantity,
                locationId: validated.toLocationId,
                referenceType: 'transfer',
                notes: validated.notes ? `Transfer In: ${validated.notes}` : 'Stock Transfer',
                createdBy: user.id
            })
        })

        return c.json({ message: 'Transfer successful' }, 201)

    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400)
        }
        console.error('Error processing transfer:', error)
        return c.json({ error: 'Failed to process stock transfer' }, 500)
    }
})

export default app
