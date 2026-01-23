Below is a **developer-ready, buildable specification** for **SmartBiz Pro ERP**. It’s written so a developer (or a full team) can understand **exactly what to build**, how modules connect, what data models to create, what APIs to expose, and how the **offline-first sync + conflict resolution** must work.

> **Goal:** A modern, modular ERP with **full offline PWA capability**, multi-industry templates, Tanzania-first compliance (VAT/PAYE), and API-first architecture.

***

# 0) High-Level Product Definition

## Product Name

**SmartBiz Pro ERP**

## Core Promise

1.  **Works fully offline** for critical workflows (sales, inventory, purchases, approvals, basic reporting)
2.  **Syncs safely** when online, with **idempotency + conflict management**
3.  **Modular**: deploy/enable only required modules
4.  **Local compliance ready**: VAT/PAYE, sequential numbering, audit trails
5.  **Predictive insights**: “Business Health Score” and alerts (phase-based)

***

# 1) Personas & Key User Journeys (What must be usable)

## Personas

*   **Owner/CEO:** dashboard, KPIs, approvals, cashflow insights
*   **Accountant:** invoices, payments, reconciliation, VAT reports, ledger close
*   **Storekeeper:** GRN, stock movements, transfers, counts, reorder
*   **Procurement:** PR → PO → GRN → Supplier invoice → payment
*   **HR Officer:** employee records, leave, advances, attendance (phase 3)
*   **Payroll Officer:** payroll run, deductions, payslips, bank file
*   **Project Manager:** budgets, milestones, resource allocation (phase 3)

## Must-have Journeys (MVP scope)

### Journey A — Sell offline and sync later

1.  Create invoice/sale offline
2.  Print receipt / send WhatsApp/SMS (optional integration later)
3.  Stock decreases offline immediately
4.  When online returns, the system syncs:
    *   sale record
    *   stock movement event
    *   accounting posting (if enabled)

### Journey B — Receive stock offline (GRN)

1.  Create GRN offline
2.  Stock increases offline
3.  Attach supplier document/photo
4.  Sync later and link to PO (if PO exists)

### Journey C — Purchases approval workflow

1.  Create Purchase Requisition
2.  Approver approves/rejects (offline allowable, sync later)
3.  Convert to PO
4.  GRN and supplier invoice match (3-way matching)

### Journey D — Accountant closes month

1.  Review postings and reconciliations
2.  Lock period
3.  Generate VAT report / exports

***

# 2) Architecture (What you are building technically)

## Target Stack

### Frontend

*   **Next.js (App Router)**
*   **PWA** (service worker, offline caching)
*   State/Data:
    *   **React Query** for server state
    *   **Zustand** for UI state
    *   **Dexie.js** for IndexedDB offline storage
*   UI:
    *   **shadcn/ui + Tailwind**
    *   Data tables, forms, modals, toasts

### Backend

*   **Bun runtime**
*   **Hono** framework
*   **Drizzle ORM**
*   **Zod** validation
*   **JWT / Supabase Auth integration**
*   **Pino** logging

### Database

*   **Supabase Postgres**
*   **Row Level Security (RLS)** for multi-tenant
*   **Supabase Storage** for files (docs, receipts, employee docs)

### DevOps

*   Docker for dev
*   GitHub Actions CI/CD
*   Monitoring: Sentry + metrics (later: Prometheus/Grafana)

***

# 3) Monorepo Structure (Developer-friendly)

Use **Turborepo** or pnpm workspaces:

    /apps
      /web                # Next.js PWA
      /api                # Bun + Hono API
      /worker             # background jobs (email, payroll generation, reports)
    /packages
      /ui                 # shared UI components (shadcn wrappers)
      /db                 # Drizzle schema, migrations
      /shared             # types, zod schemas, utils
      /sync               # sync protocol + conflict helpers
      /config             # eslint/tsconfig/prettier

***

# 4) Core Domain Model (What tables/entities exist)

## Multi-tenancy pattern

Every business record includes:

*   `organization_id` (UUID)
*   plus common audit fields

### Common fields on most tables

*   `id UUID`
*   `organization_id UUID`
*   `created_at TIMESTAMP`
*   `updated_at TIMESTAMP`
*   `created_by UUID`
*   `updated_by UUID`
*   `deleted_at TIMESTAMP NULL` (soft delete)
*   `version INT` (for optimistic concurrency)

***

# 5) Modules & Detailed Features (Build Specification)

