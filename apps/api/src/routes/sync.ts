import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@smartbiz/db'
import { items, itemCategories as categories, stockMovements } from '@smartbiz/db'
import { stakeholders } from '@smartbiz/db'
import { sales, saleItems } from '@smartbiz/db'
import { organizations } from '@smartbiz/db'
import { projects } from '@smartbiz/db'
import { expenses, expenseCategories } from '@smartbiz/db'
import { gt, eq, and, sql } from 'drizzle-orm'

const app = new Hono<{ Variables: { user: any, organizationId: string } }>()

// Schema for Push Sync (Mobile/Web sending changes)
const pushSchema = z.object({
    changes: z.object({
        items: z.object({
            created: z.array(z.any()),
            updated: z.array(z.any()),
            deleted: z.array(z.string()),
        }).optional(),
        sales: z.object({
            created: z.array(z.any()),
            updated: z.array(z.any()),
            deleted: z.array(z.string()),
        }).optional(),
        customers: z.object({
            created: z.array(z.any()),
            updated: z.array(z.any()),
            deleted: z.array(z.string()),
        }).optional(),
        expenses: z.object({
            created: z.array(z.any()),
            updated: z.array(z.any()),
            deleted: z.array(z.string()),
        }).optional()
    })
})

// GET /pull - Delta Sync (Get changes since last pull)
app.get('/pull', async (c) => {
    const organizationId = c.get('organizationId')
    const lastPulledAt = c.req.query('lastPulledAt')

    if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

    // If no lastPulledAt, default to 1970 (full sync)
    const since = lastPulledAt ? new Date(parseInt(lastPulledAt)) : new Date(0)

    try {
        // Fetch changes from all major tables
        const [
            changedItems,
            changedCategories,
            changedCustomers,
            changedSales,
            changedProjects,
            changedExpenses,
            changedExpenseCategories
        ] = await Promise.all([
            db.select().from(items).where(and(
                eq(items.organizationId, organizationId),
                gt(items.updatedAt, since)
            )),
            db.select().from(categories).where(and(
                eq(categories.organizationId, organizationId),
                gt(categories.updatedAt, since) // Provided schema has updatedAt
            )),
            db.select().from(stakeholders).where(and(
                eq(stakeholders.organizationId, organizationId),
                gt(stakeholders.updatedAt, since)
            )),
            db.select().from(sales).where(and(
                eq(sales.organizationId, organizationId),
                gt(sales.updatedAt, since)
            )),
            db.select().from(projects).where(and(
                eq(projects.organizationId, organizationId),
                gt(projects.updatedAt, since)
            )),
            db.select().from(expenses).where(and(
                eq(expenses.organizationId, organizationId),
                gt(expenses.updatedAt, since)
            )),
            db.select().from(expenseCategories).where(and(
                eq(expenseCategories.organizationId, organizationId),
                gt(expenseCategories.createdAt, since) // No updatedAt on expenseCategories in current schema
            ))
        ])

        return c.json({
            changes: {
                items: {
                    created: [], // For now, we mix created/updated as 'updated' usually covers both in simple delta
                    updated: changedItems,
                    deleted: [] // We need soft delete logic for this
                },
                categories: {
                    created: [],
                    updated: changedCategories,
                    deleted: []
                },
                customers: {
                    created: [],
                    updated: changedCustomers,
                    deleted: []
                },
                sales: {
                    created: [],
                    updated: changedSales,
                    deleted: []
                },
                projects: {
                    created: [],
                    updated: changedProjects,
                    deleted: []
                },
                expenses: {
                    created: [],
                    updated: changedExpenses,
                    deleted: []
                },
                expenseCategories: {
                    created: [],
                    updated: changedExpenseCategories,
                    deleted: []
                }
            },
            timestamp: Date.now()
        })
    } catch (error) {
        console.error('Sync Pull Error:', error)
        return c.json({ error: 'Failed to pull changes' }, 500)
    }
})

// POST /push - Push changes from client
app.post('/push', async (c) => {
    const organizationId = c.get('organizationId')
    const user = c.get('user')
    if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

    try {
        const body = await c.req.json()
        const { changes } = pushSchema.parse(body)

        const results = await db.transaction(async (tx: any) => {
            const syncResults: any = {
                sales: { created: 0 },
                expenses: { created: 0 }
            }

            // 1. Process Items
            if (changes.items?.created) {
                for (const item of changes.items.created) {
                    const existing = await tx.query.items.findFirst({
                        where: eq(items.id, item.id)
                    })

                    if (!existing) {
                        await tx.insert(items).values({
                            id: item.id,
                            organizationId,
                            name: item.name,
                            sku: item.sku,
                            barcode: item.barcode,
                            description: item.description,
                            categoryId: item.categoryId || 'default',
                            costPrice: String(item.costPrice || '0'),
                            sellingPrice: String(item.sellingPrice || '0'),
                            stockLevel: item.stockLevel || 0,
                            isActive: true,
                            createdAt: new Date(),
                            updatedAt: new Date(item.updatedAt || Date.now()),
                        })
                        syncResults.items = (syncResults.items || 0) + 1
                    }
                }
            }

            // 2. Process Customers (Stakeholders)
            if (changes.customers?.created) {
                for (const cust of changes.customers.created) {
                    const existing = await tx.query.stakeholders.findFirst({
                        where: eq(stakeholders.id, cust.id)
                    })

                    if (!existing) {
                        await tx.insert(stakeholders).values({
                            id: cust.id,
                            organizationId,
                            type: 'CUSTOMER',
                            fullName: cust.fullName,
                            email: cust.email,
                            phone: cust.phone,
                            address: cust.address,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        })
                        syncResults.customers = (syncResults.customers || 0) + 1
                    }
                }
            }

            // 3. Process Sales
            if (changes.sales?.created) {
                for (const sale of changes.sales.created) {
                    // Basic duplicate check by ID (since mobile provides the ID)
                    const existing = await tx.query.sales.findFirst({
                        where: eq(sales.id, sale.id)
                    })

                    if (!existing) {
                        await tx.insert(sales).values({
                            id: sale.id,
                            organizationId,
                            customerId: sale.customerId,
                            saleNumber: `SALE-${sale.id.substring(0, 8).toUpperCase()}`,
                            subtotal: String(sale.totalAmount), // Simplistic mapping for now
                            totalAmount: String(sale.totalAmount),
                            paidAmount: String(sale.totalAmount),
                            paymentStatus: 'PAID',
                            createdAt: new Date(sale.createdAt),
                            updatedAt: new Date(sale.updatedAt),
                            createdBy: user?.id,
                        })
                        syncResults.sales.created++
                    }
                }
            }

            // 4. Process Expenses
            if (changes.expenses?.created) {
                for (const exp of changes.expenses.created) {
                    const existing = await tx.query.expenses.findFirst({
                        where: eq(expenses.id, exp.id)
                    })

                    if (!existing) {
                        await tx.insert(expenses).values({
                            id: exp.id,
                            organizationId,
                            categoryId: exp.categoryId,
                            description: exp.description,
                            amount: String(exp.amount),
                            expenseDate: new Date(exp.date).toISOString().split('T')[0],
                            createdAt: new Date(exp.date),
                            updatedAt: new Date(exp.updatedAt || Date.now()),
                            createdBy: user?.id,
                        })
                        syncResults.expenses.created++
                    }
                }
            }

            return syncResults
        })

        return c.json({ message: 'Sync successful', results })
    } catch (error: any) {
        console.error('Sync Push Error:', error)
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400)
        }
        return c.json({ error: 'Failed to push changes', message: error.message }, 500)
    }
})

export default app
