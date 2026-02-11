import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@smartbiz/db'
import { returns, returnItems } from '@smartbiz/db/src/schema/returns'
import { sales, saleItems } from '@smartbiz/db/src/schema/sales'
import { items, stockMovements } from '@smartbiz/db/src/schema/inventory'
import { eq, and, desc, sql } from 'drizzle-orm'

const app = new Hono<{ Variables: { user: any, organizationId: string } }>()

// Validation Schemas
const createReturnSchema = z.object({
    saleId: z.string().uuid(),
    items: z.array(z.object({
        itemId: z.string().uuid(),
        quantity: z.number().int().positive(),
        condition: z.enum(['GOOD', 'DAMAGED', 'EXPIRED', 'OTHER']),
        reason: z.string().optional(),
        restock: z.boolean().default(true)
    })).min(1),
    reason: z.string().optional(),
    notes: z.string().optional()
})

// GET /returns - List all returns
app.get('/', async (c) => {
    try {
        const organizationId = c.get('organizationId')
        if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

        const result = await db.query.returns.findMany({
            where: eq(returns.organizationId, organizationId),
            with: {
                customer: true,
                sale: true,
                items: {
                    with: {
                        item: true
                    }
                }
            },
            orderBy: [desc(returns.createdAt)],
        })

        return c.json(result)
    } catch (error) {
        console.error('Error fetching returns:', error)
        return c.json({ error: 'Failed to fetch returns' }, 500)
    }
})

// GET /returns/:id - Get return details
app.get('/:id', async (c) => {
    try {
        const organizationId = c.get('organizationId')
        if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

        const returnId = c.req.param('id')
        const result = await db.query.returns.findFirst({
            where: and(eq(returns.id, returnId), eq(returns.organizationId, organizationId)),
            with: {
                customer: true,
                sale: true,
                items: {
                    with: {
                        item: true
                    }
                }
            },
        })

        if (!result) return c.json({ error: 'Return not found' }, 404)

        return c.json(result)
    } catch (error) {
        console.error('Error fetching return:', error)
        return c.json({ error: 'Failed to fetch return' }, 500)
    }
})

// POST /returns - Create a new return request
app.post('/', async (c) => {
    try {
        const organizationId = c.get('organizationId')
        const user = c.get('user')
        if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

        const body = await c.req.json()
        const validated = createReturnSchema.parse(body)

        // 1. Verify Sale exists and belongs to org
        const sale = await db.query.sales.findFirst({
            where: and(eq(sales.id, validated.saleId), eq(sales.organizationId, organizationId)),
            with: {
                items: true
            }
        })

        if (!sale) return c.json({ error: 'Sale not found' }, 404)

        // 2. Transaction
        const result = await db.transaction(async (tx: any) => {
            let totalRefundAmount = 0
            const returnItemsData = []

            // Validate items against sale
            for (const returnItem of validated.items) {
                const soldItem = sale.items.find((si: any) => si.itemId === returnItem.itemId)

                if (!soldItem) {
                    throw new Error(`Item ${returnItem.itemId} was not part of this sale`)
                }

                if (Number(returnItem.quantity) > Number(soldItem.quantity)) {
                    throw new Error(`Cannot return more than sold quantity for item ${soldItem.itemId}`)
                }

                // Calculate refund amount for this item
                const unitPrice = Number(soldItem.unitPrice)
                // Pro-rated discount? For simplicity, we assume unit price - (discount / qty) if discount was per item?
                // The saleItems table has 'discount' as total discount for the line.
                // unitPrice is gross.
                // net unit price = (total line amount) / quantity
                const netTotal = Number(soldItem.total)
                const soldQty = Number(soldItem.quantity)
                const effectiveUnitPrice = netTotal / soldQty

                const itemTotal = effectiveUnitPrice * returnItem.quantity

                totalRefundAmount += itemTotal

                returnItemsData.push({
                    itemId: returnItem.itemId,
                    quantity: returnItem.quantity,
                    unitPrice: String(effectiveUnitPrice), // Track what we are refunding per unit
                    total: String(itemTotal),
                    condition: returnItem.condition,
                    restock: returnItem.restock,
                    reason: returnItem.reason
                })
            }

            // 3. Create Return Record
            const [newReturn] = await tx.insert(returns).values({
                organizationId,
                saleId: sale.id,
                customerId: sale.customerId, // Inherit from sale
                returnNumber: `RET-${Date.now()}`,
                status: 'APPROVED', // Auto-approve for now (MVP), or 'PENDING' if workflow needed
                refundStatus: 'PENDING',
                totalAmount: String(totalRefundAmount),
                reason: validated.reason,
                notes: validated.notes,
                createdBy: user?.id,
            }).returning()

            // 4. Create Return Items
            for (const item of returnItemsData) {
                await tx.insert(returnItems).values({
                    returnId: newReturn.id,
                    ...item,
                    quantity: item.quantity,
                    // ensure types match schema expectations (integer vs string for decimals)
                })

                // 5. Inventory Adjustment (If Approved & Restock)
                // Since we auto-approve in MVP:
                if (item.restock) {
                    await tx.insert(stockMovements).values({
                        organizationId,
                        itemId: item.itemId,
                        type: 'RETURN',
                        quantity: Math.abs(item.quantity), // Add to stock
                        referenceType: 'return',
                        referenceId: newReturn.id,
                        notes: `Return ${newReturn.returnNumber}`,
                        createdBy: user?.id || ''
                    })

                    // Trigger sync
                    await tx.update(items)
                        .set({ updatedAt: new Date() })
                        .where(eq(items.id, item.itemId))
                }
            }

            // 6. Update Sale Status
            await tx.update(sales)
                .set({ status: 'RETURNED' }) // Or 'PARTIALLY_RETURNED' if we had that status
                .where(eq(sales.id, sale.id))

            return newReturn
        })

        return c.json(result, 201)

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400)
        }
        console.error('Error creating return:', error)
        return c.json({ error: error.message || 'Failed to create return' }, 400)
    }
})

export default app
