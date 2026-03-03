exports.id = 275;
exports.ids = [275];
exports.modules = {

/***/ 1133:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  app: () => (/* binding */ src_app)
});

// UNUSED EXPORTS: default

// EXTERNAL MODULE: ../../node_modules/dotenv/config.js
var config = __webpack_require__(7270);
// EXTERNAL MODULE: ../../node_modules/hono/dist/index.js + 22 modules
var dist = __webpack_require__(7534);
// EXTERNAL MODULE: ../../node_modules/hono/dist/middleware/logger/index.js + 1 modules
var logger = __webpack_require__(9697);
// EXTERNAL MODULE: ../../node_modules/hono/dist/middleware/cors/index.js
var cors = __webpack_require__(2649);
// EXTERNAL MODULE: ../../node_modules/hono/dist/middleware/pretty-json/index.js
var pretty_json = __webpack_require__(7437);
// EXTERNAL MODULE: ../../node_modules/@supabase/supabase-js/dist/index.mjs + 3 modules
var supabase_js_dist = __webpack_require__(1610);
;// CONCATENATED MODULE: ./src/lib/supabase.ts

let _supabase = null;
const getSupabase = () => {
    if (_supabase)
        return _supabase;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        console.error('CRITICAL: Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
        throw new Error('Supabase configuration missing');
    }
    _supabase = (0,supabase_js_dist.createClient)(url, key);
    return _supabase;
};
// Legacy Export (Proxied to lazy getter)
const supabase = new Proxy({}, {
    get: (target, prop) => {
        const client = getSupabase();
        return client[prop];
    }
});
const supabaseAdmin = supabase;

// EXTERNAL MODULE: ../../packages/db/src/index.ts + 14 modules
var src = __webpack_require__(9292);
// EXTERNAL MODULE: ../../node_modules/drizzle-orm/sql/expressions/conditions.js
var conditions = __webpack_require__(7763);
;// CONCATENATED MODULE: ./src/middleware/auth.ts




