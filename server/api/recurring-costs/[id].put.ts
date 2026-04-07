import { and, eq } from 'drizzle-orm'

import { recurringCosts } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const { vaultId } = requireVaultAuth(event)

  const body = await readBody<{
    name?: string
    amount?: string
    category?: string | null
    startDate?: string
    endDate?: string | null
    dayOfMonth?: number
    notes?: string | null
  }>(event)
  const db = getDb()
  const [row] = await db
    .update(recurringCosts)
    .set({
      ...(body.name != null ? { name: body.name } : {}),
      ...(body.amount != null ? { amount: String(body.amount) } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.startDate != null ? { startDate: body.startDate } : {}),
      ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
      ...(body.dayOfMonth != null ? { dayOfMonth: body.dayOfMonth } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    })
    .where(and(eq(recurringCosts.id, id), eq(recurringCosts.vaultId, vaultId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'Not found' })
  return row
})
