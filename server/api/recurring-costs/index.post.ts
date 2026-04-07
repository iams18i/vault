import { recurringCosts } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const { vaultId } = requireVaultAuth(event)
  const body = await readBody<{
    name: string
    amount: string
    category?: string | null
    startDate: string
    endDate?: string | null
    dayOfMonth?: number
    notes?: string | null
  }>(event)
  if (!body?.name || body.amount == null || !body.startDate) {
    throw createError({ statusCode: 400, message: 'name, amount, startDate required' })
  }
  const db = getDb()
  const [row] = await db
    .insert(recurringCosts)
    .values({
      vaultId,
      name: body.name,
      amount: String(body.amount),
      category: body.category ?? null,
      startDate: body.startDate,
      endDate: body.endDate ?? null,
      dayOfMonth: body.dayOfMonth ?? 1,
      notes: body.notes ?? null,
    })
    .returning()
  return row
})