async function authMiddleware(c, next) {
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
        let profile = await src.db.query.profiles.findFirst({
            where: (0,conditions.eq)(src.profiles.userId, user.id),
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
                const result = await src.db.transaction(async (tx) => {
                    const [newOrg] = await tx.insert(src.organizations).values({
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
                    const [newProfile] = await tx.insert(src.profiles).values({
                        userId: user.id,
                        organizationId: newOrg.id,
                        firstName,
                        lastName,
                        email,
                        role: 'OWNER',
                        permissions: [],
                    }).returning();
                    return newProfile;
                });
                profile = result;
                console.log(`Auto-created org + profile for user ${email}`);
            }
            catch (autoCreateErr) {
                console.error('Failed to auto-create org/profile:', autoCreateErr);
                // Continue without profile — dashboard will show limited data
            }
        }
        // Attach to context
        c.set('user', user);
        if (profile) {
            c.set('profile', profile);
            c.set('organizationId', profile.organizationId);
        }
        else {
            c.set('profile', null);
            c.set('organizationId', null);
        }
        await next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
}

// EXTERNAL MODULE: ../../node_modules/zod/v3/types.js + 4 modules
var types = __webpack_require__(7583);
// EXTERNAL MODULE: ../../node_modules/@hono/zod-validator/dist/cjs/index.js
var cjs = __webpack_require__(6369);
;// CONCATENATED MODULE: ./src/routes/organizations.ts






const app = new dist.Hono();
// Schema for creating an organization
const createOrgSchema = types/* object */.Ik({
    name: types/* string */.Yj().min(2).max(100),
    industry: types/* enum */.k5(['RETAIL', 'WHOLESALE', 'HEALTHCARE', 'EDUCATION', 'NGO', 'MANUFACTURING']),
    country: types/* string */.Yj().length(2),
    currency: types/* string */.Yj().length(3),
});
// Create Organization
app.post('/', (0,cjs/* zValidator */.l)('json', createOrgSchema), async (c) => {
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
        const result = await src.db.transaction(async (tx) => {
            // 1. Create Organization
            // Generate slug from name
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            // Add random suffix to ensure uniqueness
            const uniqueSlug = `${slug}-${Math.floor(Math.random() * 10000)}`;
            const [newOrg] = await tx.insert(src.organizations).values({
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
            const [newProfile] = await tx.insert(src.profiles).values({
                userId: user.id,
                organizationId: newOrg.id,
                firstName,
                lastName,
                role: 'OWNER',
                permissions: [],
            }).returning();
            return {
                organization: newOrg,
                profile: newProfile
            };
        });
        return c.json(result, 201);
    }
    catch (error) {
        console.error('Error creating organization:', error);
        // Log deep details for debugging
        if (error.code)
            console.error('DB Error Code:', error.code);
        if (error.detail)
            console.error('DB Error Detail:', error.detail);
        if (error.hint)
            console.error('DB Error Hint:', error.hint);
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
    const org = await src.db.query.organizations.findFirst({
        where: (0,conditions.eq)(src.organizations.id, profile.organizationId),
    });
    return c.json({ organization: org });
});
// Update My Organization
app.patch('/me', (0,cjs/* zValidator */.l)('json', createOrgSchema.partial()), async (c) => {
    const profile = c.get('profile');
    const updates = c.req.valid('json');
    if (!profile || !profile.organizationId) {
        return c.json({ error: 'No organization found for this user' }, 404);
    }
    try {
        const [updatedOrg] = await src.db.update(src.organizations)
            .set({
            ...updates,
            updatedAt: new Date(),
        })
            .where((0,conditions.eq)(src.organizations.id, profile.organizationId))
            .returning();
        return c.json({ organization: updatedOrg });
    }
    catch (error) {
        console.error('Error updating organization:', error);
        return c.json({ error: 'Failed to update organization', details: error.message }, 500);
    }
});
/* harmony default export */ const organizations = (app);

;// CONCATENATED MODULE: ../../packages/shared/src/schemas/index.js

// Auth schemas
const loginSchema = types/* object */.Ik({
    email: types/* string */.Yj().email('Invalid email address'),
    password: types/* string */.Yj().min(8, 'Password must be at least 8 characters'),
});
const registerSchema = types/* object */.Ik({
    email: types/* string */.Yj().email('Invalid email address'),
    password: types/* string */.Yj().min(8, 'Password must be at least 8 characters'),
    firstName: types/* string */.Yj().min(1, 'First name is required'),
    lastName: types/* string */.Yj().min(1, 'Last name is required'),
    organizationName: types/* string */.Yj().min(1, 'Organization name is required'),
});
const profileUpdateSchema = types/* object */.Ik({
    firstName: types/* string */.Yj().min(1).optional(),
    lastName: types/* string */.Yj().min(1).optional(),
    phone: types/* string */.Yj().optional(),
    avatar: types/* string */.Yj().url().optional(),
});
// Organization schemas
const organizationSchema = types/* object */.Ik({
    name: types/* string */.Yj().min(1, 'Organization name is required'),
    slug: types/* string */.Yj().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    industry: types/* enum */.k5(['RETAIL', 'WHOLESALE', 'HEALTHCARE', 'EDUCATION', 'NGO', 'MANUFACTURING']),
    country: types/* string */.Yj().length(2, 'Country code must be 2 characters'),
    currency: types/* string */.Yj().length(3, 'Currency code must be 3 characters'),
    timezone: types/* string */.Yj(),
});
// Stakeholder schemas
const stakeholderSchema = types/* object */.Ik({
    type: types/* enum */.k5(['CUSTOMER', 'SUPPLIER']),
    code: types/* string */.Yj().min(1, 'Code is required'),
    name: types/* string */.Yj().min(1, 'Name is required'),
    email: types/* string */.Yj().email().optional().or(types/* literal */.eu('')),
    phone: types/* string */.Yj().optional(),
    address: types/* string */.Yj().optional(),
    city: types/* string */.Yj().optional(),
    country: types/* string */.Yj().optional(),
    taxId: types/* string */.Yj().optional(),
    creditLimit: types/* number */.ai().min(0).optional(),
    paymentTerms: types/* number */.ai().int().min(0).optional(),
    isActive: types/* boolean */.zM().default(true),
    customFields: types/* record */.g1(types/* any */.bz()).optional(),
});
const stakeholderUpdateSchema = stakeholderSchema.partial().omit({ type: true });
// Pagination schema
const paginationSchema = types/* object */.Ik({
    page: types/* number */.ai().int().min(1).default(1),
    limit: types/* number */.ai().int().min(1).max(100).default(20),
    sortBy: types/* string */.Yj().optional(),
    sortOrder: types/* enum */.k5(['asc', 'desc']).optional(),
});
// Sync schemas
const syncOperationSchema = types/* object */.Ik({
    id: types/* string */.Yj().uuid(),
    organizationId: types/* string */.Yj().uuid(),
    userId: types/* string */.Yj().uuid(),
    deviceId: types/* string */.Yj(),
    table: types/* string */.Yj(),
    action: types/* enum */.k5(['CREATE', 'UPDATE', 'DELETE']),
    entityId: types/* string */.Yj().uuid(),
    payload: types/* any */.bz(),
    expectedVersion: types/* number */.ai().int().optional(),
    priority: types/* number */.ai().int().min(0).max(10),
    createdAtLocal: types/* number */.ai().int(),
});
const syncPushRequestSchema = types/* object */.Ik({
    deviceId: types/* string */.Yj(),
    operations: types/* array */.YO(syncOperationSchema).max(200),
});
const conflictResolutionSchema = types/* object */.Ik({
    conflictId: types/* string */.Yj().uuid(),
    resolution: types/* enum */.k5(['USE_SERVER', 'KEEP_LOCAL', 'MERGE', 'ADJUSTMENT', 'CANCEL']),
    mergedPayload: types/* any */.bz().optional(),
});

;// CONCATENATED MODULE: ../../packages/shared/src/constants/index.js
// App constants
const APP_NAME = 'SmartBiz Pro ERP';
const APP_VERSION = '1.0.0';
// API constants
const API_TIMEOUT = 30000; // 30 seconds
const MAX_SYNC_BATCH_SIZE = 200;
const SYNC_RETRY_ATTEMPTS = 3;
const SYNC_RETRY_DELAY = 1000; // 1 second
// Offline constants
const INDEXEDDB_NAME = 'smartbiz-pro';
const INDEXEDDB_VERSION = 1;
const MAX_OFFLINE_STORAGE_MB = 50;
// Pagination constants
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
// User roles
const constants_USER_ROLES = {
    ADMIN: 'ADMIN',
    OWNER: 'OWNER',
    ACCOUNTANT: 'ACCOUNTANT',
    STOREKEEPER: 'STOREKEEPER',
    PROCUREMENT: 'PROCUREMENT',
    HR: 'HR',
    PAYROLL: 'PAYROLL',
    PROJECT_MANAGER: 'PROJECT_MANAGER',
    SALES: 'SALES',
};
// Sync priorities
const SYNC_PRIORITY = {
    CRITICAL: 10, // Payments, financial transactions
    HIGH: 7, // Sales, purchases
    MEDIUM: 5, // Inventory movements
    LOW: 3, // Master data updates
    LOWEST: 1, // Logs, analytics
};
// Stock movement types
const STOCK_MOVEMENT_TYPE = {
    GRN: 'GRN', // Goods Received Note
    SALE: 'SALE', // Sale/Issue
    ISSUE: 'ISSUE', // Stock issue
    TRANSFER: 'TRANSFER', // Inter-location transfer
    ADJUSTMENT: 'ADJUSTMENT', // Stock adjustment
    RETURN: 'RETURN', // Customer return
};
// Payment methods
const PAYMENT_METHOD = {
    CASH: 'CASH',
    MOBILE_MONEY: 'MOBILE_MONEY',
    CARD: 'CARD',
    BANK_TRANSFER: 'BANK_TRANSFER',
    CREDIT: 'CREDIT',
    CHEQUE: 'CHEQUE',
};
// Industries
const INDUSTRIES = {
    RETAIL: 'RETAIL',
    WHOLESALE: 'WHOLESALE',
    HEALTHCARE: 'HEALTHCARE',
    EDUCATION: 'EDUCATION',
    NGO: 'NGO',
    MANUFACTURING: 'MANUFACTURING',
};
// Currencies (Tanzania focus)
const CURRENCIES = {
    TZS: 'TZS', // Tanzanian Shilling
    USD: 'USD',
    EUR: 'EUR',
    GBP: 'GBP',
    KES: 'KES', // Kenyan Shilling
    UGX: 'UGX', // Ugandan Shilling
};
// Date formats
const DATE_FORMAT = {
    SHORT: 'dd/MM/yyyy',
    LONG: 'dd MMMM yyyy',
    WITH_TIME: 'dd/MM/yyyy HH:mm',
    ISO: 'yyyy-MM-dd',
};
// Granular Permissions
const PERMISSIONS = {
    // Inventory
    INVENTORY_VIEW: 'INVENTORY_VIEW',
    INVENTORY_CREATE: 'INVENTORY_CREATE',
    INVENTORY_EDIT: 'INVENTORY_EDIT',
    INVENTORY_DELETE: 'INVENTORY_DELETE',
    INVENTORY_ADJUST: 'INVENTORY_ADJUST',
    // Sales
    SALES_VIEW: 'SALES_VIEW',
    SALES_CREATE: 'SALES_CREATE',
    SALES_EDIT: 'SALES_EDIT',
    SALES_VOID: 'SALES_VOID',
    // Customers
    CUSTOMERS_VIEW: 'CUSTOMERS_VIEW',
    CUSTOMERS_CREATE: 'CUSTOMERS_CREATE',
    CUSTOMERS_EDIT: 'CUSTOMERS_EDIT',
    CUSTOMERS_DELETE: 'CUSTOMERS_DELETE',
    // Reports
    REPORTS_VIEW: 'REPORTS_VIEW',
    REPORTS_FINANCIAL: 'REPORTS_FINANCIAL',
    // Settings
    SETTINGS_VIEW: 'SETTINGS_VIEW',
    SETTINGS_EDIT: 'SETTINGS_EDIT',
    USERS_MANAGE: 'USERS_MANAGE',
};
// Default Role Permissions
const constants_ROLE_PERMISSIONS = {
    [constants_USER_ROLES.ADMIN]: Object.values(PERMISSIONS),
    [constants_USER_ROLES.OWNER]: Object.values(PERMISSIONS),
    [constants_USER_ROLES.STOREKEEPER]: [
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.INVENTORY_CREATE,
        PERMISSIONS.INVENTORY_EDIT,
        PERMISSIONS.INVENTORY_ADJUST,
        PERMISSIONS.REPORTS_VIEW,
    ],
    [constants_USER_ROLES.SALES]: [
        PERMISSIONS.SALES_VIEW,
        PERMISSIONS.SALES_CREATE,
        PERMISSIONS.CUSTOMERS_VIEW,
        PERMISSIONS.CUSTOMERS_CREATE,
        PERMISSIONS.INVENTORY_VIEW,
    ],
    [constants_USER_ROLES.ACCOUNTANT]: [
        PERMISSIONS.SALES_VIEW,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.REPORTS_FINANCIAL,
        PERMISSIONS.CUSTOMERS_VIEW,
    ],
};

;// CONCATENATED MODULE: ../../packages/shared/src/utils/index.js
/**
 * Generate a UUID v4
 */
function generateId() {
    return crypto.randomUUID();
}
/**
 * Generate an idempotency key for sync operations
 */
function generateIdempotencyKey(organizationId, deviceId, timestamp) {
    return `${organizationId}:${deviceId}:${timestamp}:${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * Format currency
 */
function formatCurrency(amount, currency = 'TZS') {
    return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency,
    }).format(amount);
}
/**
 * Format date
 */
function formatDate(date, format = 'short') {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (format === 'long') {
        return new Intl.DateTimeFormat('en-TZ', {
            dateStyle: 'long',
            timeStyle: 'short',
        }).format(d);
    }
    return new Intl.DateTimeFormat('en-TZ', {
        dateStyle: 'short',
    }).format(d);
}
/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout = null;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
/**
 * Sleep/delay function
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Retry function with exponential backoff
 */
async function retry(fn, options = {}) {
    const { maxAttempts = 3, initialDelay = 1000, maxDelay = 10000, backoffFactor = 2, } = options;
    let lastError;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt < maxAttempts - 1) {
                const delay = Math.min(initialDelay * Math.pow(backoffFactor, attempt), maxDelay);
                await sleep(delay);
            }
        }
    }
    throw lastError;
}
/**
 * Check if code is running in browser
 */
function isBrowser() {
    return typeof window !== 'undefined';
}
/**
 * Check if online
 */
function isOnline() {
    if (!isBrowser())
        return true;
    return navigator.onLine;
}
/**
 * Truncate string
 */
function truncate(str, length) {
    if (str.length <= length)
        return str;
    return str.substring(0, length) + '...';
}
/**
 * Calculate percentage
 */
function percentage(value, total) {
    if (total === 0)
        return 0;
    return (value / total) * 100;
}
/**
 * Clamp number between min and max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
/**
 * Check if user has permission
 */

function hasPermission(role, userPermissions, requiredPermission) {
    // Admin and Owner have all permissions
    if (role === USER_ROLES.ADMIN || role === USER_ROLES.OWNER)
        return true;
    // Check role-based permissions
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    if (rolePerms.includes(requiredPermission))
        return true;
    // Check custom user permissions
    if (userPermissions && userPermissions.includes(requiredPermission))
        return true;
    return false;
}

;// CONCATENATED MODULE: ../../packages/shared/src/index.ts





;// CONCATENATED MODULE: ./src/routes/auth.ts





const auth_app = new dist.Hono();
// GET /auth/me - Get current user profile
auth_app.get('/me', (c) => {
    const user = c.get('user');
    const profile = c.get('profile');
    return c.json({
        user,
        profile,
    });
});
// GET /auth/users - List users in organization
auth_app.get('/users', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId) {
        return c.json({ error: 'No organization context' }, 400);
    }
    // Only Admin/Owner can see all users
    // We could add a permission check here or allow all staff to see basic info
    try {
        const organizationUsers = await src.db
            .select()
            .from(src.profiles)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.profiles.organizationId, profile.organizationId), (0,conditions.eq)(src.profiles.deletedAt, null) // Check soft delete
        ));
        return c.json(organizationUsers);
    }
    catch (error) {
        return c.json({ error: 'Failed to fetch users' }, 500);
    }
});
// POST /auth/invite - Invite a user via email
auth_app.post('/invite', async (c) => {
    const profile = c.get('profile');
    const { email, role, fullName } = await c.req.json();
    if (!profile?.organizationId) {
        return c.json({ error: 'No organization context' }, 400);
    }
    // Explicit permission check
    const perms = profile.permissions || [];
    const hasManageUsers = profile.role === constants_USER_ROLES.ADMIN ||
        profile.role === constants_USER_ROLES.OWNER ||
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
            const rolePermissions = constants_ROLE_PERMISSIONS[role] || [];
            await src.db.insert(src.profiles).values({
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
    }
    catch (error) {
        console.error('Invite Error:', error);
        return c.json({ error: 'Internal server error during invite' }, 500);
    }
});
// PATCH /auth/users/:id/role - Update user role
auth_app.patch('/users/:id/role', async (c) => {
    const adminProfile = c.get('profile');
    const userId = c.req.param('id');
    const { role } = await c.req.json();
    if (!adminProfile?.organizationId) {
        return c.json({ error: 'No organization context' }, 400);
    }
    // Only Admin/Owner can change roles
    const isOwner = adminProfile.role === constants_USER_ROLES.OWNER;
    const isAdmin = adminProfile.role === constants_USER_ROLES.ADMIN;
    if (!isOwner && !isAdmin) {
        return c.json({ error: 'Unauthorized to update roles' }, 403);
    }
    try {
        // Prevent modifying own role to avoid lockout
        if (userId === adminProfile.id) {
            return c.json({ error: 'Cannot modify your own role' }, 400);
        }
        const targetUser = await src.db.query.profiles.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.profiles.id, userId), (0,conditions.eq)(src.profiles.organizationId, adminProfile.organizationId))
        });
        if (!targetUser) {
            return c.json({ error: 'User not found in organization' }, 404);
        }
        // Prevent Admin from modifying Owner
        if (targetUser.role === constants_USER_ROLES.OWNER && !isOwner) {
            return c.json({ error: 'Admins cannot modify Owners' }, 403);
        }
        const newPermissions = constants_ROLE_PERMISSIONS[role] || [];
        await src.db.update(src.profiles)
            .set({
            role: role,
            permissions: newPermissions,
            updatedAt: new Date()
        })
            .where((0,conditions.eq)(src.profiles.id, userId));
        return c.json({ message: 'Role updated successfully' });
    }
    catch (error) {
        console.error('Update Role Error:', error);
        return c.json({ error: 'Failed to update role' }, 500);
    }
});
// DELETE /auth/users/:id - Deactivate/Soft delete user
auth_app.delete('/users/:id', async (c) => {
    // ... similar logic for soft delete, clearing auth access if needed
    // For now, let's keep it simple
    return c.json({ message: 'Not implemented yet' }, 501);
});
/* harmony default export */ const auth = (auth_app);

// EXTERNAL MODULE: ../../node_modules/drizzle-orm/sql/expressions/select.js
var expressions_select = __webpack_require__(7581);
// EXTERNAL MODULE: ../../node_modules/drizzle-orm/sql/sql.js
var sql = __webpack_require__(3361);
;// CONCATENATED MODULE: ./src/routes/stakeholders.ts






const stakeholdersApp = new dist.Hono();
// Schema for creating/updating a stakeholder
const stakeholders_stakeholderSchema = types/* object */.Ik({
    type: types/* enum */.k5(['CUSTOMER', 'SUPPLIER']),
    stakeholderType: types/* enum */.k5(['INDIVIDUAL', 'BUSINESS']).optional().default('INDIVIDUAL'),
    name: types/* string */.Yj().min(2),
    email: types/* string */.Yj().email().optional().or(types/* literal */.eu('')),
    phone: types/* string */.Yj().optional(),
    address: types/* string */.Yj().optional(),
    city: types/* string */.Yj().optional(),
    country: types/* string */.Yj().length(2).optional(),
    taxId: types/* string */.Yj().optional(),
    creditLimit: types/* number */.ai().optional(),
    paymentTerms: types/* number */.ai().int().optional(),
});
// GET /stakeholders - List all (filtered by type)
stakeholdersApp.get('/', async (c) => {
    const type = c.req.query('type');
    const organizationId = c.get('organizationId');
    let query = src.db
        .select()
        .from(src.stakeholders)
        .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.stakeholders.organizationId, organizationId), type ? (0,conditions.eq)(src.stakeholders.type, type) : undefined, (0,conditions.eq)(src.stakeholders.isActive, true)))
        .orderBy((0,expressions_select/* desc */.i)(src.stakeholders.createdAt));
    const results = await query;
    return c.json({ stakeholders: results });
});
// GET /stakeholders/:id - Get single
stakeholdersApp.get('/:id', async (c) => {
    const id = c.req.param('id');
    const organizationId = c.get('organizationId');
    // 1. Get Stakeholder
    const result = await src.db
        .select()
        .from(src.stakeholders)
        .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.stakeholders.id, id), (0,conditions.eq)(src.stakeholders.organizationId, organizationId)))
        .limit(1);
    if (result.length === 0) {
        return c.json({ error: 'Stakeholder not found' }, 404);
    }
    const stakeholder = result[0];
    // 2. Calculate Outstanding Debt
    // Sum of (totalAmount - paidAmount) for all sales that are NOT 'PAID'
    const salesDebt = await src.db
        .select({
        totalDebt: (0,sql/* sql */.ll) `sum(${src.sales.totalAmount} - ${src.sales.paidAmount})`,
        overdueDebt: (0,sql/* sql */.ll) `sum(CASE WHEN ${src.sales.dueDate} < NOW() THEN (${src.sales.totalAmount} - ${src.sales.paidAmount}) ELSE 0 END)`
    })
        .from(src.sales)
        .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.customerId, id), (0,conditions.eq)(src.sales.organizationId, organizationId), (0,sql/* sql */.ll) `${src.sales.paymentStatus} != 'PAID'`));
    const outstandingDebt = parseFloat(salesDebt[0]?.totalDebt || '0');
    const overdueAmount = parseFloat(salesDebt[0]?.overdueDebt || '0');
    // 3. Calculate Available Credit
    let availableCredit = 0;
    if (stakeholder.creditLimit) {
        availableCredit = Math.max(0, parseFloat(stakeholder.creditLimit) - outstandingDebt);
    }
    return c.json({
        stakeholder: {
            ...stakeholder,
            outstandingDebt,
            overdueAmount,
            availableCredit
        }
    });
});
// POST /stakeholders - Create new
stakeholdersApp.post('/', (0,cjs/* zValidator */.l)('json', stakeholders_stakeholderSchema), async (c) => {
    const data = c.req.valid('json');
    const user = c.get('user');
    const organizationId = c.get('organizationId');
    // Generate a simple code if not provided (e.g. CUST-001)
    // Simplified for now: Timestamp based
    const code = `${data.type.substring(0, 3)}-${Date.now().toString().slice(-6)}`;
    try {
        const [newStakeholder] = await src.db
            .insert(src.stakeholders)
            .values({
            ...data,
            organizationId,
            code,
            createdBy: user.id, // user.id is the ID from Supabase
            updatedBy: user.id,
            creditLimit: data.creditLimit ? String(data.creditLimit) : null, // Drizzle expects string for decimal
        })
            .returning();
        return c.json({ stakeholder: newStakeholder }, 201);
    }
    catch (error) {
        console.error('Error creating stakeholder:', error);
        return c.json({ error: 'Failed to create stakeholder' }, 500);
    }
});
// PATCH /stakeholders/:id - Update
stakeholdersApp.patch('/:id', (0,cjs/* zValidator */.l)('json', stakeholders_stakeholderSchema.partial()), async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const user = c.get('user');
    const organizationId = c.get('organizationId');
    try {
        const [updatedStakeholder] = await src.db
            .update(src.stakeholders)
            .set({
            ...data,
            updatedBy: user.id,
            updatedAt: new Date(),
            creditLimit: data.creditLimit ? String(data.creditLimit) : undefined,
        })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.stakeholders.id, id), (0,conditions.eq)(src.stakeholders.organizationId, organizationId)))
            .returning();
        if (!updatedStakeholder) {
            return c.json({ error: 'Stakeholder not found' }, 404);
        }
        return c.json({ stakeholder: updatedStakeholder });
    }
    catch (error) {
        console.error('Error updating stakeholder:', error);
        return c.json({ error: 'Failed to update stakeholder' }, 500);
    }
});
// PATCH /stakeholders/:id/loyalty - Adjust points
stakeholdersApp.patch('/:id/loyalty', (0,cjs/* zValidator */.l)('json', types/* object */.Ik({ points: types/* number */.ai() })), async (c) => {
    const id = c.req.param('id');
    const { points } = c.req.valid('json');
    const organizationId = c.get('organizationId');
    try {
        const [updated] = await src.db
            .update(src.stakeholders)
            .set({
            loyaltyPoints: (0,sql/* sql */.ll) `${src.stakeholders.loyaltyPoints} + ${points}`,
            updatedAt: new Date(),
        })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.stakeholders.id, id), (0,conditions.eq)(src.stakeholders.organizationId, organizationId)))
            .returning();
        if (!updated)
            return c.json({ error: 'Stakeholder not found' }, 404);
        return c.json({ stakeholder: updated });
    }
    catch (error) {
        return c.json({ error: 'Failed to adjust loyalty points' }, 500);
    }
});
/* harmony default export */ const stakeholders = (stakeholdersApp);

// EXTERNAL MODULE: ../../node_modules/zod/v3/ZodError.js
var ZodError = __webpack_require__(5765);
;// CONCATENATED MODULE: ./src/routes/items.ts





const items_app = new dist.Hono();
// Validation Schemas
const createItemSchema = types/* object */.Ik({
    name: types/* string */.Yj().min(1),
    sku: types/* string */.Yj().min(1),
    barcode: types/* string */.Yj().optional(),
    description: types/* string */.Yj().optional(),
    categoryId: types/* string */.Yj().uuid().optional(),
    unit: types/* string */.Yj().default('pcs'),
    // Handle string or number input for prices
    costPrice: types/* union */.KC([types/* string */.Yj(), types/* number */.ai()]).transform(val => String(val)),
    sellingPrice: types/* union */.KC([types/* string */.Yj(), types/* number */.ai()]).transform(val => String(val)),
    reorderPoint: types/* number */.ai().int().optional(),
    reorderQuantity: types/* number */.ai().int().optional(),
    imageUrl: types/* string */.Yj().optional(),
    quantity: types/* number */.ai().int().optional() // For initial stock import
});
const updateItemSchema = createItemSchema.partial();
const createBulkItemsSchema = types/* array */.YO(createItemSchema);
// Health check
items_app.get('/health', (c) => c.json({ status: 'ok', resource: 'items' }));
// GET /items - List all items with optional filters
items_app.get('/', async (c) => {
    try {
        const { category, search, lowStock } = c.req.query();
        const user = c.get('user');
        const organizationId = c.get('organizationId');
        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        let query = src.db
            .select()
            .from(src.items)
            .where((0,conditions.eq)(src.items.organizationId, organizationId));
        // Apply filters
        if (category) {
            query = query.where((0,conditions/* and */.Uo)((0,conditions.eq)(src.items.organizationId, organizationId), (0,conditions.eq)(src.items.categoryId, category)));
        }
        if (search) {
            query = query.where((0,conditions/* and */.Uo)((0,conditions.eq)(src.items.organizationId, organizationId), (0,conditions.or)((0,conditions/* like */.mj)(src.items.name, `%${search}%`), (0,conditions/* like */.mj)(src.items.sku, `%${search}%`), (0,conditions/* like */.mj)(src.items.barcode, `%${search}%`))));
        }
        const result = await query;
        // TODO: Add stock levels from stock_movements aggregation
        // For now, return items without stock levels
        return c.json(result);
    }
    catch (error) {
        console.error('Error fetching items:', error);
        return c.json({ error: 'Failed to fetch items' }, 500);
    }
});
// GET /items/low-stock - Get items below reorder point
items_app.get('/low-stock', async (c) => {
    try {
        const organizationId = c.get('organizationId');
        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const lowStockItems = await src.db
            .select({
            id: src.items.id,
            name: src.items.name,
            sku: src.items.sku,
            reorderPoint: src.items.reorderPoint,
            currentStock: (0,sql/* sql */.ll) `COALESCE(sum(${src.stockMovements.quantity}), 0)`,
        })
            .from(src.items)
            .leftJoin(src.stockMovements, (0,conditions.eq)(src.stockMovements.itemId, src.items.id))
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.items.organizationId, organizationId), (0,conditions.eq)(src.items.isActive, true), (0,sql/* sql */.ll) `${src.items.reorderPoint} > 0`))
            .groupBy(src.items.id, src.items.name, src.items.sku, src.items.reorderPoint)
            .having((0,sql/* sql */.ll) `COALESCE(sum(${src.stockMovements.quantity}), 0) <= ${src.items.reorderPoint}`);
        const formattedItems = lowStockItems.map(item => ({
            ...item,
            currentStock: Number(item.currentStock),
            isLowStock: true
        }));
        return c.json({
            count: formattedItems.length,
            items: formattedItems
        });
    }
    catch (error) {
        console.error('Error fetching low stock items:', error);
        return c.json({ error: 'Failed to fetch low stock items' }, 500);
    }
});
// POST /items/bulk - Bulk import items
items_app.post('/bulk', async (c) => {
    try {
        const user = c.get('user');
        const organizationId = c.get('organizationId');
        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const body = await c.req.json();
        const validated = createBulkItemsSchema.parse(body);
        // 1. Get existing SKUs to avoid duplicates
        const existingItems = await src.db
            .select({ sku: src.items.sku })
            .from(src.items)
            .where((0,conditions.eq)(src.items.organizationId, organizationId));
        const existingSkus = new Set(existingItems.map((i) => i.sku));
        const newItems = [];
        const validItems = [];
        // 2. Filter valid new items
        for (const item of validated) {
            if (!existingSkus.has(item.sku)) {
                validItems.push(item);
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
                });
            }
        }
        if (newItems.length === 0) {
            return c.json({ message: 'No new items to import', count: 0 }, 200);
        }
        // 3. Insert Items and create Stock Movements
        await src.db.transaction(async (tx) => {
            const insertedItems = await tx.insert(src.items).values(newItems).returning();
            // Create initial stock movements for items with quantity > 0
            const movementsToInsert = [];
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
                    });
                }
            }
            if (movementsToInsert.length > 0) {
                await tx.insert(src.stockMovements).values(movementsToInsert);
            }
        });
        return c.json({
            message: `Successfully imported ${newItems.length} items`,
            count: newItems.length
        }, 201);
    }
    catch (error) {
        if (error instanceof ZodError/* ZodError */.G) {
            console.error('Validation failed:', error.errors);
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Error importing items:', error);
        return c.json({ error: 'Failed to import items' }, 500);
    }
});
// POST /items - Create new item
items_app.post('/', async (c) => {
    try {
        const user = c.get('user');
        const organizationId = c.get('organizationId');
        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const body = await c.req.json();
        const validated = createItemSchema.parse(body);
        const newItem = {
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
        };
        // Handle initial quantity if provided in single create
        // Stock management is handled via movements below, so we don't set quantityOnHand directly
        if (validated.quantity && validated.quantity > 0) {
            // Note: items table doesn't have quantityOnHand column
        }
        const [created] = await src.db.insert(src.items).values(newItem).returning();
        // Create stock movement if quantity provided
        if (validated.quantity && validated.quantity > 0) {
            await src.db.insert(src.stockMovements).values({
                organizationId,
                itemId: created.id,
                type: 'ADJUSTMENT',
                quantity: validated.quantity,
                referenceType: 'adjustment',
                referenceId: created.id,
                notes: 'Initial Stock',
                createdBy: user.id
            });
        }
        return c.json(created, 201);
    }
    catch (error) {
        if (error instanceof ZodError/* ZodError */.G) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Error creating item:', error);
        return c.json({ error: 'Failed to create item' }, 500);
    }
});
// GET /items/:id - Get single item
items_app.get('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const user = c.get('user');
        const organizationId = c.get('organizationId');
        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const [item] = await src.db
            .select()
            .from(src.items)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.items.id, id), (0,conditions.eq)(src.items.organizationId, organizationId)))
            .limit(1);
        if (!item) {
            return c.json({ error: 'Item not found' }, 404);
        }
        // TODO: Add current stock level from stock_movements
        return c.json(item);
    }
    catch (error) {
        console.error('Error fetching item:', error);
        return c.json({ error: 'Failed to fetch item' }, 500);
    }
});
// PATCH /items/:id - Update item
items_app.patch('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const user = c.get('user');
        const organizationId = c.get('organizationId');
        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const body = await c.req.json();
        const validated = updateItemSchema.parse(body);
        const [updated] = await src.db
            .update(src.items)
            .set({
            ...validated,
            updatedAt: new Date()
        })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.items.id, id), (0,conditions.eq)(src.items.organizationId, user.organizationId)))
            .returning();
        if (!updated) {
            return c.json({ error: 'Item not found' }, 404);
        }
        return c.json(updated);
    }
    catch (error) {
        if (error instanceof ZodError/* ZodError */.G) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Error updating item:', error);
        return c.json({ error: 'Failed to update item' }, 500);
    }
});
// DELETE /items/:id - Soft delete item
items_app.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const user = c.get('user');
        if (!user?.organizationId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const [deleted] = await src.db
            .update(src.items)
            .set({
            isActive: false,
            updatedAt: new Date()
        })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.items.id, id), (0,conditions.eq)(src.items.organizationId, user.organizationId)))
            .returning();
        if (!deleted) {
            return c.json({ error: 'Item not found' }, 404);
        }
        return c.json({ message: 'Item deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting item:', error);
        return c.json({ error: 'Failed to delete item' }, 500);
    }
});
/* harmony default export */ const items = (items_app);

;// CONCATENATED MODULE: ./src/routes/categories.ts





const categories_app = new dist.Hono();
// Validation Schemas
const createCategorySchema = types/* object */.Ik({
    name: types/* string */.Yj().min(1),
    description: types/* string */.Yj().optional(),
    parentId: types/* string */.Yj().uuid().optional()
});
const updateCategorySchema = createCategorySchema.partial();
// Health check
categories_app.get('/health', (c) => c.json({ status: 'ok', resource: 'categories' }));
// GET /categories - List all categories
categories_app.get('/', async (c) => {
    try {
        const user = c.get('user');
        const organizationId = c.get('organizationId');
        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const result = await src.db
            .select()
            .from(src.itemCategories)
            .where((0,conditions.eq)(src.itemCategories.organizationId, organizationId));
        return c.json(result);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        return c.json({ error: 'Failed to fetch categories' }, 500);
    }
});
// POST /categories - Create new category
categories_app.post('/', async (c) => {
    try {
        const user = c.get('user');
        const organizationId = c.get('organizationId');
        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const body = await c.req.json();
        const validated = createCategorySchema.parse(body);
        const newCategory = {
            organizationId: organizationId,
            isActive: true,
            name: validated.name,
            description: validated.description,
            parentId: validated.parentId
        };
        const [created] = await src.db.insert(src.itemCategories).values(newCategory).returning();
        return c.json(created, 201);
    }
    catch (error) {
        if (error instanceof ZodError/* ZodError */.G) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Error creating category:', error);
        return c.json({ error: 'Failed to create category' }, 500);
    }
});
// PATCH /categories/:id - Update category
categories_app.patch('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const user = c.get('user');
        const organizationId = c.get('organizationId');
        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const body = await c.req.json();
        const validated = updateCategorySchema.parse(body);
        const [updated] = await src.db
            .update(src.itemCategories)
            .set({
            ...validated,
            updatedAt: new Date()
        })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.itemCategories.id, id), (0,conditions.eq)(src.itemCategories.organizationId, organizationId)))
            .returning();
        if (!updated) {
            return c.json({ error: 'Category not found' }, 404);
        }
        return c.json(updated);
    }
    catch (error) {
        if (error instanceof ZodError/* ZodError */.G) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Error updating category:', error);
        return c.json({ error: 'Failed to update category' }, 500);
    }
});
// DELETE /categories/:id - Delete category
categories_app.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const user = c.get('user');
        const organizationId = c.get('organizationId');
        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const [deleted] = await src.db
            .update(src.itemCategories)
            .set({
            isActive: false,
            updatedAt: new Date()
        })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.itemCategories.id, id), (0,conditions.eq)(src.itemCategories.organizationId, organizationId)))
            .returning();
        if (!deleted) {
            return c.json({ error: 'Category not found' }, 404);
        }
        return c.json({ message: 'Category deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting category:', error);
        return c.json({ error: 'Failed to delete category' }, 500);
    }
});
/* harmony default export */ const categories = (categories_app);

;// CONCATENATED MODULE: ./src/routes/stock-movements.ts





const stock_movements_app = new dist.Hono();
// Validation Schema
const stockMovementSchema = types/* object */.Ik({
    itemId: types/* string */.Yj().uuid(),
    type: types/* enum */.k5([
        'GRN', 'SALE', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT',
        'RETURN', 'DAMAGE', 'THEFT'
    ]),
    quantity: types/* number */.ai().int(),
    notes: types/* string */.Yj().optional(),
    locationId: types/* string */.Yj().uuid().optional(),
    referenceType: types/* enum */.k5(['sale', 'purchase', 'adjustment']).optional(),
    referenceId: types/* string */.Yj().uuid().optional(),
});
// GET /stock-movements - List stock movements (filtered by item)
stock_movements_app.get('/', async (c) => {
    try {
        const { itemId } = c.req.query();
        const user = c.get('user');
        const organizationId = c.get('organizationId');
        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const filters = [(0,conditions.eq)(src.stockMovements.organizationId, organizationId)];
        if (itemId) {
            filters.push((0,conditions.eq)(src.stockMovements.itemId, itemId));
        }
        const query = src.db
            .select()
            .from(src.stockMovements)
            .where((0,conditions/* and */.Uo)(...filters))
            .orderBy((0,expressions_select/* desc */.i)(src.stockMovements.createdAt));
        const result = await query.limit(10000); // Temporary increase for MVP
        return c.json(result);
    }
    catch (error) {
        console.error('Error fetching stock movements:', error);
        return c.json({ error: 'Failed to fetch stock movements' }, 500);
    }
});
// POST /stock-movements - Create a new stock movement (adjustment)
stock_movements_app.post('/', async (c) => {
    try {
        const user = c.get('user');
        const organizationId = c.get('organizationId');
        if (!organizationId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const body = await c.req.json();
        const validated = stockMovementSchema.parse(body);
        // Verify item exists and belongs to organization
        const item = await src.db.query.items.findFirst({
            where: (0,conditions.eq)(src.items.id, validated.itemId),
        });
        if (!item || item.organizationId !== organizationId) {
            return c.json({ error: 'Item not found' }, 404);
        }
        // Create the movement
        const [movement] = await src.db.insert(src.stockMovements)
            .values({
            organizationId,
            itemId: validated.itemId,
            type: validated.type,
            quantity: validated.quantity,
            notes: validated.notes,
            locationId: validated.locationId,
            referenceType: validated.referenceType || 'adjustment',
            referenceId: validated.referenceId,
            createdBy: user.id
        })
            .returning();
        return c.json(movement, 201);
    }
    catch (error) {
        if (error instanceof ZodError/* ZodError */.G) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Error creating stock movement:', error);
        return c.json({ error: 'Failed to create stock movement' }, 500);
    }
});
// POST /stock-movements/transfer - Transfer stock between locations
stock_movements_app.post('/transfer', async (c) => {
    const user = c.get('user');
    const organizationId = c.get('organizationId');
    if (!organizationId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    try {
        const body = await c.req.json();
        const transferSchema = types/* object */.Ik({
            itemId: types/* string */.Yj().uuid(),
            fromLocationId: types/* string */.Yj().uuid(),
            toLocationId: types/* string */.Yj().uuid(),
            quantity: types/* number */.ai().int().positive(),
            notes: types/* string */.Yj().optional(),
        });
        const validated = transferSchema.parse(body);
        if (validated.fromLocationId === validated.toLocationId) {
            return c.json({ error: 'Cannot transfer to the same location' }, 400);
        }
        // Verify locations belong to organization
        const [fromLocation] = await src.db.select().from(src.locations).where((0,conditions/* and */.Uo)((0,conditions.eq)(src.locations.id, validated.fromLocationId), (0,conditions.eq)(src.locations.organizationId, organizationId)));
        const [toLocation] = await src.db.select().from(src.locations).where((0,conditions/* and */.Uo)((0,conditions.eq)(src.locations.id, validated.toLocationId), (0,conditions.eq)(src.locations.organizationId, organizationId)));
        if (!fromLocation || !toLocation) {
            return c.json({ error: 'Invalid location(s)' }, 400);
        }
        // Transactionally create movements
        await src.db.transaction(async (tx) => {
            // OUT from source
            await tx.insert(src.stockMovements).values({
                organizationId,
                itemId: validated.itemId,
                type: 'TRANSFER_OUT',
                quantity: -validated.quantity,
                locationId: validated.fromLocationId,
                referenceType: 'transfer',
                notes: validated.notes ? `Transfer Out: ${validated.notes}` : 'Stock Transfer',
                createdBy: user.id
            });
            // IN to destination
            await tx.insert(src.stockMovements).values({
                organizationId,
                itemId: validated.itemId,
                type: 'TRANSFER_IN',
                quantity: validated.quantity,
                locationId: validated.toLocationId,
                referenceType: 'transfer',
                notes: validated.notes ? `Transfer In: ${validated.notes}` : 'Stock Transfer',
                createdBy: user.id
            });
        });
        return c.json({ message: 'Transfer successful' }, 201);
    }
    catch (error) {
        if (error instanceof ZodError/* ZodError */.G) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Error processing transfer:', error);
        return c.json({ error: 'Failed to process stock transfer' }, 500);
    }
});
/* harmony default export */ const stock_movements = (stock_movements_app);

;// CONCATENATED MODULE: ./src/routes/sales.ts








const sales_app = new dist.Hono();
// Validation Schemas
const createSaleSchema = types/* object */.Ik({
    customerId: types/* string */.Yj().uuid().optional(),
    items: types/* array */.YO(types/* object */.Ik({
        itemId: types/* string */.Yj().uuid(),
        quantity: types/* number */.ai().positive(),
        unitPrice: types/* number */.ai().nonnegative(),
        discount: types/* number */.ai().nonnegative().optional().default(0),
        tax: types/* number */.ai().nonnegative().optional().default(0),
    })).min(1),
    payment: types/* object */.Ik({
        amount: types/* number */.ai().nonnegative(),
        method: types/* enum */.k5(['CASH', 'MOBILE_MONEY', 'CARD', 'BANK_TRANSFER', 'CREDIT']),
        reference: types/* string */.Yj().optional(),
        accountId: types/* string */.Yj().uuid().optional(),
    }).optional(),
    notes: types/* string */.Yj().optional(),
});
// GET /sales - List all sales
sales_app.get('/', async (c) => {
    try {
        const organizationId = c.get('organizationId');
        if (!organizationId)
            return c.json({ error: 'Unauthorized' }, 401);
        const result = await src.db.query.sales.findMany({
            where: (0,conditions.eq)(src.sales.organizationId, organizationId),
            with: {
                customer: true,
                items: {
                    with: {
                        item: true
                    }
                },
                payments: true,
            },
            orderBy: [(0,expressions_select/* desc */.i)(src.sales.createdAt)],
        });
        return c.json(result);
    }
    catch (error) {
        console.error('Error fetching sales:', error);
        return c.json({ error: 'Failed to fetch sales' }, 500);
    }
});
// GET /sales/payments - List all payments
sales_app.get('/payments', async (c) => {
    try {
        const organizationId = c.get('organizationId');
        if (!organizationId)
            return c.json({ error: 'Unauthorized' }, 401);
        const result = await src.db.query.payments.findMany({
            where: (0,conditions.eq)(src.payments.organizationId, organizationId),
            with: {
                sale: true,
                // customer: true, // payments table doesn't have customerId directly, it's via sale. But we can join if needed.
            },
            orderBy: [(0,expressions_select/* desc */.i)(src.payments.createdAt)],
        });
        return c.json(result);
    }
    catch (error) {
        console.error('Error fetching payments:', error);
        return c.json({ error: 'Failed to fetch payments' }, 500);
    }
});
// POST /sales/payments - Record a manual payment (can be unlinked or linked to invoice/quote)
sales_app.post('/payments', async (c) => {
    try {
        const organizationId = c.get('organizationId');
        const user = c.get('user');
        if (!organizationId)
            return c.json({ error: 'Unauthorized' }, 401);
        const body = await c.req.json();
        const paymentSchema = types/* object */.Ik({
            customerId: types/* string */.Yj().uuid().optional(),
            saleId: types/* string */.Yj().uuid().optional(),
            amount: types/* number */.ai().positive(),
            method: types/* enum */.k5(['CASH', 'MOBILE_MONEY', 'CARD', 'BANK_TRANSFER', 'CREDIT']),
            reference: types/* string */.Yj().optional(),
            accountId: types/* string */.Yj().uuid().optional(),
            notes: types/* string */.Yj().optional()
        });
        const validated = paymentSchema.parse(body);
        const result = await src.db.transaction(async (tx) => {
            // 1. Create Payment Record
            const [payment] = await tx.insert(src.payments).values({
                organizationId,
                saleId: validated.saleId,
                amount: String(validated.amount),
                method: validated.method,
                reference: validated.reference,
                notes: validated.notes,
                createdBy: user?.id,
            }).returning();
            // 2. Adjust Bank Account if provided
            if (validated.accountId) {
                await tx.insert(src.bankTransactions).values({
                    organizationId,
                    accountId: validated.accountId,
                    type: 'DEPOSIT',
                    amount: String(validated.amount),
                    transactionDate: new Date().toISOString(),
                    description: `Payment received ${validated.reference ? `(${validated.reference})` : ''}`,
                    referenceType: 'PAYMENT',
                    referenceId: payment.id,
                    createdBy: user?.id || ''
                });
                await tx
                    .update(src.bankAccounts)
                    .set({
                    currentBalance: (0,sql/* sql */.ll) `${src.bankAccounts.currentBalance} + ${validated.amount}`,
                    updatedAt: new Date()
                })
                    .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.bankAccounts.id, validated.accountId), (0,conditions.eq)(src.bankAccounts.organizationId, organizationId)));
            }
            // 3. If saleId is present, update the sale balance
            if (validated.saleId) {
                const sale = await tx.query.sales.findFirst({
                    where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.id, validated.saleId), (0,conditions.eq)(src.sales.organizationId, organizationId))
                });
                if (sale) {
                    const newPaidTotal = parseFloat(sale.paidAmount) + validated.amount;
                    await tx.update(src.sales).set({
                        paidAmount: String(newPaidTotal),
                        paymentStatus: newPaidTotal >= parseFloat(sale.totalAmount) ? 'PAID' : 'PARTIAL',
                        updatedAt: new Date()
                    }).where((0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.id, validated.saleId), (0,conditions.eq)(src.sales.organizationId, organizationId)));
                }
            }
            return payment;
        });
        return c.json(result, 201);
    }
    catch (error) {
        console.error('Record Payment Error:', error);
        return c.json({ error: error.message || 'Failed to record payment' }, 500);
    }
});
// POST /sales - Create a new sale
sales_app.post('/', async (c) => {
    try {
        const organizationId = c.get('organizationId');
        const user = c.get('user');
        if (!organizationId)
            return c.json({ error: 'Unauthorized' }, 401);
        const body = await c.req.json();
        const validated = createSaleSchema.parse(body);
        // Calculate totals
        const subtotal = validated.items.reduce((acc, item) => {
            return acc + (item.quantity * item.unitPrice);
        }, 0);
        const discountTotal = validated.items.reduce((acc, item) => {
            return acc + (item.discount || 0);
        }, 0);
        const taxTotal = validated.items.reduce((acc, item) => {
            return acc + (item.tax || 0);
        }, 0);
        const totalAmount = subtotal - discountTotal + taxTotal;
        const paidAmount = validated.payment ? validated.payment.amount : 0;
        // Validation: Credit Sale Logic
        let dueDate = null;
        if (paidAmount < totalAmount) {
            // 1. Customer is required for credit
            if (!validated.customerId) {
                return c.json({ error: 'Customer is required for credit sales' }, 400);
            }
            // 2. Check Credit Limit
            const customer = await src.db.query.stakeholders.findFirst({
                where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.stakeholders.id, validated.customerId), (0,conditions.eq)(src.stakeholders.organizationId, organizationId)),
            });
            if (!customer)
                return c.json({ error: 'Customer not found' }, 404);
            const creditLimit = customer.creditLimit ? parseFloat(customer.creditLimit) : 0;
            if (creditLimit > 0) {
                // Calculate current debt
                const currentDebtResult = await src.db
                    .select({
                    totalDebt: (0,sql/* sql */.ll) `sum(${src.sales.totalAmount} - ${src.sales.paidAmount})`
                })
                    .from(src.sales)
                    .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.customerId, validated.customerId), (0,conditions.eq)(src.sales.organizationId, organizationId), (0,sql/* sql */.ll) `${src.sales.paymentStatus} != 'PAID'`));
                const currentDebt = parseFloat(currentDebtResult[0]?.totalDebt || '0');
                const newDebt = totalAmount - paidAmount;
                if (currentDebt + newDebt > creditLimit) {
                    return c.json({ error: `Credit limit exceeded. Available credit: ${creditLimit - currentDebt}` }, 400);
                }
            }
            // 3. Set Due Date
            const paymentTerms = customer.paymentTerms || 0;
            const due = new Date();
            due.setDate(due.getDate() + paymentTerms);
            dueDate = due;
        }
        // Transactional insert
        const result = await src.db.transaction(async (tx) => {
            // 1. Create Sale
            const [newSale] = await tx.insert(src.sales).values({
                organizationId,
                customerId: validated.customerId,
                saleNumber: `SALE-${Date.now()}`, // Basic generator
                subtotal: String(subtotal),
                discountTotal: String(discountTotal),
                taxTotal: String(taxTotal),
                totalAmount: String(totalAmount),
                paidAmount: String(paidAmount),
                paymentStatus: paidAmount >= totalAmount ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'PENDING'),
                dueDate: dueDate,
                notes: validated.notes,
                createdBy: user?.id,
            }).returning();
            // 2. Create Sale Items and Adjust Stock
            for (const item of validated.items) {
                // Create Sale Item
                await tx.insert(src.saleItems).values({
                    saleId: newSale.id,
                    itemId: item.itemId,
                    quantity: String(item.quantity),
                    unitPrice: String(item.unitPrice),
                    discount: String(item.discount),
                    tax: String(item.tax),
                    total: String((item.quantity * item.unitPrice) - (item.discount || 0) + (item.tax || 0)),
                });
                // Create Stock Movement (Deduct Stock)
                await tx.insert(src.stockMovements).values({
                    organizationId,
                    itemId: item.itemId,
                    type: 'SALE',
                    quantity: -Math.abs(item.quantity), // Ensure negative
                    referenceType: 'sale',
                    referenceId: newSale.id,
                    notes: `Sold via ${newSale.saleNumber}`,
                    createdBy: user?.id || ''
                });
                // Decrease quantity on hand
                // Note: items table does not have quantityOnHand. Stock is managed by movements.
                // We update updatedAt to trigger any syncs
                await tx.update(src.items)
                    .set({
                    updatedAt: new Date()
                })
                    .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.items.id, item.itemId), (0,conditions.eq)(src.items.organizationId, organizationId)));
            }
            // 3. Create Payment and Bank Transaction if present
            if (validated.payment && validated.payment.amount > 0) {
                const [payment] = await tx.insert(src.payments).values({
                    organizationId,
                    saleId: newSale.id,
                    amount: String(validated.payment.amount),
                    method: validated.payment.method,
                    reference: validated.payment.reference,
                    createdBy: user?.id,
                }).returning();
                // Linked Bank Transaction (Deposit Revenue)
                if (validated.payment.accountId) {
                    // 1. Get Account
                    const [account] = await tx
                        .select()
                        .from(src.bankAccounts)
                        .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.bankAccounts.id, validated.payment.accountId), (0,conditions.eq)(src.bankAccounts.organizationId, organizationId)));
                    if (account) {
                        // 2. Create Deposit
                        await tx.insert(src.bankTransactions).values({
                            organizationId,
                            accountId: validated.payment.accountId,
                            type: 'DEPOSIT',
                            amount: String(validated.payment.amount),
                            transactionDate: new Date().toISOString(), // Use current date for immediate deposit
                            description: `Revenue from ${newSale.saleNumber}`,
                            referenceType: 'SALE',
                            referenceId: newSale.id,
                            createdBy: user?.id || ''
                        });
                        // 3. Update Balance
                        await tx
                            .update(src.bankAccounts)
                            .set({
                            currentBalance: (0,sql/* sql */.ll) `${src.bankAccounts.currentBalance} + ${validated.payment.amount}`,
                            updatedAt: new Date()
                        })
                            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.bankAccounts.id, validated.payment.accountId), (0,conditions.eq)(src.bankAccounts.organizationId, organizationId)));
                    }
                }
            }
            // 4. Update Loyalty Points for Customers
            if (validated.customerId) {
                const pointsEarned = totalAmount * 0.01; // 1% of total amount
                await tx
                    .update(src.stakeholders)
                    .set({
                    loyaltyPoints: (0,sql/* sql */.ll) `${src.stakeholders.loyaltyPoints} + ${pointsEarned}`,
                    updatedAt: new Date()
                })
                    .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.stakeholders.id, validated.customerId), (0,conditions.eq)(src.stakeholders.organizationId, organizationId)));
            }
            return newSale;
        });
        return c.json(result, 201);
    }
    catch (error) {
        if (error instanceof ZodError/* ZodError */.G) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Error creating sale:', error);
        return c.json({ error: 'Failed to create sale' }, 500);
    }
});
// GET /sales/:id - Get sale details
sales_app.get('/:id', async (c) => {
    try {
        const organizationId = c.get('organizationId');
        if (!organizationId)
            return c.json({ error: 'Unauthorized' }, 401);
        const saleId = c.req.param('id');
        const result = await src.db.query.sales.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.id, saleId), (0,conditions.eq)(src.sales.organizationId, organizationId)),
            with: {
                customer: true,
                items: {
                    with: {
                        item: true
                    }
                },
                payments: true,
            },
        });
        if (!result)
            return c.json({ error: 'Sale not found' }, 404);
        return c.json(result);
    }
    catch (error) {
        console.error('Error fetching sale:', error);
        return c.json({ error: 'Failed to fetch sale' }, 500);
    }
});
// POST /sales/:id/payments - Record a payment for a sale (Debt Collection)
sales_app.post('/:id/payments', async (c) => {
    try {
        const organizationId = c.get('organizationId');
        const user = c.get('user');
        if (!organizationId)
            return c.json({ error: 'Unauthorized' }, 401);
        const saleId = c.req.param('id');
        const body = await c.req.json();
        // Validation Schema for Payment
        const paymentSchema = types/* object */.Ik({
            amount: types/* number */.ai().positive(),
            method: types/* enum */.k5(['CASH', 'MOBILE_MONEY', 'CARD', 'BANK_TRANSFER', 'CREDIT']),
            reference: types/* string */.Yj().optional(),
            accountId: types/* string */.Yj().uuid().optional(),
            notes: types/* string */.Yj().optional()
        });
        const validated = paymentSchema.parse(body);
        // Transaction
        const updatedSale = await src.db.transaction(async (tx) => {
            // 1. Get Sale
            const sale = await tx.query.sales.findFirst({
                where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.id, saleId), (0,conditions.eq)(src.sales.organizationId, organizationId))
            });
            if (!sale)
                throw new Error('Sale not found');
            const currentPaid = parseFloat(sale.paidAmount);
            const total = parseFloat(sale.totalAmount);
            const newAmount = validated.amount;
            if (currentPaid + newAmount > total) {
                throw new Error(`Payment exceeds balance. Remaining: ${total - currentPaid}`);
            }
            // 2. Create Payment Record
            await tx.insert(src.payments).values({
                organizationId,
                saleId: sale.id,
                amount: String(newAmount),
                method: validated.method,
                reference: validated.reference,
                notes: validated.notes,
                createdBy: user?.id,
            });
            // 3. Create Bank Transaction (Deposit)
            if (validated.accountId) {
                const [account] = await tx
                    .select()
                    .from(src.bankAccounts)
                    .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.bankAccounts.id, validated.accountId), (0,conditions.eq)(src.bankAccounts.organizationId, organizationId)));
                if (account) {
                    await tx.insert(src.bankTransactions).values({
                        organizationId,
                        accountId: validated.accountId,
                        type: 'DEPOSIT',
                        amount: String(newAmount),
                        transactionDate: new Date().toISOString(),
                        description: `Payment for ${sale.saleNumber}`,
                        referenceType: 'SALE',
                        referenceId: sale.id,
                        createdBy: user?.id || ''
                    });
                    await tx
                        .update(src.bankAccounts)
                        .set({
                        currentBalance: (0,sql/* sql */.ll) `${src.bankAccounts.currentBalance} + ${newAmount}`,
                        updatedAt: new Date()
                    })
                        .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.bankAccounts.id, validated.accountId), (0,conditions.eq)(src.bankAccounts.organizationId, organizationId)));
                }
            }
            // 4. Update Sale Status
            const newPaidTotal = currentPaid + newAmount;
            const [updated] = await tx
                .update(src.sales)
                .set({
                paidAmount: String(newPaidTotal),
                paymentStatus: newPaidTotal >= total ? 'PAID' : 'PARTIAL',
                updatedAt: new Date()
            })
                .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.id, saleId), (0,conditions.eq)(src.sales.organizationId, organizationId)))
                .returning();
            return updated;
        });
        return c.json(updatedSale);
    }
    catch (error) {
        if (error instanceof ZodError/* ZodError */.G) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Error recording payment:', error);
        return c.json({ error: error.message || 'Failed to record payment' }, 400);
    }
});
/* harmony default export */ const sales = (sales_app);

// EXTERNAL MODULE: ../../node_modules/drizzle-orm/sql/functions/aggregate.js
var aggregate = __webpack_require__(4192);
;// CONCATENATED MODULE: ./src/routes/reports.ts




const reports_app = new dist.Hono();
// GET /reports/pnl
reports_app.get('/pnl', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    // Default to this month if not specified
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    // Ensure end date includes the full day
    end.setHours(23, 59, 59, 999);
    try {
        // 1. Calculate Revenue (Total Sales)
        // Note: We use 'paidAmount' for cash basis or 'totalAmount' for accrual. 
        // Standard P&L is usually Accrual (Revenue recognized when sale made).
        const [revenueResult] = await src.db
            .select({ total: (0,sql/* sql */.ll) `sum(${src.sales.totalAmount})` })
            .from(src.sales)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.organizationId, profile.organizationId), (0,conditions/* gte */.RO)(src.sales.createdAt, start), (0,conditions/* lte */.wJ)(src.sales.createdAt, end), (0,conditions.eq)(src.sales.status, 'COMPLETED') // Only completed sales
        ));
        const revenue = parseFloat(revenueResult?.total || '0');
        // 2. Calculate Expenses
        const [expensesResult] = await src.db
            .select({ total: (0,sql/* sql */.ll) `sum(${src.expenses.amount})` })
            .from(src.expenses)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.expenses.organizationId, profile.organizationId), (0,conditions/* gte */.RO)(src.expenses.expenseDate, start.toISOString().split('T')[0]), // expenseDate is the correct column
        (0,conditions/* lte */.wJ)(src.expenses.expenseDate, end.toISOString().split('T')[0])));
        const totalExpenses = parseFloat(expensesResult?.total || '0');
        // 3. Calculate COGS (Cost of Goods Sold)
        // Join saleItems with items to get costPrice
        // MVP: Using current item.costPrice * quantitySold
        const [cogsResult] = await src.db
            .select({
            total: (0,sql/* sql */.ll) `sum(${src.saleItems.quantity} * ${src.items.costPrice})`
        })
            .from(src.saleItems)
            .innerJoin(src.sales, (0,conditions.eq)(src.saleItems.saleId, src.sales.id))
            .innerJoin(src.items, (0,conditions.eq)(src.saleItems.itemId, src.items.id))
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.organizationId, profile.organizationId), (0,conditions/* gte */.RO)(src.sales.createdAt, start), (0,conditions/* lte */.wJ)(src.sales.createdAt, end), (0,conditions.eq)(src.sales.status, 'COMPLETED')));
        const cogs = parseFloat(cogsResult?.total || '0');
        // 4. Calculate Summary
        const grossProfit = revenue - cogs;
        const netProfit = grossProfit - totalExpenses;
        const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
        return c.json({
            period: { start, end },
            revenue,
            cogs,
            grossProfit,
            expenses: totalExpenses,
            netProfit,
            margin
        });
    }
    catch (error) {
        console.error('P&L Report Error:', error);
        return c.json({ error: 'Failed to generate report' }, 500);
    }
});
// GET /reports/dashboard — Dashboard summary stats
reports_app.get('/dashboard', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        // Total revenue (all time, completed sales)
        const [revenueResult] = await src.db
            .select({ total: (0,sql/* sql */.ll) `sum(${src.sales.totalAmount})` })
            .from(src.sales)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.organizationId, profile.organizationId), (0,conditions.eq)(src.sales.status, 'COMPLETED')));
        // Total number of orders
        const [orderCountResult] = await src.db
            .select({ count: (0,sql/* sql */.ll) `count(*)` })
            .from(src.sales)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.organizationId, profile.organizationId), (0,conditions.eq)(src.sales.status, 'COMPLETED')));
        // Today's revenue
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const [todayResult] = await src.db
            .select({ total: (0,sql/* sql */.ll) `sum(${src.sales.totalAmount})` })
            .from(src.sales)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.organizationId, profile.organizationId), (0,conditions.eq)(src.sales.status, 'COMPLETED'), (0,conditions/* gte */.RO)(src.sales.createdAt, todayStart)));
        // Pending Purchase Orders
        const [pendingOrdersResult] = await src.db
            .select({ count: (0,sql/* sql */.ll) `count(*)` })
            .from(src.purchaseOrders)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.purchaseOrders.organizationId, profile.organizationId), (0,conditions.or)((0,conditions.eq)(src.purchaseOrders.status, 'ISSUED'), (0,conditions.eq)(src.purchaseOrders.status, 'PARTIAL_RECEIVED'))));
        return c.json({
            totalRevenue: parseFloat(revenueResult?.total || '0'),
            totalOrders: parseInt(orderCountResult?.count || '0'),
            todayRevenue: parseFloat(todayResult?.total || '0'),
            pendingOrders: parseInt(pendingOrdersResult?.count || '0'),
        });
    }
    catch (error) {
        console.error('Dashboard Report Error:', error);
        return c.json({ error: 'Failed to generate dashboard report' }, 500);
    }
});
// GET /reports/sales-chart?range=7d|30d|90d — Daily revenue for chart
reports_app.get('/sales-chart', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    const range = c.req.query('range') || '7d';
    const days = range === '90d' ? 90 : range === '30d' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    try {
        const results = await src.db
            .select({
            date: (0,sql/* sql */.ll) `DATE(${src.sales.createdAt})`,
            revenue: (0,sql/* sql */.ll) `sum(${src.sales.totalAmount})`,
        })
            .from(src.sales)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.organizationId, profile.organizationId), (0,conditions.eq)(src.sales.status, 'COMPLETED'), (0,conditions/* gte */.RO)(src.sales.createdAt, startDate)))
            .groupBy((0,sql/* sql */.ll) `DATE(${src.sales.createdAt})`)
            .orderBy((0,sql/* sql */.ll) `DATE(${src.sales.createdAt})`);
        // Fill in days with zero revenue so the chart has no gaps
        const chartData = [];
        const revenueMap = new Map(results.map(r => [r.date, parseFloat(r.revenue || '0')]));
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            chartData.push({
                date: dateStr,
                revenue: revenueMap.get(dateStr) ?? 0,
            });
        }
        return c.json(chartData);
    }
    catch (error) {
        console.error('Sales Chart Error:', error);
        return c.json({ error: 'Failed to generate sales chart' }, 500);
    }
});
// GET /reports/top-products?limit=5 — Top selling products
reports_app.get('/top-products', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    const limit = parseInt(c.req.query('limit') || '5');
    try {
        const results = await src.db
            .select({
            itemId: src.saleItems.itemId,
            name: src.items.name,
            totalQuantity: (0,sql/* sql */.ll) `sum(${src.saleItems.quantity})`,
            totalRevenue: (0,sql/* sql */.ll) `sum(${src.saleItems.quantity} * ${src.saleItems.unitPrice})`,
        })
            .from(src.saleItems)
            .innerJoin(src.sales, (0,conditions.eq)(src.saleItems.saleId, src.sales.id))
            .innerJoin(src.items, (0,conditions.eq)(src.saleItems.itemId, src.items.id))
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.organizationId, profile.organizationId), (0,conditions.eq)(src.sales.status, 'COMPLETED')))
            .groupBy(src.saleItems.itemId, src.items.name)
            .orderBy((0,expressions_select/* desc */.i)((0,sql/* sql */.ll) `sum(${src.saleItems.quantity})`))
            .limit(limit);
        return c.json(results.map(r => ({
            itemId: r.itemId,
            name: r.name,
            totalQuantity: parseInt(r.totalQuantity || '0'),
            totalRevenue: parseFloat(r.totalRevenue || '0'),
        })));
    }
    catch (error) {
        console.error('Top Products Error:', error);
        return c.json({ error: 'Failed to generate top products report' }, 500);
    }
});
// GET /reports/inventory-valuation — Stock levels and valuation
reports_app.get('/inventory-valuation', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        // Get all active items with their stock levels from stock_movements
        const results = await src.db
            .select({
            id: src.items.id,
            name: src.items.name,
            sku: src.items.sku,
            costPrice: src.items.costPrice,
            sellingPrice: src.items.sellingPrice,
            reorderPoint: src.items.reorderPoint,
            stockLevel: (0,sql/* sql */.ll) `COALESCE(sum(${src.stockMovements.quantity}), 0)`,
        })
            .from(src.items)
            .leftJoin(src.stockMovements, (0,conditions.eq)(src.stockMovements.itemId, src.items.id))
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.items.organizationId, profile.organizationId), (0,conditions.eq)(src.items.isActive, true)))
            .groupBy(src.items.id, src.items.name, src.items.sku, src.items.costPrice, src.items.sellingPrice, src.items.reorderPoint)
            .orderBy((0,expressions_select/* desc */.i)((0,sql/* sql */.ll) `COALESCE(sum(${src.stockMovements.quantity}), 0)`));
        const valuation = results.map(r => {
            const stock = parseInt(r.stockLevel || '0');
            const cost = parseFloat(r.costPrice?.toString() || '0');
            return {
                id: r.id,
                name: r.name,
                sku: r.sku,
                costPrice: cost,
                sellingPrice: parseFloat(r.sellingPrice?.toString() || '0'),
                stockLevel: stock,
                reorderPoint: r.reorderPoint || 0,
                stockValue: stock * cost,
            };
        });
        const totalValue = valuation.reduce((sum, v) => sum + v.stockValue, 0);
        const lowStockCount = valuation.filter(v => v.reorderPoint > 0 && v.stockLevel <= v.reorderPoint).length;
        return c.json({
            items: valuation,
            summary: {
                totalValue,
                totalItems: valuation.length,
                lowStockCount,
            }
        });
    }
    catch (error) {
        console.error('Inventory Valuation Error:', error);
        return c.json({ error: 'Failed to generate inventory valuation' }, 500);
    }
});
// GET /reports/tax — VAT/GST Summary
reports_app.get('/tax', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    try {
        // 1. VAT Output (from Sales)
        const [salesTaxResult] = await src.db
            .select({ total: (0,sql/* sql */.ll) `sum(${src.sales.taxTotal})` })
            .from(src.sales)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.organizationId, profile.organizationId), (0,conditions/* gte */.RO)(src.sales.createdAt, start), (0,conditions/* lte */.wJ)(src.sales.createdAt, end), (0,conditions.eq)(src.sales.status, 'COMPLETED')));
        // 2. VAT Input (from Supplier Invoices/Bills)
        const [purchaseTaxResult] = await src.db
            .select({ total: (0,sql/* sql */.ll) `sum(${src.supplierInvoices.taxTotal})` })
            .from(src.supplierInvoices)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.supplierInvoices.organizationId, profile.organizationId), (0,conditions/* gte */.RO)(src.supplierInvoices.invoiceDate, start.toISOString().split('T')[0]), (0,conditions/* lte */.wJ)(src.supplierInvoices.invoiceDate, end.toISOString().split('T')[0]), (0,conditions.eq)(src.supplierInvoices.status, 'PAID') // Usually claimable on paid bills
        ));
        const vatOutput = parseFloat(salesTaxResult?.total || '0');
        const vatInput = parseFloat(purchaseTaxResult?.total || '0');
        const netTax = vatOutput - vatInput;
        return c.json({
            period: { start, end },
            vatOutput,
            vatInput,
            netTax,
            status: netTax >= 0 ? 'PAYABLE' : 'CLAIMABLE'
        });
    }
    catch (error) {
        console.error('Tax Report Error:', error);
        return c.json({ error: 'Failed to generate tax report' }, 500);
    }
});
// GET /reports/analytics/sales-trends?period=month|week — Advanced sales aggregation
reports_app.get('/analytics/sales-trends', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    const period = c.req.query('period') || 'month';
    const now = new Date();
    let startDate;
    if (period === 'week') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    }
    else {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }
    try {
        const results = await src.db
            .select({
            period: period === 'week' ? (0,sql/* sql */.ll) `TO_CHAR(${src.sales.createdAt}, 'Dy')` : (0,sql/* sql */.ll) `TO_CHAR(${src.sales.createdAt}, 'DD Mon')`,
            revenue: (0,sql/* sql */.ll) `sum(${src.sales.totalAmount})`,
            orders: (0,sql/* sql */.ll) `count(*)`,
        })
            .from(src.sales)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.organizationId, profile.organizationId), (0,conditions.eq)(src.sales.status, 'COMPLETED'), (0,conditions/* gte */.RO)(src.sales.createdAt, startDate)))
            .groupBy(period === 'week' ? (0,sql/* sql */.ll) `TO_CHAR(${src.sales.createdAt}, 'Dy')` : (0,sql/* sql */.ll) `TO_CHAR(${src.sales.createdAt}, 'DD Mon')`)
            .orderBy((0,aggregate/* min */.jk)(src.sales.createdAt));
        return c.json({ data: results });
    }
    catch (error) {
        console.error('Sales Trends Error:', error);
        return c.json({ error: 'Failed to generate sales trends' }, 500);
    }
});
// GET /reports/analytics/inventory-performance — Stock turnover & aging
reports_app.get('/analytics/inventory-performance', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        // Simple turnover calculation: Sales Quantity / Average Stock (MVP: Total Sales / Current Stock)
        const results = await src.db
            .select({
            itemId: src.items.id,
            name: src.items.name,
            sku: src.items.sku,
            totalSold: (0,sql/* sql */.ll) `COALESCE(SUM(CASE WHEN ${src.stockMovements.type} = 'SALE' THEN ABS(${src.stockMovements.quantity}) ELSE 0 END), 0)`,
            currentStock: (0,sql/* sql */.ll) `COALESCE(SUM(${src.stockMovements.quantity}), 0)`,
            lastMovement: (0,sql/* sql */.ll) `MAX(${src.stockMovements.createdAt})`,
        })
            .from(src.items)
            .leftJoin(src.stockMovements, (0,conditions.eq)(src.stockMovements.itemId, src.items.id))
            .where((0,conditions.eq)(src.items.organizationId, profile.organizationId))
            .groupBy(src.items.id, src.items.name, src.items.sku)
            .limit(10);
        const performance = results.map(r => {
            const sold = parseFloat(r.totalSold || '0');
            const stock = parseFloat(r.currentStock || '0');
            const daysSinceLastMove = r.lastMovement ? Math.floor((Date.now() - new Date(r.lastMovement).getTime()) / (1000 * 60 * 60 * 24)) : 365;
            return {
                ...r,
                turnoverRate: stock > 0 ? (sold / stock).toFixed(2) : '0',
                status: daysSinceLastMove > 90 ? 'STAGNANT' : daysSinceLastMove > 30 ? 'SLOW' : 'ACTIVE',
                daysSinceLastMove
            };
        });
        return c.json({ data: performance });
    }
    catch (error) {
        console.error('Inventory Performance Error:', error);
        return c.json({ error: 'Failed to generate inventory performance' }, 500);
    }
});
/* harmony default export */ const reports = (reports_app);

;// CONCATENATED MODULE: ./src/routes/locations.ts





const locations_app = new dist.Hono();
const locationSchema = types/* object */.Ik({
    name: types/* string */.Yj().min(1, 'Name is required'),
    type: types/* enum */.k5(['WAREHOUSE', 'STORE', 'OTHER']),
    address: types/* string */.Yj().optional(),
});
// GET /locations - List all locations
locations_app.get('/', async (c) => {
    const organizationId = c.get('organizationId');
    if (!organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const result = await src.db
            .select()
            .from(src.locations)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.locations.organizationId, organizationId), (0,conditions.eq)(src.locations.isActive, true)))
            .orderBy((0,expressions_select/* desc */.i)(src.locations.createdAt));
        return c.json(result);
    }
    catch (error) {
        console.error('Error fetching locations:', error);
        return c.json({ error: 'Failed to fetch locations' }, 500);
    }
});
// POST /locations - Create new location
locations_app.post('/', async (c) => {
    const organizationId = c.get('organizationId');
    if (!organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const body = await c.req.json();
        const validated = locationSchema.parse(body);
        const [newLocation] = await src.db
            .insert(src.locations)
            .values({
            ...validated,
            organizationId
        })
            .returning();
        return c.json(newLocation, 201);
    }
    catch (error) {
        if (error instanceof ZodError/* ZodError */.G) {
            return c.json({ error: error.flatten() }, 400);
        }
        console.error('Error creating location:', error);
        return c.json({ error: 'Failed to create location' }, 500);
    }
});
// PATCH /locations/:id - Update location
locations_app.patch('/:id', async (c) => {
    const organizationId = c.get('organizationId');
    const id = c.req.param('id');
    if (!organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const body = await c.req.json();
        const validated = locationSchema.partial().parse(body);
        const [updatedLocation] = await src.db
            .update(src.locations)
            .set(validated)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.locations.id, id), (0,conditions.eq)(src.locations.organizationId, organizationId)))
            .returning();
        if (!updatedLocation) {
            return c.json({ error: 'Location not found' }, 404);
        }
        return c.json(updatedLocation);
    }
    catch (error) {
        if (error instanceof ZodError/* ZodError */.G) {
            return c.json({ error: error.flatten() }, 400);
        }
        console.error('Error updating location:', error);
        return c.json({ error: 'Failed to update location' }, 500);
    }
});
// DELETE /locations/:id - Soft delete location
locations_app.delete('/:id', async (c) => {
    const organizationId = c.get('organizationId');
    const id = c.req.param('id');
    if (!organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const [deletedLocation] = await src.db
            .update(src.locations)
            .set({ isActive: false })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.locations.id, id), (0,conditions.eq)(src.locations.organizationId, organizationId)))
            .returning();
        if (!deletedLocation) {
            return c.json({ error: 'Location not found' }, 404);
        }
        return c.json({ message: 'Location deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting location:', error);
        return c.json({ error: 'Failed to delete location' }, 500);
    }
});
/* harmony default export */ const locations = (locations_app);

;// CONCATENATED MODULE: ./src/routes/purchases.ts




const purchases_app = new dist.Hono();
// GET /purchases/orders - List Purchase Orders
purchases_app.get('/orders', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const orders = await src.db.query.purchaseOrders.findMany({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.purchaseOrders.organizationId, profile.organizationId)),
            with: {
                supplier: true,
                lines: true
            },
            orderBy: [(0,expressions_select/* desc */.i)(src.purchaseOrders.createdAt)]
        });
        return c.json(orders);
    }
    catch (error) {
        console.error('List POs Error:', error);
        return c.json({ error: 'Failed to fetch purchase orders' }, 500);
    }
});
// GET /purchases/orders/:id - Get Single PO
purchases_app.get('/orders/:id', async (c) => {
    const profile = c.get('profile');
    const id = c.req.param('id');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const order = await src.db.query.purchaseOrders.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.purchaseOrders.id, id), (0,conditions.eq)(src.purchaseOrders.organizationId, profile.organizationId)),
            with: {
                supplier: true,
                lines: {
                    with: {
                        item: true
                    }
                },
                grns: true,
                invoices: true
            }
        });
        if (!order)
            return c.json({ error: 'Purchase Order not found' }, 404);
        return c.json(order);
    }
    catch (error) {
        return c.json({ error: 'Failed to fetch purchase order' }, 500);
    }
});
// POST /purchases/orders - Create PO
purchases_app.post('/orders', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json();
    const { supplierId, items: orderItems, notes, expectedDeliveryDate } = body;
    if (!supplierId || !orderItems || !Array.isArray(orderItems)) {
        return c.json({ error: 'Invalid data' }, 400);
    }
    try {
        // Generate PO Number
        const [countResult] = await src.db
            .select({ count: (0,aggregate/* count */.U9)() })
            .from(src.purchaseOrders)
            .where((0,conditions.eq)(src.purchaseOrders.organizationId, profile.organizationId));
        const nextNum = (countResult?.count || 0) + 1;
        const orderNumber = `PO-${new Date().getFullYear()}-${nextNum.toString().padStart(4, '0')}`;
        // Calculate totals
        let totalAmount = 0;
        const linesToInsert = [];
        for (const item of orderItems) {
            const lineTotal = Number(item.quantity) * Number(item.unitCost);
            totalAmount += lineTotal;
            linesToInsert.push({
                itemId: item.itemId,
                quantity: item.quantity,
                unitCost: item.unitCost,
                totalCost: lineTotal
            });
        }
        const result = await src.db.transaction(async (tx) => {
            const [newOrder] = await tx.insert(src.purchaseOrders).values({
                organizationId: profile.organizationId,
                supplierId,
                orderNumber,
                expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
                totalAmount: totalAmount.toString(),
                notes,
                status: 'DRAFT',
                createdBy: profile.id
            }).returning();
            if (linesToInsert.length > 0) {
                await tx.insert(src.purchaseOrderLines).values(linesToInsert.map(line => ({
                    ...line,
                    purchaseOrderId: newOrder.id,
                    totalCost: line.totalCost.toString(),
                    unitCost: line.unitCost.toString()
                })));
            }
            return newOrder;
        });
        return c.json(result, 201);
    }
    catch (error) {
        console.error('Create PO Error:', error);
        return c.json({ error: 'Failed to create purchase order' }, 500);
    }
});
// PATCH /purchases/orders/:id/status
purchases_app.patch('/orders/:id/status', async (c) => {
    const profile = c.get('profile');
    const id = c.req.param('id');
    const { status } = await c.req.json();
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        await src.db.update(src.purchaseOrders)
            .set({
            status,
            updatedAt: new Date(),
            ...(status === 'ISSUED' ? { issueDate: new Date().toISOString() } : {})
        })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.purchaseOrders.id, id), (0,conditions.eq)(src.purchaseOrders.organizationId, profile.organizationId)));
        return c.json({ success: true });
    }
    catch (error) {
        return c.json({ error: 'Failed to update status' }, 500);
    }
});
// POST /purchases/orders/:id/receive - Receive Stock (Create GRN)
purchases_app.post('/orders/:id/receive', async (c) => {
    const profile = c.get('profile');
    const id = c.req.param('id');
    const { items: receivedItems } = await c.req.json();
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    if (!receivedItems || !Array.isArray(receivedItems) || receivedItems.length === 0) {
        return c.json({ error: 'Invalid items data' }, 400);
    }
    try {
        await src.db.transaction(async (tx) => {
            // 1. Get PO
            const order = await tx.query.purchaseOrders.findFirst({
                where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.purchaseOrders.id, id), (0,conditions.eq)(src.purchaseOrders.organizationId, profile.organizationId)),
                with: { lines: true }
            });
            if (!order)
                throw new Error('Order not found');
            // 2. Create GRN Header
            const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const grnNumber = `GRN-${order.orderNumber.split('-').slice(1).join('-')}-${randomSuffix}`;
            const [grn] = await tx.insert(src.grns).values({
                organizationId: profile.organizationId,
                purchaseOrderId: id,
                supplierId: order.supplierId,
                grnNumber,
                status: 'VERIFIED',
                receivedBy: profile.id
            }).returning();
            // 3. Process Items
            for (const item of receivedItems) {
                const poLine = order.lines.find((l) => l.id === item.lineId);
                if (!poLine)
                    continue;
                const qty = Number(item.quantity);
                // Create GRN Line
                await tx.insert(src.grnLines).values({
                    grnId: grn.id,
                    purchaseOrderLineId: poLine.id,
                    itemId: poLine.itemId,
                    quantityReceived: qty
                });
                // Update PO Line Received Qty
                await tx.update(src.purchaseOrderLines)
                    .set({
                    receivedQuantity: (0,sql/* sql */.ll) `${src.purchaseOrderLines.receivedQuantity} + ${qty}`
                })
                    .where((0,conditions.eq)(src.purchaseOrderLines.id, poLine.id));
                // Create Stock Movement
                await tx.insert(src.stockMovements).values({
                    organizationId: profile.organizationId,
                    itemId: poLine.itemId,
                    type: 'GRN',
                    quantity: qty,
                    referenceType: 'purchase_order',
                    referenceId: order.id,
                    notes: `Received via ${grnNumber}`,
                    createdBy: profile.id
                });
                // Update Item Cost Price
                await tx.update(src.items)
                    .set({ costPrice: poLine.unitCost.toString() })
                    .where((0,conditions.eq)(src.items.id, poLine.itemId));
            }
            // 4. Update PO Status
            const updatedLines = await tx.query.purchaseOrderLines.findMany({
                where: (0,conditions.eq)(src.purchaseOrderLines.purchaseOrderId, id)
            });
            const allReceived = updatedLines.every((l) => l.receivedQuantity >= l.quantity);
            const newStatus = allReceived ? 'COMPLETED' : 'PARTIAL_RECEIVED';
            if (order.status !== newStatus && order.status !== 'COMPLETED') {
                await tx.update(src.purchaseOrders)
                    .set({ status: newStatus, updatedAt: new Date() })
                    .where((0,conditions.eq)(src.purchaseOrders.id, id));
            }
        });
        return c.json({ success: true, message: 'Stock received successfully' });
    }
    catch (error) {
        console.error('Receive Stock Error:', error);
        return c.json({ error: error.message || 'Failed to receive stock' }, 500);
    }
});
/* harmony default export */ const purchases = (purchases_app);

;// CONCATENATED MODULE: ./src/routes/finance.ts






const finance_app = new dist.Hono();
// Validation schemas
const createBillSchema = types/* object */.Ik({
    supplierId: types/* string */.Yj().uuid(),
    purchaseOrderId: types/* string */.Yj().uuid().optional(),
    grnId: types/* string */.Yj().uuid().optional(),
    invoiceNumber: types/* string */.Yj().min(1),
    invoiceDate: types/* string */.Yj(),
    dueDate: types/* string */.Yj().optional(),
    subtotal: types/* number */.ai().positive(),
    taxTotal: types/* number */.ai().min(0).default(0),
    totalAmount: types/* number */.ai().positive()
});
const createPaymentSchema = types/* object */.Ik({
    supplierInvoiceId: types/* string */.Yj().uuid(),
    supplierId: types/* string */.Yj().uuid(),
    amount: types/* number */.ai().positive(),
    paymentMethod: types/* enum */.k5(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MOBILE_MONEY', 'OTHER']),
    paymentDate: types/* string */.Yj(),
    reference: types/* string */.Yj().optional(),
    accountId: types/* string */.Yj().uuid().optional(),
    notes: types/* string */.Yj().optional()
});
// GET /finance/bills - List all bills
finance_app.get('/bills', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const bills = await src.db.query.supplierInvoices.findMany({
            where: (0,conditions.eq)(src.supplierInvoices.organizationId, profile.organizationId),
            with: {
                supplier: true,
                purchaseOrder: true,
                payments: true
            },
            orderBy: [(0,expressions_select/* desc */.i)(src.supplierInvoices.createdAt)]
        });
        return c.json(bills);
    }
    catch (error) {
        console.error('List Bills Error:', error);
        return c.json({ error: 'Failed to fetch bills' }, 500);
    }
});
// GET /finance/bills/:id - Get single bill
finance_app.get('/bills/:id', async (c) => {
    const profile = c.get('profile');
    const id = c.req.param('id');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const bill = await src.db.query.supplierInvoices.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.supplierInvoices.id, id), (0,conditions.eq)(src.supplierInvoices.organizationId, profile.organizationId)),
            with: {
                supplier: true,
                purchaseOrder: {
                    with: {
                        lines: {
                            with: { item: true }
                        }
                    }
                },
                grn: true,
                payments: true
            }
        });
        if (!bill)
            return c.json({ error: 'Bill not found' }, 404);
        return c.json(bill);
    }
    catch (error) {
        console.error('Fetch Bill Error:', error);
        return c.json({ error: 'Failed to fetch bill' }, 500);
    }
});
// POST /finance/bills - Create a new bill
finance_app.post('/bills', (0,cjs/* zValidator */.l)('json', createBillSchema), async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    const data = c.req.valid('json');
    // Verify PO belongs to organization if provided
    if (data.purchaseOrderId) {
        const po = await src.db.query.purchaseOrders.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.purchaseOrders.id, data.purchaseOrderId), (0,conditions.eq)(src.purchaseOrders.organizationId, profile.organizationId))
        });
        if (!po)
            return c.json({ error: 'Purchase Order not found' }, 404);
    }
    try {
        const [newBill] = await src.db.insert(src.supplierInvoices).values({
            organizationId: profile.organizationId,
            supplierId: data.supplierId,
            purchaseOrderId: data.purchaseOrderId || null,
            grnId: data.grnId || null,
            invoiceNumber: data.invoiceNumber,
            invoiceDate: data.invoiceDate,
            dueDate: data.dueDate || null,
            status: 'PENDING',
            subtotal: data.subtotal.toString(),
            taxTotal: data.taxTotal.toString(),
            totalAmount: data.totalAmount.toString(),
            paidAmount: '0'
        }).returning();
        return c.json(newBill, 201);
    }
    catch (error) {
        console.error('Create Bill Error:', error);
        return c.json({ error: 'Failed to create bill' }, 500);
    }
});
// POST /finance/bills/:id/payments - Record a payment against a bill
finance_app.post('/bills/:id/payments', (0,cjs/* zValidator */.l)('json', createPaymentSchema), async (c) => {
    const profile = c.get('profile');
    const billId = c.req.param('id');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    const data = c.req.valid('json');
    try {
        const result = await src.db.transaction(async (tx) => {
            // Get the bill
            const bill = await tx.query.supplierInvoices.findFirst({
                where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.supplierInvoices.id, billId), (0,conditions.eq)(src.supplierInvoices.organizationId, profile.organizationId))
            });
            if (!bill)
                throw new Error('Bill not found');
            // Create the payment
            const [payment] = await tx.insert(src.purchasePayments).values({
                organizationId: profile.organizationId,
                supplierInvoiceId: billId,
                supplierId: data.supplierId,
                amount: data.amount.toString(),
                paymentMethod: data.paymentMethod,
                paymentDate: data.paymentDate,
                reference: data.reference || null,
                notes: data.notes || null,
                createdBy: profile.id
            }).returning();
            // Linked Bank Transaction (if accountId provided)
            if (data.accountId) {
                // 1. Get Account to check/update
                const [account] = await tx
                    .select()
                    .from(src.bankAccounts)
                    .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.bankAccounts.id, data.accountId), (0,conditions.eq)(src.bankAccounts.organizationId, profile.organizationId)));
                if (!account)
                    throw new Error('Selected bank account not found');
                // Allow overdraft? For now, let's enforce positive balance logic if needed, but standard accounting usually allows negative.
                // However, preventing accidental negative cash is good. 
                // Let's NOT throw error for insufficient funds here to allow flexibility, 
                // or maybe we should? Let's check balance but proceed (warn?). 
                // Actually, let's block if it's CASH type and insufficient?
                // For simplicity in this iteration, we allow it but log it/users handle it.
                // 2. Create Bank Transaction (Withdrawal)
                await tx.insert(src.bankTransactions).values({
                    organizationId: profile.organizationId,
                    accountId: data.accountId,
                    type: 'WITHDRAWAL',
                    amount: data.amount.toString(),
                    transactionDate: data.paymentDate, // Use payment date
                    description: `Payment for Bill #${bill.invoiceNumber}`,
                    referenceType: 'PURCHASE', // Using PURCHASE for payments against bills
                    referenceId: payment.id,
                    createdBy: profile.id
                });
                // 3. Update Account Balance
                await tx
                    .update(src.bankAccounts)
                    .set({
                    currentBalance: (0,sql/* sql */.ll) `${src.bankAccounts.currentBalance} - ${data.amount}`,
                    updatedAt: new Date()
                })
                    .where((0,conditions.eq)(src.bankAccounts.id, data.accountId));
            }
            // Update bill paid amount
            const currentPaid = parseFloat(bill.paidAmount || '0');
            const newPaidAmount = currentPaid + data.amount;
            const totalAmount = parseFloat(bill.totalAmount);
            let newStatus = 'PARTIAL_PAID';
            if (newPaidAmount >= totalAmount) {
                newStatus = 'PAID';
            }
            await tx.update(src.supplierInvoices)
                .set({
                paidAmount: newPaidAmount.toString(),
                status: newStatus,
                updatedAt: new Date()
            })
                .where((0,conditions.eq)(src.supplierInvoices.id, billId));
            return payment;
        });
        return c.json(result, 201);
    }
    catch (error) {
        console.error('Create Payment Error:', error);
        return c.json({ error: error.message || 'Failed to record payment' }, 500);
    }
});
// GET /finance/payments - List all payments
finance_app.get('/payments', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const payments = await src.db.query.purchasePayments.findMany({
            where: (0,conditions.eq)(src.purchasePayments.organizationId, profile.organizationId),
            with: {
                supplierInvoice: true,
                supplier: true
            },
            orderBy: [(0,expressions_select/* desc */.i)(src.purchasePayments.createdAt)]
        });
        return c.json(payments);
    }
    catch (error) {
        console.error('List Payments Error:', error);
        return c.json({ error: 'Failed to fetch payments' }, 500);
    }
});
/* harmony default export */ const finance = (finance_app);

