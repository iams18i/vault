import { eq } from "drizzle-orm"
import { monthlyIncome } from "../../db/schema"

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: "Invalid id" })
  const db = getDb()
  const [row] = await db.delete(monthlyIncome).where(eq(monthlyIncome.id, id)).returning()
  if (!row) throw createError({ statusCode: 404, message: "Not found" })
  return { ok: true }
})
