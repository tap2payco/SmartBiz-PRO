import { Hono } from 'hono'
import { db } from '@smartbiz/db'
import { locations } from '@smartbiz/db/src/schema/inventory'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'

const app = new Hono<{ Variables: { user: any, organizationId: string } }>()

const locationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['WAREHOUSE', 'STORE', 'OTHER']),
    address: z.string().optional(),
})

// GET /locations - List all locations
app.get('/', async (c) => {
    const organizationId = c.get('organizationId')
    if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

    try {
        const result = await db
            .select()
            .from(locations)
            .where(
                and(
                    eq(locations.organizationId, organizationId),
                    eq(locations.isActive, true)
                )
            )
            .orderBy(desc(locations.createdAt))

        return c.json(result)
    } catch (error) {
        console.error('Error fetching locations:', error)
        return c.json({ error: 'Failed to fetch locations' }, 500)
    }
})

// POST /locations - Create new location
app.post('/', async (c) => {
    const organizationId = c.get('organizationId')
    if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

    try {
        const body = await c.req.json()
        const validated = locationSchema.parse(body)

        const [newLocation] = await db
            .insert(locations)
            .values({
                ...validated,
                organizationId
            })
            .returning()

        return c.json(newLocation, 201)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: error.flatten() }, 400)
        }
        console.error('Error creating location:', error)
        return c.json({ error: 'Failed to create location' }, 500)
    }
})

// PATCH /locations/:id - Update location
app.patch('/:id', async (c) => {
    const organizationId = c.get('organizationId')
    const id = c.req.param('id')
    if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

    try {
        const body = await c.req.json()
        const validated = locationSchema.partial().parse(body)

        const [updatedLocation] = await db
            .update(locations)
            .set(validated)
            .where(
                and(
                    eq(locations.id, id),
                    eq(locations.organizationId, organizationId)
                )
            )
            .returning()

        if (!updatedLocation) {
            return c.json({ error: 'Location not found' }, 404)
        }

        return c.json(updatedLocation)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: error.flatten() }, 400)
        }
        console.error('Error updating location:', error)
        return c.json({ error: 'Failed to update location' }, 500)
    }
})

// DELETE /locations/:id - Soft delete location
app.delete('/:id', async (c) => {
    const organizationId = c.get('organizationId')
    const id = c.req.param('id')
    if (!organizationId) return c.json({ error: 'Unauthorized' }, 401)

    try {
        const [deletedLocation] = await db
            .update(locations)
            .set({ isActive: false })
            .where(
                and(
                    eq(locations.id, id),
                    eq(locations.organizationId, organizationId)
                )
            )
            .returning()

        if (!deletedLocation) {
            return c.json({ error: 'Location not found' }, 404)
        }

        return c.json({ message: 'Location deleted successfully' })
    } catch (error) {
        console.error('Error deleting location:', error)
        return c.json({ error: 'Failed to delete location' }, 500)
    }
})

export default app
