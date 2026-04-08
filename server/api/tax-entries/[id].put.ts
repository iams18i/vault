import { and, eq } from 'drizzle-orm'

import { taxEntries } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const { vaultId } = requireVaultAuth(event)

  const body = await readBody<{
    name?: string
    year?: number
    month?: number
    amountDue?: string
    amountPaid?: string
    dueDate?: string | null
    status?: 'pending' | 'paid' | 'partial'
    notes?: string | null
  }>(event)
  const db = getDb()
  const [row] = await db
    .update(taxEntries)
    .set({
      ...(body.name != null ? { name: body.name } : {}),
      ...(body.year != null ? { year: body.year } : {}),
      ...(body.month != null ? { month: body.month } : {}),
      ...(body.amountDue != null ? { amountDue: String(body.amountDue) } : {}),
      ...(body.amountPaid != null ? { amountPaid: String(body.amountPaid) } : {}),
      ...(body.dueDate !== undefined ? { dueDate: body.dueDate } : {}),
      ...(body.status != null ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.status === 'paid' ? { paidAt: new Date() } : {}),
      ...(body.status === 'pending' || body.status === 'partial' ? { paidAt: null } : {}),
    })
    .where(and(eq(taxEntries.id, id), eq(taxEntries.vaultId, vaultId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'Not found' })
  return row
})
