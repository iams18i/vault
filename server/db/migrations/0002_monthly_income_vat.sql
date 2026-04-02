ALTER TABLE "monthly_income" ADD COLUMN "vat_exempt" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "monthly_income" ADD COLUMN "vat_rate_percent" numeric(5, 2);
--> statement-breakpoint
ALTER TABLE "monthly_income" ADD COLUMN "vat_amount" numeric(14, 2) DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "monthly_income" ADD COLUMN "gross_amount" numeric(14, 2) DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE "monthly_income" SET
  "vat_exempt" = false,
  "vat_rate_percent" = 23,
  "vat_amount" = ROUND(CAST("net_amount" AS numeric) * 23 / 100, 2),
  "gross_amount" = CAST("net_amount" AS numeric) + ROUND(CAST("net_amount" AS numeric) * 23 / 100, 2);