;// CONCATENATED MODULE: ./src/routes/expenses.ts






const expenses_app = new dist.Hono();
// Validation schemas
const expenses_createCategorySchema = types/* object */.Ik({
    name: types/* string */.Yj().min(1),
    type: types/* enum */.k5(['OPERATING', 'ADMINISTRATIVE', 'MARKETING', 'PAYROLL', 'UTILITIES', 'RENT', 'OTHER']).default('OTHER'),
    description: types/* string */.Yj().optional()
});
const createExpenseSchema = types/* object */.Ik({
    categoryId: types/* string */.Yj().uuid().optional(),
    description: types/* string */.Yj().min(1),
    amount: types/* number */.ai().positive(),
    expenseDate: types/* string */.Yj(),
    reference: types/* string */.Yj().optional(),
    paymentMethod: types/* string */.Yj().optional(),
    notes: types/* string */.Yj().optional()
});
// GET /expenses/categories - List expense categories
expenses_app.get('/categories', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const categories = await src.db.query.expenseCategories.findMany({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.expenseCategories.organizationId, profile.organizationId), (0,conditions.eq)(src.expenseCategories.isActive, true))
        });
        return c.json(categories);
    }
    catch (error) {
        console.error('List Expense Categories Error:', error);
        return c.json({ error: 'Failed to fetch categories' }, 500);
    }
});
// POST /expenses/categories - Create expense category
expenses_app.post('/categories', (0,cjs/* zValidator */.l)('json', expenses_createCategorySchema), async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    const data = c.req.valid('json');
    try {
        const [category] = await src.db.insert(src.expenseCategories).values({
            organizationId: profile.organizationId,
            name: data.name,
            type: data.type,
            description: data.description || null
        }).returning();
        return c.json(category, 201);
    }
    catch (error) {
        console.error('Create Expense Category Error:', error);
        return c.json({ error: 'Failed to create category' }, 500);
    }
});
// GET /expenses - List all expenses
expenses_app.get('/', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const expensesList = await src.db.query.expenses.findMany({
            where: (0,conditions.eq)(src.expenses.organizationId, profile.organizationId),
            with: {
                category: true
            },
            orderBy: [(0,expressions_select/* desc */.i)(src.expenses.expenseDate)]
        });
        return c.json(expensesList);
    }
    catch (error) {
        console.error('List Expenses Error:', error);
        return c.json({ error: 'Failed to fetch expenses' }, 500);
    }
});
// GET /expenses/summary - Get expense summary
expenses_app.get('/summary', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        // Total by category
        const byCategory = await src.db
            .select({
            categoryName: src.expenseCategories.name,
            total: (0,sql/* sql */.ll) `sum(${src.expenses.amount})`
        })
            .from(src.expenses)
            .leftJoin(src.expenseCategories, (0,conditions.eq)(src.expenses.categoryId, src.expenseCategories.id))
            .where((0,conditions.eq)(src.expenses.organizationId, profile.organizationId))
            .groupBy(src.expenseCategories.name);
        // Total this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const [monthlyTotal] = await src.db
            .select({
            total: (0,sql/* sql */.ll) `sum(${src.expenses.amount})`
        })
            .from(src.expenses)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.expenses.organizationId, profile.organizationId), (0,sql/* sql */.ll) `${src.expenses.expenseDate} >= ${startOfMonth}`));
        return c.json({
            byCategory,
            monthlyTotal: monthlyTotal?.total || '0'
        });
    }
    catch (error) {
        console.error('Expense Summary Error:', error);
        return c.json({ error: 'Failed to get summary' }, 500);
    }
});
// POST /expenses - Create expense
expenses_app.post('/', (0,cjs/* zValidator */.l)('json', createExpenseSchema), async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    const data = c.req.valid('json');
    // Verify category if provided
    if (data.categoryId) {
        const category = await src.db.query.expenseCategories.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.expenseCategories.id, data.categoryId), (0,conditions.eq)(src.expenseCategories.organizationId, profile.organizationId))
        });
        if (!category && data.categoryId)
            return c.json({ error: 'Category not found' }, 404);
    }
    try {
        const [expense] = await src.db.insert(src.expenses).values({
            organizationId: profile.organizationId,
            categoryId: data.categoryId || null,
            description: data.description,
            amount: data.amount.toString(),
            expenseDate: data.expenseDate,
            reference: data.reference || null,
            paymentMethod: data.paymentMethod || null,
            notes: data.notes || null,
            createdBy: profile.id
        }).returning();
        return c.json(expense, 201);
    }
    catch (error) {
        console.error('Create Expense Error:', error);
        return c.json({ error: 'Failed to create expense' }, 500);
    }
});
// DELETE /expenses/:id - Delete expense
expenses_app.delete('/:id', async (c) => {
    const profile = c.get('profile');
    const id = c.req.param('id');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        await src.db.delete(src.expenses).where((0,conditions/* and */.Uo)((0,conditions.eq)(src.expenses.id, id), (0,conditions.eq)(src.expenses.organizationId, profile.organizationId)));
        return c.json({ success: true });
    }
    catch (error) {
        console.error('Delete Expense Error:', error);
        return c.json({ error: 'Failed to delete expense' }, 500);
    }
});
/* harmony default export */ const expenses = (expenses_app);

