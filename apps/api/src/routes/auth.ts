import { Hono } from 'hono';
import { db, profiles, organizations } from '@smartbiz/db';
import { eq, and } from 'drizzle-orm';
import { User } from '@supabase/supabase-js';
import { Profile, USER_ROLES, ROLE_PERMISSIONS } from '@smartbiz/shared';
import { requirePermission } from '../middleware/rbac';
import { supabaseAdmin } from '../lib/supabase';

type Variables = {
    user: User;
    profile: Profile | null;
    organizationId: string | null;
};

const app = new Hono<{ Variables: Variables }>();

// GET /auth/me - Get current user profile
app.get('/me', (c) => {
    const user = c.get('user');
    const profile = c.get('profile');

    return c.json({
        user,
        profile,
    });
});

// GET /auth/users - List users in organization
app.get('/users', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) {
        return c.json({ error: 'No organization context' }, 400);
    }

    // Only Admin/Owner can see all users
    // We could add a permission check here or allow all staff to see basic info

    try {
        const organizationUsers = await db
            .select()
            .from(profiles)
            .where(
                and(
                    eq(profiles.organizationId, profile.organizationId),
                    eq(profiles.deletedAt, null as any) // Check soft delete
                )
            );

        return c.json(organizationUsers);
    } catch (error) {
        return c.json({ error: 'Failed to fetch users' }, 500);
    }
});

// POST /auth/invite - Invite a user via email
app.post('/invite', async (c) => {
    const profile = c.get('profile');
    const { email, role, fullName } = await c.req.json();

    if (!profile?.organizationId) {
        return c.json({ error: 'No organization context' }, 400);
    }

    // Explicit permission check
    const perms = (profile.permissions as string[]) || [];
    const hasManageUsers = profile.role === USER_ROLES.ADMIN ||
        profile.role === USER_ROLES.OWNER ||
        perms.includes('USERS_MANAGE');

    if (!hasManageUsers) {
        return c.json({ error: 'Unauthorized to invite users' }, 403);
    }

    try {
        // 1. Create Supabase Auth User (Invite)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

        if (authError) {
            console.error('Supabase Invite Error:', authError);
            return c.json({ error: authError.message }, 400);
        }

        // 2. Create Profile Record
        if (authData.user) {
            const rolePermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];

            await db.insert(profiles).values({
                id: authData.user.id,
                email: email,
                fullName: fullName,
                organizationId: profile.organizationId,
                role: role,
                permissions: rolePermissions,
                status: 'INVITED',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            return c.json({ message: 'Invitation sent successfully', user: authData.user });
        }

        return c.json({ error: 'Failed to create user invite' }, 500);

    } catch (error) {
        console.error('Invite Error:', error);
        return c.json({ error: 'Internal server error during invite' }, 500);
    }
});

// PATCH /auth/users/:id/role - Update user role
app.patch('/users/:id/role', async (c) => {
    const adminProfile = c.get('profile');
    const userId = c.req.param('id');
    const { role } = await c.req.json();

    if (!adminProfile?.organizationId) {
        return c.json({ error: 'No organization context' }, 400);
    }

    // Only Admin/Owner can change roles
    const isOwner = adminProfile.role === USER_ROLES.OWNER;
    const isAdmin = adminProfile.role === USER_ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
        return c.json({ error: 'Unauthorized to update roles' }, 403);
    }

    try {
        // Prevent modifying own role to avoid lockout
        if (userId === adminProfile.id) {
            return c.json({ error: 'Cannot modify your own role' }, 400);
        }

        const targetUser = await db.query.profiles.findFirst({
            where: and(
                eq(profiles.id, userId),
                eq(profiles.organizationId, adminProfile.organizationId)
            )
        });

        if (!targetUser) {
            return c.json({ error: 'User not found in organization' }, 404);
        }

        // Prevent Admin from modifying Owner
        if (targetUser.role === USER_ROLES.OWNER && !isOwner) {
            return c.json({ error: 'Admins cannot modify Owners' }, 403);
        }

        const newPermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];

        await db.update(profiles)
            .set({
                role: role,
                permissions: newPermissions,
                updatedAt: new Date()
            })
            .where(eq(profiles.id, userId));

        return c.json({ message: 'Role updated successfully' });

    } catch (error) {
        console.error('Update Role Error:', error);
        return c.json({ error: 'Failed to update role' }, 500);
    }
});

// DELETE /auth/users/:id - Deactivate/Soft delete user
app.delete('/users/:id', async (c) => {
    // ... similar logic for soft delete, clearing auth access if needed
    // For now, let's keep it simple
    return c.json({ message: 'Not implemented yet' }, 501);
});

export default app;
