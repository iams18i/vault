import { and, eq } from 'drizzle-orm'

import { taxEntries } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const { vaultId } = requireVaultAuth(event)
  const q = getQuery(event)
  const year = q.year != null ? Number(q.year) : undefined
  const month = q.month != null ? Number(q.month) : undefined
  const db = getDb()
  const v = eq(taxEntries.vaultId, vaultId)
  if (year != null && Number.isFinite(year) && month != null && Number.isFinite(month)) {
    return db
      .select()
      .from(taxEntries)
      .where(and(v, eq(taxEntries.year, year), eq(taxEntries.month, month)))
      .orderBy(taxEntries.id)
  }
  if (year != null && Number.isFinite(year)) {
    return db
      .select()
      .from(taxEntries)
      .where(and(v, eq(taxEntries.year, year)))
      .orderBy(taxEntries.id)
  }
  return db
    .select()
    .from(taxEntries)
    .where(v)
    .orderBy(taxEntries.id)
})
