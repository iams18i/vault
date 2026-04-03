import { eq } from 'drizzle-orm'
import { categories, monthlyExpenses, recurringCosts } from '../../db/schema'
import { parseOptionalCategoryColorField } from '../../utils/categoryColor'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id))
    throw createError({ statusCode: 400, message: 'Invalid id' })

  const body = await readBody<{
    name?: string | null
    color?: string | null
  }>(event)

  const db = getDb()
  const [current] = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
  if (!current)
    throw createError({ statusCode: 404, message: 'Not found' })

  let newName = current.name
  if (body.name !== undefined) {
    const trimmed = (body.name ?? '').trim()
    if (!trimmed)
      throw createError({ statusCode: 400, message: 'name is required' })
    if (trimmed.length > 128) {
      throw createError({
        statusCode: 400,
        message: 'name must be at most 128 characters',
      })
    }
    newName = trimmed
  }

  let newColor: string | null = current.color
  if (body.color !== undefined) {
    newColor = parseOptionalCategoryColorField(body.color) ?? null
  }

  if (newName !== current.name) {
    const [dup] = await db.select().from(categories).where(eq(categories.name, newName)).limit(1)
    if (dup && dup.id !== id) {
      throw createError({
        statusCode: 409,
        message: 'Kategoria o tej nazwie już istnieje',
      })
    }
  }

  const oldName = current.name
  const nameChanged = newName !== oldName

  await db.transaction(async (tx) => {
    if (nameChanged) {
      await tx
        .update(monthlyExpenses)
        .set({ category: newName })
        .where(eq(monthlyExpenses.category, oldName))
      await tx
        .update(recurringCosts)
        .set({ category: newName })
        .where(eq(recurringCosts.category, oldName))
    }
    await tx
      .update(categories)
      .set({ name: newName, color: newColor })
      .where(eq(categories.id, id))
  })

  const [updated] = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
  return updated
})
