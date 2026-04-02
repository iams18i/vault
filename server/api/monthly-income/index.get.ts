import { eq } from "drizzle-orm"
import { monthlyIncome } from "../../db/schema"

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const month = q.month as string | undefined
  const db = getDb()
  if (month) {
    return db
      .select()
      .from(monthlyIncome)
      .where(eq(monthlyIncome.month, month))
      .orderBy(monthlyIncome.id)
  }
  return db.select().from(monthlyIncome).orderBy(monthlyIncome.id)
})
