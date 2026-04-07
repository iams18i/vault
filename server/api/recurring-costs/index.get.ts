import { and, eq } from 'drizzle-orm'

import { recurringCosts } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const { vaultId } = requireVaultAuth(event)
  const q = getQuery(event)
  const category =
    typeof q.category === 'string' && q.category.trim() !== ''
      ? q.category.trim()
      : undefined
  const db = getDb()
  if (category) {
    return db
      .select()
      .from(recurringCosts)
      .where(
        and(
          eq(recurringCosts.vaultId, vaultId),
          eq(recurringCosts.category, category),
        ),
      )
      .orderBy(recurringCosts.id)
  }
  return db
    .select()
    .from(recurringCosts)
    .where(eq(recurringCosts.vaultId, vaultId))
    .orderBy(recurringCosts.id)
})
