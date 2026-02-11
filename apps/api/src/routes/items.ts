import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@smartbiz/db'
import { items, itemCategories, stockMovements } from '@smartbiz/db/src/schema/inventory'
import type { Item, NewItem } from '@smartbiz/db/src/schema/inventory'
import { eq, and, like, or, sql } from 'drizzle-orm'

const app = new Hono<{ Variables: { user: any, organizationId: string } }>()

// Validation Schemas
const createItemSchema = z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    barcode: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    unit: z.string().default('pcs'),
    // Handle string or number input for prices
    costPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
    sellingPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
    reorderPoint: z.number().int().optional(),
    reorderQuantity: z.number().int().optional(),
    imageUrl: z.string().optional(),
    quantity: z.number().int().optional() // For initial stock import
})

const updateItemSchema = createItemSchema.partial()

const createBulkItemsSchema = z.array(createItemSchema)

// Health check
app.get('/health', (c) => c.json({ status: 'ok', resource: 'items' }))

// GET /items - List all items with optional filters
app.get('/', async (c) => {
    try {
        const { category, search, lowStock } = c.req.query()
        const user = c.get('user')
        const organizationId = c.get('organizationId')

        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        let query = db
            .select()
            .from(items)
            .where(eq(items.organizationId, organizationId))

        // Apply filters
        if (category) {
            query = query.where(and(
                eq(items.organizationId, organizationId),
                eq(items.categoryId, category)
            ))
        }

        if (search) {
            query = query.where(and(
                eq(items.organizationId, organizationId),
                or(
                    like(items.name, `%${search}%`),
                    like(items.sku, `%${search}%`),
                    like(items.barcode, `%${search}%`)
                )
            ))
        }

        const result = await query

        // TODO: Add stock levels from stock_movements aggregation
        // For now, return items without stock levels

        return c.json(result)
    } catch (error) {
        console.error('Error fetching items:', error)
        return c.json({ error: 'Failed to fetch items' }, 500)
    }
})

// GET /items/low-stock - Get items below reorder point
app.get('/low-stock', async (c) => {
    try {
        const organizationId = c.get('organizationId')

        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const lowStockItems = await db
            .select({
                id: items.id,
                name: items.name,
                sku: items.sku,
                reorderPoint: items.reorderPoint,
                currentStock: sql<string>`COALESCE(sum(${stockMovements.quantity}), 0)`,
            })
            .from(items)
            .leftJoin(stockMovements, eq(stockMovements.itemId, items.id))
            .where(and(
                eq(items.organizationId, organizationId),
                eq(items.isActive, true),
                sql`${items.reorderPoint} > 0`
            ))
            .groupBy(items.id, items.name, items.sku, items.reorderPoint)
            .having(sql`COALESCE(sum(${stockMovements.quantity}), 0) <= ${items.reorderPoint}`);

        const formattedItems = lowStockItems.map(item => ({
            ...item,
            currentStock: Number(item.currentStock),
            isLowStock: true
        }));

        return c.json({
            count: formattedItems.length,
            items: formattedItems
        })
    } catch (error) {
        console.error('Error fetching low stock items:', error)
        return c.json({ error: 'Failed to fetch low stock items' }, 500)
    }
})

// POST /items/bulk - Bulk import items
app.post('/bulk', async (c) => {
    try {
        const user = c.get('user')
        const organizationId = c.get('organizationId')

        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const body = await c.req.json()
        const validated = createBulkItemsSchema.parse(body)

        // 1. Get existing SKUs to avoid duplicates
        const existingItems = await db
            .select({ sku: items.sku })
            .from(items)
            .where(eq(items.organizationId, organizationId))

        const existingSkus = new Set(existingItems.map((i: any) => i.sku))
        const newItems: NewItem[] = []
        const validItems: any[] = []

        // 2. Filter valid new items
        for (const item of validated as any[]) {
            if (!existingSkus.has(item.sku)) {
                validItems.push(item)
                newItems.push({
                    name: item.name,
                    sku: item.sku,
                    barcode: item.barcode,
                    description: item.description,
                    categoryId: item.categoryId,
                    unit: item.unit,
                    costPrice: item.costPrice,
                    sellingPrice: item.sellingPrice,
                    reorderPoint: item.reorderPoint,
                    reorderQuantity: item.reorderQuantity,
                    imageUrl: item.imageUrl,
                    organizationId: organizationId,
                    isActive: true,
                })
            }
        }

        if (newItems.length === 0) {
            return c.json({ message: 'No new items to import', count: 0 }, 200)
        }

        // 3. Insert Items and create Stock Movements
        await db.transaction(async (tx: any) => {
            const insertedItems = await tx.insert(items).values(newItems).returning()

            // Create initial stock movements for items with quantity > 0
            const movementsToInsert = []

            for (let i = 0; i < insertedItems.length; i++) {
                const inserted = insertedItems[i];
                const input = validItems.find(v => v.sku === inserted.sku);
                const qty = input?.quantity || 0;

                if (qty > 0) {
                    movementsToInsert.push({
                        organizationId,
                        itemId: inserted.id,
                        type: 'ADJUSTMENT', // Initial Stock
                        quantity: qty,
                        referenceType: 'adjustment',
                        referenceId: inserted.id, // Self refer for initial
                        notes: 'Initial Import',
                        createdBy: user.id
                    })
                }
            }

            if (movementsToInsert.length > 0) {
                await tx.insert(stockMovements).values(movementsToInsert)
            }
        })

        return c.json({
            message: `Successfully imported ${newItems.length} items`,
            count: newItems.length
        }, 201)

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Validation failed:', error.errors)
            return c.json({ error: 'Validation failed', details: error.errors }, 400)
        }
        console.error('Error importing items:', error)
        return c.json({ error: 'Failed to import items' }, 500)
    }
})

