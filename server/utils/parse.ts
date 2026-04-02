export function num(s: string | null | undefined): number {
  if (s == null || s === "") return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}
