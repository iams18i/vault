<script setup lang="ts">
import {
  VAT_OPTIONS,
  type VatSelectValue,
  payloadToVatSelect,
  previewVatGross,
  vatSelectToPayload,
} from "~/constants/vat-pl"
import { fromYm, toYm } from "~/lib/month"

const { format } = useCurrency()
const { currentYm } = useMonth()

type Row = {
  id: number
  month: string
  company: string
  type: "hourly" | "ryczalt"
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
const rows = ref<Row[]>([])
const loading = ref(true)

const form = reactive({
  company: "",
  type: "hourly" as "hourly" | "ryczalt",
  hours: "",
  hourlyRate: "",
  netAmount: "",
  notes: "",
})
const formVatSelect = ref<VatSelectValue>("23")

const previewNet = computed(() => {
  if (form.type !== "hourly") {
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

async function load() {
  loading.value = true
  try {
    rows.value = await $fetch<Row[]>("/api/monthly-income", { query: { month: toYm(filterMonth.value) } })
  } finally {
    loading.value = false
  }
}

watch(filterMonth, load)
onMounted(load)

async function add() {
  if (!form.company.trim()) return
  const vat = vatSelectToPayload(formVatSelect.value)
  await $fetch("/api/monthly-income", {
    method: "POST",
    body: {
      month: toYm(filterMonth.value),
      company: form.company.trim(),
      type: form.type,
      hours: form.type === "hourly" ? form.hours : null,
      hourlyRate: form.type === "hourly" ? form.hourlyRate : null,
      netAmount: form.type === "ryczalt" ? form.netAmount : null,
      vatExempt: vat.vatExempt,
      vatRatePercent: vat.vatRatePercent,
      notes: form.notes.trim() || null,
    },
  })
  form.company = ""
  form.hours = ""
  form.hourlyRate = ""
  form.netAmount = ""
  form.notes = ""
  formVatSelect.value = "23"
  await load()
}

async function remove(id: number) {
  if (!confirm("Usunąć wpis?")) return
  await $fetch(`/api/monthly-income/${id}`, { method: "DELETE" })
  await load()
}

const editing = ref<Row | null>(null)
const editForm = reactive({
  company: "",
  type: "hourly" as "hourly" | "ryczalt",
  hours: "",
  hourlyRate: "",
  netAmount: "",
  notes: "",
})
const editVatSelect = ref<VatSelectValue>("23")

function openEdit(row: Row) {
  editing.value = row
  editForm.company = row.company
  editForm.type = row.type
  editForm.hours = row.hours ?? ""
  editForm.hourlyRate = row.hourlyRate ?? ""
  editForm.netAmount = row.netAmount
  editForm.notes = row.notes ?? ""
  editVatSelect.value = payloadToVatSelect(row.vatExempt, row.vatRatePercent)
}

const editPreviewNet = computed(() => {
  if (editForm.type !== "hourly") {
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
  const vat = vatSelectToPayload(editVatSelect.value)
  await $fetch(`/api/monthly-income/${editing.value.id}`, {
    method: "PUT",
    body: {
      company: editForm.company.trim(),
      type: editForm.type,
      hours: editForm.type === "hourly" ? editForm.hours : null,
      hourlyRate: editForm.type === "hourly" ? editForm.hourlyRate : null,
      netAmount: editForm.type === "ryczalt" ? editForm.netAmount : undefined,
      vatExempt: vat.vatExempt,
      vatRatePercent: vat.vatRatePercent,
      notes: editForm.notes.trim() || null,
    },
  })
  editing.value = null
  await load()
}

function typeLabel(t: string) {
  return t === "hourly" ? "Godzinowy" : "Ryczałt"
}

function vatLabel(r: Row) {
  if (r.vatExempt) return "zw."
  const p = r.vatRatePercent != null ? String(Number(r.vatRatePercent)) : "23"
  return `${p}%`
}

const editDialogOpen = computed({
  get: () => editing.value !== null,
  set: (v: boolean) => {
    if (!v) editing.value = null
  },
})
</script>

<template>
  <div class="space-y-8 max-w-4xl">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Dochód miesięczny</h1>
      <p class="text-sm text-muted-foreground mt-1">
        Netto z godzin lub ryczałt; VAT wg polskich stawek (23 / 8 / 5 / 0 %) lub zwolnienie.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <Label for="inc-month" class="text-muted-foreground">Miesiąc</Label>
      <MonthPicker v-model="filterMonth" class="w-44" />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Nowy wpis</CardTitle>
        <CardDescription>Typ rozliczenia i stawka VAT na fakturze</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-2 max-w-xs">
          <Label>Typ</Label>
          <Select v-model="form.type">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Typ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Godzinowy (B2B)</SelectItem>
              <SelectItem value="ryczalt">Ryczałt (netto / mies.)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-2">
          <Label for="co">Kontrahent / firma</Label>
          <Input id="co" v-model="form.company" placeholder="Nazwa" />
        </div>
        <template v-if="form.type === 'hourly'">
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="grid gap-2">
              <Label for="h">Godziny</Label>
              <Input id="h" v-model="form.hours" type="number" step="0.25" min="0" placeholder="np. 120" />
            </div>
            <div class="grid gap-2">
              <Label for="rate">Stawka netto / h (PLN)</Label>
              <Input id="rate" v-model="form.hourlyRate" type="number" step="0.01" min="0" placeholder="np. 150" />
            </div>
            <div class="grid gap-2">
              <Label>VAT</Label>
              <Select v-model="formVatSelect">
                <SelectTrigger class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="o in VAT_OPTIONS" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </template>
        <div v-else class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-2 max-w-xs sm:max-w-none">
            <Label for="net">Kwota netto (PLN)</Label>
            <Input id="net" v-model="form.netAmount" type="number" step="0.01" min="0" />
          </div>
          <div class="grid gap-2">
            <Label>VAT</Label>
            <Select v-model="formVatSelect">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="o in VAT_OPTIONS" :key="o.value" :value="o.value">
                  {{ o.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div v-if="previewNet != null && previewTax" class="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm space-y-1">
          <div class="flex justify-between gap-4">
            <span class="text-muted-foreground">Netto</span>
            <span class="tabular-nums font-medium">{{ format(previewNet) }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-muted-foreground">VAT</span>
            <span class="tabular-nums">{{ format(previewTax.vat) }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-muted-foreground">Brutto</span>
            <span class="tabular-nums font-medium">{{ format(previewTax.gross) }}</span>
          </div>
        </div>
        <div class="grid gap-2">
          <Label for="notes">Notatki</Label>
          <Input id="notes" v-model="form.notes" placeholder="Opcjonalnie" />
        </div>
        <Button @click="add">Dodaj</Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Wpisy ({{ filterMonth }})</CardTitle>
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
                <Badge variant="secondary">{{ typeLabel(r.type) }}</Badge>
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">
                <template v-if="r.type === 'hourly'">{{ r.hours }} h × {{ format(r.hourlyRate!) }}</template>
                <template v-else>—</template>
              </TableCell>
              <TableCell class="text-right text-sm">{{ vatLabel(r) }}</TableCell>
              <TableCell class="text-right tabular-nums">{{ format(r.netAmount) }}</TableCell>
              <TableCell class="text-right tabular-nums">{{ format(r.vatAmount) }}</TableCell>
              <TableCell class="text-right tabular-nums font-medium">{{ format(r.grossAmount) }}</TableCell>
              <TableCell class="text-right space-x-2">
                <Button variant="ghost" size="sm" @click="openEdit(r)">Edytuj</Button>
                <Button variant="ghost" size="sm" class="text-destructive" @click="remove(r.id)">Usuń</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p v-else class="text-sm text-muted-foreground">Brak wpisów.</p>
      </CardContent>
    </Card>

    <Dialog v-model:open="editDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edytuj wpis</DialogTitle>
          <DialogDescription>Zmiana typu lub VAT przeliczy kwoty.</DialogDescription>
        </DialogHeader>
        <div v-if="editing" class="grid gap-4 py-2">
          <div class="grid gap-2">
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
            <Input v-model="editForm.company" />
          </div>
          <template v-if="editForm.type === 'hourly'">
            <div class="grid grid-cols-2 gap-3">
              <div class="grid gap-2">
                <Label>Godziny</Label>
                <Input v-model="editForm.hours" type="number" step="0.25" />
              </div>
              <div class="grid gap-2">
                <Label>Stawka / h</Label>
                <Input v-model="editForm.hourlyRate" type="number" step="0.01" />
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
                <SelectItem v-for="o in VAT_OPTIONS" :key="o.value" :value="o.value">
                  {{ o.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div v-if="editPreviewNet != null && editPreviewTax" class="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm space-y-1">
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Netto</span>
              <span class="tabular-nums font-medium">{{ format(editPreviewNet) }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">VAT</span>
              <span class="tabular-nums">{{ format(editPreviewTax.vat) }}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Brutto</span>
              <span class="tabular-nums font-medium">{{ format(editPreviewTax.gross) }}</span>
            </div>
          </div>
          <div class="grid gap-2">
            <Label>Notatki</Label>
            <Input v-model="editForm.notes" />
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
