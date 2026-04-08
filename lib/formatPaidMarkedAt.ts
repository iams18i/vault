/** Format API ISO timestamp for „marked paid” labels (pl-PL). */
export function formatPaidMarkedAt(value: string | null | undefined) {
  if (value == null || value === '') return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
