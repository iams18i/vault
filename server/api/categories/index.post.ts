import { eq } from "drizzle-orm"
import { categories } from "../../db/schema"

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string | null }>(event)
  const raw = body.name?.trim() ?? ""
  if (!raw) {
    throw createError({ statusCode: 400, message: "name is required" })
  }
  if (raw.length > 128) {
    throw createError({ statusCode: 400, message: "name must be at most 128 characters" })
  }

  const db = getDb()

  const [existing] = await db.select().from(categories).where(eq(categories.name, raw)).limit(1)
  if (existing) return existing

  try {
    const [row] = await db.insert(categories).values({ name: raw }).returning()
    return row
  } catch {
    const [again] = await db.select().from(categories).where(eq(categories.name, raw)).limit(1)
    if (again) return again
    throw createError({ statusCode: 500, message: "Failed to create category" })
  }
})
