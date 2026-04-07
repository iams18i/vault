import { and, count, eq } from 'drizzle-orm'

import { categories, monthlyExpenses, recurringCosts } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const { vaultId } = requireVaultAuth(event)

  const db = getDb()
  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.vaultId, vaultId)))
    .limit(1)
  if (!row) throw createError({ statusCode: 404, message: 'Not found' })

  const [expRow] = await db
    .select({ n: count() })
    .from(monthlyExpenses)
    .where(
      and(
        eq(monthlyExpenses.vaultId, vaultId),
        eq(monthlyExpenses.category, row.name),
      ),
    )
  const [recRow] = await db
    .select({ n: count() })
    .from(recurringCosts)
    .where(
      and(
        eq(recurringCosts.vaultId, vaultId),
        eq(recurringCosts.category, row.name),
      ),
    )

  const nExp = Number(expRow?.n ?? 0)
  const nRec = Number(recRow?.n ?? 0)
  if (nExp > 0 || nRec > 0) {
    throw createError({
      statusCode: 409,
      message:
        'Nie można usunąć kategorii przypisanej do wydatków lub kosztów stałych. Zmień kategorię tych pozycji.',
    })
  }

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.vaultId, vaultId)))
  return { ok: true }
})
