import { monthlyExpenses } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const { vaultId } = requireVaultAuth(event)
  const body = await readBody<{
    month: string
    name: string
    amount: string
    category?: string | null
    expenseDate?: string | null
    notes?: string | null
  }>(event)
  if (!body?.month || !body.name || body.amount == null) {
    throw createError({ statusCode: 400, message: 'month, name, amount required' })
  }
  const db = getDb()
  const [row] = await db
    .insert(monthlyExpenses)
    .values({
      vaultId,
      month: body.month,
      name: body.name,
      amount: String(body.amount),
      category: body.category ?? null,
      expenseDate: body.expenseDate ?? null,
      notes: body.notes ?? null,
    })
    .returning()
  return row
})
