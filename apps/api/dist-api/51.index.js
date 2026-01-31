exports.id = 51;
exports.ids = [51];
exports.modules = {

/***/ 6741:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  app: () => (/* binding */ src_app)
});

// UNUSED EXPORTS: default

// NAMESPACE OBJECT: ../../packages/db/src/schema/index.ts
var schema_namespaceObject = {};
__webpack_require__.r(schema_namespaceObject);
__webpack_require__.d(schema_namespaceObject, {
  auditLogs: () => (auditLogs),
  bankAccountTypeEnum: () => (bankAccountTypeEnum),
  bankAccounts: () => (bankAccounts),
  bankAccountsRelations: () => (bankAccountsRelations),
  bankTransactions: () => (bankTransactions),
  bankTransactionsRelations: () => (bankTransactionsRelations),
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
  profiles: () => (profiles),
  profilesRelations: () => (profilesRelations),
  purchaseOrderLines: () => (purchaseOrderLines),
  purchaseOrderLinesRelations: () => (purchaseOrderLinesRelations),
  purchaseOrderStatusEnum: () => (purchaseOrderStatusEnum),
  purchaseOrders: () => (purchaseOrders),
  purchaseOrdersRelations: () => (purchaseOrdersRelations),
  purchasePaymentMethodEnum: () => (purchasePaymentMethodEnum),
  purchasePayments: () => (purchasePayments),
  purchasePaymentsRelations: () => (purchasePaymentsRelations),
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
  supplierInvoices: () => (supplierInvoices),
  supplierInvoicesRelations: () => (supplierInvoicesRelations),
  transactionReferenceTypeEnum: () => (transactionReferenceTypeEnum),
  transactionTypeEnum: () => (transactionTypeEnum),
  userRoleEnum: () => (userRoleEnum)
});

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
    isActive: (0,columns_boolean/* boolean */.zM)('is_active').notNull().default(true),
    customFields: (0,jsonb/* jsonb */.Fx)('custom_fields'),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
    createdBy: (0,uuid/* uuid */.uR)('created_by').notNull(),
    updatedBy: (0,uuid/* uuid */.uR)('updated_by').notNull(),
    deletedAt: (0,timestamp/* timestamp */.vE)('deleted_at'),
    version: (0,integer/* integer */.nd)('version').notNull().default(1),
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
    subtotal: (0,numeric/* decimal */._)('subtotal', { precision: 15, scale: 2 }).notNull().default('0'),
    taxTotal: (0,numeric/* decimal */._)('tax_total', { precision: 15, scale: 2 }).notNull().default('0'),
    discountTotal: (0,numeric/* decimal */._)('discount_total', { precision: 15, scale: 2 }).notNull().default('0'),
    totalAmount: (0,numeric/* decimal */._)('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    paidAmount: (0,numeric/* decimal */._)('paid_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    notes: (0,columns_text/* text */.Qq)('notes'),
    createdAt: (0,timestamp/* timestamp */.vE)('created_at').notNull().defaultNow(),
    updatedAt: (0,timestamp/* timestamp */.vE)('updated_at').notNull().defaultNow(),
    createdBy: (0,uuid/* uuid */.uR)('created_by'),
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

;// CONCATENATED MODULE: ../../packages/db/src/schema/index.ts
// Export all schemas








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
    const client = (0,src/* default */.A)(connectionString, {
        ssl: 'require',
        max: 10, // Limit connections for serverless
        idle_timeout: 20,
        connect_timeout: 10,
    });
    _db = (0,driver/* drizzle */.f)(client, { schema: schema_namespaceObject });
    return _db;
};
// Lazy-loaded database instance using Proxy
const db = new Proxy({}, {
    get: (target, prop) => {
        const database = getDb();
        return database[prop];
    }
});
// Re-export all schema for convenience


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
        // We use the db directly here instead of Supabase client to ensure we get custom fields matches
        const profile = await db.query.profiles.findFirst({
            where: (0,conditions.eq)(profiles.userId, user.id),
        });
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
        const result = await db.transaction(async (tx) => {
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
    const org = await db.query.organizations.findFirst({
        where: (0,conditions.eq)(organizations.id, profile.organizationId),
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
        const [updatedOrg] = await db.update(organizations)
            .set({
            ...updates,
            updatedAt: new Date(),
        })
            .where((0,conditions.eq)(organizations.id, profile.organizationId))
            .returning();
        return c.json({ organization: updatedOrg });
    }
    catch (error) {
        console.error('Error updating organization:', error);
        return c.json({ error: 'Failed to update organization', details: error.message }, 500);
    }
});
/* harmony default export */ const routes_organizations = (app);

;// CONCATENATED MODULE: ../../packages/shared/src/schemas/index.ts

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

;// CONCATENATED MODULE: ../../packages/shared/src/constants/index.ts
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

;// CONCATENATED MODULE: ../../packages/shared/src/utils/index.ts
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
        const organizationUsers = await db
            .select()
            .from(profiles)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(profiles.organizationId, profile.organizationId), (0,conditions.eq)(profiles.deletedAt, null) // Check soft delete
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
        const targetUser = await db.query.profiles.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(profiles.id, userId), (0,conditions.eq)(profiles.organizationId, adminProfile.organizationId))
        });
        if (!targetUser) {
            return c.json({ error: 'User not found in organization' }, 404);
        }
        // Prevent Admin from modifying Owner
        if (targetUser.role === constants_USER_ROLES.OWNER && !isOwner) {
            return c.json({ error: 'Admins cannot modify Owners' }, 403);
        }
        const newPermissions = constants_ROLE_PERMISSIONS[role] || [];
        await db.update(profiles)
            .set({
            role: role,
            permissions: newPermissions,
            updatedAt: new Date()
        })
            .where((0,conditions.eq)(profiles.id, userId));
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
    let query = db
        .select()
        .from(stakeholders)
        .where((0,conditions/* and */.Uo)((0,conditions.eq)(stakeholders.organizationId, organizationId), type ? (0,conditions.eq)(stakeholders.type, type) : undefined, (0,conditions.eq)(stakeholders.isActive, true)))
        .orderBy((0,expressions_select/* desc */.i)(stakeholders.createdAt));
    const results = await query;
    return c.json({ stakeholders: results });
});
// GET /stakeholders/:id - Get single
stakeholdersApp.get('/:id', async (c) => {
    const id = c.req.param('id');
    const organizationId = c.get('organizationId');
    const result = await db
        .select()
        .from(stakeholders)
        .where((0,conditions/* and */.Uo)((0,conditions.eq)(stakeholders.id, id), (0,conditions.eq)(stakeholders.organizationId, organizationId)))
        .limit(1);
    if (result.length === 0) {
        return c.json({ error: 'Stakeholder not found' }, 404);
    }
    return c.json({ stakeholder: result[0] });
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
        const [newStakeholder] = await db
            .insert(stakeholders)
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
        const [updatedStakeholder] = await db
            .update(stakeholders)
            .set({
            ...data,
            updatedBy: user.id,
            updatedAt: new Date(),
            creditLimit: data.creditLimit ? String(data.creditLimit) : undefined,
        })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(stakeholders.id, id), (0,conditions.eq)(stakeholders.organizationId, organizationId)))
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
// DELETE /stakeholders/:id - Soft delete
stakeholdersApp.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const organizationId = c.get('organizationId');
    const user = c.get('user');
    try {
        const [deleted] = await db
            .update(stakeholders)
            .set({
            isActive: false,
            deletedAt: new Date(),
            updatedBy: user.id
        })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(stakeholders.id, id), (0,conditions.eq)(stakeholders.organizationId, organizationId)))
            .returning();
        if (!deleted) {
            return c.json({ error: 'Stakeholder not found' }, 404);
        }
        return c.json({ message: 'Stakeholder deleted successfully' });
    }
    catch (error) {
        return c.json({ error: 'Failed to delete stakeholder' }, 500);
    }
});
/* harmony default export */ const routes_stakeholders = (stakeholdersApp);

