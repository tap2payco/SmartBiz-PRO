import { Hono } from 'hono';
import { db } from '@smartbiz/db';
import { organizations, profiles, userRoleEnum } from '@smartbiz/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { User } from '@supabase/supabase-js';
import { Profile } from '@smartbiz/shared';

type Variables = {
    user: User;
    profile: Profile | null;
    organizationId: string | null;
};

const app = new Hono<{ Variables: Variables }>();

// Schema for creating an organization
const createOrgSchema = z.object({
    name: z.string().min(2).max(100),
    industry: z.enum(['RETAIL', 'WHOLESALE', 'HEALTHCARE', 'EDUCATION', 'NGO', 'MANUFACTURING']),
    country: z.string().length(2),
    currency: z.string().length(3),
});

// Create Organization
app.post('/', zValidator('json', createOrgSchema), async (c) => {
    const user = c.get('user');
    const existingProfile = c.get('profile');
    const { name, industry, country, currency } = c.req.valid('json');

    if (existingProfile) {
        return c.json({
            error: 'User already belongs to an organization',
            code: 'ALREADY_HAS_ORG'
        }, 400);
    }

    try {
        const result = await db.transaction(async (tx: any) => {
            // 1. Create Organization
            // Generate slug from name
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            // Add random suffix to ensure uniqueness
            const uniqueSlug = `${slug}-${Math.floor(Math.random() * 10000)}`;

            const [newOrg] = await tx.insert(organizations).values({
                name,
                slug: uniqueSlug,
                industry,
                country,
                currency,
                settings: {
                    taxEnabled: true,
                    vatRate: 18,
                    offlineMode: true,
                    multiLocation: false,
                    sequentialNumbering: true,
                    fiscalYearStart: '01-01',
                },
            }).returning();

            // 2. Create Profile (OWNER)
            // Extract names from user metadata or fallback
            // Note: Supabase user metadata might be empty if signed up with email/password only and no extra data sent
            const firstName = user.user_metadata?.first_name || 'Admin';
            const lastName = user.user_metadata?.last_name || 'User';

            const [newProfile] = await tx.insert(profiles).values({
                userId: user.id,
                organizationId: newOrg.id,
                firstName,
                lastName,
                role: 'OWNER',
                permissions: [],
            } as any).returning();

            return {
                organization: newOrg,
                profile: newProfile
            };
        });

        return c.json(result, 201);

    } catch (error: any) {
        console.error('Error creating organization:', error);
        // Log deep details for debugging
        if (error.code) console.error('DB Error Code:', error.code);
        if (error.detail) console.error('DB Error Detail:', error.detail);
        if (error.hint) console.error('DB Error Hint:', error.hint);

        return c.json({
            error: 'Failed to create organization',
            details: error.message,
            code: error.code
        }, 500);
    }
});

// Get My Organization
app.get('/me', async (c) => {
    const profile = c.get('profile');

    if (!profile) {
        return c.json({ organization: null });
    }

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, profile.organizationId),
    });

    return c.json({ organization: org });
});

// Update My Organization
app.patch('/me', zValidator('json', createOrgSchema.partial()), async (c) => {
    const profile = c.get('profile');
    const updates = c.req.valid('json');

    if (!profile || !profile.organizationId) {
        return c.json({ error: 'No organization found for this user' }, 404);
    }

    try {
        const [updatedOrg] = await db.update(organizations)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(eq(organizations.id, profile.organizationId))
            .returning();

        return c.json({ organization: updatedOrg });
    } catch (error: any) {
        console.error('Error updating organization:', error);
        return c.json({ error: 'Failed to update organization', details: error.message }, 500);
    }
});

export default app;
