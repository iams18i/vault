DROP TABLE IF EXISTS "income_deductions";
DROP TABLE IF EXISTS "income_sources";
--> statement-breakpoint
CREATE TABLE "monthly_income" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" varchar(7) NOT NULL,
	"company" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"hours" numeric(10, 2),
	"hourly_rate" numeric(14, 2),
	"net_amount" numeric(14, 2) NOT NULL,
	"notes" text
);
