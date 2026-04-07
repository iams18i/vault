import { and, eq } from 'drizzle-orm'

import { companies, monthlyIncome } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

const incomeSelect = {
  id: monthlyIncome.id,
  month: monthlyIncome.month,
  companyId: monthlyIncome.companyId,
  company: companies.name,
  type: monthlyIncome.type,
  hours: monthlyIncome.hours,
  hourlyRate: monthlyIncome.hourlyRate,
  netAmount: monthlyIncome.netAmount,
  vatExempt: monthlyIncome.vatExempt,
  vatRatePercent: monthlyIncome.vatRatePercent,
  vatAmount: monthlyIncome.vatAmount,
  grossAmount: monthlyIncome.grossAmount,
  notes: monthlyIncome.notes,
}

export default defineEventHandler(async (event) => {
  const { vaultId } = requireVaultAuth(event)
  const q = getQuery(event)
  const month = q.month as string | undefined
  const companyId = q.companyId as string | undefined

  const db = getDb()
  const base = db
    .select(incomeSelect)
    .from(monthlyIncome)
    .innerJoin(companies, eq(monthlyIncome.companyId, companies.id))

  const conditions = [
    eq(monthlyIncome.vaultId, vaultId),
    eq(companies.vaultId, vaultId),
  ]
  if (month) conditions.push(eq(monthlyIncome.month, month))
  if (companyId?.trim()) {
    conditions.push(eq(monthlyIncome.companyId, companyId.trim()))
  }

  return base.where(and(...conditions)).orderBy(monthlyIncome.id)
})
