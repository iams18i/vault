import { count, eq } from 'drizzle-orm'
import { categories, monthlyExpenses, recurringCosts } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id))
    throw createError({ statusCode: 400, message: 'Invalid id' })

  const db = getDb()
  const [row] = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
  if (!row) throw createError({ statusCode: 404, message: 'Not found' })

  const [expRow] = await db
    .select({ n: count() })
    .from(monthlyExpenses)
    .where(eq(monthlyExpenses.category, row.name))
  const [recRow] = await db
    .select({ n: count() })
    .from(recurringCosts)
    .where(eq(recurringCosts.category, row.name))

  const nExp = Number(expRow?.n ?? 0)
  const nRec = Number(recRow?.n ?? 0)
  if (nExp > 0 || nRec > 0) {
    throw createError({
      statusCode: 409,
      message:
        'Nie można usunąć kategorii przypisanej do wydatków lub kosztów stałych. Zmień kategorię tych pozycji.',
    })
  }

  await db.delete(categories).where(eq(categories.id, id))
  return { ok: true }
})
