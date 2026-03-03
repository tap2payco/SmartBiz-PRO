ALTER TABLE "stakeholders" ADD COLUMN "loyalty_points" numeric(15, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "project_tasks" ADD COLUMN "assigned_to" uuid;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assigned_to_employees_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;