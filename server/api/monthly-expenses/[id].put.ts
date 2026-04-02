import { eq } from "drizzle-orm"
import { monthlyExpenses } from "../../db/schema"

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: "Invalid id" })
  const body = await readBody<{
    month?: string
    name?: string
    amount?: string
    category?: string | null
    expenseDate?: string | null
    notes?: string | null
  }>(event)
  const db = getDb()
  const [row] = await db
    .update(monthlyExpenses)
    .set({
      ...(body.month != null ? { month: body.month } : {}),
      ...(body.name != null ? { name: body.name } : {}),
      ...(body.amount != null ? { amount: String(body.amount) } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.expenseDate !== undefined ? { expenseDate: body.expenseDate } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    })
    .where(eq(monthlyExpenses.id, id))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: "Not found" })
  return row
})
