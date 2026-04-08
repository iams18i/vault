import { and, eq } from 'drizzle-orm'

import { companies, monthlyIncome } from '../db/schema'
import { getDb } from './db'
import { num } from './parse'

/** Dashboard synthetic row + backing tax_entries row use this exact name. */
export const SYNTHETIC_VAT_FROM_INCOME_NAME = 'VAT (z dochodu)'

/** Tax entries whose name references VAT — merged into dashboard „VAT (z dochodu)”. */
export function isVatTaxEntryName(name: string): boolean {
  return /\bvat\b/i.test(name.trim())
}

export async function getIncomeVatTotalForMonth(
  db: ReturnType<typeof getDb>,
  vaultId: string,
  monthParam: string,
): Promise<number> {
  const incomeRows = await db
    .select({ vatAmount: monthlyIncome.vatAmount })
    .from(monthlyIncome)
    .innerJoin(companies, eq(monthlyIncome.companyId, companies.id))
    .where(
      and(
        eq(monthlyIncome.vaultId, vaultId),
        eq(companies.vaultId, vaultId),
        eq(monthlyIncome.month, monthParam),
      ),
    )
  return Math.round(incomeRows.reduce((s, r) => s + num(r.vatAmount), 0) * 100) / 100
}