// EXTERNAL MODULE: ../../node_modules/zod/v3/ZodError.js
var ZodError = __webpack_require__(5765);
// EXTERNAL MODULE: ../../node_modules/drizzle-orm/sql/sql.js
var sql = __webpack_require__(3361);
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
        let query = db
            .select()
            .from(items)
            .where((0,conditions.eq)(items.organizationId, organizationId));
        // Apply filters
        if (category) {
            query = query.where((0,conditions/* and */.Uo)((0,conditions.eq)(items.organizationId, organizationId), (0,conditions.eq)(items.categoryId, category)));
        }
        if (search) {
            query = query.where((0,conditions/* and */.Uo)((0,conditions.eq)(items.organizationId, organizationId), (0,conditions.or)((0,conditions/* like */.mj)(items.name, `%${search}%`), (0,conditions/* like */.mj)(items.sku, `%${search}%`), (0,conditions/* like */.mj)(items.barcode, `%${search}%`))));
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
        // Get items where reorder_point > 0 (items that have reorder tracking enabled)
        // For now, we'll flag all items with reorder_point set as potentially low stock
        // In a full implementation, we'd join with stock_movements to get actual stock levels
        const lowStockItems = await db
            .select()
            .from(items)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(items.organizationId, organizationId), (0,conditions.eq)(items.isActive, true), (0,sql/* sql */.ll) `${items.reorderPoint} > 0`));
        // For MVP: Return items with reorder point set
        // TODO: Calculate actual stock levels from stock_movements
        const itemsWithStockInfo = lowStockItems.map((item) => ({
            ...item,
            currentStock: 0, // Placeholder - would be calculated from stock_movements
            isLowStock: true // Since reorder_point > 0 and stock tracking isn't fully implemented
        }));
        return c.json({
            count: itemsWithStockInfo.length,
            items: itemsWithStockInfo
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
        const existingItems = await db
            .select({ sku: items.sku })
            .from(items)
            .where((0,conditions.eq)(items.organizationId, organizationId));
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
        await db.transaction(async (tx) => {
            const insertedItems = await tx.insert(items).values(newItems).returning();
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
                await tx.insert(stockMovements).values(movementsToInsert);
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
        const [created] = await db.insert(items).values(newItem).returning();
        // Create stock movement if quantity provided
        if (validated.quantity && validated.quantity > 0) {
            await db.insert(stockMovements).values({
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
        const [item] = await db
            .select()
            .from(items)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(items.id, id), (0,conditions.eq)(items.organizationId, organizationId)))
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
        const [updated] = await db
            .update(items)
            .set({
            ...validated,
            updatedAt: new Date()
        })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(items.id, id), (0,conditions.eq)(items.organizationId, user.organizationId)))
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
        const [deleted] = await db
            .update(items)
            .set({
            isActive: false,
            updatedAt: new Date()
        })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(items.id, id), (0,conditions.eq)(items.organizationId, user.organizationId)))
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
/* harmony default export */ const routes_items = (items_app);

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
        const result = await db
            .select()
            .from(itemCategories)
            .where((0,conditions.eq)(itemCategories.organizationId, organizationId));
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
        const [created] = await db.insert(itemCategories).values(newCategory).returning();
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
        const [updated] = await db
            .update(itemCategories)
            .set({
            ...validated,
            updatedAt: new Date()
        })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(itemCategories.id, id), (0,conditions.eq)(itemCategories.organizationId, organizationId)))
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
        const [deleted] = await db
            .update(itemCategories)
            .set({
            isActive: false,
            updatedAt: new Date()
        })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(itemCategories.id, id), (0,conditions.eq)(itemCategories.organizationId, organizationId)))
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
        const filters = [(0,conditions.eq)(stockMovements.organizationId, organizationId)];
        if (itemId) {
            filters.push((0,conditions.eq)(stockMovements.itemId, itemId));
        }
        const query = db
            .select()
            .from(stockMovements)
            .where((0,conditions/* and */.Uo)(...filters))
            .orderBy((0,expressions_select/* desc */.i)(stockMovements.createdAt));
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
        const item = await db.query.items.findFirst({
            where: (0,conditions.eq)(items.id, validated.itemId),
        });
        if (!item || item.organizationId !== organizationId) {
            return c.json({ error: 'Item not found' }, 404);
        }
        // Create the movement
        const [movement] = await db.insert(stockMovements)
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
        // Transactionally create movements
        await db.transaction(async (tx) => {
            // OUT from source
            await tx.insert(stockMovements).values({
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
            await tx.insert(stockMovements).values({
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
        const result = await db.query.sales.findMany({
            where: (0,conditions.eq)(sales.organizationId, organizationId),
            with: {
                customer: true,
                items: {
                    with: {
                        item: true
                    }
                },
                payments: true,
            },
            orderBy: [(0,expressions_select/* desc */.i)(sales.createdAt)],
        });
        return c.json(result);
    }
    catch (error) {
        console.error('Error fetching sales:', error);
        return c.json({ error: 'Failed to fetch sales' }, 500);
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
        // Transactional insert
        const result = await db.transaction(async (tx) => {
            // 1. Create Sale
            const [newSale] = await tx.insert(sales).values({
                organizationId,
                customerId: validated.customerId,
                saleNumber: `SALE-${Date.now()}`, // Basic generator
                subtotal: String(subtotal),
                discountTotal: String(discountTotal),
                taxTotal: String(taxTotal),
                totalAmount: String(totalAmount),
                paidAmount: String(paidAmount),
                paymentStatus: paidAmount >= totalAmount ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'PENDING'),
                notes: validated.notes,
                createdBy: user?.id,
            }).returning();
            // 2. Create Sale Items and Adjust Stock
            for (const item of validated.items) {
                // Create Sale Item
                await tx.insert(saleItems).values({
                    saleId: newSale.id,
                    itemId: item.itemId,
                    quantity: String(item.quantity),
                    unitPrice: String(item.unitPrice),
                    discount: String(item.discount),
                    tax: String(item.tax),
                    total: String((item.quantity * item.unitPrice) - (item.discount || 0) + (item.tax || 0)),
                });
                // Create Stock Movement (Deduct Stock)
                await tx.insert(stockMovements).values({
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
                await tx.update(items)
                    .set({
                    updatedAt: new Date()
                })
                    .where((0,conditions.eq)(items.id, item.itemId));
            }
            // 3. Create Payment and Bank Transaction if present
            if (validated.payment && validated.payment.amount > 0) {
                const [payment] = await tx.insert(payments).values({
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
                        .from(bankAccounts)
                        .where((0,conditions/* and */.Uo)((0,conditions.eq)(bankAccounts.id, validated.payment.accountId), (0,conditions.eq)(bankAccounts.organizationId, organizationId)));
                    if (account) {
                        // 2. Create Deposit
                        await tx.insert(bankTransactions).values({
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
                            .update(bankAccounts)
                            .set({
                            currentBalance: (0,sql/* sql */.ll) `${bankAccounts.currentBalance} + ${validated.payment.amount}`,
                            updatedAt: new Date()
                        })
                            .where((0,conditions.eq)(bankAccounts.id, validated.payment.accountId));
                    }
                }
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
        const result = await db.query.sales.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(sales.id, saleId), (0,conditions.eq)(sales.organizationId, organizationId)),
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
/* harmony default export */ const routes_sales = (sales_app);

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
        const [revenueResult] = await db
            .select({ total: (0,sql/* sql */.ll) `sum(${sales.totalAmount})` })
            .from(sales)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(sales.organizationId, profile.organizationId), (0,conditions/* gte */.RO)(sales.createdAt, start), (0,conditions/* lte */.wJ)(sales.createdAt, end), (0,conditions.eq)(sales.status, 'COMPLETED') // Only completed sales
        ));
        const revenue = parseFloat(revenueResult?.total || '0');
        // 2. Calculate Expenses
        const [expensesResult] = await db
            .select({ total: (0,sql/* sql */.ll) `sum(${expenses.amount})` })
            .from(expenses)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(expenses.organizationId, profile.organizationId), (0,conditions/* gte */.RO)(expenses.expenseDate, start.toISOString().split('T')[0]), // expenseDate is the correct column
        (0,conditions/* lte */.wJ)(expenses.expenseDate, end.toISOString().split('T')[0])));
        const totalExpenses = parseFloat(expensesResult?.total || '0');
        // 3. Calculate COGS (Cost of Goods Sold)
        // Join saleItems with items to get costPrice
        // MVP: Using current item.costPrice * quantitySold
        const [cogsResult] = await db
            .select({
            total: (0,sql/* sql */.ll) `sum(${saleItems.quantity} * ${items.costPrice})`
        })
            .from(saleItems)
            .innerJoin(sales, (0,conditions.eq)(saleItems.saleId, sales.id))
            .innerJoin(items, (0,conditions.eq)(saleItems.itemId, items.id))
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(sales.organizationId, profile.organizationId), (0,conditions/* gte */.RO)(sales.createdAt, start), (0,conditions/* lte */.wJ)(sales.createdAt, end), (0,conditions.eq)(sales.status, 'COMPLETED')));
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
        const result = await db
            .select()
            .from(locations)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(locations.organizationId, organizationId), (0,conditions.eq)(locations.isActive, true)))
            .orderBy((0,expressions_select/* desc */.i)(locations.createdAt));
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
        const [newLocation] = await db
            .insert(locations)
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
        const [updatedLocation] = await db
            .update(locations)
            .set(validated)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(locations.id, id), (0,conditions.eq)(locations.organizationId, organizationId)))
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
        const [deletedLocation] = await db
            .update(locations)
            .set({ isActive: false })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(locations.id, id), (0,conditions.eq)(locations.organizationId, organizationId)))
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
/* harmony default export */ const routes_locations = (locations_app);

