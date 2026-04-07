import { and, eq } from 'drizzle-orm'

import { recurringCosts } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const { vaultId } = requireVaultAuth(event)

  const db = getDb()
  const [row] = await db
    .delete(recurringCosts)
    .where(and(eq(recurringCosts.id, id), eq(recurringCosts.vaultId, vaultId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'Not found' })
  return { ok: true }
})
