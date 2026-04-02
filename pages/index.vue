<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { format } = useCurrency()
const { currentYm } = useMonth()
import { fromYm, shiftMonth, toYm } from "~/lib/month"

const month = ref(fromYm(currentYm()))

onMounted(() => {
  const q = route.query.month
  if (typeof q === "string" && /^\d{4}-\d{2}$/.test(q)) {
    month.value = fromYm(q)
  }
})

watch(month, (m) => {
  router.replace({ query: { month: toYm(m) } })
})

const dashboardUrl = computed(() => `/api/dashboard/${toYm(month.value)}`)
const { data, pending, error } = await useFetch(dashboardUrl)

function prev() {
  month.value = shiftMonth(month.value, -1)
}
function next() {
  month.value = shiftMonth(month.value, 1)
}

function typeLabel(t: string) {
  if (t === "hourly") return "Godzinowy"
  if (t === "ryczalt") return "Ryczałt"
  return t
}

function vatDashLabel(row: { vatExempt?: boolean; vatRatePercent?: string | null }) {
  if (row.vatExempt) return "zw."
  const p = row.vatRatePercent != null && row.vatRatePercent !== "" ? String(Number(row.vatRatePercent)) : "23"
  return `${p}%`
}
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Pulpit miesięczny</h1>
        <p class="text-sm text-muted-foreground">Podsumowanie dochodu netto i kosztów</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="icon" @click="prev">
          <span class="sr-only">Poprzedni</span>
          ←
        </Button>
        <MonthPicker v-model="month" class="w-44" />
        <Button variant="outline" size="icon" @click="next">
          <span class="sr-only">Następny</span>
          →
        </Button>
      </div>
    </div>

    <p v-if="pending" class="text-sm text-muted-foreground">Ładowanie…</p>
    <p v-else-if="error" class="text-sm text-destructive">Błąd ładowania</p>

    <template v-else-if="data">
      <Card>
        <CardHeader>
          <CardTitle>Dochód</CardTitle>
          <CardDescription>Netto, VAT i brutto za wybrany miesiąc</CardDescription>
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
                  <Badge variant="secondary">{{ typeLabel(row.type) }}</Badge>
                </TableCell>
                <TableCell class="text-right text-muted-foreground text-sm">
                  <template v-if="row.type === 'hourly'">
                    {{ row.hours }} h × {{ format(row.hourlyRate!) }}
                  </template>
                  <template v-else>—</template>
                </TableCell>
                <TableCell class="text-right text-sm text-muted-foreground">{{ vatDashLabel(row) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ format(row.netAmount) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ format(row.vatAmount ?? 0) }}</TableCell>
                <TableCell class="text-right tabular-nums font-medium">{{ format(row.grossAmount ?? row.netAmount) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p v-else class="text-sm text-muted-foreground">Brak wpisów dochodu — dodaj w sekcji Dochód.</p>
          <Separator />
          <div class="grid gap-2 text-sm">
            <div class="flex justify-between font-semibold">
              <span>Suma netto</span>
              <span class="tabular-nums">{{ format(data.income.netIncome) }}</span>
            </div>
            <div class="flex justify-between text-muted-foreground">
              <span>Suma VAT</span>
              <span class="tabular-nums">{{ format(data.income.vatTotal ?? 0) }}</span>
            </div>
            <div class="flex justify-between font-semibold">
              <span>Suma brutto</span>
              <span class="tabular-nums">{{ format(data.income.grossTotal ?? data.income.netIncome) }}</span>
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
                <TableHead>Kategoria</TableHead>
                <TableHead class="text-right">Kwota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="r in data.recurring.items" :key="r.id">
                <TableCell class="font-medium">{{ r.name }}</TableCell>
                <TableCell>
                  <Badge v-if="r.category" variant="secondary">{{ r.category }}</Badge>
                  <span v-else class="text-sm text-muted-foreground">—</span>
                </TableCell>
                <TableCell class="text-right tabular-nums">{{ format(r.amount) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p v-else class="text-sm text-muted-foreground">Brak</p>
          <Separator />
          <div class="flex justify-between text-sm font-medium">
            <span>Razem</span>
            <span class="tabular-nums">{{ format(data.recurring.total) }}</span>
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
                  <Badge v-if="e.category" variant="secondary">{{ e.category }}</Badge>
                  <span v-else class="text-sm text-muted-foreground">—</span>
                </TableCell>
                <TableCell class="text-right tabular-nums">{{ format(e.amount) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p v-else class="text-sm text-muted-foreground">Brak</p>
          <Separator />
          <div class="flex justify-between text-sm font-medium">
            <span>Razem</span>
            <span class="tabular-nums">{{ format(data.expenses.total) }}</span>
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
                <TableCell class="max-w-[200px] truncate">{{ inv.vendor || inv.invoiceNumber || "—" }}</TableCell>
                <TableCell>
                  <Badge variant="outline">{{ inv.status }}</Badge>
                </TableCell>
                <TableCell class="text-right tabular-nums">{{ format(inv.grossAmount) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p v-else class="text-sm text-muted-foreground">Brak</p>
          <Separator />
          <div class="flex justify-between text-sm font-medium">
            <span>Razem brutto</span>
            <span class="tabular-nums">{{ format(data.invoices.total) }}</span>
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
                <Badge v-if="t.synthetic" variant="secondary" class="text-xs font-normal">z dochodu</Badge>
              </span>
              <span class="text-muted-foreground">
                Należne {{ format(t.amountDue) }} · Zapłacone {{ format(t.amountPaid) }} · Pozostało
                <span :class="t.remaining > 0 ? 'text-foreground font-medium' : ''">{{ format(t.remaining) }}</span>
              </span>
            </li>
          </ul>
          <Separator />
          <div class="grid gap-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Suma należnych</span>
              <span class="tabular-nums">{{ format(data.taxes.totalDue) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Suma zapłaconych</span>
              <span class="tabular-nums">{{ format(data.taxes.totalPaid) }}</span>
            </div>
            <div class="flex justify-between font-medium">
              <span>Do zapłaty</span>
              <span class="tabular-nums">{{ format(data.taxes.remaining) }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="border-primary/20">
        <CardHeader>
          <CardTitle>Podsumowanie</CardTitle>
          <CardDescription>Po kosztach operacyjnych (bez potrącania podatków z kwoty)</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span>Dochód netto</span>
            <span class="tabular-nums">{{ format(data.summary.netIncome) }}</span>
          </div>
          <div class="flex justify-between text-muted-foreground">
            <span>− Koszty stałe</span>
            <span class="tabular-nums">−{{ format(data.summary.recurringTotal) }}</span>
          </div>
          <div class="flex justify-between text-muted-foreground">
            <span>− Wydatki</span>
            <span class="tabular-nums">−{{ format(data.summary.expensesTotal) }}</span>
          </div>
          <div class="flex justify-between text-muted-foreground">
            <span>− Faktury</span>
            <span class="tabular-nums">−{{ format(data.summary.invoicesTotal) }}</span>
          </div>
          <Separator />
          <div class="flex justify-between text-lg font-semibold">
            <span>Pozostało</span>
            <span
              class="tabular-nums"
              :class="data.summary.remainingAfterCosts < 0 ? 'text-destructive' : 'text-primary'"
            >
              {{ format(data.summary.remainingAfterCosts) }}
            </span>
          </div>
          <p class="text-xs text-muted-foreground pt-2">Podatki planuj osobno wg sekcji Podatki.</p>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
