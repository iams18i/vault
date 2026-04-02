export function useMonth() {
  const currentYm = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  }

  const shiftMonth = (ym: string, delta: number) => {
    const [y, m] = ym.split("-").map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  }

  return { currentYm, shiftMonth }
}
