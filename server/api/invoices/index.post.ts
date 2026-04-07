import { invoices } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const { vaultId } = requireVaultAuth(event)
  const body = await readBody<{
    month: string
    grossAmount: string
    invoiceNumber?: string | null
    vendor?: string | null
    description?: string | null
    netAmount?: string
    vatAmount?: string
    issueDate?: string | null
    dueDate?: string | null
    paidDate?: string | null
    status?: 'pending' | 'paid' | 'overdue'
    notes?: string | null
  }>(event)
  if (!body?.month || body.grossAmount == null) {
    throw createError({ statusCode: 400, message: 'month and grossAmount required' })
  }
  const db = getDb()
  const [row] = await db
    .insert(invoices)
    .values({
      vaultId,
      month: body.month,
      grossAmount: String(body.grossAmount),
      invoiceNumber: body.invoiceNumber ?? null,
      vendor: body.vendor ?? null,
      description: body.description ?? null,
      netAmount: String(body.netAmount ?? '0'),
      vatAmount: String(body.vatAmount ?? '0'),
      issueDate: body.issueDate ?? null,
      dueDate: body.dueDate ?? null,
      paidDate: body.paidDate ?? null,
      status: body.status ?? 'pending',
      notes: body.notes ?? null,
    })
    .returning()
  return row
})