// POST /items - Create new item
app.post('/', async (c) => {
    try {
        const user = c.get('user')
        const organizationId = c.get('organizationId')

        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const body = await c.req.json()
        const validated = createItemSchema.parse(body)

        const newItem: NewItem = {
            organizationId: organizationId,
            isActive: true,
            name: validated.name,
            sku: validated.sku,
            barcode: validated.barcode,
            description: validated.description,
            categoryId: validated.categoryId,
            unit: validated.unit,
            costPrice: validated.costPrice,
            sellingPrice: validated.sellingPrice,
            reorderPoint: validated.reorderPoint,
            reorderQuantity: validated.reorderQuantity,
            imageUrl: validated.imageUrl
        }

        // Handle initial quantity if provided in single create
        // Stock management is handled via movements below, so we don't set quantityOnHand directly
        if (validated.quantity && validated.quantity > 0) {
            // Note: items table doesn't have quantityOnHand column
        }

        const [created] = await db.insert(items).values(newItem).returning()

        // Create stock movement if quantity provided
        if (validated.quantity && validated.quantity > 0) {
            await db.insert(stockMovements).values({
                organizationId,
                itemId: created.id,
                type: 'ADJUSTMENT',
                quantity: validated.quantity,
                referenceType: 'adjustment',
                referenceId: created.id,
                notes: 'Initial Stock',
                createdBy: user.id
            })
        }

        return c.json(created, 201)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400)
        }
        console.error('Error creating item:', error)
        return c.json({ error: 'Failed to create item' }, 500)
    }
})

// GET /items/:id - Get single item
app.get('/:id', async (c) => {
    try {
        const { id } = c.req.param()
        const user = c.get('user')
        const organizationId = c.get('organizationId')

        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const [item] = await db
            .select()
            .from(items)
            .where(and(
                eq(items.id, id),
                eq(items.organizationId, organizationId)
            ))
            .limit(1)

        if (!item) {
            return c.json({ error: 'Item not found' }, 404)
        }

        // TODO: Add current stock level from stock_movements

        return c.json(item)
    } catch (error) {
        console.error('Error fetching item:', error)
        return c.json({ error: 'Failed to fetch item' }, 500)
    }
})

// PATCH /items/:id - Update item
app.patch('/:id', async (c) => {
    try {
        const { id } = c.req.param()
        const user = c.get('user')
        const organizationId = c.get('organizationId')

        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const body = await c.req.json()
        const validated = updateItemSchema.parse(body)

        const [updated] = await db
            .update(items)
            .set({
                ...validated,
                updatedAt: new Date()
            })
            .where(and(
                eq(items.id, id),
                eq(items.organizationId, user.organizationId)
            ))
            .returning()

        if (!updated) {
            return c.json({ error: 'Item not found' }, 404)
        }

        return c.json(updated)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400)
        }
        console.error('Error updating item:', error)
        return c.json({ error: 'Failed to update item' }, 500)
    }
})

// DELETE /items/:id - Soft delete item
app.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param()
        const user = c.get('user')

        if (!user?.organizationId) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const [deleted] = await db
            .update(items)
            .set({
                isActive: false,
                updatedAt: new Date()
            })
            .where(and(
                eq(items.id, id),
                eq(items.organizationId, user.organizationId)
            ))
            .returning()

        if (!deleted) {
            return c.json({ error: 'Item not found' }, 404)
        }

        return c.json({ message: 'Item deleted successfully' })
    } catch (error) {
        console.error('Error deleting item:', error)
        return c.json({ error: 'Failed to delete item' }, 500)
    }
})

export default app
