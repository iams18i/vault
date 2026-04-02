import {
  boolean,
  date,
  decimal,
  integer,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core"

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
})

export const monthlyIncome = pgTable("monthly_income", {
  id: serial("id").primaryKey(),
  month: varchar("month", { length: 7 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().$type<"hourly" | "ryczalt">(),
  hours: decimal("hours", { precision: 10, scale: 2 }),
  hourlyRate: decimal("hourly_rate", { precision: 14, scale: 2 }),
  netAmount: decimal("net_amount", { precision: 14, scale: 2 }).notNull(),
  vatExempt: boolean("vat_exempt").notNull().default(false),
  vatRatePercent: decimal("vat_rate_percent", { precision: 5, scale: 2 }),
  vatAmount: decimal("vat_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  grossAmount: decimal("gross_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
})

export const recurringCosts = pgTable("recurring_costs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  category: varchar("category", { length: 128 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  dayOfMonth: integer("day_of_month").notNull().default(1),
  notes: text("notes"),
})

export const monthlyExpenses = pgTable("monthly_expenses", {
  id: serial("id").primaryKey(),
  month: varchar("month", { length: 7 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  category: varchar("category", { length: 128 }),
  expenseDate: date("expense_date"),
  notes: text("notes"),
})

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 128 }),
  vendor: varchar("vendor", { length: 255 }),
  description: text("description"),
  netAmount: decimal("net_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  vatAmount: decimal("vat_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  grossAmount: decimal("gross_amount", { precision: 14, scale: 2 }).notNull(),
  issueDate: date("issue_date"),
  dueDate: date("due_date"),
  paidDate: date("paid_date"),
  status: varchar("status", { length: 20 })
    .notNull()
    .default("pending")
    .$type<"pending" | "paid" | "overdue">(),
  month: varchar("month", { length: 7 }).notNull(),
  notes: text("notes"),
})

export const taxEntries = pgTable("tax_entries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  amountDue: decimal("amount_due", { precision: 14, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 14, scale: 2 }).notNull().default("0"),
  dueDate: date("due_date"),
  status: varchar("status", { length: 20 })
    .notNull()
    .default("pending")
    .$type<"pending" | "paid" | "partial">(),
  notes: text("notes"),
})
