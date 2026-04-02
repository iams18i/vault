<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'

const { format } = useCurrency()
const { currentYm } = useMonth()

type Row = {
  id: number
  name: string
  amount: string
  category: string | null
  startDate: string
  endDate: string | null
  dayOfMonth: number
  notes: string | null
}

const filterCategory = ref('')
const rows = ref<Row[]>([])
const loading = ref(true)
const addDialogOpen = ref(false)

/** Apple-style ⌘N vs Ctrl + N (set on client). */
const showAppleShortcut = ref(true)

function openAddDialog() {
  addDialogOpen.value = true
}

onKeyStroke(
  (e) => e.key.toLowerCase() === 'n' && (e.metaKey || e.ctrlKey),
  (e) => {
    const el = e.target as HTMLElement | null
    if (el?.closest?.('input, textarea, select, [contenteditable="true"]'))
      return
    e.preventDefault()
    openAddDialog()
  },
)

async function load() {
  loading.value = true
  try {
    const q = filterCategory.value ? { category: filterCategory.value } : {}
    rows.value = await $fetch<Row[]>('/api/recurring-costs', { query: q })
  } finally {
    loading.value = false
  }
}

watch(filterCategory, load)
onMounted(() => {
  load()
  showAppleShortcut.value = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)
})

const form = reactive({
  name: '',
  amount: '',
  category: '',
  startDate: `${currentYm()}-01`,
  endDate: '',
  dayOfMonth: 1,
  notes: '',
})

function resetAddForm() {
  form.name = ''
  form.amount = ''
  form.category = ''
  form.startDate = `${currentYm()}-01`
  form.endDate = ''
  form.dayOfMonth = 1
  form.notes = ''
}

async function add() {
  if (!form.name || !form.amount || !form.startDate) return
  await $fetch('/api/recurring-costs', {
    method: 'POST',
    body: {
      name: form.name,
      amount: form.amount,
      category: form.category || null,
      startDate: form.startDate,
      endDate: form.endDate || null,
      dayOfMonth: form.dayOfMonth,
      notes: form.notes || null,
    },
  })
  resetAddForm()
  addDialogOpen.value = false
  await load()
}

async function remove(id: number) {
  if (!confirm('Usunąć?')) return
  await $fetch(`/api/recurring-costs/${id}`, { method: 'DELETE' })
  await load()
}

const editing = ref<Row | null>(null)
const editForm = reactive({
  name: '',
  amount: '',
  category: '',
  startDate: '',
  endDate: '',
  dayOfMonth: 1,
  notes: '',
})

function openEdit(row: Row) {
  editing.value = row
  editForm.name = row.name
  editForm.amount = row.amount
  editForm.category = row.category ?? ''
  editForm.startDate = row.startDate
  editForm.endDate = row.endDate ?? ''
  editForm.dayOfMonth = row.dayOfMonth
  editForm.notes = row.notes ?? ''
}

const editDialogOpen = computed({
  get: () => editing.value !== null,
  set: (v: boolean) => {
    if (!v) editing.value = null
  },
})

const totalMonthly = computed(() =>
  rows.value.reduce((s, r) => s + Number(r.amount), 0),
)

const byCategory = computed(() => {
  const map = new Map<string, number>()
  for (const r of rows.value) {
    const key = r.category?.trim() || 'Bez kategorii'
    map.set(key, (map.get(key) ?? 0) + Number(r.amount))
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1])
})

const RADAR_MAX_CATEGORIES = 6

const radarBundle = computed(() => {
  const entries = [...byCategory.value]
  if (!entries.length) return null

  let categories: string[]
  let amounts: number[]

  if (entries.length <= RADAR_MAX_CATEGORIES) {
    categories = entries.map(([n]) => n)
    amounts = entries.map(([, v]) => v)
  } else {
    const head = entries.slice(0, RADAR_MAX_CATEGORIES - 1)
    const tail = entries.slice(RADAR_MAX_CATEGORIES - 1)
    const sumTail = tail.reduce((s, [, v]) => s + v, 0)
    categories = [...head.map(([n]) => n), 'Pozostałe']
    amounts = [...head.map(([, v]) => v), sumTail]
  }

  const tailNames = new Set(
    entries.length > RADAR_MAX_CATEGORIES
      ? entries.slice(RADAR_MAX_CATEGORIES - 1).map(([n]) => n)
      : [],
  )

  const counts = categories.map((cat) => {
    if (cat === 'Pozostałe') {
      return rows.value.filter((r) =>
        tailNames.has(r.category?.trim() || 'Bez kategorii'),
      ).length
    }
    return rows.value.filter(
      (r) => (r.category?.trim() || 'Bez kategorii') === cat,
    ).length
  })

  return { categories, amounts, counts }
})

