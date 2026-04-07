import { and, eq } from 'drizzle-orm'

import { companies, monthlyIncome } from '../../db/schema'
import {
  computeNetAmount,
  computeStoredVatFields,
  resolveVatRatePercent,
} from '../../utils/monthly-income'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const { vaultId } = requireVaultAuth(event)

  const body = await readBody<{
    month?: string
    companyId?: string
    type?: 'hourly' | 'ryczalt'
    hours?: string | null
    hourlyRate?: string | null
    netAmount?: string | null
    vatExempt?: boolean
    vatRatePercent?: string | number | null
    notes?: string | null
  }>(event)
  const db = getDb()
  const [existing] = await db
    .select()
    .from(monthlyIncome)
    .where(and(eq(monthlyIncome.id, id), eq(monthlyIncome.vaultId, vaultId)))
    .limit(1)
  if (!existing) throw createError({ statusCode: 404, message: 'Not found' })

  let companyId = existing.companyId
  if (body.companyId !== undefined) {
    const next = body.companyId.trim()
    if (!next) {
      throw createError({ statusCode: 400, message: 'Invalid companyId' })
    }
    const [co] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, next), eq(companies.vaultId, vaultId)))
      .limit(1)
    if (!co) {
      throw createError({ statusCode: 400, message: 'companyId not found' })
    }
    companyId = next
  }

  const type = body.type ?? existing.type
  const hours = body.hours !== undefined ? body.hours : existing.hours
  const hourlyRate = body.hourlyRate !== undefined ? body.hourlyRate : existing.hourlyRate
  const netInput = body.netAmount !== undefined ? body.netAmount : existing.netAmount

  let netAmount = existing.netAmount
  if (
    body.type != null ||
    body.hours !== undefined ||
    body.hourlyRate !== undefined ||
    body.netAmount !== undefined
  ) {
    netAmount = computeNetAmount(type, {
      hours,
      hourlyRate,
      netAmount: type === 'ryczalt' ? netInput : undefined,
    })
  }

  const exempt = body.vatExempt !== undefined ? Boolean(body.vatExempt) : existing.vatExempt
  const rate = exempt
    ? null
    : body.vatRatePercent !== undefined
      ? resolveVatRatePercent(false, body.vatRatePercent)
      : resolveVatRatePercent(false, existing.vatRatePercent ?? undefined)

  const vatFields = computeStoredVatFields(netAmount, exempt, rate)

  await db
    .update(monthlyIncome)
    .set({
      ...(body.month != null ? { month: body.month } : {}),
      companyId,
      ...(body.type != null ? { type: body.type } : {}),
      hours: type === 'hourly' ? (hours != null ? String(hours) : null) : null,
      hourlyRate: type === 'hourly' ? (hourlyRate != null ? String(hourlyRate) : null) : null,
      netAmount,
      ...vatFields,
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    })
    .where(and(eq(monthlyIncome.id, id), eq(monthlyIncome.vaultId, vaultId)))

  const [withName] = await db
    .select({
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
    })
    .from(monthlyIncome)
    .innerJoin(companies, eq(monthlyIncome.companyId, companies.id))
    .where(and(eq(monthlyIncome.id, id), eq(monthlyIncome.vaultId, vaultId)))
    .limit(1)

  if (!withName) throw createError({ statusCode: 404, message: 'Not found' })
  return withName
})
