import { monthlyIncome } from "../../db/schema"
import {
  computeNetAmount,
  computeStoredVatFields,
  resolveVatRatePercent,
} from "../../utils/monthly-income"

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    month: string
    company: string
    type: "hourly" | "ryczalt"
    hours?: string | null
    hourlyRate?: string | null
    netAmount?: string | null
    vatExempt?: boolean
    vatRatePercent?: string | number | null
    notes?: string | null
  }>(event)
  if (!body?.month || !body.company || !body.type) {
    throw createError({ statusCode: 400, message: "month, company, type required" })
  }
  if (body.type !== "hourly" && body.type !== "ryczalt") {
    throw createError({ statusCode: 400, message: "type must be hourly or ryczalt" })
  }
  const exempt = Boolean(body.vatExempt)
  const rate = resolveVatRatePercent(exempt, body.vatRatePercent)
  const net = computeNetAmount(body.type, {
    hours: body.hours,
    hourlyRate: body.hourlyRate,
    netAmount: body.netAmount,
  })
  const vatFields = computeStoredVatFields(net, exempt, rate)

  const db = getDb()
  const [row] = await db
    .insert(monthlyIncome)
    .values({
      month: body.month,
      company: body.company,
      type: body.type,
      hours: body.type === "hourly" ? String(body.hours) : null,
      hourlyRate: body.type === "hourly" ? String(body.hourlyRate) : null,
      netAmount: net,
      ...vatFields,
      notes: body.notes ?? null,
    })
    .returning()
  return row
})