function formatChartNumber(n: number) {
  return format(String(n))
}

async function saveEdit() {
  if (
    !editing.value ||
    !editForm.name ||
    !editForm.amount ||
    !editForm.startDate
  )
    return
  await $fetch(`/api/recurring-costs/${editing.value.id}`, {
    method: 'PUT',
    body: {
      name: editForm.name,
      amount: editForm.amount,
      category: editForm.category || null,
      startDate: editForm.startDate,
      endDate: editForm.endDate || null,
      dayOfMonth: editForm.dayOfMonth,
      notes: editForm.notes || null,
    },
  })
  editing.value = null
  await load()
}
</script>

<template>
  <div class="space-y-8 max-w-6xl">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Koszty stałe</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Miesięczne z okresem obowiązywania
        </p>
      </div>
      <Button
        class="w-full sm:w-auto shrink-0"
        size="lg"
        aria-keyshortcuts="Meta+N Control+N"
        @click="openAddDialog"
      >
        <span
          class="inline-flex w-full items-center justify-center gap-2 sm:w-auto sm:justify-start"
        >
          Dodaj koszt stały
          <KbdGroup
            class="pointer-events-none hidden sm:inline-flex"
            aria-hidden="true"
          >
            <template v-if="showAppleShortcut">
              <Kbd>⌘</Kbd>
              <span class="text-muted-foreground text-xs font-medium">+</span>
              <Kbd>N</Kbd>
            </template>
            <template v-else>
              <Kbd>Ctrl</Kbd>
              <span class="text-muted-foreground text-xs font-medium">+</span>
              <Kbd>N</Kbd>
            </template>
          </KbdGroup>
        </span>
      </Button>
    </div>

    <div
      class="grid gap-8 lg:grid-cols-[1fr_minmax(280px,22rem)] lg:items-start"
    >
      <Card class="min-w-0">
        <CardHeader
          class="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-end sm:justify-between"
        >
          <CardTitle>Lista</CardTitle>
          <div class="grid gap-2 w-full sm:w-56 sm:shrink-0">
            <CategoryCombobox
              v-model="filterCategory"
              allow-empty
              empty-label="Wszystkie kategorie"
              placeholder="Wszystkie kategorie"
              trigger-class="w-full justify-between"
            />
          </div>
        </CardHeader>
        <CardContent>
          <p v-if="loading" class="text-sm text-muted-foreground">Ładowanie…</p>
          <Table v-else-if="rows.length">
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead class="text-right">Kwota</TableHead>
                <TableHead>Kategoria</TableHead>
                <TableHead>Okres</TableHead>
                <TableHead class="text-right w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="r in rows" :key="r.id">
                <TableCell class="font-medium">{{ r.name }}</TableCell>
                <TableCell class="text-right tabular-nums">{{
                  format(r.amount)
                }}</TableCell>
                <TableCell class="text-sm text-muted-foreground">{{
                  r.category || '—'
                }}</TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  {{ r.startDate }} → {{ r.endDate || '—' }}
                </TableCell>
                <TableCell class="text-right space-x-2">
                  <Button variant="ghost" size="sm" @click="openEdit(r)"
                    >Edytuj</Button
                  >
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-destructive"
                    @click="remove(r.id)"
                  >
                    Usuń
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p v-else class="text-sm text-muted-foreground">Brak wpisów.</p>
        </CardContent>
      </Card>

      <div class="space-y-6 lg:sticky lg:top-6">
        <div
          v-if="!loading && rows.length"
          class="space-y-3 rounded-lg border border-border bg-muted/30 p-4"
        >
          <div>
            <p
              class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Podsumowanie
            </p>
            <div
              class="mt-2 flex flex-wrap items-baseline justify-between gap-4"
            >
              <span class="text-sm text-muted-foreground"
                >Suma miesięczna (lista)</span
              >
              <span class="text-xl font-semibold tabular-nums tracking-tight">{{
                format(totalMonthly)
              }}</span>
            </div>
          </div>
          <Separator />
          <div class="space-y-1.5 text-sm">
            <p class="text-xs text-muted-foreground">Według kategorii</p>
            <div
              v-for="[cat, sum] in byCategory"
              :key="cat"
              class="flex justify-between gap-4 text-muted-foreground"
            >
              <span>{{ cat }}</span>
              <span class="shrink-0 tabular-nums">{{ format(sum) }}</span>
            </div>
          </div>
        </div>

        <div>
          <p class="text-sm font-medium text-muted-foreground mb-3">
            Według kategorii
          </p>
          <ClientOnly>
            <div v-if="radarBundle" class="w-full max-w-xl">
              <RecurringCostsRadarChart
                :categories="radarBundle.categories"
                :amounts="radarBundle.amounts"
                :counts="radarBundle.counts"
                :format-value="formatChartNumber"
              />
            </div>
            <p v-else class="text-sm text-muted-foreground py-8 text-center">
              Brak danych do wykresu.
            </p>
            <template #fallback>
              <p class="text-sm text-muted-foreground py-8 text-center">
                Ładowanie wykresu…
              </p>
            </template>
          </ClientOnly>
        </div>
      </div>
    </div>

    <Dialog v-model:open="addDialogOpen">
      <DialogContent class="sm:max-w-lg">
        <form @submit.prevent="add">
          <DialogHeader>
            <DialogTitle>Nowy koszt stały</DialogTitle>
            <DialogDescription
              >Wpis zostanie dodany do listy po zapisaniu.</DialogDescription
            >
          </DialogHeader>
          <div class="grid gap-4 py-2">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="grid gap-2">
                <Label for="rc-add-name">Nazwa</Label>
                <Input id="rc-add-name" v-model="form.name" />
              </div>
              <div class="grid gap-2">
                <Label for="rc-add-amount">Kwota / mies. (PLN)</Label>
                <Input
                  id="rc-add-amount"
                  v-model="form.amount"
                  type="number"
                  step="0.01"
                />
              </div>
              <div class="grid gap-2">
                <Label>Kategoria</Label>
                <CategoryCombobox v-model="form.category" />
              </div>
              <div class="grid gap-2">
                <Label for="rc-add-dom">Dzień miesiąca</Label>
                <Input
                  id="rc-add-dom"
                  v-model.number="form.dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                />
              </div>
              <div class="grid gap-2">
                <Label for="rc-add-start">Początek</Label>
                <Input id="rc-add-start" v-model="form.startDate" type="date" />
              </div>
              <div class="grid gap-2">
                <Label for="rc-add-end">Koniec (opcj.)</Label>
                <Input id="rc-add-end" v-model="form.endDate" type="date" />
              </div>
            </div>
            <div class="grid gap-2">
              <Label for="rc-add-notes">Notatki</Label>
              <Input id="rc-add-notes" v-model="form.notes" />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              @click="addDialogOpen = false"
              >Anuluj</Button
            >
            <Button type="submit">Dodaj</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="editDialogOpen">
      <DialogContent class="sm:max-w-lg">
        <form @submit.prevent="saveEdit">
          <DialogHeader>
            <DialogTitle>Edytuj koszt stały</DialogTitle>
            <DialogDescription
              >Zmiany zapisują się od razu po kliknięciu
              Zapisz.</DialogDescription
            >
          </DialogHeader>
          <div v-if="editing" class="grid gap-4 py-2">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="grid gap-2 sm:col-span-2">
                <Label for="rc-edit-name">Nazwa</Label>
                <Input id="rc-edit-name" v-model="editForm.name" />
              </div>
              <div class="grid gap-2">
                <Label for="rc-edit-amount">Kwota / mies. (PLN)</Label>
                <Input
                  id="rc-edit-amount"
                  v-model="editForm.amount"
                  type="number"
                  step="0.01"
                />
              </div>
              <div class="grid gap-2">
                <Label>Kategoria</Label>
                <CategoryCombobox v-model="editForm.category" />
              </div>
              <div class="grid gap-2">
                <Label for="rc-edit-dom">Dzień miesiąca</Label>
                <Input
                  id="rc-edit-dom"
                  v-model.number="editForm.dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                />
              </div>
              <div class="grid gap-2">
                <Label for="rc-edit-start">Początek</Label>
                <Input
                  id="rc-edit-start"
                  v-model="editForm.startDate"
                  type="date"
                />
              </div>
              <div class="grid gap-2">
                <Label for="rc-edit-end">Koniec (opcj.)</Label>
                <Input
                  id="rc-edit-end"
                  v-model="editForm.endDate"
                  type="date"
                />
              </div>
            </div>
            <div class="grid gap-2">
              <Label for="rc-edit-notes">Notatki</Label>
              <Input id="rc-edit-notes" v-model="editForm.notes" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="editing = null"
              >Anuluj</Button
            >
            <Button type="submit">Zapisz</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
