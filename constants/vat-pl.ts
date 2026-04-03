/** Polish VAT options for UI (stawki + zwolnienie). */
export const VAT_OPTIONS = [
  { value: "23", label: "23% (podstawowa)" },
  { value: "8", label: "8% (obniżona)" },
  { value: "5", label: "5% (obniżona)" },
  { value: "0", label: "0%" },
  { value: "exempt", label: "Zwolniony z VAT" },
] as const

export type VatSelectValue = (typeof VAT_OPTIONS)[number]["value"]

export function vatSelectToPayload(v: VatSelectValue): { vatExempt: boolean; vatRatePercent?: number } {
  if (v === "exempt") return { vatExempt: true }
  return { vatExempt: false, vatRatePercent: Number(v) }
}

export function payloadToVatSelect(exempt: boolean, rate: string | null | undefined): VatSelectValue {
  if (exempt) return "exempt"
  const n = rate != null && rate !== "" ? String(Number(rate)) : "23"
  if (n === "23" || n === "8" || n === "5" || n === "0") return n as VatSelectValue
  return "23"
}

/** Client-side preview aligned with server rounding (2 grosze). */
export function previewVatGross(net: number, sel: VatSelectValue): { vat: number; gross: number } {
  if (sel === "exempt") return { vat: 0, gross: Math.round(net * 100) / 100 }
  const rate = Number(sel)
  const vat = Math.round((net * rate) / 100 * 100) / 100
  const gross = Math.round((net + vat) * 100) / 100
  return { vat, gross }
}

/** Brutto → netto + VAT (2 grosze); `vat + net` sumuje się do brutto. */
export function previewNetVatFromGross(
  gross: number,
  sel: VatSelectValue,
): { net: number; vat: number } {
  if (sel === "exempt") {
    const net = Math.round(gross * 100) / 100
    return { net, vat: 0 }
  }
  const rate = Number(sel)
  const net = Math.round((gross / (1 + rate / 100)) * 100) / 100
  const vat = Math.round((gross - net) * 100) / 100
  return { net, vat }
}
