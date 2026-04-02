import { eq } from "drizzle-orm"
import { monthlyIncome } from "../../db/schema"
import {
  computeNetAmount,
  computeStoredVatFields,
  resolveVatRatePercent,
} from "../../utils/monthly-income"

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: "Invalid id" })
  const body = await readBody<{
    month?: string
    company?: string
    type?: "hourly" | "ryczalt"
    hours?: string | null
    hourlyRate?: string | null
    netAmount?: string | null
    vatExempt?: boolean
    vatRatePercent?: string | number | null
    notes?: string | null
  }>(event)
  const db = getDb()
  const [existing] = await db.select().from(monthlyIncome).where(eq(monthlyIncome.id, id))
  if (!existing) throw createError({ statusCode: 404, message: "Not found" })

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
      netAmount: type === "ryczalt" ? netInput : undefined,
    })
  }

  const exempt = body.vatExempt !== undefined ? Boolean(body.vatExempt) : existing.vatExempt
  const rate = exempt
    ? null
    : body.vatRatePercent !== undefined
      ? resolveVatRatePercent(false, body.vatRatePercent)
      : resolveVatRatePercent(false, existing.vatRatePercent ?? undefined)

  const vatFields = computeStoredVatFields(netAmount, exempt, rate)

  const [row] = await db
    .update(monthlyIncome)
    .set({
      ...(body.month != null ? { month: body.month } : {}),
      ...(body.company != null ? { company: body.company } : {}),
      ...(body.type != null ? { type: body.type } : {}),
      hours: type === "hourly" ? (hours != null ? String(hours) : null) : null,
      hourlyRate: type === "hourly" ? (hourlyRate != null ? String(hourlyRate) : null) : null,
      netAmount,
      ...vatFields,
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    })
    .where(eq(monthlyIncome.id, id))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: "Not found" })
  return row
})
