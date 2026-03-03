import { z } from 'zod';
// Auth schemas
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});
export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    organizationName: z.string().min(1, 'Organization name is required'),
});
export const profileUpdateSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    avatar: z.string().url().optional(),
});
// Organization schemas
export const organizationSchema = z.object({
    name: z.string().min(1, 'Organization name is required'),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    industry: z.enum(['RETAIL', 'WHOLESALE', 'HEALTHCARE', 'EDUCATION', 'NGO', 'MANUFACTURING']),
    country: z.string().length(2, 'Country code must be 2 characters'),
    currency: z.string().length(3, 'Currency code must be 3 characters'),
    timezone: z.string(),
});
// Stakeholder schemas
export const stakeholderSchema = z.object({
    type: z.enum(['CUSTOMER', 'SUPPLIER']),
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    taxId: z.string().optional(),
    creditLimit: z.number().min(0).optional(),
    paymentTerms: z.number().int().min(0).optional(),
    isActive: z.boolean().default(true),
    customFields: z.record(z.any()).optional(),
});
export const stakeholderUpdateSchema = stakeholderSchema.partial().omit({ type: true });
// Pagination schema
export const paginationSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});
// Sync schemas
export const syncOperationSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    userId: z.string().uuid(),
    deviceId: z.string(),
    table: z.string(),
    action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
    entityId: z.string().uuid(),
    payload: z.any(),
    expectedVersion: z.number().int().optional(),
    priority: z.number().int().min(0).max(10),
    createdAtLocal: z.number().int(),
});
export const syncPushRequestSchema = z.object({
    deviceId: z.string(),
    operations: z.array(syncOperationSchema).max(200),
});
export const conflictResolutionSchema = z.object({
    conflictId: z.string().uuid(),
    resolution: z.enum(['USE_SERVER', 'KEEP_LOCAL', 'MERGE', 'ADJUSTMENT', 'CANCEL']),
    mergedPayload: z.any().optional(),
});
