-- Replaces legacy serial-key schema (0000–0005) with vault-scoped nanoid schema + auth.
-- Destructive: drops all existing app data in public.* listed below.
BEGIN;
DROP TABLE IF EXISTS "monthly_income" CASCADE;
DROP TABLE IF EXISTS "companies" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "monthly_expenses" CASCADE;
DROP TABLE IF EXISTS "recurring_costs" CASCADE;
DROP TABLE IF EXISTS "invoices" CASCADE;
DROP TABLE IF EXISTS "tax_entries" CASCADE;
DROP TABLE IF EXISTS "email_verification_tokens" CASCADE;
DROP TABLE IF EXISTS "vault_members" CASCADE;
DROP TABLE IF EXISTS "vaults" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
CREATE TABLE "users" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255),
	"email_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
CREATE TABLE "vaults" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_id" varchar(16) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "vault_members" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"vault_id" varchar(16) NOT NULL,
	"user_id" varchar(16) NOT NULL,
	"role" varchar(20) DEFAULT 'owner' NOT NULL
);
CREATE TABLE "email_verification_tokens" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"user_id" varchar(16) NOT NULL,
	"token" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
CREATE TABLE "categories" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"vault_id" varchar(16) NOT NULL,
	"name" varchar(128) NOT NULL,
	"color" varchar(7)
);
CREATE TABLE "companies" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"vault_id" varchar(16) NOT NULL,
	"name" varchar(255) NOT NULL
);
CREATE TABLE "monthly_income" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"vault_id" varchar(16) NOT NULL,
	"month" varchar(7) NOT NULL,
	"company_id" varchar(16) NOT NULL,
	"type" varchar(20) NOT NULL,
	"hours" numeric(10, 2),
	"hourly_rate" numeric(14, 2),
	"net_amount" numeric(14, 2) NOT NULL,
	"vat_exempt" boolean DEFAULT false NOT NULL,
	"vat_rate_percent" numeric(5, 2),
	"vat_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"gross_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"notes" text
);
CREATE TABLE "recurring_costs" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"vault_id" varchar(16) NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"category" varchar(128),
	"start_date" date NOT NULL,
	"end_date" date,
	"day_of_month" integer DEFAULT 1 NOT NULL,
	"notes" text
);
CREATE TABLE "monthly_expenses" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"vault_id" varchar(16) NOT NULL,
	"month" varchar(7) NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"category" varchar(128),
	"expense_date" date,
	"notes" text
);
CREATE TABLE "invoices" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"vault_id" varchar(16) NOT NULL,
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
CREATE TABLE "tax_entries" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"vault_id" varchar(16) NOT NULL,
	"name" varchar(255) NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"amount_due" numeric(14, 2) NOT NULL,
	"amount_paid" numeric(14, 2) DEFAULT '0' NOT NULL,
	"due_date" date,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text
);
ALTER TABLE "vaults" ADD CONSTRAINT "vaults_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "vault_members" ADD CONSTRAINT "vault_members_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "vault_members" ADD CONSTRAINT "vault_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "categories" ADD CONSTRAINT "categories_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "companies" ADD CONSTRAINT "companies_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "monthly_income" ADD CONSTRAINT "monthly_income_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "monthly_income" ADD CONSTRAINT "monthly_income_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "recurring_costs" ADD CONSTRAINT "recurring_costs_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "monthly_expenses" ADD CONSTRAINT "monthly_expenses_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tax_entries" ADD CONSTRAINT "tax_entries_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "vault_members_vault_user_uq" ON "vault_members" USING btree ("vault_id","user_id");
CREATE UNIQUE INDEX "categories_vault_name_uq" ON "categories" USING btree ("vault_id","name");
CREATE UNIQUE INDEX "companies_vault_name_uq" ON "companies" USING btree ("vault_id","name");
COMMIT;
