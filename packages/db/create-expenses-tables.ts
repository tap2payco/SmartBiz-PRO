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
    console.log('🚀 Creating expense tracking tables...');

    try {
        // Create expense category type enum
        console.log('Creating expense_category_type enum...');
        await sql`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category_type') THEN
                CREATE TYPE "public"."expense_category_type" AS ENUM('OPERATING', 'ADMINISTRATIVE', 'MARKETING', 'PAYROLL', 'UTILITIES', 'RENT', 'OTHER');
            END IF;
        END $$;`;

        // Create expense_categories table
        console.log('Creating expense_categories table...');
        await sql`
            CREATE TABLE IF NOT EXISTS "expense_categories" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "name" varchar(100) NOT NULL,
                "type" "expense_category_type" DEFAULT 'OTHER' NOT NULL,
                "description" text,
                "is_active" boolean DEFAULT true NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        `;

        // Create expenses table
        console.log('Creating expenses table...');
        await sql`
            CREATE TABLE IF NOT EXISTS "expenses" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "category_id" uuid REFERENCES "expense_categories"("id"),
                "description" text NOT NULL,
                "amount" numeric(15, 2) NOT NULL,
                "expense_date" date DEFAULT now() NOT NULL,
                "reference" varchar(100),
                "payment_method" varchar(50),
                "notes" text,
                "created_by" uuid NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );
        `;

        console.log('✅ Expense tracking tables created successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await sql.end();
    }
}

migrate();
