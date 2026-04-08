import { taxEntries } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const { vaultId } = requireVaultAuth(event)
  const body = await readBody<{
    name: string
    year: number
    month: number
    amountDue: string
    amountPaid?: string
    dueDate?: string | null
    status?: 'pending' | 'paid' | 'partial'
    notes?: string | null
  }>(event)
  if (!body?.name || body.year == null || body.month == null || body.amountDue == null) {
    throw createError({ statusCode: 400, message: 'name, year, month, amountDue required' })
  }
  const db = getDb()
  const [row] = await db
    .insert(taxEntries)
    .values({
      vaultId,
      name: body.name,
      year: body.year,
      month: body.month,
      amountDue: String(body.amountDue),
      amountPaid: String(body.amountPaid ?? '0'),
      dueDate: body.dueDate ?? null,
      status: body.status ?? 'pending',
      notes: body.notes ?? null,
      paidAt: body.status === 'paid' ? new Date() : null,
    })
    .returning()
  return row
})
