import { sql } from 'drizzle-orm';

export async function runMigrations(db: any) {
    console.log('🚀 Starting database migration...');

    try {
        // Enums
        console.log('Checking enums...');
        await db.execute(sql`DO $$ BEGIN
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

        await db.execute(sql`
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

        await db.execute(sql`
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
        await db.execute(sql`
            ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "image_url" text;
        `);

        await db.execute(sql`
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

        await db.execute(sql`
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

        await db.execute(sql`
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
        await db.execute(sql`
            ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "due_date" timestamp;
        `);

        await db.execute(sql`
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

        await db.execute(sql`
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

        // Add constraints separately to avoid errors if they already exist
        console.log('Adding constraints...');
        await db.execute(sql`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_customer_id_stakeholders_id_fk') THEN
                ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_stakeholders_id_fk" FOREIGN KEY ("customer_id") REFERENCES "stakeholders"("id") ON DELETE set null;
            END IF;
        END $$;`);

        console.log('✅ Database migration completed successfully!');
    } catch (error) {
        console.error('❌ Database migration failed:', error);
        throw error; // Re-throw to fail startup
    }
}
