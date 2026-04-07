import { and, eq } from 'drizzle-orm'

import { companies } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const { vaultId } = requireVaultAuth(event)

  const body = await readBody<{ name?: string | null }>(event)

  const db = getDb()
  const [current] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, id), eq(companies.vaultId, vaultId)))
    .limit(1)
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
    const [dup] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.vaultId, vaultId), eq(companies.name, trimmed)))
      .limit(1)
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
    .where(and(eq(companies.id, id), eq(companies.vaultId, vaultId)))
    .returning()
  return updated
})
