CREATE TYPE "public"."refund_status" AS ENUM('PENDING', 'PARTIAL', 'REFUNDED', 'CREDITED');--> statement-breakpoint
CREATE TYPE "public"."return_condition" AS ENUM('GOOD', 'DAMAGED', 'EXPIRED', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."return_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "return_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"total" numeric(15, 2) NOT NULL,
	"condition" "return_condition" DEFAULT 'GOOD' NOT NULL,
	"restock" boolean DEFAULT true NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sale_id" uuid NOT NULL,
	"customer_id" uuid,
	"return_number" varchar(50) NOT NULL,
	"status" "return_status" DEFAULT 'PENDING' NOT NULL,
	"refund_status" "refund_status" DEFAULT 'PENDING' NOT NULL,
	"total_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"refunded_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"approved_by" uuid
);
--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_id_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."returns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_customer_id_stakeholders_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."stakeholders"("id") ON DELETE no action ON UPDATE no action;