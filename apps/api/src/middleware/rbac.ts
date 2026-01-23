import { Context, Next } from 'hono';
import { hasPermission } from '@smartbiz/shared';

export function requirePermission(permission: string) {
    return async (c: Context, next: Next) => {
        const profile = c.get('profile');

        if (!profile) {
            return c.json({ error: 'Unauthorized: No profile context' }, 401);
        }

        // Cast permission permissions column from JSONB to string[]
        const userPermissions = (profile.permissions as string[]) || [];

        if (!hasPermission(profile.role, userPermissions, permission)) {
            return c.json({
                error: 'Forbidden: Insufficient permissions',
                details: `Required: ${permission}`
            }, 403);
        }

        await next();
    };
}
