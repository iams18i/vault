import { and, eq } from 'drizzle-orm'

import { taxEntries } from '../../../db/schema'
import {
  getIncomeVatTotalForMonth,
  isVatTaxEntryName,
  SYNTHETIC_VAT_FROM_INCOME_NAME,
} from '../../../utils/vatFromIncome'
import { requireVaultAuth } from '../../../utils/vault-scope'

function parseMonth(ym: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym)
  if (!m) throw createError({ statusCode: 400, message: 'month must be YYYY-MM' })
  const y = Number(m[1])
  const mo = Number(m[2])
  if (mo < 1 || mo > 12) throw createError({ statusCode: 400, message: 'Invalid month' })
  return { y, mo }
}

export default defineEventHandler(async (event) => {
  const { vaultId } = requireVaultAuth(event)
  const monthParam = getQuery(event).month
  if (typeof monthParam !== 'string' || !/^\d{4}-\d{2}$/.test(monthParam)) {
    throw createError({ statusCode: 400, message: 'query month (YYYY-MM) required' })
  }
  const { y, mo } = parseMonth(monthParam)
  const db = getDb()

  const taxRows = await db
    .select()
    .from(taxEntries)
    .where(
      and(eq(taxEntries.vaultId, vaultId), eq(taxEntries.year, y), eq(taxEntries.month, mo)),
    )

  const existing = taxRows.find(
    (t) => isVatTaxEntryName(t.name) && t.name.trim() === SYNTHETIC_VAT_FROM_INCOME_NAME,
  )
  if (!existing) {
    return { ok: true, noop: true as const }
  }

  const D = await getIncomeVatTotalForMonth(db, vaultId, monthParam)
  const [row] = await db
    .update(taxEntries)
    .set({
      amountDue: String(D),
      amountPaid: '0',
      status: 'pending',
      paidAt: null,
    })
    .where(eq(taxEntries.id, existing.id))
    .returning()
  return row
})
