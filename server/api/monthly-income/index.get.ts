import { and, eq } from 'drizzle-orm'

import { companies, monthlyIncome } from '../../db/schema'

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
  const q = getQuery(event)
  const month = q.month as string | undefined
  const companyIdNum = Number(q.companyId as string | undefined)

  const db = getDb()
  const base = db
    .select(incomeSelect)
    .from(monthlyIncome)
    .innerJoin(companies, eq(monthlyIncome.companyId, companies.id))

  const conditions = []
  if (month) conditions.push(eq(monthlyIncome.month, month))
  if (Number.isFinite(companyIdNum)) {
    conditions.push(eq(monthlyIncome.companyId, companyIdNum))
  }

  if (conditions.length === 0) {
    return base.orderBy(monthlyIncome.id)
  }
  if (conditions.length === 1) {
    return base.where(conditions[0]).orderBy(monthlyIncome.id)
  }
  return base.where(and(...conditions)).orderBy(monthlyIncome.id)
})
