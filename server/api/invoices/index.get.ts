import { and, eq } from 'drizzle-orm'

import { invoices } from '../../db/schema'
import { requireVaultAuth } from '../../utils/vault-scope'

export default defineEventHandler(async (event) => {
  const { vaultId } = requireVaultAuth(event)
  const q = getQuery(event)
  const month = q.month as string | undefined
  const status = q.status as string | undefined
  const db = getDb()
  const v = eq(invoices.vaultId, vaultId)
  const conditions = [v]
  if (month) conditions.push(eq(invoices.month, month))
  if (status)
    conditions.push(eq(invoices.status, status as 'pending' | 'paid' | 'overdue'))
  if (conditions.length === 1) {
    return db.select().from(invoices).where(v).orderBy(invoices.id)
  }
  return db
    .select()
    .from(invoices)
    .where(and(...conditions))
    .orderBy(invoices.id)
})
