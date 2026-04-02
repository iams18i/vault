import { and, eq } from "drizzle-orm"
import { monthlyExpenses } from "../../db/schema"

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const month = q.month as string | undefined
  const category = typeof q.category === "string" && q.category.trim() !== "" ? q.category.trim() : undefined
  const db = getDb()

  if (month && category) {
    return db
      .select()
      .from(monthlyExpenses)
      .where(and(eq(monthlyExpenses.month, month), eq(monthlyExpenses.category, category)))
      .orderBy(monthlyExpenses.id)
  }
  if (month) {
    return db
      .select()
      .from(monthlyExpenses)
      .where(eq(monthlyExpenses.month, month))
      .orderBy(monthlyExpenses.id)
  }
  if (category) {
    return db
      .select()
      .from(monthlyExpenses)
      .where(eq(monthlyExpenses.category, category))
      .orderBy(monthlyExpenses.id)
  }
  return db.select().from(monthlyExpenses).orderBy(monthlyExpenses.id)
})
