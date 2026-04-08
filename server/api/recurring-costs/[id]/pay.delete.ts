import { and, eq } from 'drizzle-orm'

import { recurringCostPayments, recurringCosts } from '../../../db/schema'
import { requireVaultAuth } from '../../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const { vaultId } = requireVaultAuth(event)
  const q = getQuery(event)
  const month = typeof q.month === 'string' ? q.month.trim() : ''
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw createError({ statusCode: 400, message: 'month query (YYYY-MM) required' })
  }

  const db = getDb()
  const [rc] = await db
    .select({ id: recurringCosts.id })
    .from(recurringCosts)
    .where(and(eq(recurringCosts.id, id), eq(recurringCosts.vaultId, vaultId)))
    .limit(1)
  if (!rc) throw createError({ statusCode: 404, message: 'Not found' })

  await db
    .update(recurringCostPayments)
    .set({ paid: false, paidAt: null })
    .where(
      and(
        eq(recurringCostPayments.vaultId, vaultId),
        eq(recurringCostPayments.recurringCostId, id),
        eq(recurringCostPayments.month, month),
      ),
    )

  return { ok: true, paid: false }
})
