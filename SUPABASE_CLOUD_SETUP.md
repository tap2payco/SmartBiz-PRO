# SmartBiz Pro ERP - Cloud Supabase Setup Guide

## Step 1: Create Supabase Project

1. **Go to Supabase**: https://supabase.com
2. **Sign up/Login** with your account
3. **Create New Project**:
   - **Organization**: Create new or select existing
   - **Project Name**: `SmartBiz Pro`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to Tanzania:
     - **Singapore** (ap-southeast-1) - Good for East Africa
     - **Frankfurt** (eu-central-1) - Alternative
   - **Pricing Plan**: Free tier (sufficient for development)

4. **Wait for provisioning** (~2 minutes)

## Step 2: Get Your Connection Details

Once the project is ready:

### A. API Credentials

1. Go to **Project Settings** (gear icon) → **API**
2. Copy these values:

```
Project URL: https://[your-project-ref].supabase.co
anon public key: eyJhbGc...
service_role key: eyJhbGc... (keep this secret!)
```

### B. Database Connection

1. Go to **Project Settings** → **Database**
2. Scroll to **Connection String** → **URI**
3. Copy the connection string:

```
postgresql://postgres.[your-project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Important**: Replace `[YOUR-PASSWORD]` with the database password you created.

## Step 3: Update Environment Variables

Create a `.env` file in the root of your project:

```bash
# Copy from .env.example
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key...

# Database
DATABASE_URL=postgresql://postgres.[your-project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres

# API Configuration
API_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001

# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Feature Flags
ENABLE_OFFLINE_MODE=true
ENABLE_ANALYTICS=false
ENABLE_DEBUG=true
```

## Step 4: Install Dependencies

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install all project dependencies
pnpm install
```

## Step 5: Push Database Schema

```bash
# Navigate to database package
cd packages/db

# Generate migration files
bun run generate

# Push schema to Supabase
bun run push
```

This will create all the tables in your Supabase database.

## Step 6: Set Up Row Level Security (RLS)

In the Supabase Dashboard:

1. Go to **Database** → **Tables**
2. For each table, click on it and go to **RLS** tab
3. **Enable RLS** for all tables

### Create RLS Policies

Run these SQL commands in **SQL Editor**:

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their organization's data
CREATE POLICY "Users can access own organization data"
ON profiles
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can access own organization stakeholders"
ON stakeholders
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Add similar policies for other tables
-- (We'll create a complete SQL file for this later)
```

## Step 7: Create Database Functions

Create a function for updating `updated_at` timestamps:

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stakeholders_updated_at
BEFORE UPDATE ON stakeholders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for other tables as needed
```

## Step 8: Verify Setup

Test the connection:

```bash
# From project root
cd packages/db

# This should connect and show your tables
bun run studio
```

Open http://localhost:4983 to see Drizzle Studio with your database.

## Step 9: Seed Initial Data (Optional)

```bash
cd packages/db
bun run seed
```

This will create:
- A default organization
- An admin user profile
- Sample stakeholders

## Troubleshooting

### Connection Issues

If you can't connect:

1. **Check firewall**: Ensure port 6543 is not blocked
2. **Verify password**: Make sure you replaced `[YOUR-PASSWORD]` correctly
3. **Check region**: Ensure the region in the connection string matches your project

### SSL Issues

If you get SSL errors, try adding `?sslmode=require` to your DATABASE_URL:

```
DATABASE_URL=postgresql://...?sslmode=require
```

### RLS Blocking Queries

If queries are blocked by RLS:

1. Use the **service_role** key for backend operations (bypasses RLS)
2. Ensure RLS policies are correctly configured
3. Check that `auth.uid()` returns the correct user ID

## Next Steps

Once your database is set up:

1. ✅ Database schema created
2. ✅ RLS policies configured
3. ✅ Triggers set up
4. → Create API application (Bun + Hono)
5. → Create Web application (Next.js)
6. → Implement authentication
7. → Build first module (Stakeholders or POS)

---

**Need Help?**

- Supabase Docs: https://supabase.com/docs
- Drizzle ORM Docs: https://orm.drizzle.team
- Project Issues: Create an issue in the repo
