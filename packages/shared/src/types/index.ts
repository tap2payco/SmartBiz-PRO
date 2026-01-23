// Common audit fields for all entities
export interface AuditFields {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    deletedAt?: Date | null;
    version: number;
}

// Multi-tenant fields
export interface TenantFields {
    organizationId: string;
}

// Base entity combining audit and tenant fields
export interface BaseEntity extends AuditFields, TenantFields { }

// Organization
export interface Organization {
    id: string;
    name: string;
    slug: string;
    industry: 'RETAIL' | 'WHOLESALE' | 'HEALTHCARE' | 'EDUCATION' | 'NGO' | 'MANUFACTURING';
    country: string;
    currency: string;
    timezone: string;
    settings: OrganizationSettings;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrganizationSettings {
    taxEnabled: boolean;
    vatRate: number;
    fiscalYearStart: string; // MM-DD format
    sequentialNumbering: boolean;
    multiLocation: boolean;
    offlineMode: boolean;
}

// User & Profile
export interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Profile extends BaseEntity {
    userId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    role: UserRole;
    permissions: Permission[];
    isActive: boolean;
}

export type UserRole =
    | 'ADMIN'
    | 'OWNER'
    | 'ACCOUNTANT'
    | 'STOREKEEPER'
    | 'PROCUREMENT'
    | 'HR'
    | 'PAYROLL'
    | 'PROJECT_MANAGER'
    | 'SALES';

export type Permission =
    | 'stakeholders:read'
    | 'stakeholders:create'
    | 'stakeholders:update'
    | 'stakeholders:delete'
    | 'inventory:read'
    | 'inventory:create'
    | 'inventory:update'
    | 'inventory:delete'
    | 'sales:read'
    | 'sales:create'
    | 'sales:update'
    | 'sales:delete'
    | 'purchases:read'
    | 'purchases:create'
    | 'purchases:update'
    | 'purchases:delete'
    | 'purchases:approve'
    | 'finance:read'
    | 'finance:create'
    | 'finance:update'
    | 'finance:delete'
    | 'reports:view'
    | 'reports:export'
    | 'settings:manage';

// Stakeholder (Customer/Supplier)
export interface Stakeholder extends BaseEntity {
    type: 'CUSTOMER' | 'SUPPLIER';
    code: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
    creditLimit?: number;
    paymentTerms?: number; // days
    isActive: boolean;
    customFields?: Record<string, any>;
}

// Sync types
export interface SyncOperation {
    id: string;
    organizationId: string;
    userId: string;
    deviceId: string;
    table: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    entityId: string;
    payload: any;
    expectedVersion?: number;
    priority: number;
    status: 'PENDING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
    createdAtLocal: number;
    syncedAt?: number;
    error?: string;
}

export interface ConflictRecord {
    conflictId: string;
    operationId: string;
    table: string;
    entityId: string;
    reason: string;
    localPayload: any;
    serverPayload: any;
    resolution?: 'USE_SERVER' | 'KEEP_LOCAL' | 'MERGE' | 'ADJUSTMENT' | 'CANCEL';
    resolvedBy?: string;
    resolvedAt?: number;
    createdAt: number;
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    };
}

export interface ApiError {
    code: string;
    message: string;
    details?: any;
}

// Pagination
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
