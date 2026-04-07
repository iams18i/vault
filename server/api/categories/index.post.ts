import { and, eq } from 'drizzle-orm'

import { categories } from '../../db/schema'
import { parseOptionalCategoryColorField } from '../../utils/categoryColor'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const { vaultId } = requireVaultAuth(event)
  const body = await readBody<{ name?: string | null; color?: string | null }>(event)
  const raw = body.name?.trim() ?? ''
  if (!raw) {
    throw createError({ statusCode: 400, message: 'name is required' })
  }
  if (raw.length > 128) {
    throw createError({ statusCode: 400, message: 'name must be at most 128 characters' })
  }

  const colorField = parseOptionalCategoryColorField(body.color)

  const db = getDb()

  const [existing] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.vaultId, vaultId), eq(categories.name, raw)))
    .limit(1)
  if (existing) return existing

  const values =
    colorField === undefined
      ? { name: raw, vaultId }
      : { name: raw, color: colorField, vaultId }

  try {
    const [row] = await db.insert(categories).values(values).returning()
    return row
  } catch {
    const [again] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.vaultId, vaultId), eq(categories.name, raw)))
      .limit(1)
    if (again) return again
    throw createError({ statusCode: 500, message: 'Failed to create category' })
  }
})
