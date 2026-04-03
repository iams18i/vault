import { count, eq } from 'drizzle-orm'

import { companies, monthlyIncome } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, message: 'Invalid id' })
  }

  const db = getDb()
  const [row] = await db.select().from(companies).where(eq(companies.id, id)).limit(1)
  if (!row) throw createError({ statusCode: 404, message: 'Not found' })

  const [incRow] = await db
    .select({ n: count() })
    .from(monthlyIncome)
    .where(eq(monthlyIncome.companyId, id))

  const nInc = Number(incRow?.n ?? 0)
  if (nInc > 0) {
    throw createError({
      statusCode: 409,
      message:
        'Nie można usunąć kontrahenta przypisanego do wpisów dochodu. Zmień kontrahenta lub usuń te wpisy.',
    })
  }

  await db.delete(companies).where(eq(companies.id, id))
  return { ok: true }
})