;// CONCATENATED MODULE: ./src/routes/banking.ts






const banking_app = new dist.Hono();
// Validation schemas
const createAccountSchema = types/* object */.Ik({
    name: types/* string */.Yj().min(1),
    type: types/* enum */.k5(['CASH', 'BANK', 'MOBILE_MONEY']),
    accountNumber: types/* string */.Yj().optional(),
    bankName: types/* string */.Yj().optional(),
    currency: types/* string */.Yj().default('TZS'),
    initialBalance: types/* number */.ai().default(0)
});
const transferSchema = types/* object */.Ik({
    fromAccountId: types/* string */.Yj().uuid(),
    toAccountId: types/* string */.Yj().uuid(),
    amount: types/* number */.ai().positive(),
    date: types/* string */.Yj(),
    description: types/* string */.Yj().optional()
});
const adjustSchema = types/* object */.Ik({
    accountId: types/* string */.Yj().uuid(),
    type: types/* enum */.k5(['DEPOSIT', 'WITHDRAWAL']),
    amount: types/* number */.ai().positive(),
    date: types/* string */.Yj(),
    description: types/* string */.Yj().optional()
});
// GET /banking/accounts - List all accounts
banking_app.get('/accounts', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const accounts = await src.db.query.bankAccounts.findMany({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.bankAccounts.organizationId, profile.organizationId), (0,conditions.eq)(src.bankAccounts.isActive, true)),
            orderBy: [(0,expressions_select/* desc */.i)(src.bankAccounts.createdAt)]
        });
        return c.json(accounts);
    }
    catch (error) {
        console.error('List Accounts Error:', error);
        return c.json({ error: 'Failed to fetch accounts' }, 500);
    }
});
// POST /banking/accounts - Create new account
banking_app.post('/accounts', (0,cjs/* zValidator */.l)('json', createAccountSchema), async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    const data = c.req.valid('json');
    try {
        const [account] = await src.db.insert(src.bankAccounts).values({
            organizationId: profile.organizationId,
            name: data.name,
            type: data.type,
            accountNumber: data.accountNumber,
            bankName: data.bankName,
            currency: data.currency,
            currentBalance: data.initialBalance.toString()
        }).returning();
        // If initial balance > 0, create an opening balance transaction
        if (data.initialBalance > 0) {
            await src.db.insert(src.bankTransactions).values({
                organizationId: profile.organizationId,
                accountId: account.id,
                type: 'DEPOSIT',
                amount: data.initialBalance.toString(),
                description: 'Opening Balance',
                referenceType: 'ADJUSTMENT',
                createdBy: profile.id
            });
        }
        return c.json(account, 201);
    }
    catch (error) {
        console.error('Create Account Error:', error);
        return c.json({ error: 'Failed to create account' }, 500);
    }
});
// GET /banking/accounts/:id/transactions - Get transaction history
banking_app.get('/accounts/:id/transactions', async (c) => {
    const profile = c.get('profile');
    const accountId = c.req.param('id');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const transactions = await src.db.query.bankTransactions.findMany({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.bankTransactions.organizationId, profile.organizationId), (0,conditions.eq)(src.bankTransactions.accountId, accountId)),
            orderBy: [(0,expressions_select/* desc */.i)(src.bankTransactions.transactionDate), (0,expressions_select/* desc */.i)(src.bankTransactions.createdAt)],
            limit: 100
        });
        return c.json(transactions);
    }
    catch (error) {
        console.error('List Transactions Error:', error);
        return c.json({ error: 'Failed to fetch transactions' }, 500);
    }
});
// POST /banking/transfer - Transfer money between accounts
banking_app.post('/transfer', (0,cjs/* zValidator */.l)('json', transferSchema), async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    const data = c.req.valid('json');
    // Verify accounts belong to organization
    const [sourceAccount] = await src.db.select().from(src.bankAccounts).where((0,conditions/* and */.Uo)((0,conditions.eq)(src.bankAccounts.id, data.fromAccountId), (0,conditions.eq)(src.bankAccounts.organizationId, profile.organizationId)));
    const [targetAccount] = await src.db.select().from(src.bankAccounts).where((0,conditions/* and */.Uo)((0,conditions.eq)(src.bankAccounts.id, data.toAccountId), (0,conditions.eq)(src.bankAccounts.organizationId, profile.organizationId)));
    if (!sourceAccount || !targetAccount) {
        return c.json({ error: 'Invalid account(s)' }, 400);
    }
    try {
        await src.db.transaction(async (tx) => {
            // 1. Get Source Account
            const [sourceAccount] = await tx
                .select()
                .from(src.bankAccounts)
                .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.bankAccounts.id, data.fromAccountId), (0,conditions.eq)(src.bankAccounts.organizationId, profile.organizationId)));
            if (!sourceAccount)
                throw new Error('Source account not found');
            if (parseFloat(sourceAccount.currentBalance) < data.amount) {
                throw new Error('Insufficient funds');
            }
            // 2. Get Target Account
            const [targetAccount] = await tx
                .select()
                .from(src.bankAccounts)
                .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.bankAccounts.id, data.toAccountId), (0,conditions.eq)(src.bankAccounts.organizationId, profile.organizationId)));
            if (!targetAccount)
                throw new Error('Target account not found');
            const transferId = crypto.randomUUID();
            // 3. Create Withdrawal Transaction
            await tx.insert(src.bankTransactions).values({
                organizationId: profile.organizationId,
                accountId: data.fromAccountId,
                type: 'WITHDRAWAL',
                amount: data.amount.toString(),
                transactionDate: data.date,
                description: `Transfer to ${targetAccount.name}` + (data.description ? ` - ${data.description}` : ''),
                referenceType: 'TRANSFER',
                transferId: transferId,
                createdBy: profile.id
            });
            // 4. Update Source Balance
            await tx
                .update(src.bankAccounts)
                .set({
                currentBalance: (0,sql/* sql */.ll) `${src.bankAccounts.currentBalance} - ${data.amount}`,
                updatedAt: new Date()
            })
                .where((0,conditions.eq)(src.bankAccounts.id, data.fromAccountId));
            // 5. Create Deposit Transaction
            await tx.insert(src.bankTransactions).values({
                organizationId: profile.organizationId,
                accountId: data.toAccountId,
                type: 'DEPOSIT',
                amount: data.amount.toString(),
                transactionDate: data.date,
                description: `Transfer from ${sourceAccount.name}` + (data.description ? ` - ${data.description}` : ''),
                referenceType: 'TRANSFER',
                transferId: transferId,
                createdBy: profile.id
            });
            // 6. Update Target Balance
            await tx
                .update(src.bankAccounts)
                .set({
                currentBalance: (0,sql/* sql */.ll) `${src.bankAccounts.currentBalance} + ${data.amount}`,
                updatedAt: new Date()
            })
                .where((0,conditions.eq)(src.bankAccounts.id, data.toAccountId));
        });
        return c.json({ success: true });
    }
    catch (error) {
        console.error('Transfer Error:', error);
        return c.json({ error: error.message || 'Failed to process transfer' }, 400); // Bad Request for insufficient funds
    }
});
// POST /banking/adjust - Manual adjustment
banking_app.post('/adjust', (0,cjs/* zValidator */.l)('json', adjustSchema), async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    const data = c.req.valid('json');
    try {
        await src.db.transaction(async (tx) => {
            const [account] = await tx
                .select()
                .from(src.bankAccounts)
                .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.bankAccounts.id, data.accountId), (0,conditions.eq)(src.bankAccounts.organizationId, profile.organizationId)));
            if (!account)
                throw new Error('Account not found');
            // Validation: Cannot withdraw more than balance
            if (data.type === 'WITHDRAWAL' && parseFloat(account.currentBalance) < data.amount) {
                throw new Error('Insufficient funds');
            }
            // Create Transaction
            await tx.insert(src.bankTransactions).values({
                organizationId: profile.organizationId,
                accountId: data.accountId,
                type: data.type,
                amount: data.amount.toString(),
                transactionDate: data.date,
                description: data.description || 'Manual Adjustment',
                referenceType: 'ADJUSTMENT',
                createdBy: profile.id
            });
            // Update Balance
            const balanceChange = data.type === 'DEPOSIT' ? data.amount : -data.amount;
            await tx
                .update(src.bankAccounts)
                .set({
                currentBalance: (0,sql/* sql */.ll) `${src.bankAccounts.currentBalance} + ${balanceChange}`,
                updatedAt: new Date()
            })
                .where((0,conditions.eq)(src.bankAccounts.id, data.accountId));
        });
        return c.json({ success: true });
    }
    catch (error) {
        console.error('Adjustment Error:', error);
        return c.json({ error: error.message || 'Failed to process adjustment' }, 400);
    }
});
/* harmony default export */ const banking = (banking_app);

;// CONCATENATED MODULE: ./src/routes/returns.ts







const returns_app = new dist.Hono();
// Validation Schemas
const createReturnSchema = types/* object */.Ik({
    saleId: types/* string */.Yj().uuid(),
    items: types/* array */.YO(types/* object */.Ik({
        itemId: types/* string */.Yj().uuid(),
        quantity: types/* number */.ai().int().positive(),
        condition: types/* enum */.k5(['GOOD', 'DAMAGED', 'EXPIRED', 'OTHER']),
        reason: types/* string */.Yj().optional(),
        restock: types/* boolean */.zM().default(true)
    })).min(1),
    reason: types/* string */.Yj().optional(),
    notes: types/* string */.Yj().optional()
});
// GET /returns - List all returns
returns_app.get('/', async (c) => {
    try {
        const organizationId = c.get('organizationId');
        if (!organizationId)
            return c.json({ error: 'Unauthorized' }, 401);
        const result = await src.db.query.returns.findMany({
            where: (0,conditions.eq)(src.returns.organizationId, organizationId),
            with: {
                customer: true,
                sale: true,
                items: {
                    with: {
                        item: true
                    }
                }
            },
            orderBy: [(0,expressions_select/* desc */.i)(src.returns.createdAt)],
        });
        return c.json(result);
    }
    catch (error) {
        console.error('Error fetching returns:', error);
        return c.json({ error: 'Failed to fetch returns' }, 500);
    }
});
// GET /returns/:id - Get return details
returns_app.get('/:id', async (c) => {
    try {
        const organizationId = c.get('organizationId');
        if (!organizationId)
            return c.json({ error: 'Unauthorized' }, 401);
        const returnId = c.req.param('id');
        const result = await src.db.query.returns.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.returns.id, returnId), (0,conditions.eq)(src.returns.organizationId, organizationId)),
            with: {
                customer: true,
                sale: true,
                items: {
                    with: {
                        item: true
                    }
                }
            },
        });
        if (!result)
            return c.json({ error: 'Return not found' }, 404);
        return c.json(result);
    }
    catch (error) {
        console.error('Error fetching return:', error);
        return c.json({ error: 'Failed to fetch return' }, 500);
    }
});
// POST /returns - Create a new return request
returns_app.post('/', async (c) => {
    try {
        const organizationId = c.get('organizationId');
        const user = c.get('user');
        if (!organizationId)
            return c.json({ error: 'Unauthorized' }, 401);
        const body = await c.req.json();
        const validated = createReturnSchema.parse(body);
        // 1. Verify Sale exists and belongs to org
        const sale = await src.db.query.sales.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.id, validated.saleId), (0,conditions.eq)(src.sales.organizationId, organizationId)),
            with: {
                items: true
            }
        });
        if (!sale)
            return c.json({ error: 'Sale not found' }, 404);
        // 2. Transaction
        const result = await src.db.transaction(async (tx) => {
            let totalRefundAmount = 0;
            const returnItemsData = [];
            // Validate items against sale
            for (const returnItem of validated.items) {
                const soldItem = sale.items.find((si) => si.itemId === returnItem.itemId);
                if (!soldItem) {
                    throw new Error(`Item ${returnItem.itemId} was not part of this sale`);
                }
                if (Number(returnItem.quantity) > Number(soldItem.quantity)) {
                    throw new Error(`Cannot return more than sold quantity for item ${soldItem.itemId}`);
                }
                // Calculate refund amount for this item
                const unitPrice = Number(soldItem.unitPrice);
                // Pro-rated discount? For simplicity, we assume unit price - (discount / qty) if discount was per item?
                // The saleItems table has 'discount' as total discount for the line.
                // unitPrice is gross.
                // net unit price = (total line amount) / quantity
                const netTotal = Number(soldItem.total);
                const soldQty = Number(soldItem.quantity);
                const effectiveUnitPrice = netTotal / soldQty;
                const itemTotal = effectiveUnitPrice * returnItem.quantity;
                totalRefundAmount += itemTotal;
                returnItemsData.push({
                    itemId: returnItem.itemId,
                    quantity: returnItem.quantity,
                    unitPrice: String(effectiveUnitPrice), // Track what we are refunding per unit
                    total: String(itemTotal),
                    condition: returnItem.condition,
                    restock: returnItem.restock,
                    reason: returnItem.reason
                });
            }
            // 3. Create Return Record
            const [newReturn] = await tx.insert(src.returns).values({
                organizationId,
                saleId: sale.id,
                customerId: sale.customerId, // Inherit from sale
                returnNumber: `RET-${Date.now()}`,
                status: 'APPROVED', // Auto-approve for now (MVP), or 'PENDING' if workflow needed
                refundStatus: 'PENDING',
                totalAmount: String(totalRefundAmount),
                reason: validated.reason,
                notes: validated.notes,
                createdBy: user?.id,
            }).returning();
            // 4. Create Return Items
            for (const item of returnItemsData) {
                await tx.insert(src.returnItems).values({
                    returnId: newReturn.id,
                    ...item,
                    quantity: item.quantity,
                    // ensure types match schema expectations (integer vs string for decimals)
                });
                // 5. Inventory Adjustment (If Approved & Restock)
                // Since we auto-approve in MVP:
                if (item.restock) {
                    await tx.insert(src.stockMovements).values({
                        organizationId,
                        itemId: item.itemId,
                        type: 'RETURN',
                        quantity: Math.abs(item.quantity), // Add to stock
                        referenceType: 'return',
                        referenceId: newReturn.id,
                        notes: `Return ${newReturn.returnNumber}`,
                        createdBy: user?.id || ''
                    });
                    // Trigger sync
                    await tx.update(src.items)
                        .set({ updatedAt: new Date() })
                        .where((0,conditions.eq)(src.items.id, item.itemId));
                }
            }
            // 6. Update Sale Status
            await tx.update(src.sales)
                .set({ status: 'RETURNED' }) // Or 'PARTIALLY_RETURNED' if we had that status
                .where((0,conditions.eq)(src.sales.id, sale.id));
            return newReturn;
        });
        return c.json(result, 201);
    }
    catch (error) {
        if (error instanceof ZodError/* ZodError */.G) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Error creating return:', error);
        return c.json({ error: error.message || 'Failed to create return' }, 400);
    }
});
/* harmony default export */ const returns = (returns_app);

;// CONCATENATED MODULE: ./src/routes/projects.ts






