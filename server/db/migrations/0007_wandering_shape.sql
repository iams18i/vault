ALTER TABLE "monthly_expenses" ADD COLUMN "paid" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "monthly_expenses" ADD COLUMN "paid_at" timestamp;
--> statement-breakpoint
CREATE TABLE "recurring_cost_payments" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"vault_id" varchar(16) NOT NULL,
	"recurring_cost_id" varchar(16) NOT NULL,
	"month" varchar(7) NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "recurring_cost_payments" ADD CONSTRAINT "recurring_cost_payments_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_cost_payments" ADD CONSTRAINT "recurring_cost_payments_recurring_cost_id_recurring_costs_id_fk" FOREIGN KEY ("recurring_cost_id") REFERENCES "public"."recurring_costs"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "rcp_vault_rc_month_uq" ON "recurring_cost_payments" USING btree ("vault_id","recurring_cost_id","month");
