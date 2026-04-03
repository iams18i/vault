import { createError } from 'h3'

const HEX = /^#[0-9A-Fa-f]{6}$/

/** Returns normalized `#RRGGBB` or null if empty. */
export function normalizeCategoryColor(
  value: string | null | undefined,
): string | null {
  if (value == null || typeof value !== 'string') return null
  const t = value.trim()
  if (!t) return null
  const withHash = t.startsWith('#') ? t : `#${t}`
  if (!HEX.test(withHash)) return null
  return withHash.toUpperCase()
}

/**
 * For optional API fields: `undefined` = omit, `null`/'' = clear, else hex or 400.
 */
export function parseOptionalCategoryColorField(
  input: unknown,
): string | null | undefined {
  if (input === undefined) return undefined
  if (input === null || input === '') return null
  const n = normalizeCategoryColor(String(input))
  if (!n) {
    throw createError({
      statusCode: 400,
      message: 'color must be #RRGGBB',
    })
  }
  return n
}
