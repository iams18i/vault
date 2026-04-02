import { eq } from "drizzle-orm"
import { taxEntries } from "../../db/schema"

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: "Invalid id" })
  const body = await readBody<{
    name?: string
    year?: number
    month?: number
    amountDue?: string
    amountPaid?: string
    dueDate?: string | null
    status?: "pending" | "paid" | "partial"
    notes?: string | null
  }>(event)
  const db = getDb()
  const [row] = await db
    .update(taxEntries)
    .set({
      ...(body.name != null ? { name: body.name } : {}),
      ...(body.year != null ? { year: body.year } : {}),
      ...(body.month != null ? { month: body.month } : {}),
      ...(body.amountDue != null ? { amountDue: String(body.amountDue) } : {}),
      ...(body.amountPaid != null ? { amountPaid: String(body.amountPaid) } : {}),
      ...(body.dueDate !== undefined ? { dueDate: body.dueDate } : {}),
      ...(body.status != null ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    })
    .where(eq(taxEntries.id, id))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: "Not found" })
  return row
})
