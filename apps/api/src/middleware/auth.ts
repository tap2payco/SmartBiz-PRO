import { Context, Next } from 'hono';
import { supabase } from '../lib/supabase';
import { db } from '@smartbiz/db';
import { profiles, organizations } from '@smartbiz/db';
import { eq } from 'drizzle-orm';

export async function authMiddleware(c: Context, next: Next) {
    if (c.req.method === 'OPTIONS') {
        return c.body(null, 204);
    }

    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized: Missing token' }, 401);
    }

    const token = authHeader.substring(7);

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return c.json({ error: 'Unauthorized: Invalid token' }, 401);
        }

        // Fetch profile with role and permissions
        let profile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, user.id),
        });

        // Auto-create organization + profile for new users
        if (!profile) {
            try {
                const email = user.email || 'user';
                const emailPrefix = email.split('@')[0];
                const orgName = `${emailPrefix}'s Business`;
                const slug = `${emailPrefix.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(Math.random() * 10000)}`;

                const firstName = user.user_metadata?.first_name || emailPrefix;
                const lastName = user.user_metadata?.last_name || '';

                const result = await db.transaction(async (tx: any) => {
                    const [newOrg] = await tx.insert(organizations).values({
                        name: orgName,
                        slug,
                        industry: 'RETAIL',
                        country: 'TZ',
                        currency: 'TZS',
                        settings: {
                            taxEnabled: true,
                            vatRate: 18,
                            offlineMode: true,
                            multiLocation: false,
                            sequentialNumbering: true,
                            fiscalYearStart: '01-01',
                        },
                    }).returning();

                    const [newProfile] = await tx.insert(profiles).values({
                        userId: user.id,
                        organizationId: newOrg.id,
                        firstName,
                        lastName,
                        email,
                        role: 'OWNER',
                        permissions: [],
                    } as any).returning();

                    return newProfile;
                });

                profile = result;
                console.log(`Auto-created org + profile for user ${email}`);
            } catch (autoCreateErr) {
                console.error('Failed to auto-create org/profile:', autoCreateErr);
                // Continue without profile — dashboard will show limited data
            }
        }

        // Attach to context
        c.set('user', user);

        if (profile) {
            c.set('profile', profile);
            c.set('organizationId', profile.organizationId);
        } else {
            c.set('profile', null);
            c.set('organizationId', null);
        }

        await next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
}
