<script setup lang="ts">
import { Check, ChevronLeft, ChevronRight, Plus } from 'lucide-vue-next'

import { fromYm, shiftMonth, toYm } from '~/lib/month'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { format } = useCurrency()
const { currentYm } = useMonth()
const auth = useAuth()

type DashboardResponse = {
  month: string
  income: {
    netIncome: number
    vatTotal: number
    grossTotal: number
    items: Array<{
      id: string
      companyId?: string
      company: string
      type: 'hourly' | 'ryczalt'
      hours: string | null
      hourlyRate: string | null
      netAmount: string
      vatAmount: string
      grossAmount: string
      vatExempt?: boolean
      vatRatePercent?: string | null
    }>
  }
  recurring: {
    items: Array<{
      id: string
      name: string
      amount: string
      category: string | null
      dayOfMonth: number
      paid: boolean
      paidAt: string | null
    }>
    total: number
  }
  expenses: {
    items: Array<{
      id: string
      name: string
      amount: string
      category: string | null
      paid: boolean
      paidAt: string | null
    }>
    total: number
  }
  invoices: {
    items: Array<{
      id: string
      invoiceNumber: string | null
      vendor: string | null
      status: string
      grossAmount: string
    }>
    total: number
  }
  taxes: {
    items: Array<{
      id: string | 'vat-from-income'
      synthetic: boolean
      name: string
      amountDue: number
      amountPaid: number
      remaining: number
      status: string
      dueDate: string | null
      paidAt: string | null
    }>
    totalDue: number
    totalPaid: number
    remaining: number
  }
  summary: {
    netIncome: number
    recurringTotal: number
    expensesTotal: number
    invoicesTotal: number
    /** Sum of amountDue for non-VAT tax entries (manual); paid status ignored. */
    nonVatTaxTotal: number
    outflows: number
    remainingAfterCosts: number
  }
}

const month = ref(fromYm(currentYm()))

onMounted(() => {
  const q = route.query.month
  if (typeof q === 'string' && /^\d{4}-\d{2}$/.test(q)) {
    month.value = fromYm(q)
  }
})

watch(month, (m) => {
  router.replace({ query: { month: toYm(m) } })
})

const dashboardUrl = computed(() => `/api/dashboard/${toYm(month.value)}`)
const dashboardYm = computed(() => toYm(month.value))
const taxYear = computed(() => Number(dashboardYm.value.slice(0, 4)))
const taxMonthNum = computed(() => Number(dashboardYm.value.slice(5, 7)))

const addExpenseOpen = ref(false)
const addInvoiceOpen = ref(false)
const addTaxOpen = ref(false)

const { data, pending, error, refresh } = await useFetch<DashboardResponse>(dashboardUrl, {
  server: false,
  headers: computed(() => {
    const h: Record<string, string> = {}
    if (auth.token.value) h.Authorization = `Bearer ${auth.token.value}`
    if (auth.currentVaultId.value) h['X-Vault-Id'] = auth.currentVaultId.value
    return h
  }),
  watch: [dashboardUrl, () => auth.currentVaultId.value, () => auth.token.value],
})

const api = useApiFetch()

async function toggleRecurringPaid(r: { id: string; paid: boolean }) {
  const ym = dashboardYm.value
  const prev = r.paid
  const row = data.value?.recurring.items.find((x) => x.id === r.id)
  if (row) row.paid = !prev
  try {
    if (prev) {
      await api(`/api/recurring-costs/${r.id}/pay`, {
        method: 'DELETE',
        query: { month: ym },
      })
    } else {
      await api(`/api/recurring-costs/${r.id}/pay`, {
        method: 'POST',
        body: { month: ym },
      })
    }
    await refresh()
  } catch {
    if (row) row.paid = prev
  }
}

async function toggleExpensePaid(e: { id: string; paid: boolean }) {
  const prev = e.paid
  const row = data.value?.expenses.items.find((x) => x.id === e.id)
  if (row) row.paid = !prev
  try {
    await api(`/api/monthly-expenses/${e.id}/pay`, { method: 'POST' })
    await refresh()
  } catch {
    if (row) row.paid = prev
  }
}

async function markInvoicePaid(id: string) {
  const inv = data.value?.invoices.items.find((x) => x.id === id)
  const prevStatus = inv?.status
  const today = new Date().toISOString().slice(0, 10)
  if (inv) inv.status = 'paid'
  try {
    await api(`/api/invoices/${id}`, {
      method: 'PUT',
      body: { status: 'paid', paidDate: today },
    })
    await refresh()
  } catch {
    if (inv && prevStatus != null) inv.status = prevStatus
  }
}

