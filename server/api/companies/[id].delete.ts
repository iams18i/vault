import { and, count, eq } from 'drizzle-orm'

import { companies, monthlyIncome } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const { vaultId } = requireVaultAuth(event)

  const db = getDb()
  const [row] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, id), eq(companies.vaultId, vaultId)))
    .limit(1)
  if (!row) throw createError({ statusCode: 404, message: 'Not found' })

  const [incRow] = await db
    .select({ n: count() })
    .from(monthlyIncome)
    .where(
      and(
        eq(monthlyIncome.vaultId, vaultId),
        eq(monthlyIncome.companyId, id),
      ),
    )

  const nInc = Number(incRow?.n ?? 0)
  if (nInc > 0) {
    throw createError({
      statusCode: 409,
      message:
        'Nie można usunąć kontrahenta przypisanego do wpisów dochodu. Zmień kontrahenta lub usuń te wpisy.',
    })
  }

  await db
    .delete(companies)
    .where(and(eq(companies.id, id), eq(companies.vaultId, vaultId)))
  return { ok: true }
})
