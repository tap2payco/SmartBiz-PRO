import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@smartbiz/db'
import { items, itemCategories as categories, stockMovements } from '@smartbiz/db/src/schema/inventory'
import { stakeholders } from '@smartbiz/db/src/schema/stakeholders'
import { sales, saleItems } from '@smartbiz/db/src/schema/sales'
import { organizations } from '@smartbiz/db/src/schema/auth'
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
            changedSales
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
    // This is a placeholder. A true V2 Push would handle batch updates transactionally.
    // For now, clients are still using individual REST endpoints which is fine.
    // We will implement this for Mobile App later.
    return c.json({ message: 'Push endpoint ready for V2' })
})

export default app
