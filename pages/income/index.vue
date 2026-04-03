<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'

import {
  VAT_OPTIONS,
  type VatSelectValue,
  payloadToVatSelect,
  previewVatGross,
  vatSelectToPayload,
} from '~/constants/vat-pl'
import { useAutoGrowTextarea } from '~/composables/useAutoGrowTextarea'
import { fromYm, toYm } from '~/lib/month'

const { format } = useCurrency()
const { currentYm } = useMonth()

const route = useRoute()
const router = useRouter()

type Row = {
  id: number
  month: string
  companyId: number
  company: string
  type: 'hourly' | 'ryczalt'
  hours: string | null
  hourlyRate: string | null
  netAmount: string
  vatExempt: boolean
  vatRatePercent: string | null
  vatAmount: string
  grossAmount: string
  notes: string | null
}

const filterMonth = ref(fromYm(currentYm()))
const filterCompanyId = ref<number | null>(null)

const selectedMonthLabel = computed(() => {
  const s = filterMonth.value.toLocaleDateString('pl-PL', {
    month: 'long',
    year: 'numeric',
  })
  return s.replace(/^./u, (c) => c.toLocaleUpperCase('pl-PL'))
})

const rows = ref<Row[]>([])
const loading = ref(true)

const addDialogOpen = ref(false)
const addFormErrors = ref<string[]>([])
const showAppleShortcut = ref(true)

function openAddDialog() {
  addFormErrors.value = []
  addDialogOpen.value = true
}

function consumeAddQuery() {
  if (route.query.add === '1') {
    openAddDialog()
    const { add: _a, ...rest } = route.query
    router.replace({ query: rest })
  }
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

const form = reactive({
  companyId: null as number | null,
  type: 'hourly' as 'hourly' | 'ryczalt',
  hours: '',
  hourlyRate: '',
  netAmount: '',
  notes: '',
})
const formVatSelect = ref<VatSelectValue>('23')

const previewNet = computed(() => {
  if (form.type !== 'hourly') {
    const n = Number(form.netAmount)
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
  }
  const h = Number(form.hours)
  const r = Number(form.hourlyRate)
  if (!Number.isFinite(h) || !Number.isFinite(r)) return null
  return Math.round(h * r * 100) / 100
})

const previewTax = computed(() => {
  const n = previewNet.value
  if (n == null) return null
  return previewVatGross(n, formVatSelect.value)
})

const { textareaClass, resize, onInput: onNotesInput } = useAutoGrowTextarea()
const addNotesRef = ref<HTMLTextAreaElement | null>(null)
const editNotesRef = ref<HTMLTextAreaElement | null>(null)

async function load() {
  loading.value = true
  try {
    const q: Record<string, string> = { month: toYm(filterMonth.value) }
    if (filterCompanyId.value != null) {
      q.companyId = String(filterCompanyId.value)
    }
    rows.value = await $fetch<Row[]>('/api/monthly-income', { query: q })
  } finally {
    loading.value = false
  }
}

watch([filterMonth, filterCompanyId], load)
watch(() => route.query.add, consumeAddQuery)
watch(addDialogOpen, (open) => {
  if (open) {
    addFormErrors.value = []
    nextTick(() => resize(addNotesRef.value))
  }
})

onMounted(() => {
  load()
  showAppleShortcut.value = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)
  consumeAddQuery()
})

function resetAddForm() {
  form.companyId = null
  form.type = 'hourly'
  form.hours = ''
  form.hourlyRate = ''
  form.netAmount = ''
  form.notes = ''
  formVatSelect.value = '23'
  addFormErrors.value = []
}

function collectAddFormErrors(): string[] {
  const errs: string[] = []
  if (form.companyId == null) errs.push('Wybierz kontrahenta.')
  if (form.type === 'hourly') {
    const h = Number(form.hours)
    const r = Number(form.hourlyRate)
    if (!Number.isFinite(h) || h <= 0) {
      errs.push('Podaj dodatnią liczbę godzin.')
    }
    if (!Number.isFinite(r) || r <= 0) {
      errs.push('Podaj stawkę godzinową większą od zera.')
    }
  } else {
    const n = Number(form.netAmount)
    if (!Number.isFinite(n) || n < 0) {
      errs.push('Podaj kwotę netto (może być zero).')
    }
  }
  return errs
}