## 5.1 Authentication & RBAC (Foundation – Phase 1)

### Features

*   Sign in / sign out
*   Roles:
    *   Admin, Owner, Accountant, Storekeeper, Procurement, HR, Payroll, ProjectManager
*   Permissions:
    *   Module-level access + action-level (create/update/delete/approve/export)
*   Audit log viewer for Admin

### Dev Notes

*   Use Supabase Auth for users.
*   Maintain `profiles` table with role and org mapping.
*   Use RLS on every table based on `organization_id`.

**Tables**

*   `organizations`
*   `profiles`
*   `roles` (optional)
*   `permissions` (optional)
*   `audit_logs`

***

## 5.2 Stakeholders Module (Phase 2)

### Entities

*   Customers
*   Suppliers
*   Contacts
*   Interactions (calls, notes, emails)

### Features

*   CRUD stakeholders
*   Custom fields (JSONB)
*   Credit limits & payment terms
*   Statements + aging summary
*   Import/Export CSV
*   Supplier performance scoring (later)

**Tables**

*   `stakeholders` (type: CUSTOMER/SUPPLIER)
*   `stakeholder_contacts`
*   `stakeholder_interactions`

***

## 5.3 Inventory/Store Module (Phase 2, Offline-critical)

### Principle: Stock is event-based

Don’t “edit stock quantity” directly. Use **append-only stock movements**.

### Entities

*   Item/Product
*   Location/Warehouse
*   Stock Movement (GRN, SALE, ISSUE, TRANSFER, ADJUSTMENT)
*   Batches & expiry (optional)
*   Stock counts (cycle counts)

### Core Features

*   Items master
*   GRN creation
*   Stock issue/transfer
*   Real-time stock view (computed)
*   Offline: all movements stored locally and synced later
*   Reorder points + alerts
*   Barcode scanning (later hardware integration)

**Tables**

*   `items`
*   `item_categories`
*   `locations`
*   `stock_movements`  ✅ append-only
*   `stock_batches` (optional)
*   `inventory_counts`
*   `inventory_count_lines`

**Stock calculation**

*   Stock at location = sum(qty\_delta) for item + location

***

## 5.4 Purchases Module (Phase 2)

### Entities

*   Purchase Requisition (PR)
*   Purchase Order (PO)
*   Supplier Invoice
*   Matching records (3-way matching)

### Core Workflow

1.  PR created
2.  Approvals (limits per role)
3.  Convert PR → PO
4.  Receive GRN linked to PO
5.  Supplier invoice entered
6.  3-way matching: PO vs GRN vs Invoice
7.  Payment request created

**Tables**

*   `purchase_requisitions`, `purchase_requisition_lines`
*   `purchase_orders`, `purchase_order_lines`
*   `goods_received_notes`, `grn_lines`
*   `supplier_invoices`, `supplier_invoice_lines`
*   `approvals`

***

## 5.5 Finance / Account & Cash Management (Phase 2)

### Core concept: double-entry ledger

Every financial transaction produces ledger entries.

### Entities

*   Chart of accounts
*   Journal entries
*   Payments/receipts
*   Petty cash
*   Bank accounts
*   Reconciliation

### Features

*   Chart of accounts template (industry pack)
*   Invoice posting → journal entries
*   Payments → journal entries
*   Bank reconciliation
*   Cashflow forecast (phase 4)
*   VAT reporting structure (phase 4 compliance)

**Tables**

*   `accounts` (chart)
*   `journal_entries`
*   `journal_lines`
*   `bank_accounts`
*   `payments`
*   `payment_allocations`
*   `reconciliations`

***

## 5.6 Budget Module (Phase 2)

### Features

*   Budget codes + hierarchy
*   Budget vs actual tracking
*   Approval workflow
*   Variance reports
*   Alerts on overrun

**Tables**

*   `budgets`
*   `budget_lines`
*   `budget_transactions_map` (link actuals to budgets)

***

## 5.7 HR Module (Phase 3)

### Features

*   Employee master
*   Document storage
*   Leave requests + approvals
*   Salary advances/loans
*   Attendance (phase 4 integration)

**Tables**

*   `employees`
*   `employee_documents`
*   `leave_requests`
*   `advances`

***

## 5.8 Payroll Module (Phase 3)

### Features

*   Payroll schedules
*   Allowances, deductions, benefits
*   PAYE computation rules (configurable)
*   Generate payslips (PDF)
*   Bank payment file export
*   Year-end certificate generation

