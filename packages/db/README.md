# Database Package (@smartbiz/db)

This package contains the database schema, migrations, and ORM configuration using Drizzle ORM.

## Setup

### 1. Create a Supabase Project

Since we're not using Docker, you'll need to create a cloud Supabase project:

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: SmartBiz Pro
   - **Database Password**: (generate a strong password)
   - **Region**: Choose closest to Tanzania (e.g., Singapore or Frankfurt)
   - **Pricing Plan**: Free tier is fine for development

5. Wait for the project to be created (~2 minutes)

### 2. Get Connection Details

Once your project is ready:

1. Go to **Project Settings** → **Database**
2. Find the **Connection String** section
3. Copy the **URI** (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)

### 3. Configure Environment Variables

Update your `.env` file in the root of the project:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

You can find the API keys in **Project Settings** → **API**.

### 4. Generate and Run Migrations

```bash
# Generate migration files from schema
cd packages/db
npm run generate

# Push schema to database
npm run push

# Or run migrations
npm run migrate
```

## Schema Overview

### Core Tables

#### `organizations`
- Multi-tenant organization data
- Industry, currency, timezone settings
- JSONB settings for flexibility

#### `profiles`
- User profiles linked to Supabase auth.users
- Role-based access control (RBAC)
- Permissions stored as JSONB array

#### `audit_logs`
- Complete audit trail
- Tracks all CREATE, UPDATE, DELETE operations
- Stores before/after values

#### `operations_log`
- Idempotency tracking for sync operations
- Prevents duplicate operations from offline sync
- Stores operation payload and status

#### `stakeholders`
- Customers and suppliers
- Credit limits and payment terms
- Custom fields support

#### `stakeholder_contacts`
- Contact persons for stakeholders
- Primary contact designation

#### `stakeholder_interactions`
- Interaction history (calls, emails, meetings, notes)
- Linked to specific stakeholders

## Row Level Security (RLS)

All tables include `organization_id` for multi-tenant isolation. RLS policies will be created to ensure:

1. Users can only access data from their organization
2. Proper permission checks for CRUD operations
3. Audit logs are append-only

## Usage in Code

```typescript
import { db, organizations, profiles } from '@smartbiz/db';
import { eq } from 'drizzle-orm';

// Query organizations
const orgs = await db.select().from(organizations);

// Query with filter
const profile = await db
  .select()
  .from(profiles)
  .where(eq(profiles.userId, userId))
  .limit(1);

// Insert
const newOrg = await db
  .insert(organizations)
  .values({
    name: 'My Retail Store',
    slug: 'my-retail-store',
    industry: 'RETAIL',
    country: 'TZ',
    currency: 'TZS',
  })
  .returning();
```

## Scripts

- `npm run generate` - Generate migration files from schema changes
- `npm run migrate` - Run pending migrations
- `npm run push` - Push schema directly to database (dev only)
- `npm run studio` - Open Drizzle Studio (database GUI)
- `npm run seed` - Seed database with sample data

## Next Steps

After setting up the database:

1. Create RLS policies in Supabase dashboard
2. Set up database triggers for `updated_at` timestamps
3. Create indexes for performance
4. Implement seed data for development