async function markTaxPaid(t: { id: string; amountDue: number }) {
  const item = data.value?.taxes.items.find((x) => !x.synthetic && x.id === t.id)
  const snap = item
    ? {
        status: item.status,
        amountPaid: item.amountPaid,
        remaining: item.remaining,
        paidAt: item.paidAt,
      }
    : null
  if (item) {
    item.status = 'paid'
    item.amountPaid = t.amountDue
    item.remaining = 0
    item.paidAt = new Date().toISOString()
  }
  try {
    await api(`/api/tax-entries/${t.id}`, {
      method: 'PUT',
      body: { status: 'paid', amountPaid: String(t.amountDue) },
    })
    await refresh()
  } catch {
    if (item && snap) {
      item.status = snap.status
      item.amountPaid = snap.amountPaid
      item.remaining = snap.remaining
      item.paidAt = snap.paidAt
    }
  }
}

/** Cofnij oznaczenie zapłaty (wpis ręczny z pulpitu). */
async function revertTaxPaid(t: { id: string; amountDue: number }) {
  const item = data.value?.taxes.items.find((x) => !x.synthetic && x.id === t.id)
  const snap = item
    ? {
        status: item.status,
        amountPaid: item.amountPaid,
        remaining: item.remaining,
        paidAt: item.paidAt,
      }
    : null
  if (item) {
    item.status = 'pending'
    item.amountPaid = 0
    item.remaining = Math.round(t.amountDue * 100) / 100
    item.paidAt = null
  }
  try {
    await api(`/api/tax-entries/${t.id}`, {
      method: 'PUT',
      body: { status: 'pending', amountPaid: '0' },
    })
    await refresh()
  } catch {
    if (item && snap) {
      item.status = snap.status
      item.amountPaid = snap.amountPaid
      item.remaining = snap.remaining
      item.paidAt = snap.paidAt
    }
  }
}

async function markSyntheticVatPaid() {
  try {
    await api('/api/tax-entries/vat-from-income/pay', {
      method: 'POST',
      body: { month: dashboardYm.value },
    })
    await refresh()
  } catch {
    // noop
  }
}

async function revertSyntheticVatPaid() {
  try {
    await api('/api/tax-entries/vat-from-income/pay', {
      method: 'DELETE',
      query: { month: dashboardYm.value },
    })
    await refresh()
  } catch {
    // noop
  }
}

function prev() {
  month.value = shiftMonth(month.value, -1)
}
function next() {
  month.value = shiftMonth(month.value, 1)
}

function typeLabel(t: string) {
  if (t === 'hourly') return 'Godzinowy'
  if (t === 'ryczalt') return 'Ryczałt'
  return t
}

