import { eq } from 'drizzle-orm'

import { companies } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, message: 'Invalid id' })
  }

  const body = await readBody<{ name?: string | null }>(event)

  const db = getDb()
  const [current] = await db.select().from(companies).where(eq(companies.id, id)).limit(1)
  if (!current) throw createError({ statusCode: 404, message: 'Not found' })

  if (body.name === undefined) return current

  const trimmed = (body.name ?? '').trim()
  if (!trimmed) {
    throw createError({ statusCode: 400, message: 'name is required' })
  }
  if (trimmed.length > 255) {
    throw createError({
      statusCode: 400,
      message: 'name must be at most 255 characters',
    })
  }

  if (trimmed !== current.name) {
    const [dup] = await db.select().from(companies).where(eq(companies.name, trimmed)).limit(1)
    if (dup && dup.id !== id) {
      throw createError({
        statusCode: 409,
        message: 'Kontrahent o tej nazwie już istnieje',
      })
    }
  }

  const [updated] = await db
    .update(companies)
    .set({ name: trimmed })
    .where(eq(companies.id, id))
    .returning()
  return updated
})
