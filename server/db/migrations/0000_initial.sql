CREATE TABLE "income_deductions" (
	"id" serial PRIMARY KEY NOT NULL,
	"income_source_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"value" numeric(14, 4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"gross_amount" numeric(14, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(128),
	"vendor" varchar(255),
	"description" text,
	"net_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"vat_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"gross_amount" numeric(14, 2) NOT NULL,
	"issue_date" date,
	"due_date" date,
	"paid_date" date,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"month" varchar(7) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "monthly_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" varchar(7) NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"category" varchar(128),
	"expense_date" date,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "recurring_costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"category" varchar(128),
	"start_date" date NOT NULL,
	"end_date" date,
	"day_of_month" integer DEFAULT 1 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "tax_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"amount_due" numeric(14, 2) NOT NULL,
	"amount_paid" numeric(14, 2) DEFAULT '0' NOT NULL,
	"due_date" date,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "income_deductions" ADD CONSTRAINT "income_deductions_income_source_id_income_sources_id_fk" FOREIGN KEY ("income_source_id") REFERENCES "public"."income_sources"("id") ON DELETE cascade ON UPDATE no action;