/** Payment calendar date in the dashboard month (day clamped to month length). */
function recurringPaymentDateLabel(ym: string, dayOfMonth: number): string {
  const parsed = /^(\d{4})-(\d{2})$/.exec(ym)
  if (!parsed) return String(dayOfMonth)
  const y = Number(parsed[1])
  const mo = Number(parsed[2])
  const lastDay = new Date(y, mo, 0).getDate()
  const d = Math.min(Math.max(1, dayOfMonth), lastDay)
  return new Date(y, mo - 1, d).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function vatDashLabel(row: {
  vatExempt?: boolean
  vatRatePercent?: string | null
}) {
  if (row.vatExempt) return 'zw.'
  const p =
    row.vatRatePercent != null && row.vatRatePercent !== ''
      ? String(Number(row.vatRatePercent))
      : '23'
  return `${p}%`
}
</script>

<template>
  <div class="max-w-7xl space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Pulpit miesięczny</h1>
        <p class="text-sm text-muted-foreground">
          Podsumowanie dochodu netto i kosztów
        </p>
      </div>
      <ButtonGroup aria-label="Nawigacja miesiąca">
        <Button type="button" variant="ghost" size="icon" @click.prevent="prev">
          <span class="sr-only">Poprzedni</span>
          <ChevronLeft class="size-4" />
        </Button>
        <MonthPicker
          v-model="month"
          class="w-44 rounded-none border-0 text-center justify-center"
        />
        <Button type="button" variant="ghost" size="icon" @click.prevent="next">
          <span class="sr-only">Następny</span>
          <ChevronRight class="size-4" />
        </Button>
      </ButtonGroup>
    </div>

    <p v-if="pending && !data" class="text-sm text-muted-foreground">Ładowanie…</p>
    <p v-else-if="error" class="text-sm text-destructive">Błąd ładowania</p>

    <template v-else-if="data">
      <div
        class="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_minmax(280px,22rem)] lg:items-start"
      >
        <div class="order-2 flex min-w-0 flex-col gap-6 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle>Dochód</CardTitle>
              <CardDescription
                >Netto, VAT i brutto za wybrany miesiąc</CardDescription
              >
            </CardHeader>
            <CardContent class="space-y-4">
              <Table v-if="data.income.items.length">
                <TableHeader>
                  <TableRow>
                    <TableHead>Kontrahent</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead class="text-right">Godz. / stawka</TableHead>
                    <TableHead class="text-right">VAT</TableHead>
                    <TableHead class="text-right">Netto</TableHead>
                    <TableHead class="text-right">VAT PLN</TableHead>
                    <TableHead class="text-right">Brutto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="row in data.income.items" :key="row.id">
                    <TableCell class="font-medium">{{ row.company }}</TableCell>
                    <TableCell>
                      <Badge variant="tag">{{ typeLabel(row.type) }}</Badge>
                    </TableCell>
                    <TableCell class="text-right text-muted-foreground text-sm">
                      <template v-if="row.type === 'hourly'">
                        {{ row.hours }} h × {{ format(row.hourlyRate!) }}
                      </template>
                      <template v-else>—</template>
                    </TableCell>
                    <TableCell
                      class="text-right text-sm text-muted-foreground"
                      >{{ vatDashLabel(row) }}</TableCell
                    >
                    <TableCell class="text-right tabular-nums">{{
                      format(row.netAmount)
                    }}</TableCell>
                    <TableCell class="text-right tabular-nums">{{
                      format(row.vatAmount ?? 0)
                    }}</TableCell>
                    <TableCell class="text-right tabular-nums font-medium">{{
                      format(row.grossAmount ?? row.netAmount)
                    }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p v-else class="text-sm text-muted-foreground">
                Brak wpisów dochodu — dodaj w sekcji Dochód.
              </p>
              <Separator />
              <div class="grid gap-2 text-sm">
                <div class="flex justify-between font-semibold">
                  <span>Suma netto</span>
                  <span class="tabular-nums">{{
                    format(data.income.netIncome)
                  }}</span>
                </div>
                <div class="flex justify-between text-muted-foreground">
                  <span>Suma VAT</span>
                  <span class="tabular-nums">{{
                    format(data.income.vatTotal ?? 0)
                  }}</span>
                </div>
                <div class="flex justify-between font-semibold">
                  <span>Suma brutto</span>
                  <span class="tabular-nums">{{
                    format(data.income.grossTotal ?? data.income.netIncome)
                  }}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Koszty stałe</CardTitle>
              <CardDescription>Aktywne w tym miesiącu</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <Table v-if="data.recurring.items.length">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa</TableHead>
                    <TableHead class="whitespace-nowrap">Termin</TableHead>
                    <TableHead>Kategoria</TableHead>
                    <TableHead class="text-right">Kwota</TableHead>
                    <TableHead class="w-[120px] text-right">Płatność</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="r in data.recurring.items" :key="r.id">
                    <TableCell
                      class="font-medium"
                      :class="r.paid ? 'text-muted-foreground line-through' : ''"
                      >{{ r.name }}</TableCell
                    >
                    <TableCell
                      class="whitespace-nowrap text-muted-foreground"
                      :class="r.paid ? 'line-through opacity-80' : ''"
                      >{{
                      recurringPaymentDateLabel(data.month, r.dayOfMonth)
                    }}</TableCell
                    >
                    <TableCell :class="r.paid ? 'opacity-60' : ''">
                      <CategoryLabel :name="r.category" as-badge />
                    </TableCell>
                    <TableCell
                      class="text-right tabular-nums"
                      :class="r.paid ? 'text-muted-foreground line-through' : ''"
                      >{{ format(r.amount) }}</TableCell
                    >
                    <TableCell class="text-right">
                      <DashboardMarkPaidCell
                        :paid="r.paid"
                        :paid-at="r.paidAt"
                        @mark-paid="toggleRecurringPaid(r)"
                        @unmark-paid="toggleRecurringPaid(r)"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p v-else class="text-sm text-muted-foreground">Brak</p>
              <Separator />
              <div class="flex justify-between text-sm font-medium">
                <span>Razem</span>
                <span class="tabular-nums">{{
                  format(data.recurring.total)
                }}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-start justify-between gap-4 space-y-0">
              <div class="space-y-1.5">
                <CardTitle>Wydatki</CardTitle>
                <CardDescription>Jednorazowe w miesiącu</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                class="shrink-0"
                aria-label="Dodaj wydatek"
                @click.prevent="addExpenseOpen = true"
              >
                <Plus class="size-4" />
              </Button>
            </CardHeader>
            <CardContent class="space-y-4">
              <Table v-if="data.expenses.items.length">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Kategoria</TableHead>
                    <TableHead class="text-right">Kwota</TableHead>
                    <TableHead class="w-[120px] text-right">Płatność</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="e in data.expenses.items" :key="e.id">
                    <TableCell
                      class="font-medium"
                      :class="e.paid ? 'text-muted-foreground line-through' : ''"
                      >{{ e.name }}</TableCell
                    >
                    <TableCell :class="e.paid ? 'opacity-60' : ''">
                      <CategoryLabel :name="e.category" as-badge />
                    </TableCell>
                    <TableCell
                      class="text-right tabular-nums"
                      :class="e.paid ? 'text-muted-foreground line-through' : ''"
                      >{{ format(e.amount) }}</TableCell
                    >
                    <TableCell class="text-right">
                      <DashboardMarkPaidCell
                        :paid="e.paid"
                        :paid-at="e.paidAt"
                        @mark-paid="toggleExpensePaid(e)"
                        @unmark-paid="toggleExpensePaid(e)"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p v-else class="text-sm text-muted-foreground">Brak</p>
              <Separator />
              <div class="flex justify-between text-sm font-medium">
                <span>Razem</span>
                <span class="tabular-nums">{{
                  format(data.expenses.total)
                }}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-start justify-between gap-4 space-y-0">
              <div class="space-y-1.5">
                <CardTitle>Faktury (koszty)</CardTitle>
                <CardDescription>Przypisane do miesiąca</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                class="shrink-0"
                aria-label="Dodaj fakturę"
                @click.prevent="addInvoiceOpen = true"
              >
                <Plus class="size-4" />
              </Button>
            </CardHeader>
            <CardContent class="space-y-4">
              <Table v-if="data.invoices.items.length">
                <TableHeader>
                  <TableRow>
                    <TableHead class="max-w-[200px]">Kontrahent / nr</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead class="text-right">Kwota</TableHead>
                    <TableHead class="w-[120px] text-right">Płatność</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="inv in data.invoices.items" :key="inv.id">
                    <TableCell
                      class="max-w-[200px] truncate"
                      :class="
                        inv.status === 'paid'
                          ? 'text-muted-foreground line-through'
                          : ''
                      "
                      >{{ inv.vendor || inv.invoiceNumber || '—' }}</TableCell
                    >
                    <TableCell
                      :class="inv.status === 'paid' ? 'opacity-60' : ''"
                    >
                      <Badge variant="outline">{{ inv.status }}</Badge>
                    </TableCell>
                    <TableCell
                      class="text-right tabular-nums"
                      :class="
                        inv.status === 'paid'
                          ? 'text-muted-foreground line-through'
                          : ''
                      "
                      >{{ format(inv.grossAmount) }}</TableCell
                    >
                    <TableCell class="text-right">
                      <Button
                        v-if="inv.status !== 'paid'"
                        type="button"
                        variant="ghost"
                        size="sm"
                        class="text-muted-foreground"
                        @click.prevent="markInvoicePaid(inv.id)"
                      >
                        Zapłać
                      </Button>
                      <span
                        v-else
                        class="inline-flex items-center gap-1 text-xs font-medium text-green-500 no-underline"
                      >
                        <Check class="size-4 shrink-0" aria-hidden="true" />
                        Zapłacono
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p v-else class="text-sm text-muted-foreground">Brak</p>
              <Separator />
              <div class="flex justify-between text-sm font-medium">
                <span>Razem brutto</span>
                <span class="tabular-nums">{{
                  format(data.invoices.total)
                }}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-start justify-between gap-4 space-y-0">
              <div class="space-y-1.5">
                <CardTitle>Podatki</CardTitle>
                <CardDescription>Wpisy za ten miesiąc</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                class="shrink-0"
                aria-label="Dodaj wpis podatkowy"
                @click.prevent="addTaxOpen = true"
              >
                <Plus class="size-4" />
              </Button>
            </CardHeader>
            <CardContent class="space-y-4">
              <ul class="space-y-3 text-sm">
                <li
                  v-for="t in data.taxes.items"
                  :key="t.synthetic ? 'vat-from-income' : t.id"
                  class="flex flex-row items-center justify-between gap-3 border-b border-border pb-3 last:border-0"
                >
                  <div
                    class="min-w-0 flex flex-col gap-1"
                    :class="
                      t.status === 'paid'
                        ? 'text-muted-foreground line-through'
                        : ''
                    "
                  >
                    <span class="font-medium flex flex-wrap items-center gap-2">
                      {{ t.name }}
                      <Badge v-if="t.synthetic" variant="tag">z dochodu</Badge>
                    </span>
                    <span
                      class="text-muted-foreground"
                      :class="
                        t.status === 'paid'
                          ? 'line-through opacity-90'
                          : ''
                      "
                    >
                      Należne {{ format(t.amountDue) }} · Zapłacone
                      {{ format(t.amountPaid) }} · Pozostało
                      <span
                        :class="
                          t.remaining > 0 ? 'text-foreground font-medium' : ''
                        "
                        >{{ format(t.remaining) }}</span
                      >
                    </span>
                  </div>
                  <div class="shrink-0">
                    <DashboardMarkPaidCell
                      :paid="t.status === 'paid'"
                      :paid-at="t.paidAt"
                      :reversible="!t.synthetic || !!t.paidAt"
                      @mark-paid="
                        t.synthetic ? markSyntheticVatPaid() : markTaxPaid(t)
                      "
                      @unmark-paid="
                        t.synthetic ? revertSyntheticVatPaid() : revertTaxPaid(t)
                      "
                    />
                  </div>
                </li>
              </ul>
              <Separator />
              <div class="grid gap-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Suma należnych</span>
                  <span class="tabular-nums">{{
                    format(data.taxes.totalDue)
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Suma zapłaconych</span>
                  <span class="tabular-nums">{{
                    format(data.taxes.totalPaid)
                  }}</span>
                </div>
                <div class="flex justify-between font-medium">
                  <span>Do zapłaty</span>
                  <span class="tabular-nums">{{
                    format(data.taxes.remaining)
                  }}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div class="order-1 lg:sticky lg:top-6 lg:order-2 lg:self-start">
          <Card class="border-primary/20">
            <CardHeader>
              <CardTitle>Podsumowanie</CardTitle>
              <CardDescription>
                Dochód netto minus koszty operacyjne oraz suma należnych
                podatków (bez VAT od sprzedaży). Oznaczenia „zapłacono” w
                tabelach są informacyjne.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span>Dochód netto</span>
                <span class="tabular-nums">{{
                  format(data.summary.netIncome)
                }}</span>
              </div>
              <div class="flex justify-between text-muted-foreground">
                <span>− Koszty stałe</span>
                <span class="tabular-nums"
                  >−{{ format(data.summary.recurringTotal) }}</span
                >
              </div>
              <div class="flex justify-between text-muted-foreground">
                <span>− Wydatki</span>
                <span class="tabular-nums"
                  >−{{ format(data.summary.expensesTotal) }}</span
                >
              </div>
              <div class="flex justify-between text-muted-foreground">
                <span>− Faktury</span>
                <span class="tabular-nums"
                  >−{{ format(data.summary.invoicesTotal) }}</span
                >
              </div>
              <div class="flex justify-between text-muted-foreground">
                <span>− Podatki (bez VAT)</span>
                <span class="tabular-nums"
                  >−{{ format(data.summary.nonVatTaxTotal) }}</span
                >
              </div>
              <Separator />
              <div class="flex justify-between text-lg font-semibold">
                <span>Pozostało</span>
                <span
                  class="tabular-nums font-heading font-bold"
                  :class="
                    data.summary.remainingAfterCosts < 0
                      ? 'text-destructive'
                      : 'text-primary'
                  "
                >
                  {{ format(data.summary.remainingAfterCosts) }}
                </span>
              </div>
              <p class="text-xs text-muted-foreground pt-2">
                VAT od sprzedaży jest w sekcji Podatki; tutaj tylko podatki poza
                VAT (suma należnych z wpisów).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </template>

    <AddExpenseDialog
      v-model:open="addExpenseOpen"
      :month="dashboardYm"
      @saved="refresh()"
    />
    <AddInvoiceDialog
      v-model:open="addInvoiceOpen"
      :month="dashboardYm"
      @saved="refresh()"
    />
    <AddTaxEntryDialog
      v-model:open="addTaxOpen"
      :year="taxYear"
      :initial-month="taxMonthNum"
      @saved="refresh()"
    />
  </div>
</template>