const projects_app = new dist.Hono();
const createProjectSchema = types/* object */.Ik({
    name: types/* string */.Yj().min(2).max(255),
    description: types/* string */.Yj().optional(),
    status: types/* enum */.k5(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).default('ACTIVE'),
    startDate: types/* string */.Yj().optional(),
    endDate: types/* string */.Yj().optional(),
});
const createTaskSchema = types/* object */.Ik({
    title: types/* string */.Yj().min(2).max(255),
    description: types/* string */.Yj().optional(),
    status: types/* string */.Yj().default('PENDING'),
    dueDate: types/* string */.Yj().optional(),
    assignedTo: types/* string */.Yj().uuid().optional(),
});
// List Projects
projects_app.get('/', async (c) => {
    const orgId = c.get('organizationId');
    if (!orgId)
        return c.json({ error: 'Unauthorized' }, 401);
    const result = await src.db.query.projects.findMany({
        where: (0,conditions.eq)(src.projects.organizationId, orgId),
        with: {
            tasks: {
                with: {
                    assignee: true
                }
            }
        },
        orderBy: (projects, { desc }) => [desc(projects.updatedAt)],
    });
    return c.json({ projects: result });
});
// Create Project
projects_app.post('/', (0,cjs/* zValidator */.l)('json', createProjectSchema), async (c) => {
    const orgId = c.get('organizationId');
    if (!orgId)
        return c.json({ error: 'Unauthorized' }, 401);
    const data = c.req.valid('json');
    const [newProject] = await src.db.insert(src.projects).values({
        ...data,
        organizationId: orgId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
    }).returning();
    return c.json({ project: newProject }, 201);
});
// Get Project
projects_app.get('/:id', async (c) => {
    const orgId = c.get('organizationId');
    const id = c.req.param('id');
    if (!orgId)
        return c.json({ error: 'Unauthorized' }, 401);
    const project = await src.db.query.projects.findFirst({
        where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.projects.id, id), (0,conditions.eq)(src.projects.organizationId, orgId)),
        with: {
            tasks: {
                with: {
                    assignee: true
                }
            }
        }
    });
    if (!project)
        return c.json({ error: 'Project not found' }, 404);
    return c.json({ project });
});
// Create Task
projects_app.post('/:id/tasks', (0,cjs/* zValidator */.l)('json', createTaskSchema), async (c) => {
    const orgId = c.get('organizationId');
    const projectId = c.req.param('id');
    if (!orgId)
        return c.json({ error: 'Unauthorized' }, 401);
    // Verify project ownership
    const project = await src.db.query.projects.findFirst({
        where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.projects.id, projectId), (0,conditions.eq)(src.projects.organizationId, orgId)),
    });
    if (!project)
        return c.json({ error: 'Project not found' }, 404);
    const data = c.req.valid('json');
    const [newTask] = await src.db.insert(src.projectTasks).values({
        ...data,
        projectId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
    }).returning();
    return c.json({ task: newTask }, 201);
});
// Update Task
projects_app.patch('/tasks/:taskId', (0,cjs/* zValidator */.l)('json', createTaskSchema.partial()), async (c) => {
    const orgId = c.get('organizationId');
    const taskId = c.req.param('taskId');
    if (!orgId)
        return c.json({ error: 'Unauthorized' }, 401);
    // Verify task belongs to organization
    const task = await src.db.query.projectTasks.findFirst({
        where: (0,conditions.eq)(src.projectTasks.id, taskId),
        with: {
            project: true
        }
    });
    if (!task || task.project.organizationId !== orgId) {
        return c.json({ error: 'Task not found' }, 404);
    }
    const data = c.req.valid('json');
    const [updated] = await src.db.update(src.projectTasks)
        .set({
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        updatedAt: new Date()
    })
        .where((0,conditions.eq)(src.projectTasks.id, taskId))
        .returning();
    return c.json({ task: updated });
});
// Delete Task
projects_app.delete('/tasks/:taskId', async (c) => {
    const orgId = c.get('organizationId');
    const taskId = c.req.param('taskId');
    if (!orgId)
        return c.json({ error: 'Unauthorized' }, 401);
    const task = await src.db.query.projectTasks.findFirst({
        where: (0,conditions.eq)(src.projectTasks.id, taskId),
        with: {
            project: true
        }
    });
    if (!task || task.project.organizationId !== orgId) {
        return c.json({ error: 'Task not found' }, 404);
    }
    await src.db.delete(src.projectTasks).where((0,conditions.eq)(src.projectTasks.id, taskId));
    return c.json({ success: true });
});
/* harmony default export */ const projects = (projects_app);

;// CONCATENATED MODULE: ./src/routes/quotations.ts







const quotations_app = new dist.Hono();
// Validation Schemas
const createQuotationSchema = types/* object */.Ik({
    customerId: types/* string */.Yj().uuid().optional(),
    validUntil: types/* string */.Yj().optional(), // ISO Date string
    notes: types/* string */.Yj().optional(),
    terms: types/* string */.Yj().optional(),
    items: types/* array */.YO(types/* object */.Ik({
        itemId: types/* string */.Yj().uuid(),
        quantity: types/* number */.ai().positive(),
        unitPrice: types/* number */.ai().nonnegative(),
        taxRate: types/* number */.ai().nonnegative().optional().default(0),
    })).min(1)
});
const updateStatusSchema = types/* object */.Ik({
    status: types/* enum */.k5(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'])
});
// GET /quotations - List
quotations_app.get('/', async (c) => {
    try {
        const organizationId = c.get('organizationId');
        if (!organizationId)
            return c.json({ error: 'Unauthorized' }, 401);
        const result = await src.db.query.quotations.findMany({
            where: (0,conditions.eq)(src.quotations.organizationId, organizationId),
            with: {
                customer: true,
                items: true
            },
            orderBy: [(0,expressions_select/* desc */.i)(src.quotations.createdAt)],
        });
        return c.json(result);
    }
    catch (error) {
        console.error('Error fetching quotations:', error);
        return c.json({ error: 'Failed to fetch quotations' }, 500);
    }
});
// GET /quotations/:id - Details
quotations_app.get('/:id', async (c) => {
    try {
        const organizationId = c.get('organizationId');
        if (!organizationId)
            return c.json({ error: 'Unauthorized' }, 401);
        const id = c.req.param('id');
        const result = await src.db.query.quotations.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.quotations.id, id), (0,conditions.eq)(src.quotations.organizationId, organizationId)),
            with: {
                customer: true,
                items: {
                    with: {
                        item: true
                    }
                }
            },
        });
        if (!result)
            return c.json({ error: 'Quotation not found' }, 404);
        return c.json(result);
    }
    catch (error) {
        console.error('Error fetching quotation:', error);
        return c.json({ error: 'Failed to fetch quotation' }, 500);
    }
});
// POST /quotations - Create
quotations_app.post('/', async (c) => {
    try {
        const organizationId = c.get('organizationId');
        const user = c.get('user');
        if (!organizationId)
            return c.json({ error: 'Unauthorized' }, 401);
        const body = await c.req.json();
        const validated = createQuotationSchema.parse(body);
        // Calculate totals
        let subtotal = 0;
        let taxTotal = 0;
        const itemsData = validated.items.map(item => {
            const lineTotal = item.quantity * item.unitPrice;
            const itemTax = lineTotal * (item.taxRate / 100);
            subtotal += lineTotal;
            taxTotal += itemTax;
            return {
                ...item,
                taxAmount: String(itemTax),
                total: String(lineTotal + itemTax) // Gross total per line
            };
        });
        const totalAmount = subtotal + taxTotal;
        const result = await src.db.transaction(async (tx) => {
            // 1. Create Quotation
            const [newQuotation] = await tx.insert(src.quotations).values({
                organizationId,
                customerId: validated.customerId,
                quotationNumber: `QT-${Date.now()}`, // Simple ID generation
                validUntil: validated.validUntil ? new Date(validated.validUntil) : null,
                notes: validated.notes,
                terms: validated.terms,
                subtotal: String(subtotal),
                taxTotal: String(taxTotal),
                totalAmount: String(totalAmount),
                status: 'DRAFT',
                createdBy: user?.id
            }).returning();
            // 2. Create Items
            for (const item of itemsData) {
                await tx.insert(src.quotationItems).values({
                    quotationId: newQuotation.id,
                    itemId: item.itemId,
                    quantity: String(item.quantity),
                    unitPrice: String(item.unitPrice),
                    taxRate: String(item.taxRate),
                    taxAmount: item.taxAmount,
                    total: item.total
                });
            }
            return newQuotation;
        });
        return c.json(result, 201);
    }
    catch (error) {
        if (error instanceof ZodError/* ZodError */.G) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        console.error('Error creating quotation:', error);
        return c.json({ error: 'Failed to create quotation' }, 500);
    }
});
// PATCH /quotations/:id/status - Update Status
quotations_app.patch('/:id/status', async (c) => {
    try {
        const organizationId = c.get('organizationId');
        const id = c.req.param('id');
        const body = await c.req.json();
        const { status } = updateStatusSchema.parse(body);
        const result = await src.db.update(src.quotations)
            .set({ status, updatedAt: new Date() })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.quotations.id, id), (0,conditions.eq)(src.quotations.organizationId, organizationId)))
            .returning();
        return c.json(result[0]);
    }
    catch (error) {
        return c.json({ error: 'Failed to update status' }, 500);
    }
});
// POST /quotations/:id/convert - Convert to Sale
quotations_app.post('/:id/convert', async (c) => {
    try {
        const organizationId = c.get('organizationId');
        const user = c.get('user');
        const id = c.req.param('id');
        if (!organizationId)
            return c.json({ error: 'Unauthorized' }, 401);
        // 1. Fetch Quotation
        const quotation = await src.db.query.quotations.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.quotations.id, id), (0,conditions.eq)(src.quotations.organizationId, organizationId)),
            with: { items: true }
        });
        if (!quotation)
            return c.json({ error: 'Quotation not found' }, 404);
        if (quotation.status === 'CONVERTED')
            return c.json({ error: 'Already converted' }, 400);
        // 2. Transaction: Create Sale, Update Stock, Update Quotation
        const result = await src.db.transaction(async (tx) => {
            // Create Sale
            const [newSale] = await tx.insert(src.sales).values({
                organizationId,
                customerId: quotation.customerId,
                saleNumber: `SALE-${Date.now()}`,
                subtotal: quotation.subtotal,
                taxTotal: quotation.taxTotal,
                totalAmount: quotation.totalAmount,
                status: 'COMPLETED', // Assume immediate completion or put PENDING if payment needed? 
                // For now, let's say it's PENDING payment if credit, or COMPLETED if cash. 
                // Typically converting a quote creates a pending order/invoice.
                paymentStatus: 'PENDING',
                notes: `Converted from Quotation ${quotation.quotationNumber}`,
                createdBy: user?.id
            }).returning();
            // Create Sale Items & Deduct Stock
            for (const item of quotation.items) {
                // Check stock first?
                const currentItem = await tx.query.items.findFirst({
                    where: (0,conditions.eq)(src.items.id, item.itemId)
                });
                if (!currentItem)
                    throw new Error(`Item ${item.itemId} not found`);
                // Deduct stock
                await tx.insert(src.stockMovements).values({
                    organizationId,
                    itemId: item.itemId,
                    type: 'SALE',
                    quantity: Number(item.quantity) * -1,
                    referenceType: 'sale',
                    referenceId: newSale.id,
                    notes: `Sale from Quote ${quotation.quotationNumber}`,
                    createdBy: user?.id || ''
                });
                await tx.insert(src.saleItems).values({
                    saleId: newSale.id,
                    itemId: item.itemId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxRate: item.taxRate,
                    taxAmount: item.taxAmount,
                    total: item.total
                });
                // Update item timestamp
                await tx.update(src.items).set({ updatedAt: new Date() }).where((0,conditions.eq)(src.items.id, item.itemId));
            }
            // Update Quotation Status
            await tx.update(src.quotations)
                .set({ status: 'CONVERTED', convertedSaleId: newSale.id, updatedAt: new Date() })
                .where((0,conditions.eq)(src.quotations.id, quotation.id));
            return newSale;
        });
        return c.json(result, 201);
    }
    catch (error) {
        console.error('Conversion error:', error);
        return c.json({ error: error.message || 'Failed to convert quotation' }, 500);
    }
});
/* harmony default export */ const quotations = (quotations_app);

;// CONCATENATED MODULE: ./src/routes/transfers.ts






const transfers_app = new dist.Hono();
// Schemas
const createTransferSchema = types/* object */.Ik({
    sourceLocationId: types/* string */.Yj().uuid(),
    destinationLocationId: types/* string */.Yj().uuid(),
    items: types/* array */.YO(types/* object */.Ik({
        itemId: types/* string */.Yj().uuid(),
        quantity: types/* number */.ai().int().positive()
    })).min(1),
    notes: types/* string */.Yj().optional(),
    driverName: types/* string */.Yj().optional(),
    vehicleNumber: types/* string */.Yj().optional()
}).refine(data => data.sourceLocationId !== data.destinationLocationId, {
    message: "Source and destination must be different",
    path: ["destinationLocationId"]
});
const receiveTransferSchema = types/* object */.Ik({
    items: types/* array */.YO(types/* object */.Ik({
        itemId: types/* string */.Yj().uuid(),
        quantityReceived: types/* number */.ai().int().nonnegative()
    }))
});
// GET / - List transfers
transfers_app.get('/', async (c) => {
    const organizationId = c.get('organizationId');
    if (!organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const results = await src.db.query.stockTransfers.findMany({
            where: (0,conditions.eq)(src.stockTransfers.organizationId, organizationId),
            with: {
                sourceLocation: true,
                destinationLocation: true,
                items: {
                    with: {
                        item: true
                    }
                }
            },
            orderBy: (0,expressions_select/* desc */.i)(src.stockTransfers.createdAt),
            limit: 50
        });
        return c.json(results);
    }
    catch (error) {
        console.error('Error fetching transfers:', error);
        return c.json({ error: 'Failed to fetch transfers' }, 500);
    }
});
// GET /:id - Get transfer details
transfers_app.get('/:id', async (c) => {
    const organizationId = c.get('organizationId');
    const id = c.req.param('id');
    try {
        const transfer = await src.db.query.stockTransfers.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.stockTransfers.id, id), (0,conditions.eq)(src.stockTransfers.organizationId, organizationId)),
            with: {
                sourceLocation: true,
                destinationLocation: true,
                items: {
                    with: {
                        item: true
                    }
                }
            }
        });
        if (!transfer)
            return c.json({ error: 'Transfer not found' }, 404);
        return c.json(transfer);
    }
    catch (error) {
        return c.json({ error: 'Failed to fetch transfer' }, 500);
    }
});
// POST / - Create Transfer (Draft)
transfers_app.post('/', async (c) => {
    const user = c.get('user');
    const organizationId = c.get('organizationId');
    try {
        const body = await c.req.json();
        const validated = createTransferSchema.parse(body);
        // Generate number
        const count = await src.db.$count(src.stockTransfers, (0,conditions.eq)(src.stockTransfers.organizationId, organizationId));
        const transferNumber = `TRF-${1001 + count}`;
        // Verify locations belong to organization
        const [sourceLocation] = await src.db.select().from(src.locations).where((0,conditions/* and */.Uo)((0,conditions.eq)(src.locations.id, validated.sourceLocationId), (0,conditions.eq)(src.locations.organizationId, organizationId)));
        const [destinationLocation] = await src.db.select().from(src.locations).where((0,conditions/* and */.Uo)((0,conditions.eq)(src.locations.id, validated.destinationLocationId), (0,conditions.eq)(src.locations.organizationId, organizationId)));
        if (!sourceLocation || !destinationLocation) {
            return c.json({ error: 'Invalid location(s)' }, 400);
        }
        await src.db.transaction(async (tx) => {
            // Create Header
            const [transfer] = await tx.insert(src.stockTransfers).values({
                organizationId,
                transferNumber,
                sourceLocationId: validated.sourceLocationId,
                destinationLocationId: validated.destinationLocationId,
                status: 'DRAFT', // Starts as draft
                notes: validated.notes,
                driverName: validated.driverName,
                vehicleNumber: validated.vehicleNumber,
                createdBy: user.id
            }).returning();
            // Create Items
            if (validated.items.length > 0) {
                await tx.insert(src.stockTransferItems).values(validated.items.map(item => ({
                    transferId: transfer.id,
                    itemId: item.itemId,
                    quantitySent: item.quantity,
                    // quantityReceived is null initially
                })));
            }
        });
        return c.json({ message: 'Transfer created successfully' }, 201);
    }
    catch (error) {
        if (error instanceof ZodError/* ZodError */.G)
            return c.json({ error: error.flatten() }, 400);
        console.error('Create transfer error:', error);
        return c.json({ error: 'Failed to create transfer' }, 500);
    }
});
// POST /:id/send - Mark as In-Transit
transfers_app.post('/:id/send', async (c) => {
    const user = c.get('user');
    const organizationId = c.get('organizationId');
    const id = c.req.param('id');
    try {
        const transfer = await src.db.query.stockTransfers.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.stockTransfers.id, id), (0,conditions.eq)(src.stockTransfers.organizationId, organizationId)),
            with: { items: true }
        });
        if (!transfer)
            return c.json({ error: 'Transfer not found' }, 404);
        if (transfer.status !== 'DRAFT')
            return c.json({ error: 'Transfer already sent' }, 400);
        await src.db.transaction(async (tx) => {
            // Update status
            await tx.update(src.stockTransfers)
                .set({ status: 'IN_TRANSIT', sentAt: new Date() })
                .where((0,conditions.eq)(src.stockTransfers.id, id));
            // Deduct stock from source
            for (const item of transfer.items) {
                await tx.insert(src.stockMovements).values({
                    organizationId,
                    itemId: item.itemId,
                    locationId: transfer.sourceLocationId,
                    type: 'TRANSFER_OUT',
                    quantity: -item.quantitySent, // Negative for stock out
                    referenceType: 'transfer',
                    referenceId: transfer.id,
                    createdAt: new Date(),
                    createdBy: user.id,
                    notes: `Transfer Out: ${transfer.transferNumber}`
                });
            }
        });
        return c.json({ message: 'Transfer marked as in-transit' });
    }
    catch (error) {
        return c.json({ error: 'Failed to send transfer' }, 500);
    }
});
// POST /:id/receive - Mark as Completed (Receive Stock)
transfers_app.post('/:id/receive', async (c) => {
    const user = c.get('user');
    const organizationId = c.get('organizationId');
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const validated = receiveTransferSchema.parse(body);
        const transfer = await src.db.query.stockTransfers.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(src.stockTransfers.id, id), (0,conditions.eq)(src.stockTransfers.organizationId, organizationId)),
        });
        if (!transfer)
            return c.json({ error: 'Transfer not found' }, 404);
        if (transfer.status !== 'IN_TRANSIT')
            return c.json({ error: 'Transfer not in transit' }, 400);
        await src.db.transaction(async (tx) => {
            // Update status
            await tx.update(src.stockTransfers)
                .set({ status: 'COMPLETED', receivedAt: new Date() })
                .where((0,conditions.eq)(src.stockTransfers.id, id));
            // Add stock to destination
            for (const item of validated.items) {
                // Update received quantity
                await tx.update(src.stockTransferItems)
                    .set({ quantityReceived: item.quantityReceived })
                    .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.stockTransferItems.transferId, id), (0,conditions.eq)(src.stockTransferItems.itemId, item.itemId)));
                // Create stock movement (IN)
                await tx.insert(src.stockMovements).values({
                    organizationId,
                    itemId: item.itemId,
                    locationId: transfer.destinationLocationId,
                    type: 'TRANSFER_IN',
                    quantity: item.quantityReceived, // Positive for stock in
                    referenceType: 'transfer',
                    referenceId: transfer.id,
                    createdAt: new Date(),
                    createdBy: user.id,
                    notes: `Transfer In: ${transfer.transferNumber}`
                });
            }
        });
        return c.json({ message: 'Transfer received successfully' });
    }
    catch (error) {
        return c.json({ error: 'Failed to receive transfer' }, 500);
    }
});
/* harmony default export */ const transfers = (transfers_app);

;// CONCATENATED MODULE: ./src/routes/hr.ts







const hr_app = new dist.Hono();
hr_app.use('*', authMiddleware);
// ==========================================
// EMPLOYEES
// ==========================================
const employeeSchema = types/* object */.Ik({
    firstName: types/* string */.Yj().min(2),
    lastName: types/* string */.Yj().min(2),
    email: types/* string */.Yj().email().optional(),
    phone: types/* string */.Yj().optional(),
    role: types/* string */.Yj().min(2),
    department: types/* string */.Yj().optional(),
    baseSalary: types/* number */.ai().min(0),
});
hr_app.get('/employees', async (c) => {
    const orgId = c.get('organizationId');
    const allEmployees = await src.db
        .select()
        .from(src.employees)
        .where((0,conditions.eq)(src.employees.organizationId, orgId));
    return c.json(allEmployees);
});
hr_app.post('/employees', (0,cjs/* zValidator */.l)('json', employeeSchema), async (c) => {
    const orgId = c.get('organizationId');
    const data = c.req.valid('json');
    const [employee] = await src.db
        .insert(src.employees)
        .values({
        organizationId: orgId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        department: data.department,
        baseSalary: data.baseSalary.toString(),
    })
        .returning();
    return c.json(employee, 201);
});
// ==========================================
// LEAVE REQUESTS
// ==========================================
const leaveRequestSchema = types/* object */.Ik({
    employeeId: types/* string */.Yj().uuid(),
    startDate: types/* string */.Yj(), // ISO date
    endDate: types/* string */.Yj(), // ISO date
    type: types/* string */.Yj(),
    reason: types/* string */.Yj().optional(),
});
hr_app.get('/leave-requests', async (c) => {
    const orgId = c.get('organizationId');
    const requests = await src.db
        .select()
        .from(src.leaveRequests)
        .where((0,conditions.eq)(src.leaveRequests.organizationId, orgId));
    return c.json(requests);
});
hr_app.post('/leave-requests', (0,cjs/* zValidator */.l)('json', leaveRequestSchema), async (c) => {
    const orgId = c.get('organizationId');
    const data = c.req.valid('json');
    const [request] = await src.db
        .insert(src.leaveRequests)
        .values({
        organizationId: orgId,
        employeeId: data.employeeId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        type: data.type,
        reason: data.reason,
    })
        .returning();
    return c.json(request, 201);
});
hr_app.patch('/leave-requests/:id/status', (0,cjs/* zValidator */.l)('json', types/* object */.Ik({ status: types/* enum */.k5(['APPROVED', 'REJECTED', 'CANCELLED']) })), async (c) => {
    const orgId = c.get('organizationId');
    const id = c.req.param('id');
    const { status } = c.req.valid('json');
    const [request] = await src.db
        .update(src.leaveRequests)
        .set({ status, updatedAt: new Date() })
        .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.leaveRequests.id, id), (0,conditions.eq)(src.leaveRequests.organizationId, orgId)))
        .returning();
    if (!request)
        return c.json({ error: 'Leave request not found' }, 404);
    return c.json(request);
});
// ==========================================
// ADVANCES
// ==========================================
const advanceSchema = types/* object */.Ik({
    employeeId: types/* string */.Yj().uuid(),
    amount: types/* number */.ai().min(1),
    reason: types/* string */.Yj().optional(),
});
hr_app.get('/advances', async (c) => {
    const orgId = c.get('organizationId');
    const allAdvances = await src.db
        .select()
        .from(src.advances)
        .where((0,conditions.eq)(src.advances.organizationId, orgId));
    return c.json(allAdvances);
});
hr_app.post('/advances', (0,cjs/* zValidator */.l)('json', advanceSchema), async (c) => {
    const orgId = c.get('organizationId');
    const data = c.req.valid('json');
    const [advance] = await src.db
        .insert(src.advances)
        .values({
        organizationId: orgId,
        employeeId: data.employeeId,
        amount: data.amount.toString(),
        reason: data.reason,
    })
        .returning();
    return c.json(advance, 201);
});
/* harmony default export */ const hr = (hr_app);

;// CONCATENATED MODULE: ./src/routes/payroll.ts








const payroll_app = new dist.Hono();
payroll_app.use('*', authMiddleware);
// ==========================================
// PAYROLL RUNS
// ==========================================
const payrollRunSchema = types/* object */.Ik({
    periodStart: types/* string */.Yj(), // ISO date
    periodEnd: types/* string */.Yj(), // ISO date
});
payroll_app.get('/runs', async (c) => {
    const orgId = c.get('organizationId');
    const runs = await src.db
        .select()
        .from(src.payrollRuns)
        .where((0,conditions.eq)(src.payrollRuns.organizationId, orgId));
    return c.json(runs);
});
// Generate a payroll run
payroll_app.post('/runs/generate', (0,cjs/* zValidator */.l)('json', payrollRunSchema), async (c) => {
    const orgId = c.get('organizationId');
    const data = c.req.valid('json');
    // 1. Fetch all active employees
    const staff = await src.db
        .select()
        .from(src.employees)
        .where((0,conditions.eq)(src.employees.organizationId, orgId));
    if (staff.length === 0) {
        return c.json({ error: 'No employees found to generate payroll.' }, 400);
    }
    // 2. Create the run record
    const [run] = await src.db
        .insert(src.payrollRuns)
        .values({
        organizationId: orgId,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        status: 'DRAFT',
        totalAmount: '0',
    })
        .returning();
    let totalRunAmount = 0;
    // 3. Generate lines for each employee
    for (const emp of staff) {
        const base = Number(emp.baseSalary);
        // For Phase 3 MVP: simple fixed deductions
        // In a full implementation, this reads from `taxTables` and `advances` within the date range.
        const allowances = 0; // Placeholder for Phase 3
        let deductions = 0;
        // Simple mock PAYE calculation (e.g. 15% tax over 270,000 TZS)
        const taxable = base + allowances;
        if (taxable > 270000) {
            deductions = (taxable - 270000) * 0.15;
        }
        const netPay = base + allowances - deductions;
        totalRunAmount += netPay;
        await src.db.insert(src.payrollRunLines).values({
            runId: run.id,
            employeeId: emp.id,
            baseSalary: base.toString(),
            allowances: allowances.toString(),
            deductions: deductions.toString(),
            netPay: netPay.toString(),
        });
    }
    // 4. Update run total
    const [updatedRun] = await src.db.update(src.payrollRuns)
        .set({ totalAmount: totalRunAmount.toString(), updatedAt: new Date() })
        .where((0,conditions.eq)(src.payrollRuns.id, run.id))
        .returning();
    return c.json(updatedRun, 201);
});
payroll_app.patch('/runs/:id/approve', async (c) => {
    const orgId = c.get('organizationId');
    const id = c.req.param('id');
    const [run] = await src.db
        .update(src.payrollRuns)
        .set({ status: 'APPROVED', updatedAt: new Date() })
        .where((0,conditions/* and */.Uo)((0,conditions.eq)(src.payrollRuns.id, id), (0,conditions.eq)(src.payrollRuns.organizationId, orgId)))
        .returning();
    if (!run)
        return c.json({ error: 'Run not found' }, 404);
    return c.json(run);
});
// ==========================================
// PAYROLL ITEMS (Allowances/Deductions mapping)
// ==========================================
payroll_app.get('/items', async (c) => {
    const orgId = c.get('organizationId');
    const items = await src.db
        .select()
        .from(src.payrollItems)
        .where((0,conditions.eq)(src.payrollItems.organizationId, orgId));
    return c.json(items);
});
/* harmony default export */ const payroll = (payroll_app);

;// CONCATENATED MODULE: ./src/routes/sync.ts









