/** Statutory VAT rates commonly used on Polish invoices (podstawowa + obniżone + zero). */
export const POLAND_VAT_RATES = [23, 8, 5, 0] as const
export type PolandVatRate = (typeof POLAND_VAT_RATES)[number]

export function isAllowedVatRate(n: number): n is PolandVatRate {
  return (POLAND_VAT_RATES as readonly number[]).includes(n)
}

export function computeVatGross(
  net: number,
  opts: { exempt: boolean; ratePercent: number | null },
): { vatAmount: string; grossAmount: string } {
  if (opts.exempt) {
    const n = Math.round(net * 100) / 100
    return { vatAmount: "0.00", grossAmount: n.toFixed(2) }
  }
  const rate = opts.ratePercent
  if (rate == null || !isAllowedVatRate(rate)) {
    throw createError({
      statusCode: 400,
      message: `vatRatePercent must be one of: ${POLAND_VAT_RATES.join(", ")}`,
    })
  }
  const vatRaw = (net * rate) / 100
  const vat = Math.round(vatRaw * 100) / 100
  const gross = Math.round((net + vat) * 100) / 100
  return { vatAmount: vat.toFixed(2), grossAmount: gross.toFixed(2) }
}
