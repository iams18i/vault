import { num } from "./parse"
import { computeVatGross, isAllowedVatRate } from "./vat-pl"

export function computeNetAmount(
  type: "hourly" | "ryczalt",
  input: { hours?: string | null; hourlyRate?: string | null; netAmount?: string | null },
): string {
  if (type === "hourly") {
    const h = num(input.hours)
    const r = num(input.hourlyRate)
    if (h <= 0 || r <= 0) {
      throw createError({ statusCode: 400, message: "hours and hourlyRate must be positive for hourly type" })
    }
    return (Math.round(h * r * 100) / 100).toFixed(2)
  }
  const n = num(input.netAmount)
  if (n < 0) {
    throw createError({ statusCode: 400, message: "netAmount required for ryczalt type" })
  }
  return (Math.round(n * 100) / 100).toFixed(2)
}

/** Resolves VAT rate from request: exempt → null; else default 23 or validate body value. */
export function resolveVatRatePercent(exempt: boolean, raw: string | number | null | undefined): number | null {
  if (exempt) return null
  const r = raw === undefined || raw === null || raw === "" ? 23 : Number(raw)
  if (!Number.isFinite(r) || !isAllowedVatRate(r)) {
    throw createError({
      statusCode: 400,
      message: "vatRatePercent must be 23, 8, 5, or 0 when not VAT-exempt",
    })
  }
  return r
}

export function computeStoredVatFields(
  netAmountStr: string,
  exempt: boolean,
  ratePercent: number | null,
): {
  vatExempt: boolean
  vatRatePercent: string | null
  vatAmount: string
  grossAmount: string
} {
  const { vatAmount, grossAmount } = computeVatGross(num(netAmountStr), {
    exempt,
    ratePercent: exempt ? null : ratePercent,
  })
  return {
    vatExempt: exempt,
    vatRatePercent: exempt ? null : ratePercent != null ? String(ratePercent) : null,
    vatAmount,
    grossAmount,
  }
}
