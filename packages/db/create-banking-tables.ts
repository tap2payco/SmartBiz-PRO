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
    console.log('🚀 Creating banking tables...');

    try {
        // Create enums
        console.log('Creating banking enums...');
        await sql`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bank_account_type') THEN
                CREATE TYPE "public"."bank_account_type" AS ENUM('CASH', 'BANK', 'MOBILE_MONEY');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bank_transaction_type') THEN
                CREATE TYPE "public"."bank_transaction_type" AS ENUM('DEPOSIT', 'WITHDRAWAL');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bank_transaction_reference_type') THEN
                CREATE TYPE "public"."bank_transaction_reference_type" AS ENUM('SALE', 'PURCHASE', 'EXPENSE', 'TRANSFER', 'ADJUSTMENT');
            END IF;
        END $$;`;

        // Create bank_accounts table
        console.log('Creating bank_accounts table...');
        await sql`
            CREATE TABLE IF NOT EXISTS "bank_accounts" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "name" varchar(100) NOT NULL,
                "type" "bank_account_type" NOT NULL,
                "account_number" varchar(50),
                "bank_name" varchar(100),
                "currency" varchar(10) DEFAULT 'TZS' NOT NULL,
                "current_balance" numeric(15, 2) DEFAULT '0' NOT NULL,
                "is_active" boolean DEFAULT true NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );
        `;

        // Create bank_transactions table
        console.log('Creating bank_transactions table...');
        await sql`
            CREATE TABLE IF NOT EXISTS "bank_transactions" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
                "account_id" uuid NOT NULL REFERENCES "bank_accounts"("id"),
                "type" "bank_transaction_type" NOT NULL,
                "amount" numeric(15, 2) NOT NULL,
                "transaction_date" date DEFAULT now() NOT NULL,
                "description" text,
                "reference_type" "bank_transaction_reference_type" DEFAULT 'ADJUSTMENT' NOT NULL,
                "reference_id" uuid,
                "transfer_id" uuid,
                "created_by" uuid NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        `;

        console.log('✅ Banking tables created successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await sql.end();
    }
}

migrate();
