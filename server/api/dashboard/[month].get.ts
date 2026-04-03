import { and, eq, gte, isNull, lte, or } from "drizzle-orm"
import {
  companies,
  invoices,
  monthlyExpenses,
  monthlyIncome,
  recurringCosts,
  taxEntries,
} from "../../db/schema"
import { num } from "../../utils/parse"

/** Tax entries whose name references VAT — merged into dashboard „VAT (z dochodu)” for paid/due tracking. */
function isVatTaxEntryName(name: string): boolean {
  return /\bvat\b/i.test(name.trim())
}

function parseMonth(ym: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym)
  if (!m) throw createError({ statusCode: 400, message: "month must be YYYY-MM" })
  const y = Number(m[1])
  const mo = Number(m[2])
  if (mo < 1 || mo > 12) throw createError({ statusCode: 400, message: "Invalid month" })
  const firstDay = `${y}-${String(mo).padStart(2, "0")}-01`
  const last = new Date(y, mo, 0)
  const lastDay = `${y}-${String(mo).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`
  return { y, mo, firstDay, lastDay }
}

export default defineEventHandler(async (event) => {
  const monthParam = getRouterParam(event, "month")
  if (!monthParam) throw createError({ statusCode: 400, message: "month required" })
  const { y, mo, firstDay, lastDay } = parseMonth(monthParam)
  const db = getDb()

  const incomeRows = await db
    .select({
      id: monthlyIncome.id,
      month: monthlyIncome.month,
      companyId: monthlyIncome.companyId,
      company: companies.name,
      type: monthlyIncome.type,
      hours: monthlyIncome.hours,
      hourlyRate: monthlyIncome.hourlyRate,
      netAmount: monthlyIncome.netAmount,
      vatExempt: monthlyIncome.vatExempt,
      vatRatePercent: monthlyIncome.vatRatePercent,
      vatAmount: monthlyIncome.vatAmount,
      grossAmount: monthlyIncome.grossAmount,
      notes: monthlyIncome.notes,
    })
    .from(monthlyIncome)
    .innerJoin(companies, eq(monthlyIncome.companyId, companies.id))
    .where(eq(monthlyIncome.month, monthParam))
    .orderBy(monthlyIncome.id)

  const netIncome = Math.round(incomeRows.reduce((s, r) => s + num(r.netAmount), 0) * 100) / 100
  const incomeVatTotal = Math.round(incomeRows.reduce((s, r) => s + num(r.vatAmount), 0) * 100) / 100
  const incomeGrossTotal = Math.round(incomeRows.reduce((s, r) => s + num(r.grossAmount), 0) * 100) / 100

  const recurringRows = await db
    .select()
    .from(recurringCosts)
    .where(
      and(lte(recurringCosts.startDate, lastDay), or(isNull(recurringCosts.endDate), gte(recurringCosts.endDate, firstDay))),
    )

  const recurringTotal = recurringRows.reduce((s, r) => s + num(r.amount), 0)

  const expenseRows = await db
    .select()
    .from(monthlyExpenses)
    .where(eq(monthlyExpenses.month, monthParam))

  const expensesTotal = expenseRows.reduce((s, r) => s + num(r.amount), 0)

  const invoiceRows = await db.select().from(invoices).where(eq(invoices.month, monthParam))

  const invoicesTotal = invoiceRows.reduce((s, r) => s + num(r.grossAmount), 0)

  const taxRows = await db
    .select()
    .from(taxEntries)
    .where(and(eq(taxEntries.year, y), eq(taxEntries.month, mo)))

  const vatEntryRows = taxRows.filter((t) => isVatTaxEntryName(t.name))
  const otherTaxRows = taxRows.filter((t) => !isVatTaxEntryName(t.name))

  const vatPaidFromEntries = Math.round(vatEntryRows.reduce((s, t) => s + num(t.amountPaid), 0) * 100) / 100
  const vatDueFromIncome = incomeVatTotal
  const vatRemaining = Math.round((vatDueFromIncome - vatPaidFromEntries) * 100) / 100
  const vatStatus: "pending" | "paid" | "partial" =
    vatPaidFromEntries <= 0
      ? "pending"
      : vatRemaining <= 0
        ? "paid"
        : "partial"

  const syntheticVat = {
    id: "vat-from-income" as const,
    synthetic: true,
    name: "VAT (z dochodu)",
    amountDue: vatDueFromIncome,
    amountPaid: vatPaidFromEntries,
    remaining: vatRemaining,
    status: vatStatus,
    dueDate: null as string | null,
  }

  let taxDueTotal = vatDueFromIncome
  let taxPaidTotal = vatPaidFromEntries
  const otherTaxItems = otherTaxRows.map((t) => {
    const due = num(t.amountDue)
    const paid = num(t.amountPaid)
    taxDueTotal += due
    taxPaidTotal += paid
    return {
      id: t.id,
      synthetic: false as const,
      name: t.name,
      amountDue: due,
      amountPaid: paid,
      remaining: Math.round((due - paid) * 100) / 100,
      status: t.status,
      dueDate: t.dueDate,
    }
  })

  const taxes = [syntheticVat, ...otherTaxItems]

  const outflows = Math.round((recurringTotal + expensesTotal + invoicesTotal) * 100) / 100
  const remaining = Math.round((netIncome - outflows) * 100) / 100
  const taxRemaining = Math.round((taxDueTotal - taxPaidTotal) * 100) / 100

  return {
    month: monthParam,
    income: {
      netIncome,
      vatTotal: incomeVatTotal,
      grossTotal: incomeGrossTotal,
      items: incomeRows,
    },
    recurring: { items: recurringRows, total: recurringTotal },
    expenses: { items: expenseRows, total: expensesTotal },
    invoices: { items: invoiceRows, total: invoicesTotal },
    taxes: { items: taxes, totalDue: taxDueTotal, totalPaid: taxPaidTotal, remaining: taxRemaining },
    summary: {
      netIncome,
      recurringTotal,
      expensesTotal,
      invoicesTotal,
      outflows,
      remainingAfterCosts: remaining,
    },
  }
})
