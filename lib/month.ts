export function toYm(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function fromYm(ym: string): Date {
  const m = /^(\d{4})-(\d{2})$/.exec(ym)
  if (!m) return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const year = Number(m[1])
  const month = Number(m[2])
  return new Date(year, month - 1, 1)
}

export function shiftMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

