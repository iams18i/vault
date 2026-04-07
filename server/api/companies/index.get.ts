import { asc, eq } from 'drizzle-orm'

import { companies } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const { vaultId } = requireVaultAuth(event)
  const db = getDb()
  return db
    .select()
    .from(companies)
    .where(eq(companies.vaultId, vaultId))
    .orderBy(asc(companies.name))
})
