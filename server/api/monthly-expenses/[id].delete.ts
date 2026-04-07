import { and, eq } from 'drizzle-orm'

import { monthlyExpenses } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const { vaultId } = requireVaultAuth(event)

  const db = getDb()
  const [row] = await db
    .delete(monthlyExpenses)
    .where(and(eq(monthlyExpenses.id, id), eq(monthlyExpenses.vaultId, vaultId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'Not found' })
  return { ok: true }
})
