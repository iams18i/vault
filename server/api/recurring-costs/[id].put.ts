import { eq } from "drizzle-orm"
import { recurringCosts } from "../../db/schema"

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: "Invalid id" })
  const body = await readBody<{
    name?: string
    amount?: string
    category?: string | null
    startDate?: string
    endDate?: string | null
    dayOfMonth?: number
    notes?: string | null
  }>(event)
  const db = getDb()
  const [row] = await db
    .update(recurringCosts)
    .set({
      ...(body.name != null ? { name: body.name } : {}),
      ...(body.amount != null ? { amount: String(body.amount) } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.startDate != null ? { startDate: body.startDate } : {}),
      ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
      ...(body.dayOfMonth != null ? { dayOfMonth: body.dayOfMonth } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    })
    .where(eq(recurringCosts.id, id))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: "Not found" })
  return row
})
