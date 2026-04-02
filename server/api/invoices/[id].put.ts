import { eq } from "drizzle-orm"
import { invoices } from "../../db/schema"

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: "Invalid id" })
  const body = await readBody<{
    month?: string
    grossAmount?: string
    invoiceNumber?: string | null
    vendor?: string | null
    description?: string | null
    netAmount?: string
    vatAmount?: string
    issueDate?: string | null
    dueDate?: string | null
    paidDate?: string | null
    status?: "pending" | "paid" | "overdue"
    notes?: string | null
  }>(event)
  const db = getDb()
  const [row] = await db
    .update(invoices)
    .set({
      ...(body.month != null ? { month: body.month } : {}),
      ...(body.grossAmount != null ? { grossAmount: String(body.grossAmount) } : {}),
      ...(body.invoiceNumber !== undefined ? { invoiceNumber: body.invoiceNumber } : {}),
      ...(body.vendor !== undefined ? { vendor: body.vendor } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.netAmount != null ? { netAmount: String(body.netAmount) } : {}),
      ...(body.vatAmount != null ? { vatAmount: String(body.vatAmount) } : {}),
      ...(body.issueDate !== undefined ? { issueDate: body.issueDate } : {}),
      ...(body.dueDate !== undefined ? { dueDate: body.dueDate } : {}),
      ...(body.paidDate !== undefined ? { paidDate: body.paidDate } : {}),
      ...(body.status != null ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    })
    .where(eq(invoices.id, id))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: "Not found" })
  return row
})
