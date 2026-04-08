import { and, eq } from 'drizzle-orm'

import { taxEntries } from '../../../db/schema'
import {
  getIncomeVatTotalForMonth,
  isVatTaxEntryName,
  SYNTHETIC_VAT_FROM_INCOME_NAME,
} from '../../../utils/vatFromIncome'
import { num } from '../../../utils/parse'
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
  const body = await readBody<{ month?: string }>(event)
  const monthParam = body?.month
  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    throw createError({ statusCode: 400, message: 'body.month (YYYY-MM) required' })
  }
  const { y, mo } = parseMonth(monthParam)
  const db = getDb()

  const D = await getIncomeVatTotalForMonth(db, vaultId, monthParam)
  const taxRows = await db
    .select()
    .from(taxEntries)
    .where(
      and(eq(taxEntries.vaultId, vaultId), eq(taxEntries.year, y), eq(taxEntries.month, mo)),
    )

  const vatRows = taxRows.filter((t) => isVatTaxEntryName(t.name))
  const P_other = Math.round(
    vatRows
      .filter((t) => t.name.trim() !== SYNTHETIC_VAT_FROM_INCOME_NAME)
      .reduce((s, t) => s + num(t.amountPaid), 0) * 100,
  ) / 100
  const need = Math.round((D - P_other) * 100) / 100

  const existing = vatRows.find((t) => t.name.trim() === SYNTHETIC_VAT_FROM_INCOME_NAME)

  if (need <= 0) {
    return { ok: true, month: monthParam, skipped: true as const }
  }

  if (existing) {
    const [row] = await db
      .update(taxEntries)
      .set({
        amountDue: String(D),
        amountPaid: String(need),
        status: 'paid',
        paidAt: new Date(),
      })
      .where(eq(taxEntries.id, existing.id))
      .returning()
    return row
  }

  const [row] = await db
    .insert(taxEntries)
    .values({
      vaultId,
      name: SYNTHETIC_VAT_FROM_INCOME_NAME,
      year: y,
      month: mo,
      amountDue: String(D),
      amountPaid: String(need),
      status: 'paid',
      paidAt: new Date(),
    })
    .returning()
  return row
})