**Tables**

*   `payroll_runs`
*   `payroll_run_lines`
*   `payroll_items` (earnings/deductions)
*   `tax_tables` (configurable)

***

## 5.9 Production/Projects Module (Phase 3)

### Features

*   Projects with hierarchy
*   Milestones + Gantt chart
*   Resource allocation
*   Budget allocation per project
*   Material requirements integration (inventory)

**Tables**

*   `projects`
*   `project_milestones`
*   `project_resources`
*   `project_budgets`

***

## 5.10 Dashboard & Analytics (Phase 4)

### Features

*   KPIs per role
*   Report builder (basic filters → export)
*   Scheduled reports (email)
*   Predictive analytics (phase-based)

**Tables**

*   `dashboards`
*   `dashboard_widgets`
*   `reports`
*   `report_runs`

***

# 6) Offline-First Implementation (Developer Specification)

## 6.1 Local DB schema (IndexedDB via Dexie)

Create these Dexie tables:

*   `cache_*` tables for each entity (items, customers, invoices…)
*   `outbox` (queued operations)
*   `sync_state` (per table cursor + timestamps)
*   `conflicts` (conflict records needing resolution)

### `outbox` record structure

```ts
type OutboxOp = {
  id: string;                 // UUID = idempotency key
  orgId: string;
  userId: string;
  deviceId: string;
  table: string;              // e.g., "stock_movements"
  action: "CREATE" | "UPDATE" | "DELETE";
  entityId: string;           // record id
  payload: any;               // full change
  expectedVersion?: number;   // for OCC on updates
  priority: number;           // payments/sales higher priority
  status: "PENDING" | "SYNCED" | "CONFLICT" | "FAILED";
  createdAtLocal: number;
};
```

## 6.2 Sync protocol (Push then Pull)

### Push

1.  Fetch PENDING outbox ops ordered by priority, then time
2.  POST `/sync/push` with batch of ops
3.  Server returns:
    *   applied ops
    *   conflicts
    *   rejected errors

### Pull

4.  GET `/sync/pull?cursor=...` per table or unified cursor
5.  Update local caches and sync cursors

***

# 7) Conflict Resolution (Exactly how to implement)

## 7.1 Design rule: Not all conflicts are equal

*   **Inventory movements:** append-only → usually no conflict (events merge)
*   **Finance (invoices/payments):** conflicts must be **manual review**
*   **Master data:** can merge fields (if safe)

## 7.2 Mechanisms required

### 1) Idempotency

Every op has a unique `id` used as `idempotency_key`.  
Server stores processed keys in `operations_log`.

### 2) Optimistic Concurrency Control (OCC)

Records that can be edited include:

*   `version INT`
    Client sends `expectedVersion`.  
    If mismatch → conflict created.

### 3) Conflict record

Store both versions and require user decision:

```ts
type ConflictRecord = {
  conflictId: string;
  operationId: string;
  table: string;
  entityId: string;
  reason: string;
  localPayload: any;
  serverPayload: any;
  resolution?: "USE_SERVER" | "KEEP_LOCAL" | "MERGE" | "ADJUSTMENT" | "CANCEL";
  createdAt: number;
};
```

## 7.3 Conflict Resolution UI requirements

*   List conflicts
*   Show Local vs Server diff
*   Provide safe action buttons
*   For finance: prefer “adjustment/credit note” rather than overwrite

***

# 8) API Contracts (Build-ready endpoints)

## 8.1 Auth & Org

```http
POST /auth/login
GET  /me
POST /organizations
GET  /organizations/:id
```

## 8.2 Stakeholders

```http
GET  /stakeholders?type=CUSTOMER
POST /stakeholders
PATCH /stakeholders/:id
GET  /stakeholders/:id/statement
```

## 8.3 Inventory

```http
GET  /items
POST /items
GET  /stock/summary?locationId=...
POST /stock-movements           // append-only
POST /grn                       // creates GRN + movements
POST /inventory-counts
```

## 8.4 Purchases

```http
POST /purchase-requisitions
POST /purchase-requisitions/:id/submit
POST /purchase-requisitions/:id/approve
POST /purchase-orders
POST /purchase-orders/:id/receive   // creates GRN
POST /supplier-invoices
POST /supplier-invoices/:id/match   // 3-way match
```

## 8.5 Finance

```http
GET  /accounts
POST /invoices
POST /payments
POST /journal-entries
POST /reconciliations/import
GET  /reports/vat
```

