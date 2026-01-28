import { Context, Next } from 'hono';
import { supabase } from '../lib/supabase';
import { db } from '@smartbiz/db';
import { profiles } from '@smartbiz/db';
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
        // We use the db directly here instead of Supabase client to ensure we get custom fields matches
        const profile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, user.id),
        });

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
