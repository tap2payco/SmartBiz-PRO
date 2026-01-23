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
    console.log('🚀 Creating purchase_payments table...');

    try {
        // Create payment method enum
        console.log('Creating purchase_payment_method enum...');
        await sql`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_payment_method') THEN
                CREATE TYPE "public"."purchase_payment_method" AS ENUM('CASH', 'BANK_TRANSFER', 'CHEQUE', 'MOBILE_MONEY', 'OTHER');
            END IF;
        END $$;`;

        // Create purchase_payments table
        console.log('Creating purchase_payments table...');
        await sql`
            CREATE TABLE IF NOT EXISTS "purchase_payments" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "supplier_invoice_id" uuid NOT NULL REFERENCES "supplier_invoices"("id"),
                "supplier_id" uuid NOT NULL REFERENCES "stakeholders"("id"),
                "amount" numeric(15, 2) NOT NULL,
                "payment_method" "purchase_payment_method" NOT NULL,
                "payment_date" date DEFAULT now() NOT NULL,
                "reference" varchar(100),
                "notes" text,
                "created_by" uuid NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        `;

        console.log('✅ purchase_payments table created successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await sql.end();
    }
}

migrate();
