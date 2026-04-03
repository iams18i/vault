import { eq } from 'drizzle-orm'

import { companies, monthlyIncome } from '../../db/schema'
import {
  computeNetAmount,
  computeStoredVatFields,
  resolveVatRatePercent,
} from '../../utils/monthly-income'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    month: string
    companyId: number
    type: 'hourly' | 'ryczalt'
    hours?: string | null
    hourlyRate?: string | null
    netAmount?: string | null
    vatExempt?: boolean
    vatRatePercent?: string | number | null
    notes?: string | null
  }>(event)

  const companyId = Number(body?.companyId)
  if (!body?.month || !Number.isFinite(companyId) || !body?.type) {
    throw createError({
      statusCode: 400,
      message: 'month, companyId, type required',
    })
  }
  if (body.type !== 'hourly' && body.type !== 'ryczalt') {
    throw createError({ statusCode: 400, message: 'type must be hourly or ryczalt' })
  }

  const db = getDb()
  const [co] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1)
  if (!co) {
    throw createError({ statusCode: 400, message: 'companyId not found' })
  }

  const exempt = Boolean(body.vatExempt)
  const rate = resolveVatRatePercent(exempt, body.vatRatePercent)
  const net = computeNetAmount(body.type, {
    hours: body.hours,
    hourlyRate: body.hourlyRate,
    netAmount: body.netAmount,
  })
  const vatFields = computeStoredVatFields(net, exempt, rate)

  const [row] = await db
    .insert(monthlyIncome)
    .values({
      month: body.month,
      companyId,
      type: body.type,
      hours: body.type === 'hourly' ? String(body.hours) : null,
      hourlyRate: body.type === 'hourly' ? String(body.hourlyRate) : null,
      netAmount: net,
      ...vatFields,
      notes: body.notes ?? null,
    })
    .returning()

  return { ...row, company: co.name }
})
