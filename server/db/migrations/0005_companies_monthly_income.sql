CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT "companies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
INSERT INTO "companies" ("name")
SELECT DISTINCT TRIM("company")
FROM "monthly_income"
WHERE LENGTH(TRIM("company")) > 0;
--> statement-breakpoint
INSERT INTO "companies" ("name")
SELECT '(brak)'
WHERE EXISTS (SELECT 1 FROM "monthly_income")
  AND NOT EXISTS (SELECT 1 FROM "companies");
--> statement-breakpoint
ALTER TABLE "monthly_income" ADD COLUMN "company_id" integer;
--> statement-breakpoint
UPDATE "monthly_income" AS mi
SET "company_id" = c."id"
FROM "companies" AS c
WHERE TRIM(mi."company") = c."name";
--> statement-breakpoint
UPDATE "monthly_income"
SET "company_id" = (SELECT "id" FROM "companies" WHERE "name" = '(brak)' LIMIT 1)
WHERE "company_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "monthly_income" ALTER COLUMN "company_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "monthly_income" ADD CONSTRAINT "monthly_income_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "monthly_income" DROP COLUMN "company";