const sync_app = new dist.Hono();
// Schema for Push Sync (Mobile/Web sending changes)
const pushSchema = types/* object */.Ik({
    changes: types/* object */.Ik({
        items: types/* object */.Ik({
            created: types/* array */.YO(types/* any */.bz()),
            updated: types/* array */.YO(types/* any */.bz()),
            deleted: types/* array */.YO(types/* string */.Yj()),
        }).optional(),
        sales: types/* object */.Ik({
            created: types/* array */.YO(types/* any */.bz()),
            updated: types/* array */.YO(types/* any */.bz()),
            deleted: types/* array */.YO(types/* string */.Yj()),
        }).optional(),
        customers: types/* object */.Ik({
            created: types/* array */.YO(types/* any */.bz()),
            updated: types/* array */.YO(types/* any */.bz()),
            deleted: types/* array */.YO(types/* string */.Yj()),
        }).optional(),
        expenses: types/* object */.Ik({
            created: types/* array */.YO(types/* any */.bz()),
            updated: types/* array */.YO(types/* any */.bz()),
            deleted: types/* array */.YO(types/* string */.Yj()),
        }).optional()
    })
});
// GET /pull - Delta Sync (Get changes since last pull)
sync_app.get('/pull', async (c) => {
    const organizationId = c.get('organizationId');
    const lastPulledAt = c.req.query('lastPulledAt');
    if (!organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    // If no lastPulledAt, default to 1970 (full sync)
    const since = lastPulledAt ? new Date(parseInt(lastPulledAt)) : new Date(0);
    try {
        // Fetch changes from all major tables
        const [changedItems, changedCategories, changedCustomers, changedSales, changedProjects, changedExpenses, changedExpenseCategories] = await Promise.all([
            src.db.select().from(src.items).where((0,conditions/* and */.Uo)((0,conditions.eq)(src.items.organizationId, organizationId), (0,conditions.gt)(src.items.updatedAt, since))),
            src.db.select().from(src.itemCategories).where((0,conditions/* and */.Uo)((0,conditions.eq)(src.itemCategories.organizationId, organizationId), (0,conditions.gt)(src.itemCategories.updatedAt, since) // Provided schema has updatedAt
            )),
            src.db.select().from(src.stakeholders).where((0,conditions/* and */.Uo)((0,conditions.eq)(src.stakeholders.organizationId, organizationId), (0,conditions.gt)(src.stakeholders.updatedAt, since))),
            src.db.select().from(src.sales).where((0,conditions/* and */.Uo)((0,conditions.eq)(src.sales.organizationId, organizationId), (0,conditions.gt)(src.sales.updatedAt, since))),
            src.db.select().from(src.projects).where((0,conditions/* and */.Uo)((0,conditions.eq)(src.projects.organizationId, organizationId), (0,conditions.gt)(src.projects.updatedAt, since))),
            src.db.select().from(src.expenses).where((0,conditions/* and */.Uo)((0,conditions.eq)(src.expenses.organizationId, organizationId), (0,conditions.gt)(src.expenses.updatedAt, since))),
            src.db.select().from(src.expenseCategories).where((0,conditions/* and */.Uo)((0,conditions.eq)(src.expenseCategories.organizationId, organizationId), (0,conditions.gt)(src.expenseCategories.createdAt, since) // No updatedAt on expenseCategories in current schema
            ))
        ]);
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
                },
                projects: {
                    created: [],
                    updated: changedProjects,
                    deleted: []
                },
                expenses: {
                    created: [],
                    updated: changedExpenses,
                    deleted: []
                },
                expenseCategories: {
                    created: [],
                    updated: changedExpenseCategories,
                    deleted: []
                }
            },
            timestamp: Date.now()
        });
    }
    catch (error) {
        console.error('Sync Pull Error:', error);
        return c.json({ error: 'Failed to pull changes' }, 500);
    }
});
// POST /push - Push changes from client
sync_app.post('/push', async (c) => {
    const organizationId = c.get('organizationId');
    const user = c.get('user');
    if (!organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const body = await c.req.json();
        const { changes } = pushSchema.parse(body);
        const results = await src.db.transaction(async (tx) => {
            const syncResults = {
                sales: { created: 0 },
                expenses: { created: 0 }
            };
            // 1. Process Sales
            if (changes.sales?.created) {
                for (const sale of changes.sales.created) {
                    // Basic duplicate check by ID (since mobile provides the ID)
                    const existing = await tx.query.sales.findFirst({
                        where: (0,conditions.eq)(src.sales.id, sale.id)
                    });
                    if (!existing) {
                        await tx.insert(src.sales).values({
                            id: sale.id,
                            organizationId,
                            customerId: sale.customerId,
                            saleNumber: `SALE-${sale.id.substring(0, 8).toUpperCase()}`,
                            subtotal: String(sale.totalAmount), // Simplistic mapping for now
                            totalAmount: String(sale.totalAmount),
                            paidAmount: String(sale.totalAmount),
                            paymentStatus: 'PAID',
                            createdAt: new Date(sale.createdAt),
                            updatedAt: new Date(sale.updatedAt),
                            createdBy: user?.id,
                        });
                        syncResults.sales.created++;
                    }
                }
            }
            // 2. Process Expenses
            if (changes.expenses?.created) {
                for (const exp of changes.expenses.created) {
                    const existing = await tx.query.expenses.findFirst({
                        where: (0,conditions.eq)(src.expenses.id, exp.id)
                    });
                    if (!existing) {
                        await tx.insert(src.expenses).values({
                            id: exp.id,
                            organizationId,
                            categoryId: exp.categoryId,
                            description: exp.description,
                            amount: String(exp.amount),
                            expenseDate: new Date(exp.date).toISOString().split('T')[0],
                            createdAt: new Date(exp.date),
                            updatedAt: new Date(exp.updatedAt || Date.now()),
                            createdBy: user?.id,
                        });
                        syncResults.expenses.created++;
                    }
                }
            }
            return syncResults;
        });
        return c.json({ message: 'Sync successful', results });
    }
    catch (error) {
        console.error('Sync Push Error:', error);
        if (error instanceof ZodError/* ZodError */.G) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400);
        }
        return c.json({ error: 'Failed to push changes', message: error.message }, 500);
    }
});
/* harmony default export */ const sync = (sync_app);

// EXTERNAL MODULE: ../../node_modules/@hono/node-server/dist/index.mjs
var node_server_dist = __webpack_require__(7416);
;// CONCATENATED MODULE: ./src/index.ts







const src_app = new dist.Hono();
// Middleware
// 1. CORS MUST be first to handle OPTIONS preflight
src_app.use('*', (0,cors.cors)({
    origin: (origin) => {
        // Allow Vercel, Render, and local development
        if (origin === 'https://smart-biz-pro-web.vercel.app' ||
            origin?.endsWith('.vercel.app') ||
            origin?.endsWith('.onrender.com') ||
            origin?.includes('localhost')) {
            return origin;
        }
        return 'https://smartbiz-pro.onrender.com'; // Default fallback
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
}));
// 2. Handle OPTIONS globally to ensure preflight success immediately
src_app.options('*', (c) => {
    return c.body(null, 204);
});
src_app.use('*', (0,logger/* logger */.v)());
src_app.use('*', (0,pretty_json/* prettyJSON */.T)());
// Health check
src_app.get('/', (c) => {
    return c.json({
        status: 'ok',
        message: 'SmartBiz Pro API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
src_app.get('/health', (c) => {
    return c.json({
        status: 'healthy',
        uptime: process.uptime(),
    });
});
src_app.get('/debug-env', (c) => {
    const keys = [
        'DATABASE_URL',
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'NEXT_PUBLIC_API_URL',
        'NODE_ENV'
    ];
    const status = {};
    keys.forEach(key => {
        status[key] = !!process.env[key];
    });
    return c.json({
        env_status: status,
        vercel_region: process.env.VERCEL_REGION || 'local'
    });
});
// Global Error Handler
src_app.onError((err, c) => {
    console.error('GLOBAL ERROR:', err);
    const isConfigError = err.message.includes('configuration missing');
    return c.json({
        error: isConfigError ? 'Configuration Error' : 'Internal Server Error',
        message: err.message,
        code: isConfigError ? 'CONFIG_MISSING' : 'INTERNAL_ERROR',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, 500);
});
// Auth Routes

// Apply auth middleware to all routes except public health check
src_app.use('/auth', authMiddleware);
src_app.use('/auth/*', authMiddleware);
src_app.route('/auth', auth);













// Mount routes
src_app.route('/auth', auth);
src_app.use('/organizations', authMiddleware);
src_app.use('/organizations/*', authMiddleware);
src_app.route('/organizations', organizations);
src_app.use('/stakeholders', authMiddleware);
src_app.use('/stakeholders/*', authMiddleware);
src_app.route('/stakeholders', stakeholders);
src_app.use('/items', authMiddleware);
src_app.use('/items/*', authMiddleware);
src_app.route('/items', items);
src_app.use('/categories', authMiddleware);
src_app.use('/categories/*', authMiddleware);
src_app.route('/categories', categories);
src_app.use('/stock-movements', authMiddleware);
src_app.use('/stock-movements/*', authMiddleware);
src_app.route('/stock-movements', stock_movements);
src_app.use('/sales', authMiddleware);
src_app.use('/sales/*', authMiddleware);
src_app.route('/sales', sales);
src_app.use('/reports', authMiddleware);
src_app.use('/reports/*', authMiddleware);
src_app.route('/reports', reports);
src_app.use('/locations', authMiddleware);
src_app.use('/locations/*', authMiddleware);
src_app.route('/locations', locations);
src_app.use('/purchases', authMiddleware);
src_app.use('/purchases/*', authMiddleware);
src_app.route('/purchases', purchases);
src_app.use('/finance', authMiddleware);
src_app.use('/finance/*', authMiddleware);
src_app.route('/finance', finance);
src_app.use('/expenses', authMiddleware);
src_app.use('/expenses/*', authMiddleware);
src_app.route('/expenses', expenses);
src_app.use('/banking', authMiddleware);
src_app.use('/banking/*', authMiddleware);
src_app.route('/banking', banking);
src_app.use('/returns', authMiddleware);
src_app.use('/returns/*', authMiddleware);
src_app.route('/returns', returns);

src_app.use('/quotations', authMiddleware);
src_app.use('/quotations/*', authMiddleware);
src_app.route('/quotations', quotations);

src_app.use('/transfers', authMiddleware);
src_app.use('/transfers/*', authMiddleware);
src_app.route('/transfers', transfers);
src_app.use('/projects', authMiddleware);
src_app.use('/projects/*', authMiddleware);
src_app.route('/projects', projects);

src_app.use('/hr', authMiddleware);
src_app.use('/hr/*', authMiddleware);
src_app.route('/hr', hr);

src_app.use('/payroll', authMiddleware);
src_app.use('/payroll/*', authMiddleware);
src_app.route('/payroll', payroll);
src_app.route('/transfers', transfers);

src_app.use('/sync', authMiddleware);
src_app.use('/sync/*', authMiddleware);
src_app.route('/sync', sync);

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    // Run migrations before starting
    Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, 9292)).then(async ({ getDb, runMigrations }) => {
        try {
            const db = getDb();
            await runMigrations(db);
            console.log(`Server is running on port ${port}`);
            (0,node_server_dist/* serve */.wX)({
                fetch: src_app.fetch,
                port
            });
        }
        catch (error) {
            console.error('Failed to start server due to migration error:', error);
            process.exit(1);
        }
    });
}
/* harmony default export */ const src_0 = ((/* unused pure expression or super */ null && (src_app)));
// Force redeploy: Verifying CORS and DB connection fixes


/***/ }),

/***/ 9292:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  advanceStatusEnum: () => (/* reexport */ advanceStatusEnum),
  advances: () => (/* reexport */ advances),
  auditLogs: () => (/* reexport */ auditLogs),
  bankAccountTypeEnum: () => (/* reexport */ bankAccountTypeEnum),
  bankAccounts: () => (/* reexport */ bankAccounts),
  bankAccountsRelations: () => (/* reexport */ bankAccountsRelations),
  bankTransactions: () => (/* reexport */ bankTransactions),
  bankTransactionsRelations: () => (/* reexport */ bankTransactionsRelations),
  db: () => (/* binding */ db),
  employees: () => (/* reexport */ employees),
  expenseCategories: () => (/* reexport */ expenseCategories),
  expenseCategoriesRelations: () => (/* reexport */ expenseCategoriesRelations),
  expenseCategoryTypeEnum: () => (/* reexport */ expenseCategoryTypeEnum),
  expenses: () => (/* reexport */ expenses),
  expensesRelations: () => (/* reexport */ expensesRelations),
  getDb: () => (/* binding */ getDb),
  grnLines: () => (/* reexport */ grnLines),
  grnLinesRelations: () => (/* reexport */ grnLinesRelations),
  grnStatusEnum: () => (/* reexport */ grnStatusEnum),
  grns: () => (/* reexport */ grns),
  grnsRelations: () => (/* reexport */ grnsRelations),
  industryEnum: () => (/* reexport */ industryEnum),
  invoiceStatusEnum: () => (/* reexport */ invoiceStatusEnum),
  itemCategories: () => (/* reexport */ itemCategories),
  itemCategoriesRelations: () => (/* reexport */ itemCategoriesRelations),
  items: () => (/* reexport */ items),
  itemsRelations: () => (/* reexport */ itemsRelations),
  leaveRequests: () => (/* reexport */ leaveRequests),
  leaveStatusEnum: () => (/* reexport */ leaveStatusEnum),
  locationTypeEnum: () => (/* reexport */ locationTypeEnum),
  locations: () => (/* reexport */ locations),
  locationsRelations: () => (/* reexport */ locationsRelations),
  operationsLog: () => (/* reexport */ operationsLog),
  organizations: () => (/* reexport */ organizations),
  organizationsRelations: () => (/* reexport */ organizationsRelations),
  paymentMethodEnum: () => (/* reexport */ paymentMethodEnum),
  paymentStatusEnum: () => (/* reexport */ paymentStatusEnum),
  payments: () => (/* reexport */ payments),
  paymentsRelations: () => (/* reexport */ paymentsRelations),
  payrollItemTypeEnum: () => (/* reexport */ payrollItemTypeEnum),
  payrollItems: () => (/* reexport */ payrollItems),
  payrollRunLines: () => (/* reexport */ payrollRunLines),
  payrollRunStatusEnum: () => (/* reexport */ payrollRunStatusEnum),
  payrollRuns: () => (/* reexport */ payrollRuns),
  profiles: () => (/* reexport */ profiles),
  profilesRelations: () => (/* reexport */ profilesRelations),
  projectStatusEnum: () => (/* reexport */ projectStatusEnum),
  projectTasks: () => (/* reexport */ projectTasks),
  projectTasksRelations: () => (/* reexport */ projectTasksRelations),
  projects: () => (/* reexport */ projects),
  projectsRelations: () => (/* reexport */ projectsRelations),
  purchaseOrderLines: () => (/* reexport */ purchaseOrderLines),
  purchaseOrderLinesRelations: () => (/* reexport */ purchaseOrderLinesRelations),
  purchaseOrderStatusEnum: () => (/* reexport */ purchaseOrderStatusEnum),
  purchaseOrders: () => (/* reexport */ purchaseOrders),
  purchaseOrdersRelations: () => (/* reexport */ purchaseOrdersRelations),
  purchasePaymentMethodEnum: () => (/* reexport */ purchasePaymentMethodEnum),
  purchasePayments: () => (/* reexport */ purchasePayments),
  purchasePaymentsRelations: () => (/* reexport */ purchasePaymentsRelations),
  quotationItems: () => (/* reexport */ quotationItems),
  quotationItemsRelations: () => (/* reexport */ quotationItemsRelations),
  quotationStatusEnum: () => (/* reexport */ quotationStatusEnum),
  quotations: () => (/* reexport */ quotations),
  quotationsRelations: () => (/* reexport */ quotationsRelations),
  refundStatusEnum: () => (/* reexport */ refundStatusEnum),
  returnConditionEnum: () => (/* reexport */ returnConditionEnum),
  returnItems: () => (/* reexport */ returnItems),
  returnItemsRelations: () => (/* reexport */ returnItemsRelations),
  returnStatusEnum: () => (/* reexport */ returnStatusEnum),
  returns: () => (/* reexport */ returns),
  returnsRelations: () => (/* reexport */ returnsRelations),
  runMigrations: () => (/* reexport */ runMigrations),
  saleItems: () => (/* reexport */ saleItems),
  saleItemsRelations: () => (/* reexport */ saleItemsRelations),
  saleStatusEnum: () => (/* reexport */ saleStatusEnum),
  sales: () => (/* reexport */ sales),
  salesRelations: () => (/* reexport */ salesRelations),
  stakeholderContacts: () => (/* reexport */ stakeholderContacts),
  stakeholderContactsRelations: () => (/* reexport */ stakeholderContactsRelations),
  stakeholderInteractions: () => (/* reexport */ stakeholderInteractions),
  stakeholderInteractionsRelations: () => (/* reexport */ stakeholderInteractionsRelations),
  stakeholderSubTypeEnum: () => (/* reexport */ stakeholderSubTypeEnum),
  stakeholderTypeEnum: () => (/* reexport */ stakeholderTypeEnum),
  stakeholders: () => (/* reexport */ stakeholders),
  stakeholdersRelations: () => (/* reexport */ stakeholdersRelations),
  stockMovementTypeEnum: () => (/* reexport */ stockMovementTypeEnum),
  stockMovements: () => (/* reexport */ stockMovements),
  stockMovementsRelations: () => (/* reexport */ stockMovementsRelations),
  stockTransferItems: () => (/* reexport */ stockTransferItems),
  stockTransferItemsRelations: () => (/* reexport */ stockTransferItemsRelations),
  stockTransferStatusEnum: () => (/* reexport */ stockTransferStatusEnum),
  stockTransfers: () => (/* reexport */ stockTransfers),
  stockTransfersRelations: () => (/* reexport */ stockTransfersRelations),
  supplierInvoices: () => (/* reexport */ supplierInvoices),
  supplierInvoicesRelations: () => (/* reexport */ supplierInvoicesRelations),
  taxTables: () => (/* reexport */ taxTables),
  transactionReferenceTypeEnum: () => (/* reexport */ transactionReferenceTypeEnum),
  transactionTypeEnum: () => (/* reexport */ transactionTypeEnum),
  userRoleEnum: () => (/* reexport */ userRoleEnum)
});

// NAMESPACE OBJECT: ../../packages/db/src/schema/index.ts
var schema_namespaceObject = {};
__webpack_require__.r(schema_namespaceObject);
__webpack_require__.d(schema_namespaceObject, {
  advanceStatusEnum: () => (advanceStatusEnum),
  advances: () => (advances),
  auditLogs: () => (auditLogs),
  bankAccountTypeEnum: () => (bankAccountTypeEnum),
  bankAccounts: () => (bankAccounts),
  bankAccountsRelations: () => (bankAccountsRelations),
  bankTransactions: () => (bankTransactions),
  bankTransactionsRelations: () => (bankTransactionsRelations),
  employees: () => (employees),
  expenseCategories: () => (expenseCategories),
  expenseCategoriesRelations: () => (expenseCategoriesRelations),
  expenseCategoryTypeEnum: () => (expenseCategoryTypeEnum),
  expenses: () => (expenses),
  expensesRelations: () => (expensesRelations),
  grnLines: () => (grnLines),
  grnLinesRelations: () => (grnLinesRelations),
  grnStatusEnum: () => (grnStatusEnum),
  grns: () => (grns),
  grnsRelations: () => (grnsRelations),
  industryEnum: () => (industryEnum),
  invoiceStatusEnum: () => (invoiceStatusEnum),
  itemCategories: () => (itemCategories),
  itemCategoriesRelations: () => (itemCategoriesRelations),
  items: () => (items),
  itemsRelations: () => (itemsRelations),
  leaveRequests: () => (leaveRequests),
  leaveStatusEnum: () => (leaveStatusEnum),
  locationTypeEnum: () => (locationTypeEnum),
  locations: () => (locations),
  locationsRelations: () => (locationsRelations),
  operationsLog: () => (operationsLog),
  organizations: () => (organizations),
  organizationsRelations: () => (organizationsRelations),
  paymentMethodEnum: () => (paymentMethodEnum),
  paymentStatusEnum: () => (paymentStatusEnum),
  payments: () => (payments),
  paymentsRelations: () => (paymentsRelations),
  payrollItemTypeEnum: () => (payrollItemTypeEnum),
  payrollItems: () => (payrollItems),
  payrollRunLines: () => (payrollRunLines),
  payrollRunStatusEnum: () => (payrollRunStatusEnum),
  payrollRuns: () => (payrollRuns),
  profiles: () => (profiles),
  profilesRelations: () => (profilesRelations),
  projectStatusEnum: () => (projectStatusEnum),
  projectTasks: () => (projectTasks),
  projectTasksRelations: () => (projectTasksRelations),
  projects: () => (projects),
  projectsRelations: () => (projectsRelations),
  purchaseOrderLines: () => (purchaseOrderLines),
  purchaseOrderLinesRelations: () => (purchaseOrderLinesRelations),
  purchaseOrderStatusEnum: () => (purchaseOrderStatusEnum),
  purchaseOrders: () => (purchaseOrders),
  purchaseOrdersRelations: () => (purchaseOrdersRelations),
  purchasePaymentMethodEnum: () => (purchasePaymentMethodEnum),
  purchasePayments: () => (purchasePayments),
  purchasePaymentsRelations: () => (purchasePaymentsRelations),
  quotationItems: () => (quotationItems),
  quotationItemsRelations: () => (quotationItemsRelations),
  quotationStatusEnum: () => (quotationStatusEnum),
  quotations: () => (quotations),
  quotationsRelations: () => (quotationsRelations),
  refundStatusEnum: () => (refundStatusEnum),
  returnConditionEnum: () => (returnConditionEnum),
  returnItems: () => (returnItems),
  returnItemsRelations: () => (returnItemsRelations),
  returnStatusEnum: () => (returnStatusEnum),
  returns: () => (returns),
  returnsRelations: () => (returnsRelations),
  saleItems: () => (saleItems),
  saleItemsRelations: () => (saleItemsRelations),
  saleStatusEnum: () => (saleStatusEnum),
  sales: () => (sales),
  salesRelations: () => (salesRelations),
  stakeholderContacts: () => (stakeholderContacts),
  stakeholderContactsRelations: () => (stakeholderContactsRelations),
  stakeholderInteractions: () => (stakeholderInteractions),
  stakeholderInteractionsRelations: () => (stakeholderInteractionsRelations),
  stakeholderSubTypeEnum: () => (stakeholderSubTypeEnum),
  stakeholderTypeEnum: () => (stakeholderTypeEnum),
  stakeholders: () => (stakeholders),
  stakeholdersRelations: () => (stakeholdersRelations),
  stockMovementTypeEnum: () => (stockMovementTypeEnum),
  stockMovements: () => (stockMovements),
  stockMovementsRelations: () => (stockMovementsRelations),
  stockTransferItems: () => (stockTransferItems),
  stockTransferItemsRelations: () => (stockTransferItemsRelations),
  stockTransferStatusEnum: () => (stockTransferStatusEnum),
  stockTransfers: () => (stockTransfers),
  stockTransfersRelations: () => (stockTransfersRelations),
  supplierInvoices: () => (supplierInvoices),
  supplierInvoicesRelations: () => (supplierInvoicesRelations),
  taxTables: () => (taxTables),
  transactionReferenceTypeEnum: () => (transactionReferenceTypeEnum),
  transactionTypeEnum: () => (transactionTypeEnum),
  userRoleEnum: () => (userRoleEnum)
});

// EXTERNAL MODULE: ../../node_modules/drizzle-orm/postgres-js/driver.js + 23 modules
var driver = __webpack_require__(2149);
// EXTERNAL MODULE: ../../node_modules/postgres/src/index.js + 9 modules
var src = __webpack_require__(8074);
// EXTERNAL MODULE: ../../node_modules/drizzle-orm/pg-core/columns/enum.js
var columns_enum = __webpack_require__(3785);
// EXTERNAL MODULE: ../../node_modules/drizzle-orm/pg-core/table.js + 23 modules
var table = __webpack_require__(21);
// EXTERNAL MODULE: ../../node_modules/drizzle-orm/pg-core/columns/uuid.js
var uuid = __webpack_require__(9627);
// EXTERNAL MODULE: ../../node_modules/drizzle-orm/pg-core/columns/varchar.js
var varchar = __webpack_require__(5671);
// EXTERNAL MODULE: ../../node_modules/drizzle-orm/pg-core/columns/jsonb.js
var jsonb = __webpack_require__(5982);
// EXTERNAL MODULE: ../../node_modules/drizzle-orm/pg-core/columns/timestamp.js
var timestamp = __webpack_require__(4374);
// EXTERNAL MODULE: ../../node_modules/drizzle-orm/pg-core/columns/text.js
var columns_text = __webpack_require__(1447);
// EXTERNAL MODULE: ../../node_modules/drizzle-orm/pg-core/columns/boolean.js
var columns_boolean = __webpack_require__(742);
// EXTERNAL MODULE: ../../node_modules/drizzle-orm/pg-core/columns/integer.js
var integer = __webpack_require__(2164);
// EXTERNAL MODULE: ../../node_modules/drizzle-orm/relations.js + 1 modules
var relations = __webpack_require__(7356);
;// CONCATENATED MODULE: ../../packages/db/src/schema/auth.ts


// Enums
const userRoleEnum = (0,columns_enum/* pgEnum */.rL)('user_role', [
    'ADMIN',
    'OWNER',
    'ACCOUNTANT',
    'STOREKEEPER',
    'PROCUREMENT',
    'HR',
    'PAYROLL',
    'PROJECT_MANAGER',
    'SALES',
]);
const industryEnum = (0,columns_enum/* pgEnum */.rL)('industry', [
    'RETAIL',
    'WHOLESALE',
    'HEALTHCARE',
    'EDUCATION',
    'NGO',
    'MANUFACTURING',
]);
// Organizations table
const organizations = (0,table/* pgTable */.cJ)('organizations', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    name: (0,varchar/* varchar */.yf)('name', { length: 255 }).notNull(),
    slug: (0,varchar/* varchar */.yf)('slug', { length: 100 }).notNull().unique(),
    industry: industryEnum('industry').notNull(),
    country: (0,varchar/* varchar */.yf)('country', { length: 2 }).notNull(),
    currency: (0,varchar/* varchar */.yf)('currency', { length: 3 }).notNull().default('TZS'),
    timezone: (0,varchar/* varchar */.yf)('timezone', { length: 50 }).notNull().default('Africa/Dar_es_Salaam'),
    settings: (0,jsonb/* jsonb */.Fx)('settings').notNull().default({}),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
});
// Profiles table (extends Supabase auth.users)
const profiles = (0,table/* pgTable */.cJ)('profiles', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    userId: (0,uuid/* uuid */.uR)('user_id').notNull().unique(), // References auth.users
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    firstName: (0,varchar/* varchar */.yf)('first_name', { length: 100 }).notNull(),
    lastName: (0,varchar/* varchar */.yf)('last_name', { length: 100 }).notNull(),
    phone: (0,varchar/* varchar */.yf)('phone', { length: 20 }),
    avatar: (0,columns_text/* text */.Qq)('avatar'),
    role: userRoleEnum('role').notNull().default('SALES'),
    permissions: (0,jsonb/* jsonb */.Fx)('permissions').notNull().default([]),
    isActive: (0,columns_boolean/* boolean */.zM)('is_active').notNull().default(true),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
    createdBy: (0,uuid/* uuid */.uR)('created_by'),
    updatedBy: (0,uuid/* uuid */.uR)('updated_by'),
    deletedAt: (0,timestamp/* timestamp */.vE)('deleted_at'),
    version: (0,integer/* integer */.nd)('version').notNull().default(1),
});
// Audit logs table
const auditLogs = (0,table/* pgTable */.cJ)('audit_logs', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    userId: (0,uuid/* uuid */.uR)('user_id').notNull(),
    action: (0,varchar/* varchar */.yf)('action', { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, LOGIN, etc.
    entity: (0,varchar/* varchar */.yf)('entity', { length: 50 }).notNull(), // table name
    entityId: (0,uuid/* uuid */.uR)('entity_id'),
    changes: (0,jsonb/* jsonb */.Fx)('changes'), // before/after values
    metadata: (0,jsonb/* jsonb */.Fx)('metadata'), // IP, device, etc.
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
});
// Operations log (for idempotency)
const operationsLog = (0,table/* pgTable */.cJ)('operations_log', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey(), // This IS the idempotency key
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    userId: (0,uuid/* uuid */.uR)('user_id').notNull(),
    deviceId: (0,varchar/* varchar */.yf)('device_id', { length: 100 }).notNull(),
    table: (0,varchar/* varchar */.yf)('table', { length: 50 }).notNull(),
    action: (0,varchar/* varchar */.yf)('action', { length: 10 }).notNull(), // CREATE, UPDATE, DELETE
    entityId: (0,uuid/* uuid */.uR)('entity_id').notNull(),
    payload: (0,jsonb/* jsonb */.Fx)('payload').notNull(),
    status: (0,varchar/* varchar */.yf)('status', { length: 20 }).notNull().default('APPLIED'), // APPLIED, CONFLICT, FAILED
    error: (0,columns_text/* text */.Qq)('error'),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    processedAt: (0,timestamp/* timestamp */.vE)('processed_at').notNull().defaultNow(),
});
// Relations
const organizationsRelations = (0,relations/* relations */.K1)(organizations, ({ many }) => ({
    profiles: many(profiles),
    auditLogs: many(auditLogs),
    operationsLog: many(operationsLog),
}));
const profilesRelations = (0,relations/* relations */.K1)(profiles, ({ one }) => ({
    organization: one(organizations, {
        fields: [profiles.organizationId],
        references: [organizations.id],
    }),
}));

// EXTERNAL MODULE: ../../node_modules/drizzle-orm/pg-core/columns/numeric.js
var numeric = __webpack_require__(9893);
// EXTERNAL MODULE: ../../node_modules/drizzle-orm/pg-core/indexes.js
var indexes = __webpack_require__(3874);
;// CONCATENATED MODULE: ../../packages/db/src/schema/stakeholders.ts



