import { asc, eq } from 'drizzle-orm'

import { categories } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const { vaultId } = requireVaultAuth(event)
  const db = getDb()
  return db
    .select()
    .from(categories)
    .where(eq(categories.vaultId, vaultId))
    .orderBy(asc(categories.name))
})
