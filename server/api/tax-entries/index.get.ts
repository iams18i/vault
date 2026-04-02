import { and, eq } from "drizzle-orm"
import { taxEntries } from "../../db/schema"

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const year = q.year != null ? Number(q.year) : undefined
  const month = q.month != null ? Number(q.month) : undefined
  const db = getDb()
  if (year != null && Number.isFinite(year) && month != null && Number.isFinite(month)) {
    return db
      .select()
      .from(taxEntries)
      .where(and(eq(taxEntries.year, year), eq(taxEntries.month, month)))
      .orderBy(taxEntries.id)
  }
  if (year != null && Number.isFinite(year)) {
    return db.select().from(taxEntries).where(eq(taxEntries.year, year)).orderBy(taxEntries.id)
  }
  return db.select().from(taxEntries).orderBy(taxEntries.id)
})