// Stakeholder type enum
const stakeholderTypeEnum = (0,columns_enum/* pgEnum */.rL)('stakeholder_type', ['CUSTOMER', 'SUPPLIER']);
// Stakeholder sub-type enum (Individual vs Business)
const stakeholderSubTypeEnum = (0,columns_enum/* pgEnum */.rL)('stakeholder_sub_type', ['INDIVIDUAL', 'BUSINESS']);
// Stakeholders table (Customers and Suppliers)
const stakeholders = (0,table/* pgTable */.cJ)('stakeholders', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    type: stakeholderTypeEnum('type').notNull(),
    stakeholderType: stakeholderSubTypeEnum('stakeholder_type').default('INDIVIDUAL'),
    code: (0,varchar/* varchar */.yf)('code', { length: 50 }).notNull(),
    name: (0,varchar/* varchar */.yf)('name', { length: 255 }).notNull(),
    email: (0,varchar/* varchar */.yf)('email', { length: 255 }),
    phone: (0,varchar/* varchar */.yf)('phone', { length: 20 }),
    address: (0,columns_text/* text */.Qq)('address'),
    city: (0,varchar/* varchar */.yf)('city', { length: 100 }),
    country: (0,varchar/* varchar */.yf)('country', { length: 2 }),
    taxId: (0,varchar/* varchar */.yf)('tax_id', { length: 50 }),
    creditLimit: (0,numeric/* decimal */._)('credit_limit', { precision: 15, scale: 2 }),
    paymentTerms: (0,integer/* integer */.nd)('payment_terms'), // days
    loyaltyPoints: (0,numeric/* decimal */._)('loyalty_points', { precision: 15, scale: 2 }).default('0'),
    isActive: (0,columns_boolean/* boolean */.zM)('is_active').notNull().default(true),
    customFields: (0,jsonb/* jsonb */.Fx)('custom_fields'),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
    createdBy: (0,uuid/* uuid */.uR)('created_by').notNull(),
    updatedBy: (0,uuid/* uuid */.uR)('updated_by').notNull(),
    deletedAt: (0,timestamp/* timestamp */.vE)('deleted_at'),
    version: (0,integer/* integer */.nd)('version').notNull().default(1),
}, (table) => {
    return {
        orgIdx: (0,indexes/* index */.Pe)('stakeholders_org_idx').on(table.organizationId),
        typeIdx: (0,indexes/* index */.Pe)('stakeholders_type_idx').on(table.type),
        codeIdx: (0,indexes/* index */.Pe)('stakeholders_code_idx').on(table.code),
    };
});
// Stakeholder contacts
const stakeholderContacts = (0,table/* pgTable */.cJ)('stakeholder_contacts', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    stakeholderId: (0,uuid/* uuid */.uR)('stakeholder_id').notNull().references(() => stakeholders.id, { onDelete: 'cascade' }),
    name: (0,varchar/* varchar */.yf)('name', { length: 255 }).notNull(),
    position: (0,varchar/* varchar */.yf)('position', { length: 100 }),
    email: (0,varchar/* varchar */.yf)('email', { length: 255 }),
    phone: (0,varchar/* varchar */.yf)('phone', { length: 20 }),
    isPrimary: (0,columns_boolean/* boolean */.zM)('is_primary').notNull().default(false),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
});
// Stakeholder interactions (calls, emails, notes)
const stakeholderInteractions = (0,table/* pgTable */.cJ)('stakeholder_interactions', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    stakeholderId: (0,uuid/* uuid */.uR)('stakeholder_id').notNull().references(() => stakeholders.id, { onDelete: 'cascade' }),
    type: (0,varchar/* varchar */.yf)('type', { length: 50 }).notNull(), // CALL, EMAIL, MEETING, NOTE
    subject: (0,varchar/* varchar */.yf)('subject', { length: 255 }),
    notes: (0,columns_text/* text */.Qq)('notes'),
    interactionDate: (0,timestamp/* timestamp */.vE)('interaction_date').notNull().defaultNow(),
    createdBy: (0,uuid/* uuid */.uR)('created_by').notNull(),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
}, (table) => {
    return {
        stakeholderIdx: (0,indexes/* index */.Pe)('stakeholder_interactions_stakeholder_idx').on(table.stakeholderId),
        typeIdx: (0,indexes/* index */.Pe)('stakeholder_interactions_type_idx').on(table.type),
    };
});
// Relations
const stakeholdersRelations = (0,relations/* relations */.K1)(stakeholders, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [stakeholders.organizationId],
        references: [organizations.id],
    }),
    contacts: many(stakeholderContacts),
    interactions: many(stakeholderInteractions),
}));
const stakeholderContactsRelations = (0,relations/* relations */.K1)(stakeholderContacts, ({ one }) => ({
    stakeholder: one(stakeholders, {
        fields: [stakeholderContacts.stakeholderId],
        references: [stakeholders.id],
    }),
}));
const stakeholderInteractionsRelations = (0,relations/* relations */.K1)(stakeholderInteractions, ({ one }) => ({
    stakeholder: one(stakeholders, {
        fields: [stakeholderInteractions.stakeholderId],
        references: [stakeholders.id],
    }),
}));

;// CONCATENATED MODULE: ../../packages/db/src/schema/inventory.ts



// Enums
const stockMovementTypeEnum = (0,columns_enum/* pgEnum */.rL)('stock_movement_type', [
    'GRN', // Goods Received Note (stock in from supplier)
    'SALE', // Stock out from sale
    'ADJUSTMENT', // Manual adjustment (+ or -)
    'TRANSFER_IN', // Transfer from another location
    'TRANSFER_OUT', // Transfer to another location
    'RETURN', // Customer return (stock in)
    'DAMAGE', // Damaged goods (stock out)
    'THEFT' // Theft/loss (stock out)
]);
const locationTypeEnum = (0,columns_enum/* pgEnum */.rL)('location_type', [
    'WAREHOUSE',
    'STORE',
    'OTHER'
]);
// Item Categories Table
const itemCategories = (0,table/* pgTable */.cJ)('item_categories', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: (0,varchar/* varchar */.yf)('name', { length: 255 }).notNull(),
    description: (0,columns_text/* text */.Qq)('description'),
    parentId: (0,uuid/* uuid */.uR)('parent_id'), // For subcategories
    isActive: (0,columns_boolean/* boolean */.zM)('is_active').notNull().default(true),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow()
});
// Items (Products) Table
const items = (0,table/* pgTable */.cJ)('items', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: (0,varchar/* varchar */.yf)('name', { length: 255 }).notNull(),
    sku: (0,varchar/* varchar */.yf)('sku', { length: 100 }).notNull(),
    barcode: (0,varchar/* varchar */.yf)('barcode', { length: 100 }),
    description: (0,columns_text/* text */.Qq)('description'),
    categoryId: (0,uuid/* uuid */.uR)('category_id').references(() => itemCategories.id),
    unit: (0,varchar/* varchar */.yf)('unit', { length: 50 }).notNull().default('pcs'), // pcs, kg, liter, etc.
    type: (0,varchar/* varchar */.yf)('type', { length: 20 }).notNull().default('good'), // 'good' | 'service'
    costPrice: (0,numeric/* decimal */._)('cost_price', { precision: 10, scale: 2 }).notNull().default('0'),
    sellingPrice: (0,numeric/* decimal */._)('selling_price', { precision: 10, scale: 2 }).notNull().default('0'),
    reorderPoint: (0,integer/* integer */.nd)('reorder_point').default(0),
    reorderQuantity: (0,integer/* integer */.nd)('reorder_quantity').default(0),
    imageUrl: (0,columns_text/* text */.Qq)('image_url'),
    isActive: (0,columns_boolean/* boolean */.zM)('is_active').notNull().default(true),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow()
}, (table) => {
    return {
        orgIdx: (0,indexes/* index */.Pe)('items_org_idx').on(table.organizationId),
        categoryIdx: (0,indexes/* index */.Pe)('items_category_idx').on(table.categoryId),
        skuIdx: (0,indexes/* index */.Pe)('items_sku_idx').on(table.sku),
    };
});
// Locations Table
const locations = (0,table/* pgTable */.cJ)('locations', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: (0,varchar/* varchar */.yf)('name', { length: 255 }).notNull(),
    type: locationTypeEnum('type').notNull().default('STORE'),
    address: (0,columns_text/* text */.Qq)('address'),
    isActive: (0,columns_boolean/* boolean */.zM)('is_active').notNull().default(true),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow()
});
// Stock Movements Table (Event-Sourced)
const stockMovements = (0,table/* pgTable */.cJ)('stock_movements', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    itemId: (0,uuid/* uuid */.uR)('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
    locationId: (0,uuid/* uuid */.uR)('location_id').references(() => locations.id),
    type: stockMovementTypeEnum('type').notNull(),
    quantity: (0,integer/* integer */.nd)('quantity').notNull(), // Positive for in, negative for out
    referenceType: (0,varchar/* varchar */.yf)('reference_type', { length: 50 }), // 'sale', 'purchase', 'adjustment'
    referenceId: (0,uuid/* uuid */.uR)('reference_id'), // ID of the related document
    notes: (0,columns_text/* text */.Qq)('notes'),
    createdBy: (0,uuid/* uuid */.uR)('created_by'), // User who created the movement
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow()
}, (table) => {
    return {
        orgIdx: (0,indexes/* index */.Pe)('stock_movements_org_idx').on(table.organizationId),
        itemIdx: (0,indexes/* index */.Pe)('stock_movements_item_idx').on(table.itemId),
        locationIdx: (0,indexes/* index */.Pe)('stock_movements_location_idx').on(table.locationId),
    };
});
// Relations
const itemCategoriesRelations = (0,relations/* relations */.K1)(itemCategories, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [itemCategories.organizationId],
        references: [organizations.id]
    }),
    parent: one(itemCategories, {
        fields: [itemCategories.parentId],
        references: [itemCategories.id]
    }),
    items: many(items)
}));
const itemsRelations = (0,relations/* relations */.K1)(items, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [items.organizationId],
        references: [organizations.id]
    }),
    category: one(itemCategories, {
        fields: [items.categoryId],
        references: [itemCategories.id]
    }),
    stockMovements: many(stockMovements)
}));
const locationsRelations = (0,relations/* relations */.K1)(locations, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [locations.organizationId],
        references: [organizations.id]
    }),
    stockMovements: many(stockMovements)
}));
const stockMovementsRelations = (0,relations/* relations */.K1)(stockMovements, ({ one }) => ({
    organization: one(organizations, {
        fields: [stockMovements.organizationId],
        references: [organizations.id]
    }),
    item: one(items, {
        fields: [stockMovements.itemId],
        references: [items.id]
    }),
    location: one(locations, {
        fields: [stockMovements.locationId],
        references: [locations.id]
    })
}));
const stockTransferStatusEnum = (0,columns_enum/* pgEnum */.rL)('stock_transfer_status', [
    'DRAFT', // Created but not yet sent
    'IN_TRANSIT', // Stock deducted from source, on its way
    'COMPLETED', // Stock added to destination
    'CANCELLED' // Cancelled before being sent
]);
// Stock Transfers Table (Head)
const stockTransfers = (0,table/* pgTable */.cJ)('stock_transfers', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    transferNumber: (0,varchar/* varchar */.yf)('transfer_number', { length: 50 }).notNull(), // e.g., TRF-1001
    sourceLocationId: (0,uuid/* uuid */.uR)('source_location_id').notNull().references(() => locations.id),
    destinationLocationId: (0,uuid/* uuid */.uR)('destination_location_id').notNull().references(() => locations.id),
    status: stockTransferStatusEnum('status').notNull().default('DRAFT'),
    sentAt: (0,timestamp/* timestamp */.vE)('sent_at'),
    receivedAt: (0,timestamp/* timestamp */.vE)('received_at'),
    notes: (0,columns_text/* text */.Qq)('notes'),
    driverName: (0,varchar/* varchar */.yf)('driver_name', { length: 100 }),
    vehicleNumber: (0,varchar/* varchar */.yf)('vehicle_number', { length: 50 }),
    createdBy: (0,uuid/* uuid */.uR)('created_by'),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow()
});
// Stock Transfer Items (Lines)
const stockTransferItems = (0,table/* pgTable */.cJ)('stock_transfer_items', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    transferId: (0,uuid/* uuid */.uR)('transfer_id').notNull().references(() => stockTransfers.id, { onDelete: 'cascade' }),
    itemId: (0,uuid/* uuid */.uR)('item_id').notNull().references(() => items.id),
    quantitySent: (0,integer/* integer */.nd)('quantity_sent').notNull(),
    quantityReceived: (0,integer/* integer */.nd)('quantity_received'), // Null until received
    notes: (0,columns_text/* text */.Qq)('notes')
});
const stockTransfersRelations = (0,relations/* relations */.K1)(stockTransfers, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [stockTransfers.organizationId],
        references: [organizations.id]
    }),
    sourceLocation: one(locations, {
        fields: [stockTransfers.sourceLocationId],
        references: [locations.id],
        relationName: 'sourceLocation'
    }),
    destinationLocation: one(locations, {
        fields: [stockTransfers.destinationLocationId],
        references: [locations.id],
        relationName: 'destinationLocation'
    }),
    items: many(stockTransferItems)
}));
const stockTransferItemsRelations = (0,relations/* relations */.K1)(stockTransferItems, ({ one }) => ({
    transfer: one(stockTransfers, {
        fields: [stockTransferItems.transferId],
        references: [stockTransfers.id]
    }),
    item: one(items, {
        fields: [stockTransferItems.itemId],
        references: [items.id]
    })
}));

;// CONCATENATED MODULE: ../../packages/db/src/schema/sales.ts





// Sales Status Enum
const saleStatusEnum = (0,columns_enum/* pgEnum */.rL)('sale_status', ['DRAFT', 'COMPLETED', 'CANCELLED', 'RETURNED']);
// Payment Status Enum
const paymentStatusEnum = (0,columns_enum/* pgEnum */.rL)('payment_status', ['PENDING', 'PARTIAL', 'PAID', 'REFUNDED']);
// Payment Method Enum
const paymentMethodEnum = (0,columns_enum/* pgEnum */.rL)('payment_method', ['CASH', 'MOBILE_MONEY', 'CARD', 'BANK_TRANSFER', 'CREDIT']);
// Sales table
const sales = (0,table/* pgTable */.cJ)('sales', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    customerId: (0,uuid/* uuid */.uR)('customer_id').references(() => stakeholders.id),
    saleNumber: (0,varchar/* varchar */.yf)('sale_number', { length: 50 }).notNull(),
    status: saleStatusEnum('status').notNull().default('COMPLETED'),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('PENDING'),
    dueDate: (0,timestamp/* timestamp */.vE)('due_date'),
    subtotal: (0,numeric/* decimal */._)('subtotal', { precision: 15, scale: 2 }).notNull().default('0'),
    taxTotal: (0,numeric/* decimal */._)('tax_total', { precision: 15, scale: 2 }).notNull().default('0'),
    discountTotal: (0,numeric/* decimal */._)('discount_total', { precision: 15, scale: 2 }).notNull().default('0'),
    totalAmount: (0,numeric/* decimal */._)('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    paidAmount: (0,numeric/* decimal */._)('paid_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    notes: (0,columns_text/* text */.Qq)('notes'),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
    createdBy: (0,uuid/* uuid */.uR)('created_by'),
}, (table) => {
    return {
        orgIdx: (0,indexes/* index */.Pe)('sales_org_idx').on(table.organizationId),
        customerIdx: (0,indexes/* index */.Pe)('sales_customer_idx').on(table.customerId),
        createdAtIdx: (0,indexes/* index */.Pe)('sales_created_at_idx').on(table.createdAt),
    };
});
// Sale Items table
const saleItems = (0,table/* pgTable */.cJ)('sale_items', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    saleId: (0,uuid/* uuid */.uR)('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
    itemId: (0,uuid/* uuid */.uR)('item_id').notNull().references(() => items.id),
    quantity: (0,numeric/* decimal */._)('quantity', { precision: 15, scale: 2 }).notNull(),
    unitPrice: (0,numeric/* decimal */._)('unit_price', { precision: 15, scale: 2 }).notNull(),
    discount: (0,numeric/* decimal */._)('discount', { precision: 15, scale: 2 }).default('0'),
    tax: (0,numeric/* decimal */._)('tax', { precision: 15, scale: 2 }).default('0'),
    total: (0,numeric/* decimal */._)('total', { precision: 15, scale: 2 }).notNull(),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
}, (table) => {
    return {
        saleIdx: (0,indexes/* index */.Pe)('sale_items_sale_idx').on(table.saleId),
        itemIdx: (0,indexes/* index */.Pe)('sale_items_item_idx').on(table.itemId),
    };
});
// Payments table
const payments = (0,table/* pgTable */.cJ)('payments', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    saleId: (0,uuid/* uuid */.uR)('sale_id').references(() => sales.id, { onDelete: 'cascade' }),
    amount: (0,numeric/* decimal */._)('amount', { precision: 15, scale: 2 }).notNull(),
    method: paymentMethodEnum('method').notNull(),
    reference: (0,varchar/* varchar */.yf)('reference', { length: 100 }), // Trans ID, Receipt No, etc.
    notes: (0,columns_text/* text */.Qq)('notes'),
    paymentDate: (0,timestamp/* timestamp */.vE)('payment_date').notNull().defaultNow(),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    createdBy: (0,uuid/* uuid */.uR)('created_by'),
}, (table) => {
    return {
        orgIdx: (0,indexes/* index */.Pe)('payments_org_idx').on(table.organizationId),
        saleIdx: (0,indexes/* index */.Pe)('payments_sale_idx').on(table.saleId),
    };
});
// Relations
const salesRelations = (0,relations/* relations */.K1)(sales, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [sales.organizationId],
        references: [organizations.id],
    }),
    customer: one(stakeholders, {
        fields: [sales.customerId],
        references: [stakeholders.id],
    }),
    items: many(saleItems),
    payments: many(payments),
}));
const saleItemsRelations = (0,relations/* relations */.K1)(saleItems, ({ one }) => ({
    sale: one(sales, {
        fields: [saleItems.saleId],
        references: [sales.id],
    }),
    item: one(items, {
        fields: [saleItems.itemId],
        references: [items.id],
    }),
}));
const paymentsRelations = (0,relations/* relations */.K1)(payments, ({ one }) => ({
    organization: one(organizations, {
        fields: [payments.organizationId],
        references: [organizations.id],
    }),
    sale: one(sales, {
        fields: [payments.saleId],
        references: [sales.id],
    }),
}));

// EXTERNAL MODULE: ../../node_modules/drizzle-orm/pg-core/columns/date.js
var date = __webpack_require__(656);
;// CONCATENATED MODULE: ../../packages/db/src/schema/purchases.ts





// Enums
const purchaseOrderStatusEnum = (0,columns_enum/* pgEnum */.rL)('purchase_order_status', [
    'DRAFT',
    'PENDING_APPROVAL',
    'ISSUED', // Sent to supplier
    'PARTIAL_RECEIVED',
    'COMPLETED', // Fully received
    'CANCELLED'
]);
const grnStatusEnum = (0,columns_enum/* pgEnum */.rL)('grn_status', [
    'DRAFT',
    'VERIFIED', // Stock updated
    'CANCELLED'
]);
const invoiceStatusEnum = (0,columns_enum/* pgEnum */.rL)('invoice_status', [
    'DRAFT',
    'PENDING', // Validated but unpaid
    'PARTIAL_PAID',
    'PAID',
    'OVERDUE',
    'CANCELLED'
]);
// Purchase Orders
const purchaseOrders = (0,table/* pgTable */.cJ)('purchase_orders', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    supplierId: (0,uuid/* uuid */.uR)('supplier_id').notNull().references(() => stakeholders.id), // Logic must ensure type='SUPPLIER'
    orderNumber: (0,varchar/* varchar */.yf)('order_number', { length: 50 }).notNull(), // PO-2024-001
    issueDate: (0,date/* date */.p6)('issue_date').notNull().defaultNow(),
    expectedDeliveryDate: (0,date/* date */.p6)('expected_delivery_date'),
    status: purchaseOrderStatusEnum('status').notNull().default('DRAFT'),
    totalAmount: (0,numeric/* decimal */._)('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    notes: (0,columns_text/* text */.Qq)('notes'),
    termsAndConditions: (0,columns_text/* text */.Qq)('terms_and_conditions'),
    // Audit
    createdBy: (0,uuid/* uuid */.uR)('created_by').notNull(),
    approvedBy: (0,uuid/* uuid */.uR)('approved_by'),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow()
});
const purchaseOrderLines = (0,table/* pgTable */.cJ)('purchase_order_lines', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    purchaseOrderId: (0,uuid/* uuid */.uR)('purchase_order_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    itemId: (0,uuid/* uuid */.uR)('item_id').notNull().references(() => items.id),
    quantity: (0,integer/* integer */.nd)('quantity').notNull(),
    receivedQuantity: (0,integer/* integer */.nd)('received_quantity').notNull().default(0),
    unitCost: (0,numeric/* decimal */._)('unit_cost', { precision: 15, scale: 2 }).notNull(),
    totalCost: (0,numeric/* decimal */._)('total_cost', { precision: 15, scale: 2 }).notNull(), // quantity * unitCost
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow()
});
// Goods Received Notes (GRN)
const grns = (0,table/* pgTable */.cJ)('grns', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    purchaseOrderId: (0,uuid/* uuid */.uR)('purchase_order_id').references(() => purchaseOrders.id), // Can be standalone?
    supplierId: (0,uuid/* uuid */.uR)('supplier_id').notNull().references(() => stakeholders.id),
    grnNumber: (0,varchar/* varchar */.yf)('grn_number', { length: 50 }).notNull(), // GRN-2024-001
    deliveryNoteNumber: (0,varchar/* varchar */.yf)('delivery_note_number', { length: 100 }), // Supplier's doc ref
    receivedDate: (0,date/* date */.p6)('received_date').notNull().defaultNow(),
    status: grnStatusEnum('status').notNull().default('DRAFT'),
    notes: (0,columns_text/* text */.Qq)('notes'),
    receivedBy: (0,uuid/* uuid */.uR)('received_by').notNull(),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow()
});
const grnLines = (0,table/* pgTable */.cJ)('grn_lines', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    grnId: (0,uuid/* uuid */.uR)('grn_id').notNull().references(() => grns.id, { onDelete: 'cascade' }),
    purchaseOrderLineId: (0,uuid/* uuid */.uR)('po_line_id').references(() => purchaseOrderLines.id), // Link for tracking
    itemId: (0,uuid/* uuid */.uR)('item_id').notNull().references(() => items.id),
    quantityReceived: (0,integer/* integer */.nd)('quantity_received').notNull(),
    notes: (0,columns_text/* text */.Qq)('notes'), // Damaged items comments etc.
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow()
});
// Supplier Invoices (Bills)
const supplierInvoices = (0,table/* pgTable */.cJ)('supplier_invoices', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    supplierId: (0,uuid/* uuid */.uR)('supplier_id').notNull().references(() => stakeholders.id),
    purchaseOrderId: (0,uuid/* uuid */.uR)('purchase_order_id').references(() => purchaseOrders.id),
    grnId: (0,uuid/* uuid */.uR)('grn_id').references(() => grns.id), // Direct GRN link if 1-to-1
    invoiceNumber: (0,varchar/* varchar */.yf)('invoice_number', { length: 100 }).notNull(), // Supplier's invoice #
    invoiceDate: (0,date/* date */.p6)('invoice_date').notNull(),
    dueDate: (0,date/* date */.p6)('due_date'),
    status: invoiceStatusEnum('status').notNull().default('DRAFT'),
    subtotal: (0,numeric/* decimal */._)('subtotal', { precision: 15, scale: 2 }).notNull(),
    taxTotal: (0,numeric/* decimal */._)('tax_total', { precision: 15, scale: 2 }).notNull().default('0'),
    totalAmount: (0,numeric/* decimal */._)('total_amount', { precision: 15, scale: 2 }).notNull(),
    paidAmount: (0,numeric/* decimal */._)('paid_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow()
});
// Payment Method Enum for Purchases
const purchasePaymentMethodEnum = (0,columns_enum/* pgEnum */.rL)('purchase_payment_method', [
    'CASH',
    'BANK_TRANSFER',
    'CHEQUE',
    'MOBILE_MONEY',
    'OTHER'
]);
// Purchase Payments (Outgoing Payments to Suppliers)
const purchasePayments = (0,table/* pgTable */.cJ)('purchase_payments', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    supplierInvoiceId: (0,uuid/* uuid */.uR)('supplier_invoice_id').notNull().references(() => supplierInvoices.id),
    supplierId: (0,uuid/* uuid */.uR)('supplier_id').notNull().references(() => stakeholders.id),
    amount: (0,numeric/* decimal */._)('amount', { precision: 15, scale: 2 }).notNull(),
    paymentMethod: purchasePaymentMethodEnum('payment_method').notNull(),
    paymentDate: (0,date/* date */.p6)('payment_date').notNull().defaultNow(),
    reference: (0,varchar/* varchar */.yf)('reference', { length: 100 }), // Cheque #, Transaction ID, etc.
    notes: (0,columns_text/* text */.Qq)('notes'),
    createdBy: (0,uuid/* uuid */.uR)('created_by').notNull(),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow()
});
// Relations
const purchaseOrdersRelations = (0,relations/* relations */.K1)(purchaseOrders, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [purchaseOrders.organizationId],
        references: [organizations.id]
    }),
    supplier: one(stakeholders, {
        fields: [purchaseOrders.supplierId],
        references: [stakeholders.id]
    }),
    lines: many(purchaseOrderLines),
    grns: many(grns),
    invoices: many(supplierInvoices)
}));
const purchaseOrderLinesRelations = (0,relations/* relations */.K1)(purchaseOrderLines, ({ one }) => ({
    purchaseOrder: one(purchaseOrders, {
        fields: [purchaseOrderLines.purchaseOrderId],
        references: [purchaseOrders.id]
    }),
    item: one(items, {
        fields: [purchaseOrderLines.itemId],
        references: [items.id]
    })
}));
const grnsRelations = (0,relations/* relations */.K1)(grns, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [grns.organizationId],
        references: [organizations.id]
    }),
    purchaseOrder: one(purchaseOrders, {
        fields: [grns.purchaseOrderId],
        references: [purchaseOrders.id]
    }),
    supplier: one(stakeholders, {
        fields: [grns.supplierId],
        references: [stakeholders.id]
    }),
    lines: many(grnLines),
    invoices: many(supplierInvoices)
}));
const grnLinesRelations = (0,relations/* relations */.K1)(grnLines, ({ one }) => ({
    grn: one(grns, {
        fields: [grnLines.grnId],
        references: [grns.id]
    }),
    item: one(items, {
        fields: [grnLines.itemId],
        references: [items.id]
    }),
    poLine: one(purchaseOrderLines, {
        fields: [grnLines.purchaseOrderLineId],
        references: [purchaseOrderLines.id]
    })
}));
const supplierInvoicesRelations = (0,relations/* relations */.K1)(supplierInvoices, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [supplierInvoices.organizationId],
        references: [organizations.id]
    }),
    supplier: one(stakeholders, {
        fields: [supplierInvoices.supplierId],
        references: [stakeholders.id]
    }),
    purchaseOrder: one(purchaseOrders, {
        fields: [supplierInvoices.purchaseOrderId],
        references: [purchaseOrders.id]
    }),
    grn: one(grns, {
        fields: [supplierInvoices.grnId],
        references: [grns.id]
    }),
    payments: many(purchasePayments)
}));
const purchasePaymentsRelations = (0,relations/* relations */.K1)(purchasePayments, ({ one }) => ({
    organization: one(organizations, {
        fields: [purchasePayments.organizationId],
        references: [organizations.id]
    }),
    supplierInvoice: one(supplierInvoices, {
        fields: [purchasePayments.supplierInvoiceId],
        references: [supplierInvoices.id]
    }),
    supplier: one(stakeholders, {
        fields: [purchasePayments.supplierId],
        references: [stakeholders.id]
    })
}));

;// CONCATENATED MODULE: ../../packages/db/src/schema/expenses.ts



