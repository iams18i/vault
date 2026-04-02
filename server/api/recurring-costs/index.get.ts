import { eq } from "drizzle-orm"
import { recurringCosts } from "../../db/schema"

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const category = typeof q.category === "string" && q.category.trim() !== "" ? q.category.trim() : undefined
  const db = getDb()
  if (category) {
    return db
      .select()
      .from(recurringCosts)
      .where(eq(recurringCosts.category, category))
      .orderBy(recurringCosts.id)
  }
  return db.select().from(recurringCosts).orderBy(recurringCosts.id)
})
