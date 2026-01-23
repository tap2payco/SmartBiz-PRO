// App constants
export const APP_NAME = 'SmartBiz Pro ERP';
export const APP_VERSION = '1.0.0';

// API constants
export const API_TIMEOUT = 30000; // 30 seconds
export const MAX_SYNC_BATCH_SIZE = 200;
export const SYNC_RETRY_ATTEMPTS = 3;
export const SYNC_RETRY_DELAY = 1000; // 1 second

// Offline constants
export const INDEXEDDB_NAME = 'smartbiz-pro';
export const INDEXEDDB_VERSION = 1;
export const MAX_OFFLINE_STORAGE_MB = 50;

// Pagination constants
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// User roles
export const USER_ROLES = {
    ADMIN: 'ADMIN',
    OWNER: 'OWNER',
    ACCOUNTANT: 'ACCOUNTANT',
    STOREKEEPER: 'STOREKEEPER',
    PROCUREMENT: 'PROCUREMENT',
    HR: 'HR',
    PAYROLL: 'PAYROLL',
    PROJECT_MANAGER: 'PROJECT_MANAGER',
    SALES: 'SALES',
} as const;

// Sync priorities
export const SYNC_PRIORITY = {
    CRITICAL: 10, // Payments, financial transactions
    HIGH: 7,      // Sales, purchases
    MEDIUM: 5,    // Inventory movements
    LOW: 3,       // Master data updates
    LOWEST: 1,    // Logs, analytics
} as const;

// Stock movement types
export const STOCK_MOVEMENT_TYPE = {
    GRN: 'GRN',                    // Goods Received Note
    SALE: 'SALE',                  // Sale/Issue
    ISSUE: 'ISSUE',                // Stock issue
    TRANSFER: 'TRANSFER',          // Inter-location transfer
    ADJUSTMENT: 'ADJUSTMENT',      // Stock adjustment
    RETURN: 'RETURN',              // Customer return
} as const;

// Payment methods
export const PAYMENT_METHOD = {
    CASH: 'CASH',
    MOBILE_MONEY: 'MOBILE_MONEY',
    CARD: 'CARD',
    BANK_TRANSFER: 'BANK_TRANSFER',
    CREDIT: 'CREDIT',
    CHEQUE: 'CHEQUE',
} as const;

// Industries
export const INDUSTRIES = {
    RETAIL: 'RETAIL',
    WHOLESALE: 'WHOLESALE',
    HEALTHCARE: 'HEALTHCARE',
    EDUCATION: 'EDUCATION',
    NGO: 'NGO',
    MANUFACTURING: 'MANUFACTURING',
} as const;

// Currencies (Tanzania focus)
export const CURRENCIES = {
    TZS: 'TZS', // Tanzanian Shilling
    USD: 'USD',
    EUR: 'EUR',
    GBP: 'GBP',
    KES: 'KES', // Kenyan Shilling
    UGX: 'UGX', // Ugandan Shilling
} as const;

// Date formats
export const DATE_FORMAT = {
    SHORT: 'dd/MM/yyyy',
    LONG: 'dd MMMM yyyy',
    WITH_TIME: 'dd/MM/yyyy HH:mm',
    ISO: 'yyyy-MM-dd',
} as const;

// Granular Permissions
export const PERMISSIONS = {
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
} as const;

// Default Role Permissions
export const ROLE_PERMISSIONS = {
    [USER_ROLES.ADMIN]: Object.values(PERMISSIONS),
    [USER_ROLES.OWNER]: Object.values(PERMISSIONS),
    [USER_ROLES.STOREKEEPER]: [
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.INVENTORY_CREATE,
        PERMISSIONS.INVENTORY_EDIT,
        PERMISSIONS.INVENTORY_ADJUST,
        PERMISSIONS.REPORTS_VIEW,
    ],
    [USER_ROLES.SALES]: [
        PERMISSIONS.SALES_VIEW,
        PERMISSIONS.SALES_CREATE,
        PERMISSIONS.CUSTOMERS_VIEW,
        PERMISSIONS.CUSTOMERS_CREATE,
        PERMISSIONS.INVENTORY_VIEW,
    ],
    [USER_ROLES.ACCOUNTANT]: [
        PERMISSIONS.SALES_VIEW,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.REPORTS_FINANCIAL,
        PERMISSIONS.CUSTOMERS_VIEW,
    ],
} as const;
