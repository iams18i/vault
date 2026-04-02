CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
INSERT INTO "categories" ("name")
SELECT DISTINCT TRIM(t.category) AS name
FROM (
	SELECT "category" FROM "monthly_expenses" WHERE "category" IS NOT NULL AND TRIM("category") <> ''
	UNION
	SELECT "category" FROM "recurring_costs" WHERE "category" IS NOT NULL AND TRIM("category") <> ''
) AS t;
