import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@smartbiz/db'
import { itemCategories } from '@smartbiz/db/src/schema/inventory'
import type { NewItemCategory } from '@smartbiz/db/src/schema/inventory'
import { eq, and } from 'drizzle-orm'

const app = new Hono<{ Variables: { user: any, organizationId: string } }>()

// Validation Schemas
const createCategorySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    parentId: z.string().uuid().optional()
})

const updateCategorySchema = createCategorySchema.partial()

// Health check
app.get('/health', (c) => c.json({ status: 'ok', resource: 'categories' }))

// GET /categories - List all categories
app.get('/', async (c) => {
    try {
        const user = c.get('user')
        const organizationId = c.get('organizationId')

        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const result = await db
            .select()
            .from(itemCategories)
            .where(eq(itemCategories.organizationId, organizationId))

        return c.json(result)
    } catch (error) {
        console.error('Error fetching categories:', error)
        return c.json({ error: 'Failed to fetch categories' }, 500)
    }
})

// POST /categories - Create new category
app.post('/', async (c) => {
    try {
        const user = c.get('user')
        const organizationId = c.get('organizationId')

        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const body = await c.req.json()
        const validated = createCategorySchema.parse(body)

        const newCategory: NewItemCategory = {
            ...validated,
            organizationId: organizationId,
            isActive: true
        }

        const [created] = await db.insert(itemCategories).values(newCategory).returning()

        return c.json(created, 201)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400)
        }
        console.error('Error creating category:', error)
        return c.json({ error: 'Failed to create category' }, 500)
    }
})

// PATCH /categories/:id - Update category
app.patch('/:id', async (c) => {
    try {
        const { id } = c.req.param()
        const user = c.get('user')
        const organizationId = c.get('organizationId')

        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const body = await c.req.json()
        const validated = updateCategorySchema.parse(body)

        const [updated] = await db
            .update(itemCategories)
            .set({
                ...validated,
                updatedAt: new Date()
            })
            .where(and(
                eq(itemCategories.id, id),
                eq(itemCategories.organizationId, organizationId)
            ))
            .returning()

        if (!updated) {
            return c.json({ error: 'Category not found' }, 404)
        }

        return c.json(updated)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400)
        }
        console.error('Error updating category:', error)
        return c.json({ error: 'Failed to update category' }, 500)
    }
})

// DELETE /categories/:id - Delete category
app.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param()
        const user = c.get('user')
        const organizationId = c.get('organizationId')

        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const [deleted] = await db
            .update(itemCategories)
            .set({
                isActive: false,
                updatedAt: new Date()
            })
            .where(and(
                eq(itemCategories.id, id),
                eq(itemCategories.organizationId, organizationId)
            ))
            .returning()

        if (!deleted) {
            return c.json({ error: 'Category not found' }, 404)
        }

        return c.json({ message: 'Category deleted successfully' })
    } catch (error) {
        console.error('Error deleting category:', error)
        return c.json({ error: 'Failed to delete category' }, 500)
    }
})

export default app
