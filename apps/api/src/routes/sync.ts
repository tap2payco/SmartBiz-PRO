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
import { bankAccounts, bankTransactions } from '@smartbiz/db'
import { gt, eq, and, sql, or } from 'drizzle-orm'

const app = new Hono<{ Variables: { user: any, organizationId: string } }>()

// Schema for Push Sync (Mobile/Web sending changes)
const pushSchema = z.object({
    changes: z.object({
        items: z.object({
            created: z.array(z.any()).optional(),
            updated: z.array(z.any()).optional(),
            deleted: z.array(z.string()).optional(),
        }).optional(),
        sales: z.object({
            created: z.array(z.any()).optional(),
            updated: z.array(z.any()).optional(),
            deleted: z.array(z.string()).optional(),
        }).optional(),
        customers: z.object({
            created: z.array(z.any()).optional(),
            updated: z.array(z.any()).optional(),
            deleted: z.array(z.string()).optional(),
        }).optional(),
        expenses: z.object({
            created: z.array(z.any()).optional(),
            updated: z.array(z.any()).optional(),
            deleted: z.array(z.string()).optional(),
        }).optional(),
        quotations: z.object({
            created: z.array(z.any()).optional(),
            updated: z.array(z.any()).optional(),
            deleted: z.array(z.string()).optional(),
        }).optional(),
        returns: z.object({
            created: z.array(z.any()).optional(),
            updated: z.array(z.any()).optional(),
            deleted: z.array(z.string()).optional(),
        }).optional(),
        payments: z.object({
            created: z.array(z.any()).optional(),
            updated: z.array(z.any()).optional(),
            deleted: z.array(z.string()).optional(),
        }).optional(),
        leaves: z.object({
            created: z.array(z.any()).optional(),
            updated: z.array(z.any()).optional(),
            deleted: z.array(z.string()).optional(),
        }).optional(),
        suppliers: z.object({
            created: z.array(z.any()).optional(),
            updated: z.array(z.any()).optional(),
            deleted: z.array(z.string()).optional(),
        }).optional(),
        purchases: z.object({
            created: z.array(z.any()).optional(),
            updated: z.array(z.any()).optional(),
            deleted: z.array(z.string()).optional(),
        }).optional(),
        bankTransactions: z.object({
            created: z.array(z.any()).optional(),
            updated: z.array(z.any()).optional(),
            deleted: z.array(z.string()).optional(),
        }).optional(),
        stockMovements: z.object({
            created: z.array(z.any()).optional(),
            updated: z.array(z.any()).optional(),
            deleted: z.array(z.string()).optional(),
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
            changedPurchaseItems,
            changedBankAccounts,
            changedBankTransactions,
            changedStockMovements
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
                    gt(sales.updatedAt, since)
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
                .then(results => results.map(r => r.purchase_order_lines)),
            db.select().from(bankAccounts).where(and(
                eq(bankAccounts.organizationId, organizationId),
                gt(bankAccounts.updatedAt, since)
            )),
            db.select().from(bankTransactions).where(and(
                eq(bankTransactions.organizationId, organizationId),
                gt(bankTransactions.createdAt, since)
            )),
            db.select().from(stockMovements).where(and(
                eq(stockMovements.organizationId, organizationId),
                gt(stockMovements.createdAt, since)
            ))
        ])

        return c.json({
            changes: {
                items: { updated: changedItems, deleted: changedItems.filter(i => i.isDeleted).map(i => i.id) },
                categories: { updated: changedCategories, deleted: changedCategories.filter(c => c.isDeleted).map(c => c.id) },
                customers: { updated: changedCustomers, deleted: changedCustomers.filter(c => c.isDeleted).map(c => c.id) },
                sales: { updated: changedSales, deleted: changedSales.filter(s => s.isDeleted).map(s => s.id) },
                saleItems: { updated: changedSaleItems, deleted: [] },
                projects: { updated: changedProjects, deleted: [] },
                expenses: { updated: changedExpenses, deleted: [] },
                expenseCategories: { updated: changedExpenseCategories, deleted: [] },
                quotations: { updated: changedQuotations, deleted: [] },
                quotationItems: { updated: changedQuotationItems, deleted: [] },
                returns: { updated: changedReturns, deleted: [] },
                returnItems: { updated: changedReturnItems, deleted: [] },
                payments: { updated: changedPayments, deleted: changedPayments.filter(p => p.isDeleted).map(p => p.id) },
                leaves: { updated: changedLeaves, deleted: [] },
                payslips: { updated: changedPayslips, deleted: [] },
                suppliers: { updated: changedSuppliers, deleted: [] },
                purchases: { updated: changedPurchases, deleted: changedPurchases.filter(p => p.isDeleted).map(p => p.id) },
                purchaseItems: { updated: changedPurchaseItems, deleted: [] },
                bankAccounts: { updated: changedBankAccounts, deleted: [] },
                bankTransactions: { updated: changedBankTransactions, deleted: [] },
                stockMovements: { updated: changedStockMovements, deleted: [] }
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
                items: { processed: 0 },
                customers: { processed: 0 },
                sales: { processed: 0 },
                expenses: { processed: 0 },
                quotations: { processed: 0 },
                returns: { processed: 0 },
                payments: { processed: 0 },
                leaves: { processed: 0 },
                suppliers: { processed: 0 },
                purchases: { processed: 0 },
                bankTransactions: { processed: 0 },
                stockMovements: { processed: 0 }
            }

            // Helper for Upsert
            const processUpsert = async (table: any, data: any[], mapper: (d: any) => any) => {
                for (const d of data) {
                    const values = mapper(d)
                    await tx.insert(table).values(values).onConflictDoUpdate({
                        target: table.id,
                        set: { ...values, updatedAt: new Date() }
                    })
                }
            }

            // 1. Process Items
            if (changes.items?.created || changes.items?.updated) {
                const allItems = [...(changes.items.created || []), ...(changes.items.updated || [])]
                for (const item of allItems) {
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
                        updatedAt: new Date(),
                    }).onConflictDoUpdate({
                        target: items.id,
                        set: {
                            name: item.name,
                            sku: item.sku,
                            barcode: item.barcode,
                            description: item.description,
                            categoryId: item.categoryId || 'default',
                            costPrice: String(item.costPrice || '0'),
                            sellingPrice: String(item.sellingPrice || '0'),
                            stockLevel: item.stockLevel || 0,
                            updatedAt: new Date()
                        }
                    })
                    syncResults.items.processed++
                }
            }

            // 2. Process Customers
            if (changes.customers?.created || changes.customers?.updated) {
                const all = [...(changes.customers.created || []), ...(changes.customers.updated || [])]
                for (const cust of all) {
                    await tx.insert(stakeholders).values({
                        id: cust.id,
                        organizationId,
                        type: 'CUSTOMER',
                        fullName: cust.fullName,
                        email: cust.email,
                        phone: cust.phone,
                        address: cust.address,
                        updatedAt: new Date(),
                    }).onConflictDoUpdate({
                        target: stakeholders.id,
                        set: {
                            fullName: cust.fullName,
                            email: cust.email,
                            phone: cust.phone,
                            address: cust.address,
                            updatedAt: new Date()
                        }
                    })
                    syncResults.customers.processed++
                }
            }

            // 3. Process Sales
            if (changes.sales?.created || changes.sales?.updated) {
                const all = [...(changes.sales.created || []), ...(changes.sales.updated || [])]
                for (const sale of all) {
                    await tx.insert(sales).values({
                        id: sale.id,
                        organizationId,
                        customerId: sale.customerId,
                        saleNumber: `SALE-${sale.id.substring(0, 8).toUpperCase()}`,
                        subtotal: String(sale.totalAmount),
                        totalAmount: String(sale.totalAmount),
                        paidAmount: sale.status === 'COMPLETED' ? String(sale.totalAmount) : '0',
                        status: sale.status || 'COMPLETED',
                        paymentStatus: sale.status === 'COMPLETED' ? 'PAID' : 'PENDING',
                        createdAt: new Date(sale.createdAt),
                        updatedAt: new Date(),
                        createdBy: user?.id,
                    }).onConflictDoUpdate({
                        target: sales.id,
                        set: {
                            customerId: sale.customerId,
                            totalAmount: String(sale.totalAmount),
                            status: sale.status,
                            updatedAt: new Date()
                        }
                    })

                    if (sale.lineItems) {
                        for (const li of sale.lineItems) {
                            await tx.insert(saleItems).values({
                                id: li.id,
                                saleId: sale.id,
                                itemId: li.itemId,
                                quantity: String(li.quantity),
                                unitPrice: String(li.unitPrice),
                                total: String(li.totalPrice),
                            }).onConflictDoUpdate({
                                target: saleItems.id,
                                set: {
                                    quantity: String(li.quantity),
                                    unitPrice: String(li.unitPrice),
                                    total: String(li.totalPrice)
                                }
                            })
                        }
                    }
                    syncResults.sales.processed++
                }
            }

            // 4. Process Expenses
            if (changes.expenses?.created || changes.expenses?.updated) {
                const all = [...(changes.expenses.created || []), ...(changes.expenses.updated || [])]
                for (const exp of all) {
                    await tx.insert(expenses).values({
                        id: exp.id,
                        organizationId,
                        categoryId: exp.categoryId,
                        description: exp.description,
                        amount: String(exp.amount),
                        expenseDate: new Date(exp.date).toISOString().split('T')[0],
                        updatedAt: new Date(),
                        createdBy: user?.id,
                    }).onConflictDoUpdate({
                        target: expenses.id,
                        set: {
                            categoryId: exp.categoryId,
                            description: exp.description,
                            amount: String(exp.amount),
                            updatedAt: new Date()
                        }
                    })
                    syncResults.expenses.processed++
                }
            }

            // 5. Process Payments
            if (changes.payments?.created) {
                for (const pmt of changes.payments.created) {
                    await tx.insert(payments).values({
                        id: pmt.id,
                        organizationId,
                        saleId: pmt.invoiceId,
                        amount: String(pmt.amount),
                        method: (pmt.paymentMethod || 'CASH').toUpperCase() as any,
                        paymentDate: new Date(pmt.createdAt),
                        createdAt: new Date(pmt.createdAt),
                        createdBy: user?.id,
                    }).onConflictDoNothing()
                    
                    await tx.update(sales)
                            .set({ paymentStatus: 'PAID', paidAmount: String(pmt.amount), status: 'COMPLETED' })
                            .where(eq(sales.id, pmt.invoiceId))

                    syncResults.payments.processed++
                }
            }

            // 6. Process Bank Transactions
            if (changes.bankTransactions?.created) {
                for (const bt of changes.bankTransactions.created) {
                    await tx.insert(bankTransactions).values({
                        id: bt.id,
                        organizationId,
                        accountId: bt.accountId,
                        type: bt.type as any,
                        amount: String(bt.amount),
                        transactionDate: new Date(bt.date),
                        description: bt.description,
                        referenceType: bt.referenceType as any,
                        referenceId: bt.referenceId,
                        createdBy: user?.id,
                        createdAt: new Date(bt.date)
                    }).onConflictDoNothing()
                    syncResults.bankTransactions.processed++
                }
            }

            // 7. Process Stock Movements
            if (changes.stockMovements?.created) {
                for (const sm of changes.stockMovements.created) {
                    await tx.insert(stockMovements).values({
                        id: sm.id,
                        organizationId,
                        itemId: sm.itemId,
                        type: sm.type as any,
                        quantity: sm.quantity,
                        referenceType: sm.referenceType,
                        referenceId: sm.referenceId,
                        notes: sm.notes,
                        createdBy: user?.id,
                        createdAt: new Date(sm.createdAt)
                    }).onConflictDoNothing()
                    syncResults.stockMovements.processed++
                }
            }

            // 8. Process Deletions (Generic)
            const entities = [
                { data: changes.items?.deleted, table: items },
                { data: changes.sales?.deleted, table: sales },
                { data: changes.customers?.deleted, table: stakeholders },
                { data: changes.expenses?.deleted, table: expenses },
                { data: changes.quotations?.deleted, table: quotations },
                { data: changes.returns?.deleted, table: returns },
                { data: changes.purchases?.deleted, table: purchaseOrders },
                { data: changes.bankTransactions?.deleted, table: bankTransactions },
                { data: changes.stockMovements?.deleted, table: stockMovements }
            ]

            for (const entity of entities) {
                if (entity.data && entity.data.length > 0) {
                    // Industrial standard: Soft Delete
                    await tx.update(entity.table)
                            .set({ isDeleted: true, updatedAt: new Date() })
                            .where(and(
                                eq(entity.table.organizationId, organizationId),
                                sql`${entity.table.id} IN ${entity.data}`
                            ))
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