## 8.6 Sync

```http
POST /sync/push
GET  /sync/pull?cursor=...
GET  /sync/status
POST /sync/resolve-conflict
```

### `/sync/push` request example

```json
{
  "deviceId": "dev_123",
  "orgId": "org_abc",
  "operations": [
    {
      "id": "op_uuid",
      "table": "stock_movements",
      "action": "CREATE",
      "entityId": "mov_uuid",
      "payload": { "...": "..." },
      "expectedVersion": null,
      "createdAtLocal": 1730000000
    }
  ]
}
```

***

# 9) Backend Services (How to organize code)

You can do microservices later; for MVP do “modular monolith”:

    /api/src
      /routes
        auth.ts
        stakeholders.ts
        inventory.ts
        purchases.ts
        finance.ts
        sync.ts
      /services
        ledger.service.ts
        inventory.service.ts
        approvals.service.ts
        tax.service.ts
        sync.service.ts
      /db
        schema.ts
        migrations/

### Key service rules

*   **inventory.service** creates stock movement events only (append-only)
*   **ledger.service** posts journal entries and ensures balancing
*   **sync.service** applies ops, checks idempotency, returns conflicts
*   **tax.service** handles VAT/PAYE rules from config tables

***

# 10) Predictive Analytics (Developer Plan)

Start simple and useful:

## Phase A (rules + SQL)

*   Stockout prediction:
    *   `avg_daily_sales = last_30_days_sales / 30`
    *   `days_left = current_stock / avg_daily_sales`
*   Late payment risk:
    *   based on aging + history
*   Budget overrun:
    *   burn rate and remaining time

## Phase B (light ML service)

*   Risk scoring endpoint:
    *   `POST /analytics/risk-score`
*   Train models offline or periodic batch job
*   Store scores per entity:
    *   `customer_scores`, `item_forecasts`

## Embed in UX

*   dashboard widgets
*   inline recommendations in inventory reorder screen
*   alerts panel

***

# 11) Non-Functional Requirements (Must meet)

## Performance

*   initial page load < 3s (good caching)
*   offline reads instant from IndexedDB
*   batch sync up to 200 ops per push

## Reliability

*   never lose offline operations
*   retries with exponential backoff
*   sync status visible to user

## Security

*   RLS in Supabase (org isolation)
*   encrypt sensitive offline fields (payroll, bank) using Web Crypto
*   full audit trail (who, what, when, device)

## Auditability

*   ledger entries immutable (no deletion; reversals only)
*   approvals logged
*   document attachments tracked

***

# 12) Testing Requirements (So developers know “done”)

## Unit tests

*   sync conflict rules
*   idempotency handling
*   ledger balancing logic

## Integration tests

*   API endpoints
*   database RLS policies
*   multi-tenant access checks

## E2E tests (Playwright)

*   offline: create sale → close tab → reopen → still exists
*   reconnect: sync → server shows data
*   simulate conflict and resolve

***

# 13) MVP Build Plan (Developer Execution Checklist)

## Sprint 1–2: Foundation

*   repo setup, CI, auth, orgs, RBAC
*   basic UI shell + navigation
*   IndexedDB + outbox + simple sync endpoint

## Sprint 3–6: Inventory + Stakeholders

*   items, locations, stock movements
*   GRN offline + stock summary
*   stakeholders CRUD offline

## Sprint 7–10: Purchases + basic Finance posting

*   PR/PO + approvals
*   supplier invoice
*   basic ledger posting (invoice/payment)

## Sprint 11–12: Reporting + hardening

*   basic dashboards
*   audit logs
*   conflict resolution UI
*   performance improvements

***

# 14) “Developer Definition of Done”

A feature is complete only if:

*   Works online and offline (if in offline scope)
*   Syncs without duplication (idempotency tested)
*   Conflicts are visible + resolvable
*   Has unit tests + one E2E scenario
*   Has audit log entries
*   RLS rules validated for multi-tenant

***

## One quick question (so I tailor the spec to your exact MVP)

Which **first vertical** are you building for?

1.  **Retail/POS + Inventory**
2.  **NGO/Projects + Budgets**
3.  **Schools (fees + payroll + accounting)**
4.  **Clinics (billing + pharmacy stock)**

Reply with the option number and I’ll refine this into a **Sprint-by-sprint backlog** with:

*   user stories
*   acceptance criteria
*   DB schema per story
*   exact API endpoints per story