// Expense Category Enum
const expenseCategoryTypeEnum = (0,columns_enum/* pgEnum */.rL)('expense_category_type', [
    'OPERATING', // Day-to-day operations
    'ADMINISTRATIVE', // Admin and office
    'MARKETING', // Marketing and advertising
    'PAYROLL', // Salaries and wages
    'UTILITIES', // Electricity, water, internet
    'RENT', // Rent and lease
    'OTHER' // Miscellaneous
]);
// Expense Categories Table
const expenseCategories = (0,table/* pgTable */.cJ)('expense_categories', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: (0,varchar/* varchar */.yf)('name', { length: 100 }).notNull(),
    type: expenseCategoryTypeEnum('type').notNull().default('OTHER'),
    description: (0,columns_text/* text */.Qq)('description'),
    isActive: (0,columns_boolean/* boolean */.zM)('is_active').notNull().default(true),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow()
});
// Expenses Table
const expenses = (0,table/* pgTable */.cJ)('expenses', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    categoryId: (0,uuid/* uuid */.uR)('category_id').references(() => expenseCategories.id),
    description: (0,columns_text/* text */.Qq)('description').notNull(),
    amount: (0,numeric/* decimal */._)('amount', { precision: 15, scale: 2 }).notNull(),
    expenseDate: (0,date/* date */.p6)('expense_date').notNull().defaultNow(),
    reference: (0,varchar/* varchar */.yf)('reference', { length: 100 }), // Receipt #, Invoice #
    paymentMethod: (0,varchar/* varchar */.yf)('payment_method', { length: 50 }), // Cash, Bank, Mobile Money
    notes: (0,columns_text/* text */.Qq)('notes'),
    createdBy: (0,uuid/* uuid */.uR)('created_by').notNull(),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow()
});
// Relations
const expenseCategoriesRelations = (0,relations/* relations */.K1)(expenseCategories, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [expenseCategories.organizationId],
        references: [organizations.id]
    }),
    expenses: many(expenses)
}));
const expensesRelations = (0,relations/* relations */.K1)(expenses, ({ one }) => ({
    organization: one(organizations, {
        fields: [expenses.organizationId],
        references: [organizations.id]
    }),
    category: one(expenseCategories, {
        fields: [expenses.categoryId],
        references: [expenseCategories.id]
    })
}));

;// CONCATENATED MODULE: ../../packages/db/src/schema/banking.ts



// Enums
const bankAccountTypeEnum = (0,columns_enum/* pgEnum */.rL)('bank_account_type', [
    'CASH',
    'BANK',
    'MOBILE_MONEY'
]);
const transactionTypeEnum = (0,columns_enum/* pgEnum */.rL)('bank_transaction_type', [
    'DEPOSIT',
    'WITHDRAWAL'
]);
const transactionReferenceTypeEnum = (0,columns_enum/* pgEnum */.rL)('bank_transaction_reference_type', [
    'SALE',
    'PURCHASE',
    'EXPENSE',
    'TRANSFER',
    'ADJUSTMENT'
]);
// Bank Accounts Table
const bankAccounts = (0,table/* pgTable */.cJ)('bank_accounts', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: (0,varchar/* varchar */.yf)('name', { length: 100 }).notNull(),
    type: bankAccountTypeEnum('type').notNull(),
    accountNumber: (0,varchar/* varchar */.yf)('account_number', { length: 50 }),
    bankName: (0,varchar/* varchar */.yf)('bank_name', { length: 100 }), // e.g. CRDB, NMB, M-Pesa
    currency: (0,varchar/* varchar */.yf)('currency', { length: 10 }).default('TZS').notNull(),
    currentBalance: (0,numeric/* decimal */._)('current_balance', { precision: 15, scale: 2 }).notNull().default('0'),
    isActive: (0,columns_boolean/* boolean */.zM)('is_active').notNull().default(true),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow()
});
// Bank Transactions Table
const bankTransactions = (0,table/* pgTable */.cJ)('bank_transactions', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    accountId: (0,uuid/* uuid */.uR)('account_id').notNull().references(() => bankAccounts.id),
    type: transactionTypeEnum('type').notNull(),
    amount: (0,numeric/* decimal */._)('amount', { precision: 15, scale: 2 }).notNull(),
    transactionDate: (0,date/* date */.p6)('transaction_date').notNull().defaultNow(),
    description: (0,columns_text/* text */.Qq)('description'),
    referenceType: transactionReferenceTypeEnum('reference_type').notNull().default('ADJUSTMENT'),
    referenceId: (0,uuid/* uuid */.uR)('reference_id'), // Link to Sale, PO, etc.
    transferId: (0,uuid/* uuid */.uR)('transfer_id'), // If transfer, links the two legs
    createdBy: (0,uuid/* uuid */.uR)('created_by').notNull(),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow()
});
// Relations
const bankAccountsRelations = (0,relations/* relations */.K1)(bankAccounts, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [bankAccounts.organizationId],
        references: [organizations.id]
    }),
    transactions: many(bankTransactions)
}));
const bankTransactionsRelations = (0,relations/* relations */.K1)(bankTransactions, ({ one }) => ({
    organization: one(organizations, {
        fields: [bankTransactions.organizationId],
        references: [organizations.id]
    }),
    account: one(bankAccounts, {
        fields: [bankTransactions.accountId],
        references: [bankAccounts.id]
    })
}));

;// CONCATENATED MODULE: ../../packages/db/src/schema/returns.ts






// Enums
const returnStatusEnum = (0,columns_enum/* pgEnum */.rL)('return_status', ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']);
const returnConditionEnum = (0,columns_enum/* pgEnum */.rL)('return_condition', ['GOOD', 'DAMAGED', 'EXPIRED', 'OTHER']);
const refundStatusEnum = (0,columns_enum/* pgEnum */.rL)('refund_status', ['PENDING', 'PARTIAL', 'REFUNDED', 'CREDITED']);
// Returns Table
const returns = (0,table/* pgTable */.cJ)('returns', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    saleId: (0,uuid/* uuid */.uR)('sale_id').notNull().references(() => sales.id),
    customerId: (0,uuid/* uuid */.uR)('customer_id').references(() => stakeholders.id),
    returnNumber: (0,varchar/* varchar */.yf)('return_number', { length: 50 }).notNull(),
    status: returnStatusEnum('status').notNull().default('PENDING'),
    refundStatus: refundStatusEnum('refund_status').notNull().default('PENDING'),
    totalAmount: (0,numeric/* decimal */._)('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    refundedAmount: (0,numeric/* decimal */._)('refunded_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    reason: (0,columns_text/* text */.Qq)('reason'),
    notes: (0,columns_text/* text */.Qq)('notes'),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
    createdBy: (0,uuid/* uuid */.uR)('created_by'),
    approvedBy: (0,uuid/* uuid */.uR)('approved_by'),
});
// Return Items Table
const returnItems = (0,table/* pgTable */.cJ)('return_items', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    returnId: (0,uuid/* uuid */.uR)('return_id').notNull().references(() => returns.id, { onDelete: 'cascade' }),
    itemId: (0,uuid/* uuid */.uR)('item_id').notNull().references(() => items.id),
    quantity: (0,integer/* integer */.nd)('quantity').notNull(),
    unitPrice: (0,numeric/* decimal */._)('unit_price', { precision: 15, scale: 2 }).notNull(),
    total: (0,numeric/* decimal */._)('total', { precision: 15, scale: 2 }).notNull(),
    condition: returnConditionEnum('condition').notNull().default('GOOD'),
    restock: (0,columns_boolean/* boolean */.zM)('restock').notNull().default(true), // Whether to add back to inventory
    reason: (0,columns_text/* text */.Qq)('reason'),
});
// Relations
const returnsRelations = (0,relations/* relations */.K1)(returns, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [returns.organizationId],
        references: [organizations.id],
    }),
    sale: one(sales, {
        fields: [returns.saleId],
        references: [sales.id],
    }),
    customer: one(stakeholders, {
        fields: [returns.customerId],
        references: [stakeholders.id],
    }),
    items: many(returnItems),
}));
const returnItemsRelations = (0,relations/* relations */.K1)(returnItems, ({ one }) => ({
    return: one(returns, {
        fields: [returnItems.returnId],
        references: [returns.id],
    }),
    item: one(items, {
        fields: [returnItems.itemId],
        references: [items.id],
    }),
}));

;// CONCATENATED MODULE: ../../packages/db/src/schema/quotations.ts






const quotationStatusEnum = (0,columns_enum/* pgEnum */.rL)('quotation_status', ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED']);
const quotations = (0,table/* pgTable */.cJ)('quotations', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    customerId: (0,uuid/* uuid */.uR)('customer_id').references(() => stakeholders.id),
    quotationNumber: (0,varchar/* varchar */.yf)('quotation_number', { length: 50 }).notNull(),
    status: quotationStatusEnum('status').notNull().default('DRAFT'),
    validUntil: (0,timestamp/* timestamp */.vE)('valid_until'),
    subtotal: (0,numeric/* decimal */._)('subtotal', { precision: 15, scale: 2 }).notNull().default('0'),
    taxTotal: (0,numeric/* decimal */._)('tax_total', { precision: 15, scale: 2 }).notNull().default('0'),
    totalAmount: (0,numeric/* decimal */._)('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    notes: (0,columns_text/* text */.Qq)('notes'),
    terms: (0,columns_text/* text */.Qq)('terms'),
    createdBy: (0,uuid/* uuid */.uR)('created_by'),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').defaultNow().notNull(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').defaultNow().notNull(),
    convertedSaleId: (0,uuid/* uuid */.uR)('converted_sale_id').references(() => sales.id), // Link to sale if converted
});
const quotationItems = (0,table/* pgTable */.cJ)('quotation_items', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    quotationId: (0,uuid/* uuid */.uR)('quotation_id').notNull().references(() => quotations.id, { onDelete: 'cascade' }),
    itemId: (0,uuid/* uuid */.uR)('item_id').references(() => items.id),
    quantity: (0,numeric/* decimal */._)('quantity', { precision: 10, scale: 2 }).notNull(),
    unitPrice: (0,numeric/* decimal */._)('unit_price', { precision: 15, scale: 2 }).notNull(),
    taxRate: (0,numeric/* decimal */._)('tax_rate', { precision: 5, scale: 2 }).default('0'),
    taxAmount: (0,numeric/* decimal */._)('tax_amount', { precision: 15, scale: 2 }).default('0'),
    total: (0,numeric/* decimal */._)('total', { precision: 15, scale: 2 }).notNull(),
    notes: (0,columns_text/* text */.Qq)('notes'),
});
// Relations
const quotationsRelations = (0,relations/* relations */.K1)(quotations, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [quotations.organizationId],
        references: [organizations.id],
    }),
    customer: one(stakeholders, {
        fields: [quotations.customerId],
        references: [stakeholders.id],
    }),
    items: many(quotationItems),
    convertedSale: one(sales, {
        fields: [quotations.convertedSaleId],
        references: [sales.id],
    }),
}));
const quotationItemsRelations = (0,relations/* relations */.K1)(quotationItems, ({ one }) => ({
    quotation: one(quotations, {
        fields: [quotationItems.quotationId],
        references: [quotations.id],
    }),
    item: one(items, {
        fields: [quotationItems.itemId],
        references: [items.id],
    }),
}));

;// CONCATENATED MODULE: ../../packages/db/src/schema/hr.ts


const leaveStatusEnum = (0,columns_enum/* pgEnum */.rL)('leave_status', ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);
const advanceStatusEnum = (0,columns_enum/* pgEnum */.rL)('advance_status', ['PENDING', 'APPROVED', 'REJECTED', 'PAID', 'REPAID']);
const employees = (0,table/* pgTable */.cJ)('employees', {
    id: (0,uuid/* uuid */.uR)('id').defaultRandom().primaryKey(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    firstName: (0,columns_text/* text */.Qq)('first_name').notNull(),
    lastName: (0,columns_text/* text */.Qq)('last_name').notNull(),
    email: (0,columns_text/* text */.Qq)('email'),
    phone: (0,columns_text/* text */.Qq)('phone'),
    role: (0,columns_text/* text */.Qq)('role').notNull(),
    department: (0,columns_text/* text */.Qq)('department'),
    baseSalary: (0,numeric/* decimal */._)('base_salary', { precision: 12, scale: 2 }).notNull().default('0'),
    joinedAt: (0,timestamp/* timestamp */.vE)('joined_at').notNull().defaultNow(),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
});
const leaveRequests = (0,table/* pgTable */.cJ)('leave_requests', {
    id: (0,uuid/* uuid */.uR)('id').defaultRandom().primaryKey(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    employeeId: (0,uuid/* uuid */.uR)('employee_id')
        .notNull()
        .references(() => employees.id, { onDelete: 'cascade' }),
    startDate: (0,timestamp/* timestamp */.vE)('start_date').notNull(),
    endDate: (0,timestamp/* timestamp */.vE)('end_date').notNull(),
    type: (0,columns_text/* text */.Qq)('type').notNull(), // e.g., ANNUAL, SICK, MATERNITY
    status: leaveStatusEnum('status').notNull().default('PENDING'),
    reason: (0,columns_text/* text */.Qq)('reason'),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
});
const advances = (0,table/* pgTable */.cJ)('advances', {
    id: (0,uuid/* uuid */.uR)('id').defaultRandom().primaryKey(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    employeeId: (0,uuid/* uuid */.uR)('employee_id')
        .notNull()
        .references(() => employees.id, { onDelete: 'cascade' }),
    amount: (0,numeric/* decimal */._)('amount', { precision: 12, scale: 2 }).notNull(),
    reason: (0,columns_text/* text */.Qq)('reason'),
    status: advanceStatusEnum('status').notNull().default('PENDING'),
    repaymentDate: (0,timestamp/* timestamp */.vE)('repayment_date'),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
});

;// CONCATENATED MODULE: ../../packages/db/src/schema/projects.ts




// Project Status Enum
const projectStatusEnum = (0,columns_enum/* pgEnum */.rL)('project_status', ['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']);
// Projects table
const projects = (0,table/* pgTable */.cJ)('projects', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: (0,varchar/* varchar */.yf)('name', { length: 255 }).notNull(),
    description: (0,columns_text/* text */.Qq)('description'),
    status: projectStatusEnum('status').notNull().default('ACTIVE'),
    startDate: (0,timestamp/* timestamp */.vE)('start_date'),
    endDate: (0,timestamp/* timestamp */.vE)('end_date'),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
});
// Project Tasks table
const projectTasks = (0,table/* pgTable */.cJ)('project_tasks', {
    id: (0,uuid/* uuid */.uR)('id').primaryKey().defaultRandom(),
    projectId: (0,uuid/* uuid */.uR)('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    title: (0,varchar/* varchar */.yf)('title', { length: 255 }).notNull(),
    description: (0,columns_text/* text */.Qq)('description'),
    status: (0,varchar/* varchar */.yf)('status', { length: 50 }).notNull().default('PENDING'), // PENDING, IN_PROGRESS, COMPLETED
    dueDate: (0,timestamp/* timestamp */.vE)('due_date'),
    assignedTo: (0,uuid/* uuid */.uR)('assigned_to').references(() => employees.id, { onDelete: 'set null' }),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
});
// Relations
const projectsRelations = (0,relations/* relations */.K1)(projects, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [projects.organizationId],
        references: [organizations.id],
    }),
    tasks: many(projectTasks),
}));
const projectTasksRelations = (0,relations/* relations */.K1)(projectTasks, ({ one }) => ({
    project: one(projects, {
        fields: [projectTasks.projectId],
        references: [projects.id],
    }),
    assignee: one(employees, {
        fields: [projectTasks.assignedTo],
        references: [employees.id],
    }),
}));

;// CONCATENATED MODULE: ../../packages/db/src/schema/payroll.ts



const payrollRunStatusEnum = (0,columns_enum/* pgEnum */.rL)('payroll_run_status', ['DRAFT', 'APPROVED', 'PROCESSED']);
const payrollItemTypeEnum = (0,columns_enum/* pgEnum */.rL)('payroll_item_type', ['EARNING', 'DEDUCTION']);
const payrollRuns = (0,table/* pgTable */.cJ)('payroll_runs', {
    id: (0,uuid/* uuid */.uR)('id').defaultRandom().primaryKey(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    periodStart: (0,timestamp/* timestamp */.vE)('period_start').notNull(),
    periodEnd: (0,timestamp/* timestamp */.vE)('period_end').notNull(),
    status: payrollRunStatusEnum('status').notNull().default('DRAFT'),
    totalAmount: (0,numeric/* decimal */._)('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
});
const payrollItems = (0,table/* pgTable */.cJ)('payroll_items', {
    id: (0,uuid/* uuid */.uR)('id').defaultRandom().primaryKey(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    type: payrollItemTypeEnum('type').notNull(),
    name: (0,columns_text/* text */.Qq)('name').notNull(),
    defaultAmount: (0,numeric/* decimal */._)('default_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    isTaxable: (0,columns_boolean/* boolean */.zM)('is_taxable').notNull().default(true),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
});
const payrollRunLines = (0,table/* pgTable */.cJ)('payroll_run_lines', {
    id: (0,uuid/* uuid */.uR)('id').defaultRandom().primaryKey(),
    runId: (0,uuid/* uuid */.uR)('run_id')
        .notNull()
        .references(() => payrollRuns.id, { onDelete: 'cascade' }),
    employeeId: (0,uuid/* uuid */.uR)('employee_id')
        .notNull()
        .references(() => employees.id, { onDelete: 'cascade' }),
    baseSalary: (0,numeric/* decimal */._)('base_salary', { precision: 12, scale: 2 }).notNull().default('0'),
    allowances: (0,numeric/* decimal */._)('allowances', { precision: 12, scale: 2 }).notNull().default('0'),
    deductions: (0,numeric/* decimal */._)('deductions', { precision: 12, scale: 2 }).notNull().default('0'),
    netPay: (0,numeric/* decimal */._)('net_pay', { precision: 12, scale: 2 }).notNull().default('0'),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
});
const taxTables = (0,table/* pgTable */.cJ)('tax_tables', {
    id: (0,uuid/* uuid */.uR)('id').defaultRandom().primaryKey(),
    organizationId: (0,uuid/* uuid */.uR)('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    name: (0,columns_text/* text */.Qq)('name').notNull(), // e.g., 'TZ PAYE 2024'
    rulesJson: (0,jsonb/* jsonb */.Fx)('rules_json').notNull(), // { brackets: [{ min, max, rate, baseTax }] }
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
});

;// CONCATENATED MODULE: ../../packages/db/src/schema/index.ts
// Export all schemas













// EXTERNAL MODULE: ../../node_modules/drizzle-orm/sql/sql.js
var sql = __webpack_require__(3361);
;// CONCATENATED MODULE: ../../packages/db/src/migrate.ts

async function runMigrations(db) {
    console.log('🚀 Starting database migration...');
    try {
        // Enums
        console.log('Checking enums...');
        await db.execute((0,sql/* sql */.ll) `DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stakeholder_type') THEN
                CREATE TYPE "public"."stakeholder_type" AS ENUM('CUSTOMER', 'SUPPLIER');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_type') THEN
                CREATE TYPE "public"."location_type" AS ENUM('WAREHOUSE', 'STORE', 'OTHER');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_movement_type') THEN
                CREATE TYPE "public"."stock_movement_type" AS ENUM('GRN', 'SALE', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT', 'RETURN', 'DAMAGE', 'THEFT');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_status') THEN
                CREATE TYPE "public"."sale_status" AS ENUM('DRAFT', 'COMPLETED', 'CANCELLED', 'RETURNED');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
                CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PARTIAL', 'PAID', 'REFUNDED');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
                CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'MOBILE_MONEY', 'CARD', 'BANK_TRANSFER', 'CREDIT');
            END IF;
        END $$;`);
        // Tables
        console.log('Checking tables...');
        await db.execute((0,sql/* sql */.ll) `
            CREATE TABLE IF NOT EXISTS "item_categories" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "name" varchar(255) NOT NULL,
                "description" text,
                "parent_id" uuid,
                "is_active" boolean DEFAULT true NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        await db.execute((0,sql/* sql */.ll) `
            CREATE TABLE IF NOT EXISTS "items" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "name" varchar(255) NOT NULL,
                "sku" varchar(100) NOT NULL,
                "barcode" varchar(100),
                "description" text,
                "category_id" uuid REFERENCES "item_categories"("id"),
                "unit" varchar(50) DEFAULT 'pcs' NOT NULL,
                "type" varchar(20) DEFAULT 'good' NOT NULL,
                "cost_price" numeric(10, 2) DEFAULT '0' NOT NULL,
                "selling_price" numeric(10, 2) DEFAULT '0' NOT NULL,
                "reorder_point" integer DEFAULT 0,
                "reorder_quantity" integer DEFAULT 0,
                "image_url" text,
                "is_active" boolean DEFAULT true NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        // Add image_url column if it doesn't exist
        await db.execute((0,sql/* sql */.ll) `
            ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "image_url" text;
        `);
        await db.execute((0,sql/* sql */.ll) `
            CREATE TABLE IF NOT EXISTS "locations" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "name" varchar(255) NOT NULL,
                "type" "location_type" DEFAULT 'STORE' NOT NULL,
                "address" text,
                "is_active" boolean DEFAULT true NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        await db.execute((0,sql/* sql */.ll) `
            CREATE TABLE IF NOT EXISTS "stock_movements" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "item_id" uuid NOT NULL REFERENCES "items"("id") ON DELETE cascade,
                "location_id" uuid REFERENCES "locations"("id"),
                "type" "stock_movement_type" NOT NULL,
                "quantity" integer NOT NULL,
                "reference_type" varchar(50),
                "reference_id" uuid,
                "notes" text,
                "created_by" uuid,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        await db.execute((0,sql/* sql */.ll) `
            CREATE TABLE IF NOT EXISTS "sales" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "customer_id" uuid REFERENCES "stakeholders"("id"),
                "sale_number" varchar(50) NOT NULL,
                "status" "sale_status" DEFAULT 'COMPLETED' NOT NULL,
                "payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL,
                "subtotal" numeric(15, 2) DEFAULT '0' NOT NULL,
                "tax_total" numeric(15, 2) DEFAULT '0' NOT NULL,
                "discount_total" numeric(15, 2) DEFAULT '0' NOT NULL,
                "total_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
                "paid_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
                "due_date" timestamp,
                "notes" text,
                "created_by" uuid,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        // Add due_date column for existing deployments
        await db.execute((0,sql/* sql */.ll) `
            ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "due_date" timestamp;
        `);
        await db.execute((0,sql/* sql */.ll) `
            CREATE TABLE IF NOT EXISTS "sale_items" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "sale_id" uuid NOT NULL REFERENCES "sales"("id") ON DELETE cascade,
                "item_id" uuid NOT NULL REFERENCES "items"("id"),
                "quantity" numeric(15, 2) NOT NULL,
                "unit_price" numeric(15, 2) NOT NULL,
                "discount" numeric(15, 2) DEFAULT '0',
                "tax" numeric(15, 2) DEFAULT '0',
                "total" numeric(15, 2) NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        await db.execute((0,sql/* sql */.ll) `
            CREATE TABLE IF NOT EXISTS "payments" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "sale_id" uuid REFERENCES "sales"("id") ON DELETE cascade,
                "amount" numeric(15, 2) NOT NULL,
                "method" "payment_method" NOT NULL,
                "reference" varchar(100),
                "notes" text,
                "payment_date" timestamp DEFAULT now() NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "created_by" uuid
            );
        `);
        // ── Returns & Quotations Enums ──
        console.log('Checking returns & quotations enums...');
        await db.execute((0,sql/* sql */.ll) `DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'return_status') THEN
                CREATE TYPE "public"."return_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'return_condition') THEN
                CREATE TYPE "public"."return_condition" AS ENUM('GOOD', 'DAMAGED', 'EXPIRED', 'OTHER');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status') THEN
                CREATE TYPE "public"."refund_status" AS ENUM('PENDING', 'PARTIAL', 'REFUNDED', 'CREDITED');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quotation_status') THEN
                CREATE TYPE "public"."quotation_status" AS ENUM('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED');
            END IF;
        END $$;`);
        // ── Returns Tables ──
        console.log('Checking returns tables...');
        await db.execute((0,sql/* sql */.ll) `
            CREATE TABLE IF NOT EXISTS "returns" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "sale_id" uuid NOT NULL REFERENCES "sales"("id"),
                "customer_id" uuid REFERENCES "stakeholders"("id"),
                "return_number" varchar(50) NOT NULL,
                "status" "return_status" DEFAULT 'PENDING' NOT NULL,
                "refund_status" "refund_status" DEFAULT 'PENDING' NOT NULL,
                "total_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
                "refunded_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
                "reason" text,
                "notes" text,
                "created_by" uuid,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        await db.execute((0,sql/* sql */.ll) `
            CREATE TABLE IF NOT EXISTS "return_items" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "return_id" uuid NOT NULL REFERENCES "returns"("id") ON DELETE cascade,
                "item_id" uuid REFERENCES "items"("id"),
                "quantity" numeric(10, 2) NOT NULL,
                "unit_price" numeric(15, 2) NOT NULL,
                "total" numeric(15, 2) NOT NULL,
                "condition" "return_condition" DEFAULT 'GOOD' NOT NULL,
                "restock" boolean DEFAULT true NOT NULL,
                "reason" text
            );
        `);
        // ── Quotations Tables ──
        console.log('Checking quotations tables...');
        await db.execute((0,sql/* sql */.ll) `
            CREATE TABLE IF NOT EXISTS "quotations" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "customer_id" uuid REFERENCES "stakeholders"("id"),
                "quotation_number" varchar(50) NOT NULL,
                "status" "quotation_status" DEFAULT 'DRAFT' NOT NULL,
                "valid_until" timestamp,
                "subtotal" numeric(15, 2) DEFAULT '0' NOT NULL,
                "tax_total" numeric(15, 2) DEFAULT '0' NOT NULL,
                "total_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
                "notes" text,
                "terms" text,
                "created_by" uuid,
                "converted_sale_id" uuid REFERENCES "sales"("id"),
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        await db.execute((0,sql/* sql */.ll) `
            CREATE TABLE IF NOT EXISTS "quotation_items" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "quotation_id" uuid NOT NULL REFERENCES "quotations"("id") ON DELETE cascade,
                "item_id" uuid REFERENCES "items"("id"),
                "quantity" numeric(10, 2) NOT NULL,
                "unit_price" numeric(15, 2) NOT NULL,
                "tax_rate" numeric(5, 2) DEFAULT '0',
                "tax_amount" numeric(15, 2) DEFAULT '0',
                "total" numeric(15, 2) NOT NULL,
                "notes" text
            );
        `);
        // Add constraints separately to avoid errors if they already exist
        console.log('Adding constraints...');
        await db.execute((0,sql/* sql */.ll) `DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_customer_id_stakeholders_id_fk') THEN
                ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_stakeholders_id_fk" FOREIGN KEY ("customer_id") REFERENCES "stakeholders"("id") ON DELETE set null;
            END IF;
        END $$;`);
        console.log('✅ Database migration completed successfully!');
    }
    catch (error) {
        console.error('❌ Database migration failed:', error);
        throw error; // Re-throw to fail startup
    }
}

;// CONCATENATED MODULE: ../../packages/db/src/index.ts



let _db = null;
const getDb = () => {
    if (_db)
        return _db;
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('CRITICAL: Missing DATABASE_URL environment variable');
        throw new Error('Database configuration missing');
    }
    // Log partial connection string for debugging (hide credentials)
    console.log('[DB] Connecting to:', connectionString.replace(/:[^:@]*@/, ':****@'));
    try {
        const client = (0,src/* default */.A)(connectionString, {
            ssl: 'require',
            max: 1, // Serverless: Use single connection per lambda to avoid exhausting pool
            idle_timeout: 20,
            connect_timeout: 10,
            prepare: false, // Disable prepared statements for transaction pooler compatibility
        });
        _db = (0,driver/* drizzle */.f)(client, { schema: schema_namespaceObject });
        console.log('[DB] Connection initialized successfully');
        return _db;
    }
    catch (error) {
        console.error('[DB] Connection Failed:', error);
        throw error;
    }
};
// Lazy-loaded database instance using Proxy
const db = new Proxy({}, {
    get: (target, prop) => {
        const database = getDb();
        return database[prop];
    }
});
// Re-export all schema for convenience




/***/ }),

/***/ 6303:
/***/ ((module) => {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncaught exception popping up in devtools
	return Promise.resolve().then(() => {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	});
}
webpackEmptyAsyncContext.keys = () => ([]);
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = 6303;
module.exports = webpackEmptyAsyncContext;

/***/ })

};
;