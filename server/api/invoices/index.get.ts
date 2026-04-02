import { and, eq } from "drizzle-orm"
import { invoices } from "../../db/schema"

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const month = q.month as string | undefined
  const status = q.status as string | undefined
  const db = getDb()
  const conditions = []
  if (month) conditions.push(eq(invoices.month, month))
  if (status) conditions.push(eq(invoices.status, status as "pending" | "paid" | "overdue"))
  if (conditions.length === 2) {
    return db
      .select()
      .from(invoices)
      .where(and(...conditions))
      .orderBy(invoices.id)
  }
  if (conditions.length === 1) {
    return db.select().from(invoices).where(conditions[0]!).orderBy(invoices.id)
  }
  return db.select().from(invoices).orderBy(invoices.id)
})