async function submitAdd() {
  const errs = collectAddFormErrors()
  addFormErrors.value = errs
  if (errs.length) return
  const vat = vatSelectToPayload(formVatSelect.value)
  try {
    await $fetch('/api/monthly-income', {
      method: 'POST',
      body: {
        month: toYm(filterMonth.value),
        companyId: form.companyId!,
        type: form.type,
        hours: form.type === 'hourly' ? form.hours : null,
        hourlyRate: form.type === 'hourly' ? form.hourlyRate : null,
        netAmount: form.type === 'ryczalt' ? form.netAmount : null,
        vatExempt: vat.vatExempt,
        vatRatePercent: vat.vatRatePercent,
        notes: form.notes.trim() || null,
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
  if (!confirm('Usunąć wpis?')) return
  await $fetch(`/api/monthly-income/${id}`, { method: 'DELETE' })
  await load()
}

const editing = ref<Row | null>(null)
const editForm = reactive({
  companyId: null as number | null,
  type: 'hourly' as 'hourly' | 'ryczalt',
  hours: '',
  hourlyRate: '',
  netAmount: '',
  notes: '',
})
const editVatSelect = ref<VatSelectValue>('23')

function openEdit(row: Row) {
  editing.value = row
  editForm.companyId = row.companyId
  editForm.type = row.type
  editForm.hours = row.hours ?? ''
  editForm.hourlyRate = row.hourlyRate ?? ''
  editForm.netAmount = row.netAmount
  editForm.notes = row.notes ?? ''
  editVatSelect.value = payloadToVatSelect(row.vatExempt, row.vatRatePercent)
  nextTick(() => resize(editNotesRef.value))
}

const editPreviewNet = computed(() => {
  if (editForm.type !== 'hourly') {
    const n = Number(editForm.netAmount)
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
  }
  const h = Number(editForm.hours)
  const r = Number(editForm.hourlyRate)
  if (!Number.isFinite(h) || !Number.isFinite(r)) return null
  return Math.round(h * r * 100) / 100
})

const editPreviewTax = computed(() => {
  const n = editPreviewNet.value
  if (n == null) return null
  return previewVatGross(n, editVatSelect.value)
})

async function saveEdit() {
  if (!editing.value) return
  if (editForm.companyId == null) {
    alert('Wybierz kontrahenta.')
    return
  }
  const vat = vatSelectToPayload(editVatSelect.value)
  try {
    await $fetch(`/api/monthly-income/${editing.value.id}`, {
      method: 'PUT',
      body: {
        companyId: editForm.companyId,
        type: editForm.type,
        hours: editForm.type === 'hourly' ? editForm.hours : null,
        hourlyRate: editForm.type === 'hourly' ? editForm.hourlyRate : null,
        netAmount: editForm.type === 'ryczalt' ? editForm.netAmount : undefined,
        vatExempt: vat.vatExempt,
        vatRatePercent: vat.vatRatePercent,
        notes: editForm.notes.trim() || null,
      },
    })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    alert(err?.data?.message ?? err?.message ?? 'Błąd zapisu')
    return
  }
  editing.value = null
  await load()
}

function typeLabel(t: string) {
  return t === 'hourly' ? 'Godzinowy' : 'Ryczałt'
}

function vatLabel(r: Row) {
  if (r.vatExempt) return 'zw.'
  const p = r.vatRatePercent != null ? String(Number(r.vatRatePercent)) : '23'
  return `${p}%`
}

const editDialogOpen = computed({
  get: () => editing.value !== null,
  set: (v: boolean) => {
    if (!v) editing.value = null
  },
})

watch(editing, (row) => {
  if (row) nextTick(() => resize(editNotesRef.value))
})
</script>

<template>
  <div class="space-y-8 max-w-7xl">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Dochód miesięczny</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Netto z godzin lub ryczałt; VAT wg polskich stawek (23 / 8 / 5 / 0 %)
          lub zwolnienie.
        </p>
      </div>
      <div
        class="flex w-full flex-wrap items-end justify-end gap-6 sm:w-auto sm:gap-8"
      >
        <div class="flex w-full min-w-0 flex-col gap-2 sm:w-44 sm:shrink-0">
          <Label>Miesiąc</Label>
          <MonthPicker v-model="filterMonth" class="w-full" />
        </div>
        <div class="flex w-full min-w-0 flex-col gap-2 sm:w-56 sm:shrink-0">
          <Label>Kontrahent</Label>
          <CompanyCombobox
            v-model="filterCompanyId"
            allow-empty
            empty-label="Wszyscy"
            placeholder="Wszyscy kontrahenci"
            trigger-class="w-full justify-between"
          />
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
            Dodaj dochód
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
      <CardHeader>
        <CardTitle>Wpisy ({{ selectedMonthLabel }})</CardTitle>
      </CardHeader>
      <CardContent>
        <p v-if="loading" class="text-sm text-muted-foreground">Ładowanie…</p>
        <Table v-else-if="rows.length">
          <TableHeader>
            <TableRow>
              <TableHead>Kontrahent</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Szczegóły</TableHead>
              <TableHead class="text-right">Stawka</TableHead>
              <TableHead class="text-right">Netto</TableHead>
              <TableHead class="text-right">VAT</TableHead>
              <TableHead class="text-right">Brutto</TableHead>
              <TableHead class="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in rows" :key="r.id">
              <TableCell class="font-medium">{{ r.company }}</TableCell>
              <TableCell>
                <Badge variant="tag">{{ typeLabel(r.type) }}</Badge>
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">
                <template v-if="r.type === 'hourly'"
                  >{{ r.hours }} h × {{ format(r.hourlyRate!) }}</template
                >
                <template v-else>—</template>
              </TableCell>
              <TableCell class="text-right text-sm">{{
                vatLabel(r)
              }}</TableCell>
              <TableCell class="text-right tabular-nums">{{
                format(r.netAmount)
              }}</TableCell>
              <TableCell class="text-right tabular-nums">{{
                format(r.vatAmount)
              }}</TableCell>
              <TableCell class="text-right tabular-nums font-medium">{{
                format(r.grossAmount)
              }}</TableCell>
              <TableCell class="space-x-2 text-right">
                <Button variant="ghost" size="sm" @click="openEdit(r)"
                  >Edytuj</Button
                >
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-destructive"
                  @click="remove(r.id)"
                  >Usuń</Button
                >
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p v-else class="text-sm text-muted-foreground">Brak wpisów.</p>
      </CardContent>
    </Card>

    <Dialog v-model:open="addDialogOpen">
      <DialogContent class="sm:max-w-lg">
        <form @submit.prevent="submitAdd">
          <DialogHeader>
            <DialogTitle>Nowy wpis dochodu</DialogTitle>
            <DialogDescription
              >Typ rozliczenia i stawka VAT na fakturze</DialogDescription
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
          <div class="grid max-h-[min(70vh,640px)] gap-4 overflow-y-auto py-2">
            <div class="grid gap-2 max-w-xs">
              <Label>Typ</Label>
              <Select v-model="form.type">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Godzinowy (B2B)</SelectItem>
                  <SelectItem value="ryczalt"
                    >Ryczałt (netto / mies.)</SelectItem
                  >
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-2">
              <Label>Kontrahent</Label>
              <CompanyCombobox v-model="form.companyId" />
            </div>
            <template v-if="form.type === 'hourly'">
              <div class="grid gap-4 sm:grid-cols-3">
                <div class="grid gap-2">
                  <Label for="inc-add-h">Godziny</Label>
                  <Input
                    id="inc-add-h"
                    v-model="form.hours"
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="np. 120"
                  />
                </div>
                <div class="grid gap-2">
                  <Label for="inc-add-rate">Stawka netto / h (PLN)</Label>
                  <Input
                    id="inc-add-rate"
                    v-model="form.hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="np. 150"
                  />
                </div>
                <div class="grid gap-2">
                  <Label>VAT</Label>
                  <Select v-model="formVatSelect">
                    <SelectTrigger class="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="o in VAT_OPTIONS"
                        :key="o.value"
                        :value="o.value"
                      >
                        {{ o.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </template>
            <div v-else class="grid gap-4 sm:grid-cols-2">
              <div class="grid max-w-xs gap-2 sm:max-w-none">
                <Label for="inc-add-net">Kwota netto (PLN)</Label>
                <Input
                  id="inc-add-net"
                  v-model="form.netAmount"
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>
              <div class="grid gap-2">
                <Label>VAT</Label>
                <Select v-model="formVatSelect">
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="o in VAT_OPTIONS"
                      :key="o.value"
                      :value="o.value"
                    >
                      {{ o.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div
              v-if="previewNet != null && previewTax"
              class="space-y-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
            >
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground">Netto</span>
                <span class="font-medium tabular-nums">{{
                  format(previewNet)
                }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground">VAT</span>
                <span class="tabular-nums">{{ format(previewTax.vat) }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-muted-foreground">Brutto</span>
                <span class="font-medium tabular-nums">{{
                  format(previewTax.gross)
                }}</span>
              </div>
            </div>
            <div class="grid gap-2">
              <Label for="inc-add-notes">Notatki</Label>
              <textarea
                id="inc-add-notes"
                ref="addNotesRef"
                v-model="form.notes"
                rows="2"
                :class="textareaClass"
                @input="onNotesInput"
              />
            </div>
          </div>
          <DialogFooter class="mt-6 gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              @click="addDialogOpen = false"
              >Anuluj</Button
            >
            <Button type="submit" aria-keyshortcuts="Meta+Enter Control+Enter">
              <span class="inline-flex items-center justify-center gap-2">
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
        <DialogHeader>
          <DialogTitle>Edytuj wpis</DialogTitle>
          <DialogDescription
            >Zmiana typu lub VAT przeliczy kwoty.</DialogDescription
          >
        </DialogHeader>
        <div
          v-if="editing"
          class="grid max-h-[min(70vh,640px)] gap-4 overflow-y-auto py-2"
        >
          <div class="grid gap-2 max-w-xs">
            <Label>Typ</Label>
            <Select v-model="editForm.type">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Godzinowy</SelectItem>
                <SelectItem value="ryczalt">Ryczałt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label>Kontrahent</Label>
            <CompanyCombobox v-model="editForm.companyId" />
          </div>
          <template v-if="editForm.type === 'hourly'">
            <div class="grid grid-cols-2 gap-3">
              <div class="grid gap-2">
                <Label>Godziny</Label>
                <Input v-model="editForm.hours" type="number" step="0.25" />
              </div>
              <div class="grid gap-2">
                <Label>Stawka / h</Label>
                <Input
                  v-model="editForm.hourlyRate"
                  type="number"
                  step="0.01"
                />
              </div>
            </div>
          </template>
          <div v-else class="grid gap-2">
            <Label>Netto</Label>
            <Input v-model="editForm.netAmount" type="number" step="0.01" />
          </div>
          <div class="grid gap-2">
            <Label>VAT</Label>
            <Select v-model="editVatSelect">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="o in VAT_OPTIONS"
                  :key="o.value"
                  :value="o.value"
                >
                  {{ o.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div
            v-if="editPreviewNet != null && editPreviewTax"
            class="space-y-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
          >
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Netto</span>
              <span class="font-medium tabular-nums">{{
                format(editPreviewNet)
              }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">VAT</span>
              <span class="tabular-nums">{{ format(editPreviewTax.vat) }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Brutto</span>
              <span class="font-medium tabular-nums">{{
                format(editPreviewTax.gross)
              }}</span>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="inc-edit-notes">Notatki</Label>
            <textarea
              id="inc-edit-notes"
              ref="editNotesRef"
              v-model="editForm.notes"
              rows="2"
              :class="textareaClass"
              @input="onNotesInput"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="editing = null">Anuluj</Button>
          <Button @click="saveEdit">Zapisz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