// EXTERNAL MODULE: ../../node_modules/drizzle-orm/sql/functions/aggregate.js
var aggregate = __webpack_require__(4192);
;// CONCATENATED MODULE: ./src/routes/purchases.ts




const purchases_app = new dist.Hono();
// GET /purchases/orders - List Purchase Orders
purchases_app.get('/orders', async (c) => {
    const profile = c.get('profile');
    if (!profile?.organizationId)
        return c.json({ error: 'Unauthorized' }, 401);
    try {
        const orders = await db.query.purchaseOrders.findMany({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(purchaseOrders.organizationId, profile.organizationId)),
            with: {
                supplier: true,
                lines: true
            },
            orderBy: [(0,expressions_select/* desc */.i)(purchaseOrders.createdAt)]
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
        const order = await db.query.purchaseOrders.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(purchaseOrders.id, id), (0,conditions.eq)(purchaseOrders.organizationId, profile.organizationId)),
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
        const [countResult] = await db
            .select({ count: (0,aggregate/* count */.U9)() })
            .from(purchaseOrders)
            .where((0,conditions.eq)(purchaseOrders.organizationId, profile.organizationId));
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
        const result = await db.transaction(async (tx) => {
            const [newOrder] = await tx.insert(purchaseOrders).values({
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
                await tx.insert(purchaseOrderLines).values(linesToInsert.map(line => ({
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
        await db.update(purchaseOrders)
            .set({
            status,
            updatedAt: new Date(),
            ...(status === 'ISSUED' ? { issueDate: new Date().toISOString() } : {})
        })
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(purchaseOrders.id, id), (0,conditions.eq)(purchaseOrders.organizationId, profile.organizationId)));
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
        await db.transaction(async (tx) => {
            // 1. Get PO
            const order = await tx.query.purchaseOrders.findFirst({
                where: (0,conditions/* and */.Uo)((0,conditions.eq)(purchaseOrders.id, id), (0,conditions.eq)(purchaseOrders.organizationId, profile.organizationId)),
                with: { lines: true }
            });
            if (!order)
                throw new Error('Order not found');
            // 2. Create GRN Header
            const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const grnNumber = `GRN-${order.orderNumber.split('-').slice(1).join('-')}-${randomSuffix}`;
            const [grn] = await tx.insert(grns).values({
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
                await tx.insert(grnLines).values({
                    grnId: grn.id,
                    purchaseOrderLineId: poLine.id,
                    itemId: poLine.itemId,
                    quantityReceived: qty
                });
                // Update PO Line Received Qty
                await tx.update(purchaseOrderLines)
                    .set({
                    receivedQuantity: (0,sql/* sql */.ll) `${purchaseOrderLines.receivedQuantity} + ${qty}`
                })
                    .where((0,conditions.eq)(purchaseOrderLines.id, poLine.id));
                // Create Stock Movement
                await tx.insert(stockMovements).values({
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
                await tx.update(items)
                    .set({ costPrice: poLine.unitCost.toString() })
                    .where((0,conditions.eq)(items.id, poLine.itemId));
            }
            // 4. Update PO Status
            const updatedLines = await tx.query.purchaseOrderLines.findMany({
                where: (0,conditions.eq)(purchaseOrderLines.purchaseOrderId, id)
            });
            const allReceived = updatedLines.every((l) => l.receivedQuantity >= l.quantity);
            const newStatus = allReceived ? 'COMPLETED' : 'PARTIAL_RECEIVED';
            if (order.status !== newStatus && order.status !== 'COMPLETED') {
                await tx.update(purchaseOrders)
                    .set({ status: newStatus, updatedAt: new Date() })
                    .where((0,conditions.eq)(purchaseOrders.id, id));
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
        const bills = await db.query.supplierInvoices.findMany({
            where: (0,conditions.eq)(supplierInvoices.organizationId, profile.organizationId),
            with: {
                supplier: true,
                purchaseOrder: true,
                payments: true
            },
            orderBy: [(0,expressions_select/* desc */.i)(supplierInvoices.createdAt)]
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
        const bill = await db.query.supplierInvoices.findFirst({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(supplierInvoices.id, id), (0,conditions.eq)(supplierInvoices.organizationId, profile.organizationId)),
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
    try {
        const [newBill] = await db.insert(supplierInvoices).values({
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
        const result = await db.transaction(async (tx) => {
            // Get the bill
            const bill = await tx.query.supplierInvoices.findFirst({
                where: (0,conditions/* and */.Uo)((0,conditions.eq)(supplierInvoices.id, billId), (0,conditions.eq)(supplierInvoices.organizationId, profile.organizationId))
            });
            if (!bill)
                throw new Error('Bill not found');
            // Create the payment
            const [payment] = await tx.insert(purchasePayments).values({
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
                    .from(bankAccounts)
                    .where((0,conditions/* and */.Uo)((0,conditions.eq)(bankAccounts.id, data.accountId), (0,conditions.eq)(bankAccounts.organizationId, profile.organizationId)));
                if (!account)
                    throw new Error('Selected bank account not found');
                // Allow overdraft? For now, let's enforce positive balance logic if needed, but standard accounting usually allows negative.
                // However, preventing accidental negative cash is good. 
                // Let's NOT throw error for insufficient funds here to allow flexibility, 
                // or maybe we should? Let's check balance but proceed (warn?). 
                // Actually, let's block if it's CASH type and insufficient?
                // For simplicity in this iteration, we allow it but log it/users handle it.
                // 2. Create Bank Transaction (Withdrawal)
                await tx.insert(bankTransactions).values({
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
                    .update(bankAccounts)
                    .set({
                    currentBalance: (0,sql/* sql */.ll) `${bankAccounts.currentBalance} - ${data.amount}`,
                    updatedAt: new Date()
                })
                    .where((0,conditions.eq)(bankAccounts.id, data.accountId));
            }
            // Update bill paid amount
            const currentPaid = parseFloat(bill.paidAmount || '0');
            const newPaidAmount = currentPaid + data.amount;
            const totalAmount = parseFloat(bill.totalAmount);
            let newStatus = 'PARTIAL_PAID';
            if (newPaidAmount >= totalAmount) {
                newStatus = 'PAID';
            }
            await tx.update(supplierInvoices)
                .set({
                paidAmount: newPaidAmount.toString(),
                status: newStatus,
                updatedAt: new Date()
            })
                .where((0,conditions.eq)(supplierInvoices.id, billId));
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
        const payments = await db.query.purchasePayments.findMany({
            where: (0,conditions.eq)(purchasePayments.organizationId, profile.organizationId),
            with: {
                supplierInvoice: true,
                supplier: true
            },
            orderBy: [(0,expressions_select/* desc */.i)(purchasePayments.createdAt)]
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
        const categories = await db.query.expenseCategories.findMany({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(expenseCategories.organizationId, profile.organizationId), (0,conditions.eq)(expenseCategories.isActive, true))
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
        const [category] = await db.insert(expenseCategories).values({
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
        const expensesList = await db.query.expenses.findMany({
            where: (0,conditions.eq)(expenses.organizationId, profile.organizationId),
            with: {
                category: true
            },
            orderBy: [(0,expressions_select/* desc */.i)(expenses.expenseDate)]
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
        const byCategory = await db
            .select({
            categoryName: expenseCategories.name,
            total: (0,sql/* sql */.ll) `sum(${expenses.amount})`
        })
            .from(expenses)
            .leftJoin(expenseCategories, (0,conditions.eq)(expenses.categoryId, expenseCategories.id))
            .where((0,conditions.eq)(expenses.organizationId, profile.organizationId))
            .groupBy(expenseCategories.name);
        // Total this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const [monthlyTotal] = await db
            .select({
            total: (0,sql/* sql */.ll) `sum(${expenses.amount})`
        })
            .from(expenses)
            .where((0,conditions/* and */.Uo)((0,conditions.eq)(expenses.organizationId, profile.organizationId), (0,sql/* sql */.ll) `${expenses.expenseDate} >= ${startOfMonth}`));
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
    try {
        const [expense] = await db.insert(expenses).values({
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
        await db.delete(expenses).where((0,conditions/* and */.Uo)((0,conditions.eq)(expenses.id, id), (0,conditions.eq)(expenses.organizationId, profile.organizationId)));
        return c.json({ success: true });
    }
    catch (error) {
        console.error('Delete Expense Error:', error);
        return c.json({ error: 'Failed to delete expense' }, 500);
    }
});
/* harmony default export */ const routes_expenses = (expenses_app);

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
        const accounts = await db.query.bankAccounts.findMany({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(bankAccounts.organizationId, profile.organizationId), (0,conditions.eq)(bankAccounts.isActive, true)),
            orderBy: [(0,expressions_select/* desc */.i)(bankAccounts.createdAt)]
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
        const [account] = await db.insert(bankAccounts).values({
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
            await db.insert(bankTransactions).values({
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
        const transactions = await db.query.bankTransactions.findMany({
            where: (0,conditions/* and */.Uo)((0,conditions.eq)(bankTransactions.organizationId, profile.organizationId), (0,conditions.eq)(bankTransactions.accountId, accountId)),
            orderBy: [(0,expressions_select/* desc */.i)(bankTransactions.transactionDate), (0,expressions_select/* desc */.i)(bankTransactions.createdAt)],
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
    try {
        await db.transaction(async (tx) => {
            // 1. Get Source Account
            const [sourceAccount] = await tx
                .select()
                .from(bankAccounts)
                .where((0,conditions/* and */.Uo)((0,conditions.eq)(bankAccounts.id, data.fromAccountId), (0,conditions.eq)(bankAccounts.organizationId, profile.organizationId)));
            if (!sourceAccount)
                throw new Error('Source account not found');
            if (parseFloat(sourceAccount.currentBalance) < data.amount) {
                throw new Error('Insufficient funds');
            }
            // 2. Get Target Account
            const [targetAccount] = await tx
                .select()
                .from(bankAccounts)
                .where((0,conditions/* and */.Uo)((0,conditions.eq)(bankAccounts.id, data.toAccountId), (0,conditions.eq)(bankAccounts.organizationId, profile.organizationId)));
            if (!targetAccount)
                throw new Error('Target account not found');
            const transferId = crypto.randomUUID();
            // 3. Create Withdrawal Transaction
            await tx.insert(bankTransactions).values({
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
                .update(bankAccounts)
                .set({
                currentBalance: (0,sql/* sql */.ll) `${bankAccounts.currentBalance} - ${data.amount}`,
                updatedAt: new Date()
            })
                .where((0,conditions.eq)(bankAccounts.id, data.fromAccountId));
            // 5. Create Deposit Transaction
            await tx.insert(bankTransactions).values({
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
                .update(bankAccounts)
                .set({
                currentBalance: (0,sql/* sql */.ll) `${bankAccounts.currentBalance} + ${data.amount}`,
                updatedAt: new Date()
            })
                .where((0,conditions.eq)(bankAccounts.id, data.toAccountId));
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
        await db.transaction(async (tx) => {
            const [account] = await tx
                .select()
                .from(bankAccounts)
                .where((0,conditions/* and */.Uo)((0,conditions.eq)(bankAccounts.id, data.accountId), (0,conditions.eq)(bankAccounts.organizationId, profile.organizationId)));
            if (!account)
                throw new Error('Account not found');
            // Validation: Cannot withdraw more than balance
            if (data.type === 'WITHDRAWAL' && parseFloat(account.currentBalance) < data.amount) {
                throw new Error('Insufficient funds');
            }
            // Create Transaction
            await tx.insert(bankTransactions).values({
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
                .update(bankAccounts)
                .set({
                currentBalance: (0,sql/* sql */.ll) `${bankAccounts.currentBalance} + ${balanceChange}`,
                updatedAt: new Date()
            })
                .where((0,conditions.eq)(bankAccounts.id, data.accountId));
        });
        return c.json({ success: true });
    }
    catch (error) {
        console.error('Adjustment Error:', error);
        return c.json({ error: error.message || 'Failed to process adjustment' }, 400);
    }
});
/* harmony default export */ const banking = (banking_app);

// EXTERNAL MODULE: ../../node_modules/@hono/node-server/dist/index.mjs
var node_server_dist = __webpack_require__(7416);
;// CONCATENATED MODULE: ./src/index.ts







const src_app = new dist.Hono();
// Middleware
// 1. CORS MUST be first to handle OPTIONS preflight
src_app.use('*', (0,cors.cors)({
    origin: (origin) => {
        // Allow Vercel production, preview and local development
        if (origin === 'https://smart-biz-pro-web.vercel.app' ||
            origin?.endsWith('.vercel.app') ||
            origin?.includes('localhost')) {
            return origin;
        }
        return 'https://smart-biz-pro-web.vercel.app'; // Default fallback
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
src_app.route('/organizations', routes_organizations);
src_app.use('/stakeholders', authMiddleware);
src_app.use('/stakeholders/*', authMiddleware);
src_app.route('/stakeholders', routes_stakeholders);
src_app.use('/items', authMiddleware);
src_app.use('/items/*', authMiddleware);
src_app.route('/items', routes_items);
src_app.use('/categories', authMiddleware);
src_app.use('/categories/*', authMiddleware);
src_app.route('/categories', categories);
src_app.use('/stock-movements', authMiddleware);
src_app.use('/stock-movements/*', authMiddleware);
src_app.route('/stock-movements', stock_movements);
src_app.use('/sales', authMiddleware);
src_app.use('/sales/*', authMiddleware);
src_app.route('/sales', routes_sales);
src_app.use('/reports', authMiddleware);
src_app.use('/reports/*', authMiddleware);
src_app.route('/reports', reports);
src_app.use('/locations', authMiddleware);
src_app.use('/locations/*', authMiddleware);
src_app.route('/locations', routes_locations);
src_app.use('/purchases', authMiddleware);
src_app.use('/purchases/*', authMiddleware);
src_app.route('/purchases', purchases);
src_app.use('/finance', authMiddleware);
src_app.use('/finance/*', authMiddleware);
src_app.route('/finance', finance);
src_app.use('/expenses', authMiddleware);
src_app.use('/expenses/*', authMiddleware);
src_app.route('/expenses', routes_expenses);
src_app.use('/banking', authMiddleware);
src_app.use('/banking/*', authMiddleware);
src_app.route('/banking', banking);

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    console.log(`Server is running on port ${port}`);
    (0,node_server_dist/* serve */.wX)({
        fetch: src_app.fetch,
        port
    });
}
/* harmony default export */ const src_0 = ((/* unused pure expression or super */ null && (src_app)));


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