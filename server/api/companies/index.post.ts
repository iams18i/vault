import { eq } from 'drizzle-orm'

import { companies } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string | null }>(event)
  const raw = body.name?.trim() ?? ''
  if (!raw) {
    throw createError({ statusCode: 400, message: 'name is required' })
  }
  if (raw.length > 255) {
    throw createError({
      statusCode: 400,
      message: 'name must be at most 255 characters',
    })
  }

  const db = getDb()

  const [existing] = await db.select().from(companies).where(eq(companies.name, raw)).limit(1)
  if (existing) return existing

  try {
    const [row] = await db.insert(companies).values({ name: raw }).returning()
    return row
  } catch {
    const [again] = await db.select().from(companies).where(eq(companies.name, raw)).limit(1)
    if (again) return again
    throw createError({ statusCode: 500, message: 'Failed to create company' })
  }
})
