import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@smartbiz/db'
import { items, itemCategories as categories, stockMovements } from '@smartbiz/db'
import { stakeholders } from '@smartbiz/db'
import { sales, saleItems } from '@smartbiz/db'
import { organizations } from '@smartbiz/db'
import { projects } from '@smartbiz/db'
import { expenses, expenseCategories } from '@smartbiz/db'
import { quotations, quotationItems, returns, returnItems, payments } from '@smartbiz/db'
import { leaveRequests, employees } from '@smartbiz/db'
import { payrollRuns, payrollRunLines } from '@smartbiz/db'
import { purchaseOrders, purchaseOrderLines } from '@smartbiz/db'
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
        }).optional(),
        quotations: z.object({
            created: z.array(z.any()),
            updated: z.array(z.any()),
            deleted: z.array(z.string()),
        }).optional(),
        returns: z.object({
            created: z.array(z.any()),
            updated: z.array(z.any()),
            deleted: z.array(z.string()),
        }).optional(),
        payments: z.object({
            created: z.array(z.any()),
            updated: z.array(z.any()),
            deleted: z.array(z.string()),
        }).optional(),
        leaves: z.object({
            created: z.array(z.any()),
            updated: z.array(z.any()),
            deleted: z.array(z.string()),
        }).optional(),
        suppliers: z.object({
            created: z.array(z.any()),
            updated: z.array(z.any()),
            deleted: z.array(z.string()),
        }).optional(),
        purchases: z.object({
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
            changedSaleItems,
            changedProjects,
            changedExpenses,
            changedExpenseCategories,
            changedQuotations,
            changedQuotationItems,
            changedReturns,
            changedReturnItems,
            changedPayments,
            changedLeaves,
            changedPayslips,
            changedSuppliers,
            changedPurchases,
            changedPurchaseItems
        ] = await Promise.all([
            db.select().from(items).where(and(
                eq(items.organizationId, organizationId),
                gt(items.updatedAt, since)
            )),
            db.select().from(categories).where(and(
                eq(categories.organizationId, organizationId),
                gt(categories.updatedAt, since)
            )),
            db.select().from(stakeholders).where(and(
                eq(stakeholders.organizationId, organizationId),
                gt(stakeholders.updatedAt, since)
            )),
            db.select().from(sales).where(and(
                eq(sales.organizationId, organizationId),
                gt(sales.updatedAt, since)
            )),
            db.select().from(saleItems)
                .innerJoin(sales, eq(saleItems.saleId, sales.id))
                .where(and(
                    eq(sales.organizationId, organizationId),
                    gt(sales.updatedAt, since) // If sale changed, pull its items
                ))
                .then(results => results.map(r => r.sale_items)),
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
                gt(expenseCategories.createdAt, since)
            )),
            db.select().from(quotations).where(and(
                eq(quotations.organizationId, organizationId),
                gt(quotations.updatedAt, since)
            )),
            db.select().from(quotationItems)
                .innerJoin(quotations, eq(quotationItems.quotationId, quotations.id))
                .where(and(
                    eq(quotations.organizationId, organizationId),
                    gt(quotations.updatedAt, since)
                ))
                .then(results => results.map(r => r.quotation_items)),
            db.select().from(returns).where(and(
                eq(returns.organizationId, organizationId),
                gt(returns.updatedAt, since)
            )),
            db.select().from(returnItems)
                .innerJoin(returns, eq(returnItems.returnId, returns.id))
                .where(and(
                    eq(returns.organizationId, organizationId),
                    gt(returns.updatedAt, since)
                ))
                .then(results => results.map(r => r.return_items)),
            db.select().from(payments).where(and(
                eq(payments.organizationId, organizationId),
                gt(payments.createdAt, since)
            )),
            db.select().from(leaveRequests).where(and(
                eq(leaveRequests.organizationId, organizationId),
                gt(leaveRequests.updatedAt, since)
            )),
            db.select().from(payrollRunLines)
                .innerJoin(payrollRuns, eq(payrollRunLines.runId, payrollRuns.id))
                .where(and(
                    eq(payrollRuns.organizationId, organizationId),
                    gt(payrollRunLines.updatedAt, since)
                ))
                .then(results => results.map(r => r.payroll_run_lines)),
            db.select().from(stakeholders).where(and(
                eq(stakeholders.organizationId, organizationId),
                eq(stakeholders.type, 'SUPPLIER'),
                gt(stakeholders.updatedAt, since)
            )),
            db.select().from(purchaseOrders).where(and(
                eq(purchaseOrders.organizationId, organizationId),
                gt(purchaseOrders.updatedAt, since)
            )),
            db.select().from(purchaseOrderLines)
                .innerJoin(purchaseOrders, eq(purchaseOrderLines.purchaseOrderId, purchaseOrders.id))
                .where(and(
                    eq(purchaseOrders.organizationId, organizationId),
                    gt(purchaseOrders.updatedAt, since)
                ))
                .then(results => results.map(r => r.purchase_order_lines))
        ])

        return c.json({
            changes: {
                items: { updated: changedItems, deleted: [] },
                categories: { updated: changedCategories, deleted: [] },
                customers: { updated: changedCustomers, deleted: [] },
                sales: { updated: changedSales, deleted: [] },
                saleItems: { updated: changedSaleItems, deleted: [] },
                projects: { updated: changedProjects, deleted: [] },
                expenses: { updated: changedExpenses, deleted: [] },
                expenseCategories: { updated: changedExpenseCategories, deleted: [] },
                quotations: { updated: changedQuotations, deleted: [] },
                quotationItems: { updated: changedQuotationItems, deleted: [] },
                returns: { updated: changedReturns, deleted: [] },
                returnItems: { updated: changedReturnItems, deleted: [] },
                payments: { updated: changedPayments, deleted: [] },
                leaves: { updated: changedLeaves, deleted: [] },
                payslips: { updated: changedPayslips, deleted: [] },
                suppliers: { updated: changedSuppliers, deleted: [] },
                purchases: { updated: changedPurchases, deleted: [] },
                purchaseItems: { updated: changedPurchaseItems, deleted: [] }
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
                items: { created: 0 },
                customers: { created: 0 },
                sales: { created: 0 },
                saleItems: { created: 0 },
                expenses: { created: 0 },
                quotations: { created: 0 },
                returns: { created: 0 },
                payments: { created: 0 },
                leaves: { created: 0 },
                suppliers: { created: 0 },
                purchases: { created: 0 }
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
                        syncResults.items.created++
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
                        syncResults.customers.created++
                    }
                }
            }

            // 3. Process Sales
            if (changes.sales?.created) {
                for (const sale of changes.sales.created) {
                    const existing = await tx.query.sales.findFirst({
                        where: eq(sales.id, sale.id)
                    })

                    if (!existing) {
                        await tx.insert(sales).values({
                            id: sale.id,
                            organizationId,
                            customerId: sale.customerId,
                            saleNumber: `SALE-${sale.id.substring(0, 8).toUpperCase()}`,
                            subtotal: String(sale.totalAmount),
                            totalAmount: String(sale.totalAmount),
                            paidAmount: sale.status === 'COMPLETED' ? String(sale.totalAmount) : '0',
                            status: sale.status === 'INVOICED' ? 'COMPLETED' : sale.status || 'COMPLETED',
                            paymentStatus: sale.status === 'COMPLETED' ? 'PAID' : 'PENDING',
                            createdAt: new Date(sale.createdAt),
                            updatedAt: new Date(sale.updatedAt),
                            createdBy: user?.id,
                        })
                        syncResults.sales.created++

                        // Process Sale Items bundled with sale
                        if (sale.lineItems) {
                            for (const li of sale.lineItems) {
                                await tx.insert(saleItems).values({
                                    id: li.id,
                                    saleId: sale.id,
                                    itemId: li.itemId,
                                    quantity: String(li.quantity),
                                    unitPrice: String(li.unitPrice),
                                    total: String(li.totalPrice),
                                    createdAt: new Date(sale.createdAt),
                                })
                                syncResults.saleItems.created++
                            }
                        }
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

            // 5. Process Quotations
            if (changes.quotations?.created) {
                for (const quote of changes.quotations.created) {
                    const existing = await tx.query.quotations.findFirst({
                        where: eq(quotations.id, quote.id)
                    })

                    if (!existing) {
                        await tx.insert(quotations).values({
                            id: quote.id,
                            organizationId,
                            customerId: quote.customerId,
                            quotationNumber: `QUO-${quote.id.substring(0, 8).toUpperCase()}`,
                            subtotal: String(quote.totalAmount),
                            totalAmount: String(quote.totalAmount),
                            status: 'DRAFT',
                            createdAt: new Date(quote.createdAt),
                            updatedAt: new Date(quote.updatedAt),
                            createdBy: user?.id,
                        })
                        syncResults.quotations.created++

                        if (quote.lineItems) {
                            for (const li of quote.lineItems) {
                                await tx.insert(quotationItems).values({
                                    id: li.id,
                                    quotationId: quote.id,
                                    itemId: li.itemId,
                                    quantity: String(li.quantity),
                                    unitPrice: String(li.unitPrice),
                                    total: String(li.totalPrice),
                                })
                            }
                        }
                    }
                }
            }

            // 6. Process Returns
            if (changes.returns?.created) {
                for (const ret of changes.returns.created) {
                    const existing = await tx.query.returns.findFirst({
                        where: eq(returns.id, ret.id)
                    })

                    if (!existing) {
                        await tx.insert(returns).values({
                            id: ret.id,
                            organizationId,
                            saleId: ret.saleId,
                            customerId: ret.customerId,
                            returnNumber: `RET-${ret.id.substring(0, 8).toUpperCase()}`,
                            totalAmount: String(ret.totalAmount),
                            status: 'COMPLETED',
                            refundStatus: 'REFUNDED',
                            refundedAmount: String(ret.totalAmount),
                            createdAt: new Date(ret.createdAt),
                            updatedAt: new Date(ret.updatedAt),
                            createdBy: user?.id,
                        })
                        syncResults.returns.created++

                        if (ret.lineItems) {
                            for (const li of ret.lineItems) {
                                await tx.insert(returnItems).values({
                                    id: li.id,
                                    returnId: ret.id,
                                    itemId: li.itemId,
                                    quantity: li.quantity,
                                    unitPrice: String(li.unitPrice),
                                    total: String(li.totalPrice),
                                    condition: 'GOOD',
                                    restock: true,
                                })
                            }
                        }
                    }
                }
            }

            // 7. Process Payments (Receipts)
            if (changes.payments?.created) {
                for (const pmt of changes.payments.created) {
                    const existing = await tx.query.payments.findFirst({
                        where: eq(payments.id, pmt.id)
                    })

                    if (!existing) {
                        await tx.insert(payments).values({
                            id: pmt.id,
                            organizationId,
                            saleId: pmt.invoiceId, // Mobile calls it invoiceId
                            amount: String(pmt.amount),
                            method: (pmt.paymentMethod || 'CASH').toUpperCase() as any,
                            paymentDate: new Date(pmt.createdAt),
                            createdAt: new Date(pmt.createdAt),
                            createdBy: user?.id,
                        })
                        
                        // Optionally update actual Sale record to PAID
                        await tx.update(sales)
                                .set({ paymentStatus: 'PAID', paidAmount: String(pmt.amount), status: 'COMPLETED' })
                                .where(eq(sales.id, pmt.invoiceId))

                        syncResults.payments.created++
                    }
                }
            }

            // 8. Process Leave Requests
            if (changes.leaves?.created) {
                for (const leave of changes.leaves.created) {
                    const existing = await tx.query.leaveRequests.findFirst({
                        where: eq(leaveRequests.id, leave.id)
                    })

                    if (!existing) {
                        await tx.insert(leaveRequests).values({
                            id: leave.id,
                            organizationId,
                            employeeId: leave.employeeId, // Mobile must provide this
                            type: leave.type,
                            startDate: new Date(leave.startDate),
                            endDate: new Date(leave.endDate),
                            reason: leave.reason,
                            status: 'PENDING',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        })
                        syncResults.leaves.created++
                    }
                }
            }

            // 9. Process Suppliers
            if (changes.suppliers?.created) {
                for (const sup of changes.suppliers.created) {
                    const existing = await tx.query.stakeholders.findFirst({
                        where: eq(stakeholders.id, sup.id)
                    })

                    if (!existing) {
                        await tx.insert(stakeholders).values({
                            id: sup.id,
                            organizationId,
                            type: 'SUPPLIER',
                            fullName: sup.fullName,
                            email: sup.email,
                            phone: sup.phone,
                            address: sup.address,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        })
                        syncResults.suppliers.created++
                    }
                }
            }

            // 10. Process Purchases
            if (changes.purchases?.created) {
                for (const pur of changes.purchases.created) {
                    const existing = await tx.query.purchaseOrders.findFirst({
                        where: eq(purchaseOrders.id, pur.id)
                    })

                    if (!existing) {
                        await tx.insert(purchaseOrders).values({
                            id: pur.id,
                            organizationId,
                            supplierId: pur.supplierId,
                            orderNumber: `PUR-${pur.id.substring(0, 8).toUpperCase()}`,
                            totalAmount: String(pur.totalAmount),
                            status: pur.status || 'COMPLETED',
                            createdAt: new Date(pur.createdAt),
                            updatedAt: new Date(pur.updatedAt),
                            createdBy: user?.id,
                        })
                        syncResults.purchases.created++

                        if (pur.lineItems) {
                            for (const li of pur.lineItems) {
                                await tx.insert(purchaseOrderLines).values({
                                    id: li.id,
                                    purchaseOrderId: pur.id,
                                    itemId: li.itemId,
                                    quantity: li.quantity,
                                    unitCost: String(li.unitPrice),
                                    totalCost: String(li.totalPrice),
                                })
                            }
                        }
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
