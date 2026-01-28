import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@smartbiz/db'
import { sales, saleItems, payments } from '@smartbiz/db/src/schema/sales'
import { items, stockMovements } from '@smartbiz/db/src/schema/inventory'
import { bankAccounts, bankTransactions } from '@smartbiz/db/src/schema/banking'
import { eq, and, desc, sql } from 'drizzle-orm'

const app = new Hono<{ Variables: { user: any, organizationId: string } }>()

// Validation Schemas
const createSaleSchema = z.object({
    customerId: z.string().uuid().optional(),
    items: z.array(z.object({
        itemId: z.string().uuid(),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        discount: z.number().nonnegative().optional().default(0),
        tax: z.number().nonnegative().optional().default(0),
    })).min(1),
    payment: z.object({
        amount: z.number().nonnegative(),
        method: z.enum(['CASH', 'MOBILE_MONEY', 'CARD', 'BANK_TRANSFER', 'CREDIT']),
        reference: z.string().optional(),
        accountId: z.string().uuid().optional(),
    }).optional(),
    notes: z.string().optional(),
})

// GET /sales - List all sales
app.get('/', async (c) => {
    try {
        const organizationId = c.get('organizationId')
        if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

        const result = await db.query.sales.findMany({
            where: eq(sales.organizationId, organizationId),
            with: {
                customer: true,
                items: {
                    with: {
                        item: true
                    }
                },
                payments: true,
            },
            orderBy: [desc(sales.createdAt)],
        })

        return c.json(result)
    } catch (error) {
        console.error('Error fetching sales:', error)
        return c.json({ error: 'Failed to fetch sales' }, 500)
    }
})

// POST /sales - Create a new sale
app.post('/', async (c) => {
    try {
        const organizationId = c.get('organizationId')
        const user = c.get('user')
        if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

        const body = await c.req.json()
        const validated = createSaleSchema.parse(body)

        // Calculate totals
        const subtotal = validated.items.reduce((acc, item) => {
            return acc + (item.quantity * item.unitPrice)
        }, 0)

        const discountTotal = validated.items.reduce((acc, item) => {
            return acc + (item.discount || 0)
        }, 0)

        const taxTotal = validated.items.reduce((acc, item) => {
            return acc + (item.tax || 0)
        }, 0)

        const totalAmount = subtotal - discountTotal + taxTotal
        const paidAmount = validated.payment ? validated.payment.amount : 0

        // Transactional insert
        const result = await db.transaction(async (tx: any) => {
            // 1. Create Sale
            const [newSale] = await tx.insert(sales).values({
                organizationId,
                customerId: validated.customerId,
                saleNumber: `SALE-${Date.now()}`, // Basic generator
                subtotal: String(subtotal),
                discountTotal: String(discountTotal),
                taxTotal: String(taxTotal),
                totalAmount: String(totalAmount),
                paidAmount: String(paidAmount),
                paymentStatus: paidAmount >= totalAmount ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'PENDING'),
                notes: validated.notes,
                createdBy: user?.id,
            }).returning()

            // 2. Create Sale Items and Adjust Stock
            for (const item of validated.items) {
                // Create Sale Item
                await tx.insert(saleItems).values({
                    saleId: newSale.id,
                    itemId: item.itemId,
                    quantity: String(item.quantity),
                    unitPrice: String(item.unitPrice),
                    discount: String(item.discount),
                    tax: String(item.tax),
                    total: String((item.quantity * item.unitPrice) - (item.discount || 0) + (item.tax || 0)),
                })

                // Create Stock Movement (Deduct Stock)
                await tx.insert(stockMovements).values({
                    organizationId,
                    itemId: item.itemId,
                    type: 'SALE',
                    quantity: -Math.abs(item.quantity), // Ensure negative
                    referenceType: 'sale',
                    referenceId: newSale.id,
                    notes: `Sold via ${newSale.saleNumber}`,
                    createdBy: user?.id || ''
                })

                // Decrease quantity on hand
                // Note: items table does not have quantityOnHand. Stock is managed by movements.
                await tx.update(items)
                    .set({
                        updatedAt: new Date()
                    })
                    .where(eq(items.id, item.itemId))
            }

            // 3. Create Payment and Bank Transaction if present
            if (validated.payment && validated.payment.amount > 0) {
                const [payment] = await tx.insert(payments).values({
                    organizationId,
                    saleId: newSale.id,
                    amount: String(validated.payment.amount),
                    method: validated.payment.method,
                    reference: validated.payment.reference,
                    createdBy: user?.id,
                }).returning()

                // Linked Bank Transaction (Deposit Revenue)
                if (validated.payment.accountId) {
                    // 1. Get Account
                    const [account] = await tx
                        .select()
                        .from(bankAccounts)
                        .where(and(eq(bankAccounts.id, validated.payment.accountId), eq(bankAccounts.organizationId, organizationId)));

                    if (account) {
                        // 2. Create Deposit
                        await tx.insert(bankTransactions).values({
                            organizationId,
                            accountId: validated.payment.accountId,
                            type: 'DEPOSIT',
                            amount: String(validated.payment.amount),
                            transactionDate: new Date().toISOString(), // Use current date for immediate deposit
                            description: `Revenue from ${newSale.saleNumber}`,
                            referenceType: 'SALE',
                            referenceId: newSale.id,
                            createdBy: user?.id || ''
                        });

                        // 3. Update Balance
                        await tx
                            .update(bankAccounts)
                            .set({
                                currentBalance: sql`${bankAccounts.currentBalance} + ${validated.payment.amount}`,
                                updatedAt: new Date()
                            })
                            .where(eq(bankAccounts.id, validated.payment.accountId));
                    }
                }
            }

            return newSale
        })

        return c.json(result, 201)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400)
        }
        console.error('Error creating sale:', error)
        return c.json({ error: 'Failed to create sale' }, 500)
    }
})

// GET /sales/:id - Get sale details
app.get('/:id', async (c) => {
    try {
        const organizationId = c.get('organizationId')
        if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

        const saleId = c.req.param('id')
        const result = await db.query.sales.findFirst({
            where: and(eq(sales.id, saleId), eq(sales.organizationId, organizationId)),
            with: {
                customer: true,
                items: {
                    with: {
                        item: true
                    }
                },
                payments: true,
            },
        })

        if (!result) return c.json({ error: 'Sale not found' }, 404)

        return c.json(result)
    } catch (error) {
        console.error('Error fetching sale:', error)
        return c.json({ error: 'Failed to fetch sale' }, 500)
    }
})

export default app
