import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL is not defined in .env');
    process.exit(1);
}

const sql = postgres(connectionString);

async function migrate() {
    console.log('🚀 Creating purchase management tables...');

    try {
        // Enums
        console.log('Creating enums...');
        await sql`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_order_status') THEN
                CREATE TYPE "public"."purchase_order_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'ISSUED', 'PARTIAL_RECEIVED', 'COMPLETED', 'CANCELLED');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grn_status') THEN
                CREATE TYPE "public"."grn_status" AS ENUM('DRAFT', 'VERIFIED', 'CANCELLED');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
                CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'PENDING', 'PARTIAL_PAID', 'PAID', 'OVERDUE', 'CANCELLED');
            END IF;
        END $$;`;

        // Purchase Orders
        console.log('Creating purchase_orders table...');
        await sql`
            CREATE TABLE IF NOT EXISTS "purchase_orders" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "supplier_id" uuid NOT NULL REFERENCES "stakeholders"("id"),
                "order_number" varchar(50) NOT NULL,
                "issue_date" date DEFAULT now() NOT NULL,
                "expected_delivery_date" date,
                "status" "purchase_order_status" DEFAULT 'DRAFT' NOT NULL,
                "total_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
                "notes" text,
                "terms_and_conditions" text,
                "created_by" uuid NOT NULL,
                "approved_by" uuid,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );
        `;

        // Purchase Order Lines
        console.log('Creating purchase_order_lines table...');
        await sql`
            CREATE TABLE IF NOT EXISTS "purchase_order_lines" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "purchase_order_id" uuid NOT NULL REFERENCES "purchase_orders"("id") ON DELETE cascade,
                "item_id" uuid NOT NULL REFERENCES "items"("id"),
                "quantity" integer NOT NULL,
                "received_quantity" integer DEFAULT 0 NOT NULL,
                "unit_cost" numeric(15, 2) NOT NULL,
                "total_cost" numeric(15, 2) NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        `;

        // GRNs
        console.log('Creating grns table...');
        await sql`
            CREATE TABLE IF NOT EXISTS "grns" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "purchase_order_id" uuid REFERENCES "purchase_orders"("id"),
                "supplier_id" uuid NOT NULL REFERENCES "stakeholders"("id"),
                "grn_number" varchar(50) NOT NULL,
                "delivery_note_number" varchar(100),
                "received_date" date DEFAULT now() NOT NULL,
                "status" "grn_status" DEFAULT 'DRAFT' NOT NULL,
                "notes" text,
                "received_by" uuid NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );
        `;

        // GRN Lines
        console.log('Creating grn_lines table...');
        await sql`
            CREATE TABLE IF NOT EXISTS "grn_lines" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "grn_id" uuid NOT NULL REFERENCES "grns"("id") ON DELETE cascade,
                "po_line_id" uuid REFERENCES "purchase_order_lines"("id"),
                "item_id" uuid NOT NULL REFERENCES "items"("id"),
                "quantity_received" integer NOT NULL,
                "notes" text,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        `;

        // Supplier Invoices
        console.log('Creating supplier_invoices table...');
        await sql`
            CREATE TABLE IF NOT EXISTS "supplier_invoices" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "supplier_id" uuid NOT NULL REFERENCES "stakeholders"("id"),
                "purchase_order_id" uuid REFERENCES "purchase_orders"("id"),
                "grn_id" uuid REFERENCES "grns"("id"),
                "invoice_number" varchar(100) NOT NULL,
                "invoice_date" date NOT NULL,
                "due_date" date,
                "status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
                "subtotal" numeric(15, 2) NOT NULL,
                "tax_total" numeric(15, 2) DEFAULT '0' NOT NULL,
                "total_amount" numeric(15, 2) NOT NULL,
                "paid_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );
        `;

        console.log('✅ Purchase tables created successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await sql.end();
    }
}

migrate();
