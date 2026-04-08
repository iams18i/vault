import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { recurringCostPayments, recurringCosts } from '../../../db/schema'
import { requireVaultAuth } from '../../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const { vaultId } = requireVaultAuth(event)
  const body = await readBody<{ month?: string }>(event)
  const month = body?.month?.trim()
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw createError({ statusCode: 400, message: 'month (YYYY-MM) required' })
  }

  const db = getDb()
  const [rc] = await db
    .select({ id: recurringCosts.id })
    .from(recurringCosts)
    .where(and(eq(recurringCosts.id, id), eq(recurringCosts.vaultId, vaultId)))
    .limit(1)
  if (!rc) throw createError({ statusCode: 404, message: 'Not found' })

  const now = new Date()
  await db
    .insert(recurringCostPayments)
    .values({
      id: nanoid(16),
      vaultId,
      recurringCostId: id,
      month,
      paid: true,
      paidAt: now,
    })
    .onConflictDoUpdate({
      target: [
        recurringCostPayments.vaultId,
        recurringCostPayments.recurringCostId,
        recurringCostPayments.month,
      ],
      set: { paid: true, paidAt: now },
    })

  return { ok: true, paid: true }
})
