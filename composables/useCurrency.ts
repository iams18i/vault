export function useCurrency() {
  const format = (value: number | string) => {
    const n = typeof value === "string" ? Number(value) : value
    const x = Number.isFinite(n) ? n : 0
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(x)
  }
  return { format }
}
