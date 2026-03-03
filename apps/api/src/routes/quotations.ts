import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@smartbiz/db'
import { quotations, quotationItems, quotationStatusEnum } from '@smartbiz/db'
import { sales, saleItems } from '@smartbiz/db'
import { items, stockMovements } from '@smartbiz/db'
import { eq, and, desc, sql } from 'drizzle-orm'

const app = new Hono<{ Variables: { user: any, organizationId: string } }>()

// Validation Schemas
const createQuotationSchema = z.object({
    customerId: z.string().uuid().optional(),
    validUntil: z.string().optional(), // ISO Date string
    notes: z.string().optional(),
    terms: z.string().optional(),
    items: z.array(z.object({
        itemId: z.string().uuid(),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        taxRate: z.number().nonnegative().optional().default(0),
    })).min(1)
})

const updateStatusSchema = z.object({
    status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'])
})

// GET /quotations - List
app.get('/', async (c) => {
    try {
        const organizationId = c.get('organizationId')
        if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

        const result = await db.query.quotations.findMany({
            where: eq(quotations.organizationId, organizationId),
            with: {
                customer: true,
                items: true
            },
            orderBy: [desc(quotations.createdAt)],
        })

        return c.json(result)
    } catch (error) {
        console.error('Error fetching quotations:', error)
        return c.json({ error: 'Failed to fetch quotations' }, 500)
    }
})

// GET /quotations/:id - Details
app.get('/:id', async (c) => {
    try {
        const organizationId = c.get('organizationId')
        if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

        const id = c.req.param('id')
        const result = await db.query.quotations.findFirst({
            where: and(eq(quotations.id, id), eq(quotations.organizationId, organizationId)),
            with: {
                customer: true,
                items: {
                    with: {
                        item: true
                    }
                }
            },
        })

        if (!result) return c.json({ error: 'Quotation not found' }, 404)

        return c.json(result)
    } catch (error) {
        console.error('Error fetching quotation:', error)
        return c.json({ error: 'Failed to fetch quotation' }, 500)
    }
})

// POST /quotations - Create
app.post('/', async (c) => {
    try {
        const organizationId = c.get('organizationId')
        const user = c.get('user')
        if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

        const body = await c.req.json()
        const validated = createQuotationSchema.parse(body)

        // Calculate totals
        let subtotal = 0
        let taxTotal = 0

        const itemsData = validated.items.map(item => {
            const lineTotal = item.quantity * item.unitPrice
            const itemTax = lineTotal * (item.taxRate / 100)

            subtotal += lineTotal
            taxTotal += itemTax

            return {
                ...item,
                taxAmount: String(itemTax),
                total: String(lineTotal + itemTax) // Gross total per line
            }
        })

        const totalAmount = subtotal + taxTotal

        const result = await db.transaction(async (tx) => {
            // 1. Create Quotation
            const [newQuotation] = await tx.insert(quotations).values({
                organizationId,
                customerId: validated.customerId,
                quotationNumber: `QT-${Date.now()}`, // Simple ID generation
                validUntil: validated.validUntil ? new Date(validated.validUntil) : null,
                notes: validated.notes,
                terms: validated.terms,
                subtotal: String(subtotal),
                taxTotal: String(taxTotal),
                totalAmount: String(totalAmount),
                status: 'DRAFT',
                createdBy: user?.id
            }).returning()

            // 2. Create Items
            for (const item of itemsData) {
                await tx.insert(quotationItems).values({
                    quotationId: newQuotation.id,
                    itemId: item.itemId,
                    quantity: String(item.quantity),
                    unitPrice: String(item.unitPrice),
                    taxRate: String(item.taxRate),
                    taxAmount: item.taxAmount,
                    total: item.total
                })
            }

            return newQuotation
        })

        return c.json(result, 201)

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400)
        }
        console.error('Error creating quotation:', error)
        return c.json({ error: 'Failed to create quotation' }, 500)
    }
})

// PATCH /quotations/:id/status - Update Status
app.patch('/:id/status', async (c) => {
    try {
        const organizationId = c.get('organizationId')
        const id = c.req.param('id')
        const body = await c.req.json()
        const { status } = updateStatusSchema.parse(body)

        const result = await db.update(quotations)
            .set({ status, updatedAt: new Date() })
            .where(and(eq(quotations.id, id), eq(quotations.organizationId, organizationId)))
            .returning()

        return c.json(result[0])
    } catch (error) {
        return c.json({ error: 'Failed to update status' }, 500)
    }
})

// POST /quotations/:id/convert - Convert to Sale
app.post('/:id/convert', async (c) => {
    try {
        const organizationId = c.get('organizationId')
        const user = c.get('user')
        const id = c.req.param('id')

        if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

        // 1. Fetch Quotation
        const quotation = await db.query.quotations.findFirst({
            where: and(eq(quotations.id, id), eq(quotations.organizationId, organizationId)),
            with: { items: true }
        })

        if (!quotation) return c.json({ error: 'Quotation not found' }, 404)
        if (quotation.status === 'CONVERTED') return c.json({ error: 'Already converted' }, 400)

        // 2. Transaction: Create Sale, Update Stock, Update Quotation
        const result = await db.transaction(async (tx) => {
            // Create Sale
            const [newSale] = await tx.insert(sales).values({
                organizationId,
                customerId: quotation.customerId,
                saleNumber: `SALE-${Date.now()}`,
                subtotal: quotation.subtotal,
                taxTotal: quotation.taxTotal,
                totalAmount: quotation.totalAmount,
                status: 'COMPLETED', // Assume immediate completion or put PENDING if payment needed? 
                // For now, let's say it's PENDING payment if credit, or COMPLETED if cash. 
                // Typically converting a quote creates a pending order/invoice.
                paymentStatus: 'PENDING',
                notes: `Converted from Quotation ${quotation.quotationNumber}`,
                createdBy: user?.id
            }).returning()

            // Create Sale Items & Deduct Stock
            for (const item of quotation.items) {
                // Check stock first?
                const currentItem = await tx.query.items.findFirst({
                    where: eq(items.id, item.itemId!)
                })

                if (!currentItem) throw new Error(`Item ${item.itemId} not found`)

                // Deduct stock
                await tx.insert(stockMovements).values({
                    organizationId,
                    itemId: item.itemId!,
                    type: 'SALE',
                    quantity: Number(item.quantity) * -1,
                    referenceType: 'sale',
                    referenceId: newSale.id,
                    notes: `Sale from Quote ${quotation.quotationNumber}`,
                    createdBy: user?.id || ''
                })

                await tx.insert(saleItems).values({
                    saleId: newSale.id,
                    itemId: item.itemId!,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxRate: item.taxRate,
                    taxAmount: item.taxAmount,
                    total: item.total
                })

                // Update item timestamp
                await tx.update(items).set({ updatedAt: new Date() }).where(eq(items.id, item.itemId!))
            }

            // Update Quotation Status
            await tx.update(quotations)
                .set({ status: 'CONVERTED', convertedSaleId: newSale.id, updatedAt: new Date() })
                .where(eq(quotations.id, quotation.id))

            return newSale
        })

        return c.json(result, 201)

    } catch (error: any) {
        console.error('Conversion error:', error)
        return c.json({ error: error.message || 'Failed to convert quotation' }, 500)
    }
})

export default app
