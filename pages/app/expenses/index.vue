<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'

import { fromYm, toYm } from '~/lib/month'

definePageMeta({ layout: 'default' })

const { format } = useCurrency()
const { currentYm } = useMonth()
const api = useApiFetch()
const auth = useAuth()

type Row = {
  id: string
  month: string
  name: string
  amount: string
  category: string | null
  expenseDate: string | null
  notes: string | null
}

const filterMonth = ref(fromYm(currentYm()))
const filterCategory = ref('')
const rows = ref<Row[]>([])
const loading = ref(true)
const addDialogOpen = ref(false)

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
    const q: Record<string, string> = { month: toYm(filterMonth.value) }
    if (filterCategory.value) q.category = filterCategory.value
    rows.value = await api<Row[]>('/api/monthly-expenses', { query: q })
  } finally {
    loading.value = false
  }
}

watch([filterMonth, filterCategory], load)
watch(() => auth.currentVaultId.value, () => {
  void load()
})
onMounted(() => {
  load()
  showAppleShortcut.value = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)
})

const form = reactive({
  name: '',
  amount: '',
  category: '',
  expenseDate: '',
  notes: '',
})

function resetAddForm() {
  form.name = ''
  form.amount = ''
  form.category = ''
  form.expenseDate = ''
  form.notes = ''
}

async function add() {
  if (!form.name || !form.amount) return
  await api('/api/monthly-expenses', {
    method: 'POST',
    body: {
      month: toYm(filterMonth.value),
      name: form.name,
      amount: form.amount,
      category: form.category || null,
      expenseDate: form.expenseDate || null,
      notes: form.notes || null,
    },
  })
  resetAddForm()
  addDialogOpen.value = false
  await load()
}

async function remove(id: string) {
  if (!confirm('Usunąć?')) return
  await api(`/api/monthly-expenses/${id}`, { method: 'DELETE' })
  await load()
}

const editing = ref<Row | null>(null)
const editForm = reactive({
  month: fromYm(currentYm()),
  name: '',
  amount: '',
  category: '',
  expenseDate: '',
  notes: '',
})

function openEdit(row: Row) {
  editing.value = row
  editForm.month = fromYm(row.month)
  editForm.name = row.name
  editForm.amount = row.amount
  editForm.category = row.category ?? ''
  editForm.expenseDate = row.expenseDate ?? ''
  editForm.notes = row.notes ?? ''
}

const editDialogOpen = computed({
  get: () => editing.value !== null,
  set: (v: boolean) => {
    if (!v) editing.value = null
  },
})

async function saveEdit() {
  if (!editing.value || !editForm.name || !editForm.amount) return
  await api(`/api/monthly-expenses/${editing.value.id}`, {
    method: 'PUT',
    body: {
      month: toYm(editForm.month),
      name: editForm.name,
      amount: editForm.amount,
      category: editForm.category || null,
      expenseDate: editForm.expenseDate || null,
      notes: editForm.notes || null,
    },
  })
  editing.value = null
  await load()
}
</script>

<template>
  <div class="space-y-8 max-w-7xl">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Wydatki</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Jednorazowe w wybranym miesiącu
        </p>
      </div>
      <div
        class="flex w-full flex-wrap items-end justify-end gap-6 sm:w-auto sm:gap-8"
      >
        <div class="flex w-full min-w-0 flex-col gap-2 sm:w-44 sm:shrink-0">
          <Label>Miesiąc</Label>
          <MonthPicker v-model="filterMonth" class="w-full" />
        </div>
        <Button
          class="w-full shrink-0 sm:w-auto"
          size="lg"
          aria-keyshortcuts="Meta+N Control+N"
          @click="openAddDialog"
        >
          <span
            class="inline-flex w-full items-center justify-center gap-2 sm:w-auto sm:justify-start"
          >
            Dodaj wydatek
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
    </div>

    <Card class="min-w-0">
      <CardHeader
        class="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-end sm:justify-between"
      >
        <CardTitle>Lista</CardTitle>
        <div class="grid w-full gap-2 sm:w-56 sm:shrink-0">
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
              <TableHead>Data</TableHead>
              <TableHead class="text-right w-[140px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in rows" :key="r.id">
              <TableCell>{{ r.name }}</TableCell>
              <TableCell class="text-right tabular-nums">{{
                format(r.amount)
              }}</TableCell>
              <TableCell>
                <CategoryLabel :name="r.category" />
              </TableCell>
              <TableCell class="text-muted-foreground">{{
                r.expenseDate || '—'
              }}</TableCell>
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
        <p v-else class="text-sm text-muted-foreground">Brak wydatków.</p>
      </CardContent>
    </Card>

    <Dialog v-model:open="addDialogOpen">
      <DialogContent class="sm:max-w-lg">
        <form @submit.prevent="add">
          <DialogHeader>
            <DialogTitle>Nowy wydatek</DialogTitle>
            <DialogDescription>
              Wpis zostanie dodany do miesiąca: {{ toYm(filterMonth) }}.
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-2">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="grid gap-2 sm:col-span-2">
                <Label for="exp-add-name">Nazwa</Label>
                <Input id="exp-add-name" v-model="form.name" />
              </div>
              <div class="grid gap-2">
                <Label for="exp-add-amount">Kwota</Label>
                <Input
                  id="exp-add-amount"
                  v-model="form.amount"
                  type="number"
                  step="0.01"
                />
              </div>
              <div class="grid gap-2">
                <Label>Kategoria</Label>
                <CategoryCombobox v-model="form.category" />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="exp-add-date">Data</Label>
                <DatePickerField
                  id="exp-add-date"
                  v-model="form.expenseDate"
                  placeholder="Brak daty"
                />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="exp-add-notes">Notatki</Label>
                <Input id="exp-add-notes" v-model="form.notes" />
              </div>
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
            <DialogTitle>Edytuj wydatek</DialogTitle>
            <DialogDescription
              >Możesz zmienić miesiąc wpisu (przeniesienie między
              okresami).</DialogDescription
            >
          </DialogHeader>
          <div v-if="editing" class="grid gap-4 py-2">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="grid gap-2 sm:col-span-2">
                <Label for="exp-edit-name">Nazwa</Label>
                <Input id="exp-edit-name" v-model="editForm.name" />
              </div>
              <div class="grid gap-2">
                <Label for="exp-edit-month">Miesiąc</Label>
                <MonthPicker v-model="editForm.month" class="w-full" />
              </div>
              <div class="grid gap-2">
                <Label for="exp-edit-amount">Kwota</Label>
                <Input
                  id="exp-edit-amount"
                  v-model="editForm.amount"
                  type="number"
                  step="0.01"
                />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label>Kategoria</Label>
                <CategoryCombobox v-model="editForm.category" />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="exp-edit-date">Data</Label>
                <DatePickerField
                  id="exp-edit-date"
                  v-model="editForm.expenseDate"
                  placeholder="Brak daty"
                />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="exp-edit-notes">Notatki</Label>
                <Input id="exp-edit-notes" v-model="editForm.notes" />
              </div>
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
