CREATE INDEX "stakeholder_interactions_stakeholder_idx" ON "stakeholder_interactions" USING btree ("stakeholder_id");--> statement-breakpoint
CREATE INDEX "stakeholder_interactions_type_idx" ON "stakeholder_interactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "stakeholders_org_idx" ON "stakeholders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "stakeholders_type_idx" ON "stakeholders" USING btree ("type");--> statement-breakpoint
CREATE INDEX "stakeholders_code_idx" ON "stakeholders" USING btree ("code");--> statement-breakpoint
CREATE INDEX "items_org_idx" ON "items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "items_category_idx" ON "items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "items_sku_idx" ON "items" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "stock_movements_org_idx" ON "stock_movements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "stock_movements_item_idx" ON "stock_movements" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "stock_movements_location_idx" ON "stock_movements" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "payments_org_idx" ON "payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payments_sale_idx" ON "payments" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sale_items_sale_idx" ON "sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sale_items_item_idx" ON "sale_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "sales_org_idx" ON "sales" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sales_customer_idx" ON "sales" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "sales_created_at_idx" ON "sales" USING btree ("created_at");