import { eq } from "drizzle-orm"
import { taxEntries } from "../../db/schema"

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: "Invalid id" })
  const db = getDb()
  const [row] = await db.select().from(taxEntries).where(eq(taxEntries.id, id))
  if (!row) throw createError({ statusCode: 404, message: "Not found" })
  return row
})
