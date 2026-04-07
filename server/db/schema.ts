import { nanoid } from "nanoid"
import {
  boolean,
  date,
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

const ID_LEN = 16

/** Primary key: nanoid(16) */
function idPk(name = "id") {
  return varchar(name, { length: ID_LEN })
    .primaryKey()
    .$defaultFn(() => nanoid(ID_LEN))
}

export const users = pgTable("users", {
  id: idPk(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }),
  emailVerifiedAt: timestamp("email_verified_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
})

export const vaults = pgTable("vaults", {
  id: idPk(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: varchar("owner_id", { length: ID_LEN })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
})

export const vaultMembers = pgTable(
  "vault_members",
  {
    id: idPk(),
    vaultId: varchar("vault_id", { length: ID_LEN })
      .notNull()
      .references(() => vaults.id),
    userId: varchar("user_id", { length: ID_LEN })
      .notNull()
      .references(() => users.id),
    role: varchar("role", { length: 20 }).notNull().default("owner"),
  },
  (t) => [uniqueIndex("vault_members_vault_user_uq").on(t.vaultId, t.userId)],
)

export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: idPk(),
  userId: varchar("user_id", { length: ID_LEN })
    .notNull()
    .references(() => users.id),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  usedAt: timestamp("used_at", { mode: "date" }),
})

export const categories = pgTable(
  "categories",
  {
    id: idPk(),
    vaultId: varchar("vault_id", { length: ID_LEN })
      .notNull()
      .references(() => vaults.id),
    name: varchar("name", { length: 128 }).notNull(),
    /** `#RRGGBB` or null */
    color: varchar("color", { length: 7 }),
  },
  (t) => [uniqueIndex("categories_vault_name_uq").on(t.vaultId, t.name)],
)

export const companies = pgTable(
  "companies",
  {
    id: idPk(),
    vaultId: varchar("vault_id", { length: ID_LEN })
      .notNull()
      .references(() => vaults.id),
    name: varchar("name", { length: 255 }).notNull(),
  },
  (t) => [uniqueIndex("companies_vault_name_uq").on(t.vaultId, t.name)],
)

export const monthlyIncome = pgTable("monthly_income", {
  id: idPk(),
  vaultId: varchar("vault_id", { length: ID_LEN })
    .notNull()
    .references(() => vaults.id),
  month: varchar("month", { length: 7 }).notNull(),
  companyId: varchar("company_id", { length: ID_LEN })
    .notNull()
    .references(() => companies.id),
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
  id: idPk(),
  vaultId: varchar("vault_id", { length: ID_LEN })
    .notNull()
    .references(() => vaults.id),
  name: varchar("name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  category: varchar("category", { length: 128 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  dayOfMonth: integer("day_of_month").notNull().default(1),
  notes: text("notes"),
})

export const monthlyExpenses = pgTable("monthly_expenses", {
  id: idPk(),
  vaultId: varchar("vault_id", { length: ID_LEN })
    .notNull()
    .references(() => vaults.id),
  month: varchar("month", { length: 7 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  category: varchar("category", { length: 128 }),
  expenseDate: date("expense_date"),
  notes: text("notes"),
})

export const invoices = pgTable("invoices", {
  id: idPk(),
  vaultId: varchar("vault_id", { length: ID_LEN })
    .notNull()
    .references(() => vaults.id),
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
  id: idPk(),
  vaultId: varchar("vault_id", { length: ID_LEN })
    .notNull()
    .references(() => vaults.id),
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
