import { and, eq } from 'drizzle-orm'

import { monthlyExpenses } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const { vaultId } = requireVaultAuth(event)

  const body = await readBody<{
    month?: string
    name?: string
    amount?: string
    category?: string | null
    expenseDate?: string | null
    notes?: string | null
  }>(event)
  const db = getDb()
  const [row] = await db
    .update(monthlyExpenses)
    .set({
      ...(body.month != null ? { month: body.month } : {}),
      ...(body.name != null ? { name: body.name } : {}),
      ...(body.amount != null ? { amount: String(body.amount) } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.expenseDate !== undefined ? { expenseDate: body.expenseDate } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    })
    .where(and(eq(monthlyExpenses.id, id), eq(monthlyExpenses.vaultId, vaultId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'Not found' })
  return row
})
