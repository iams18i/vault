<script setup lang="ts">
import { getLocalTimeZone, today } from '@internationalized/date'
import { onKeyStroke } from '@vueuse/core'

import DatePickerField from '~/components/DatePickerField.vue'
import { cn } from '@/lib/utils'
import type { DatePickerPreset } from '~/types/date-picker-preset'

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
const addFormErrors = ref<string[]>([])

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

onKeyStroke(
  (e) => e.key === 'Enter' && (e.metaKey || e.ctrlKey),
  (e) => {
    if (!addDialogOpen.value) return
    e.preventDefault()
    void submitAdd()
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
watch(addDialogOpen, (open) => {
  if (open) addFormErrors.value = []
})
onMounted(() => {
  load()
  showAppleShortcut.value = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)
})

function calendarDateToIso(d: ReturnType<typeof today>) {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

const recurringStartPresets = computed<DatePickerPreset[]>(() => {
  const z = getLocalTimeZone()
  const t = today(z)
  const first = t.set({ day: 1 })
  return [
    { label: 'Dziś', value: calendarDateToIso(t) },
    { label: 'Pierwszy dzień miesiąca', value: calendarDateToIso(first) },
    {
      label: '1. dzień następnego miesiąca',
      value: calendarDateToIso(first.add({ months: 1 })),
    },
  ]
})

const recurringEndPresets = computed<DatePickerPreset[]>(() => {
  const z = getLocalTimeZone()
  const t = today(z)
  return [
    { label: 'Bez daty końca', value: '' },
    { label: 'Za 6 miesięcy', value: calendarDateToIso(t.add({ months: 6 })) },
    {
      label: 'Za 12 miesięcy',
      value: calendarDateToIso(t.add({ months: 12 })),
    },
    {
      label: 'Za 24 miesiące',
      value: calendarDateToIso(t.add({ months: 24 })),
    },
  ]
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
  addFormErrors.value = []
}

const isoDateRe = /^\d{4}-\d{2}-\d{2}$/

function collectAddFormErrors(): string[] {
  const errs: string[] = []
  if (!form.name.trim()) errs.push('Podaj nazwę.')
  const amt = String(form.amount).trim()
  if (!amt) {
    errs.push('Podaj kwotę.')
  } else {
    const n = Number(amt.replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0)
      errs.push('Kwota musi być liczbą większą od zera.')
  }
  if (!form.startDate || !isoDateRe.test(form.startDate))
    errs.push('Podaj prawidłową datę początku.')
  const dom = Number(form.dayOfMonth)
  if (!Number.isInteger(dom) || dom < 1 || dom > 31)
    errs.push('Dzień miesiąca musi być liczbą całkowitą od 1 do 31.')
  const end = form.endDate?.trim() ?? ''
  if (end) {
    if (!isoDateRe.test(end))
      errs.push('Podaj prawidłową datę końca lub pozostaw puste.')
    else if (form.startDate && end < form.startDate)
      errs.push('Data końca nie może być wcześniejsza niż data początku.')
  }
  return errs
}

async function submitAdd() {
  const errs = collectAddFormErrors()
  addFormErrors.value = errs
  if (errs.length) return
  try {
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
  } catch (e: unknown) {
    const fe = e as { data?: { message?: string; statusMessage?: string } }
    const msg = fe.data?.message ?? fe.data?.statusMessage
    addFormErrors.value = [
      typeof msg === 'string' && msg.trim()
        ? msg
        : 'Nie udało się zapisać. Spróbuj ponownie.',
    ]
  }
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

const notesTextareaClass = cn(
  'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input min-h-16 max-h-60 w-full min-w-0 resize-none rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
  'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
)

const NOTE_TA_MAX_PX = 240

const addNotesTextareaRef = ref<HTMLTextAreaElement | null>(null)
const editNotesTextareaRef = ref<HTMLTextAreaElement | null>(null)

function resizeNotesTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  const h = Math.min(el.scrollHeight, NOTE_TA_MAX_PX)
  el.style.height = `${h}px`
  el.style.overflowY = el.scrollHeight > NOTE_TA_MAX_PX ? 'auto' : 'hidden'
}

function onNotesInput(e: Event) {
  resizeNotesTextarea(e.target as HTMLTextAreaElement)
}

watch(addDialogOpen, (open) => {
  if (open) nextTick(() => resizeNotesTextarea(addNotesTextareaRef.value))
})

watch(editing, (row) => {
  if (row) nextTick(() => resizeNotesTextarea(editNotesTextareaRef.value))
})
</script>

<template>
  <div class="space-y-8 max-w-7xl">
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
              <span class="text-inherit text-xs font-medium">+</span>
              <Kbd>N</Kbd>
            </template>
            <template v-else>
              <Kbd>Ctrl</Kbd>
              <span class="text-inherit text-xs font-medium">+</span>
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
                <TableCell>
                  <CategoryLabel :name="r.category" />
                </TableCell>
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
            <h3 class="font-medium uppercase tracking-wide">Podsumowanie</h3>
            <div
              class="mt-2 flex flex-wrap items-baseline justify-between gap-4"
            >
              <span class="text-sm text-muted-foreground"
                >Suma miesięczna (lista)</span
              >
              <span
                class="text-xl font-heading font-semibold tabular-nums tracking-tight"
                >{{ format(totalMonthly) }}</span
              >
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
        <form @submit.prevent="submitAdd">
          <DialogHeader>
            <DialogTitle>Nowy koszt stały</DialogTitle>
            <DialogDescription
              >Wpis zostanie dodany do listy po zapisaniu.</DialogDescription
            >
          </DialogHeader>
          <div
            v-if="addFormErrors.length"
            class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            <ul class="list-inside list-disc space-y-1">
              <li v-for="(msg, i) in addFormErrors" :key="i">{{ msg }}</li>
            </ul>
          </div>
          <div class="grid gap-4 py-2">
            <div class="grid gap-2">
              <Label for="rc-add-name">Nazwa</Label>
              <Input id="rc-add-name" v-model="form.name" />
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
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
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div class="grid min-w-0 gap-2">
                <Label for="rc-add-start">Początek</Label>
                <DatePickerField
                  id="rc-add-start"
                  v-model="form.startDate"
                  :presets="recurringStartPresets"
                  presets-title="Szybki wybór"
                />
              </div>
              <div class="grid min-w-0 gap-2">
                <Label for="rc-add-end">Koniec (opcj.)</Label>
                <DatePickerField
                  id="rc-add-end"
                  v-model="form.endDate"
                  placeholder="Bez daty"
                  :presets="recurringEndPresets"
                  presets-title="Szybki wybór"
                />
              </div>
              <div class="grid min-w-0 gap-2">
                <Label for="rc-add-dom">Dzień miesiąca</Label>
                <DayPicker id="rc-add-dom" v-model="form.dayOfMonth" />
              </div>
            </div>
            <div class="grid gap-2">
              <Label for="rc-add-notes">Notatki</Label>
              <textarea
                id="rc-add-notes"
                ref="addNotesTextareaRef"
                v-model="form.notes"
                rows="2"
                :class="notesTextareaClass"
                @input="onNotesInput"
              />
            </div>
          </div>
          <DialogFooter class="mt-8 pt-2">
            <Button
              type="button"
              variant="outline"
              @click="addDialogOpen = false"
              >Anuluj</Button
            >
            <Button
              type="submit"
              aria-keyshortcuts="Meta+Enter Control+Enter"
            >
              <span
                class="inline-flex items-center justify-center gap-2"
              >
                Dodaj
                <KbdGroup
                  class="pointer-events-none hidden sm:inline-flex"
                  aria-hidden="true"
                >
                  <template v-if="showAppleShortcut">
                    <Kbd>⌘</Kbd>
                    <span class="text-inherit text-xs font-medium">+</span>
                    <Kbd>Enter</Kbd>
                  </template>
                  <template v-else>
                    <Kbd>Ctrl</Kbd>
                    <span class="text-inherit text-xs font-medium">+</span>
                    <Kbd>Enter</Kbd>
                  </template>
                </KbdGroup>
              </span>
            </Button>
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
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div class="grid min-w-0 gap-2">
                <Label for="rc-edit-start">Początek</Label>
                <DatePickerField
                  id="rc-edit-start"
                  v-model="editForm.startDate"
                  :presets="recurringStartPresets"
                  presets-title="Szybki wybór"
                />
              </div>
              <div class="grid min-w-0 gap-2">
                <Label for="rc-edit-end">Koniec (opcj.)</Label>
                <DatePickerField
                  id="rc-edit-end"
                  v-model="editForm.endDate"
                  placeholder="Bez daty końca"
                  :presets="recurringEndPresets"
                  presets-title="Szybki wybór"
                />
              </div>
              <div class="grid min-w-0 gap-2">
                <Label for="rc-edit-dom">Dzień miesiąca</Label>
                <DayPicker id="rc-edit-dom" v-model="editForm.dayOfMonth" />
              </div>
            </div>
            <div class="grid gap-2">
              <Label for="rc-edit-notes">Notatki</Label>
              <textarea
                id="rc-edit-notes"
                ref="editNotesTextareaRef"
                v-model="editForm.notes"
                rows="2"
                :class="notesTextareaClass"
                @input="onNotesInput"
              />
            </div>
          </div>
          <DialogFooter class="mt-8 pt-2">
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
