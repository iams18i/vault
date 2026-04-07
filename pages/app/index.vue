<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

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
    }>
    total: number
  }
  expenses: {
    items: Array<{
      id: string
      name: string
      amount: string
      category: string | null
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
const { data, pending, error } = await useFetch<DashboardResponse>(dashboardUrl, {
  server: false,
  headers: computed(() => {
    const h: Record<string, string> = {}
    if (auth.token.value) h.Authorization = `Bearer ${auth.token.value}`
    if (auth.currentVaultId.value) h['X-Vault-Id'] = auth.currentVaultId.value
    return h
  }),
  watch: [dashboardUrl, () => auth.currentVaultId.value, () => auth.token.value],
})

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
        <Button variant="ghost" size="icon" @click="prev">
          <span class="sr-only">Poprzedni</span>
          <ChevronLeft class="size-4" />
        </Button>
        <MonthPicker
          v-model="month"
          class="w-44 rounded-none border-0 text-center justify-center"
        />
        <Button variant="ghost" size="icon" @click="next">
          <span class="sr-only">Następny</span>
          <ChevronRight class="size-4" />
        </Button>
      </ButtonGroup>
    </div>

    <p v-if="pending" class="text-sm text-muted-foreground">Ładowanie…</p>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="r in data.recurring.items" :key="r.id">
                    <TableCell class="font-medium">{{ r.name }}</TableCell>
                    <TableCell class="whitespace-nowrap text-muted-foreground">{{
                      recurringPaymentDateLabel(data.month, r.dayOfMonth)
                    }}</TableCell>
                    <TableCell>
                      <CategoryLabel :name="r.category" as-badge />
                    </TableCell>
                    <TableCell class="text-right tabular-nums">{{
                      format(r.amount)
                    }}</TableCell>
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
            <CardHeader>
              <CardTitle>Wydatki</CardTitle>
              <CardDescription>Jednorazowe w miesiącu</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <Table v-if="data.expenses.items.length">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Kategoria</TableHead>
                    <TableHead class="text-right">Kwota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="e in data.expenses.items" :key="e.id">
                    <TableCell class="font-medium">{{ e.name }}</TableCell>
                    <TableCell>
                      <CategoryLabel :name="e.category" as-badge />
                    </TableCell>
                    <TableCell class="text-right tabular-nums">{{
                      format(e.amount)
                    }}</TableCell>
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
            <CardHeader>
              <CardTitle>Faktury (koszty)</CardTitle>
              <CardDescription>Przypisane do miesiąca</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <Table v-if="data.invoices.items.length">
                <TableBody>
                  <TableRow v-for="inv in data.invoices.items" :key="inv.id">
                    <TableCell class="max-w-[200px] truncate">{{
                      inv.vendor || inv.invoiceNumber || '—'
                    }}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{{ inv.status }}</Badge>
                    </TableCell>
                    <TableCell class="text-right tabular-nums">{{
                      format(inv.grossAmount)
                    }}</TableCell>
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
            <CardHeader>
              <CardTitle>Podatki</CardTitle>
              <CardDescription>Wpisy za ten miesiąc</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <ul class="space-y-3 text-sm">
                <li
                  v-for="t in data.taxes.items"
                  :key="t.synthetic ? 'vat-from-income' : t.id"
                  class="flex flex-col gap-1 border-b border-border pb-3 last:border-0"
                >
                  <span class="font-medium flex flex-wrap items-center gap-2">
                    {{ t.name }}
                    <Badge v-if="t.synthetic" variant="tag">z dochodu</Badge>
                  </span>
                  <span class="text-muted-foreground">
                    Należne {{ format(t.amountDue) }} · Zapłacone
                    {{ format(t.amountPaid) }} · Pozostało
                    <span
                      :class="
                        t.remaining > 0 ? 'text-foreground font-medium' : ''
                      "
                      >{{ format(t.remaining) }}</span
                    >
                  </span>
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
              <CardDescription
                >Po kosztach operacyjnych (bez potrącania podatków z
                kwoty)</CardDescription
              >
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
                Podatki planuj osobno wg sekcji Podatki.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
