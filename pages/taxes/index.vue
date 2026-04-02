<script setup lang="ts">
const { format } = useCurrency()

type Row = {
  id: number
  name: string
  year: number
  month: number
  amountDue: string
  amountPaid: string
  dueDate: string | null
  status: string
  notes: string | null
}

const year = ref(new Date().getFullYear())
const rows = ref<Row[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    rows.value = await $fetch("/api/tax-entries", { query: { year: year.value } })
  } finally {
    loading.value = false
  }
}

watch(year, load)
onMounted(load)

const form = reactive({
  name: "",
  month: new Date().getMonth() + 1,
  amountDue: "",
  amountPaid: "0",
  dueDate: "",
  status: "pending" as "pending" | "paid" | "partial",
  notes: "",
})

async function add() {
  if (!form.name || !form.amountDue) return
  await $fetch("/api/tax-entries", {
    method: "POST",
    body: {
      name: form.name,
      year: year.value,
      month: form.month,
      amountDue: form.amountDue,
      amountPaid: form.amountPaid || "0",
      dueDate: form.dueDate || null,
      status: form.status,
      notes: form.notes || null,
    },
  })
  form.name = ""
  form.amountDue = ""
  form.amountPaid = "0"
  form.dueDate = ""
  form.notes = ""
  await load()
}

async function remove(id: number) {
  if (!confirm("Usunąć?")) return
  await $fetch(`/api/tax-entries/${id}`, { method: "DELETE" })
  await load()
}

function statusLabel(s: string) {
  if (s === "pending") return "Oczekuje"
  if (s === "partial") return "Częściowo"
  if (s === "paid") return "Zapłacone"
  return s
}

const editing = ref<Row | null>(null)
const editForm = reactive({
  name: "",
  year: new Date().getFullYear(),
  month: 1,
  amountDue: "",
  amountPaid: "",
  dueDate: "",
  status: "pending" as "pending" | "paid" | "partial",
  notes: "",
})

/** If status is „paid” and nothing paid yet, treat as fully settled (należne). */
function syncPaidWhenMarkedPaid() {
  if (editForm.status !== "paid") return
  const paid = Number(String(editForm.amountPaid ?? "").trim() || "0")
  if (Number.isFinite(paid) && paid > 0) return
  if (!editForm.amountDue) return
  editForm.amountPaid = String(editForm.amountDue)
}

function openEdit(row: Row) {
  editing.value = row
  editForm.name = row.name
  editForm.year = row.year
  editForm.month = row.month
  editForm.amountDue = row.amountDue
  editForm.amountPaid = row.amountPaid
  editForm.dueDate = row.dueDate ?? ""
  editForm.status = row.status as "pending" | "paid" | "partial"
  editForm.notes = row.notes ?? ""
  syncPaidWhenMarkedPaid()
}

watch(() => editForm.status, () => syncPaidWhenMarkedPaid())

const editDialogOpen = computed({
  get: () => editing.value !== null,
  set: (v: boolean) => {
    if (!v) editing.value = null
  },
})

async function saveEdit() {
  if (!editing.value || !editForm.name || !editForm.amountDue) return
  syncPaidWhenMarkedPaid()
  await $fetch(`/api/tax-entries/${editing.value.id}`, {
    method: "PUT",
    body: {
      name: editForm.name,
      year: editForm.year,
      month: editForm.month,
      amountDue: editForm.amountDue,
      amountPaid: editForm.amountPaid || "0",
      dueDate: editForm.dueDate || null,
      status: editForm.status,
      notes: editForm.notes.trim() || null,
    },
  })
  editing.value = null
  await load()
}

const totals = computed(() => {
  let due = 0
  let paid = 0
  for (const r of rows.value) {
    due += Number(r.amountDue)
    paid += Number(r.amountPaid)
  }
  return { due, paid, left: due - paid }
})
</script>

<template>
  <div class="space-y-8 max-w-3xl">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Podatki</h1>
        <p class="text-sm text-muted-foreground mt-1">
          PIT, ZUS… VAT z dochodu jest na pulpicie. Zapłaty wpisz jako pozycję z „VAT” w nazwie (ten sam miesiąc).
        </p>
      </div>
      <div class="grid gap-2">
        <Label>Rok</Label>
        <Input v-model.number="year" type="number" min="2000" max="2100" class="w-28" />
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Podsumowanie roku</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-wrap gap-6 text-sm">
        <div>
          <span class="text-muted-foreground">Należne</span>
          <p class="text-lg font-semibold tabular-nums">{{ format(totals.due) }}</p>
        </div>
        <div>
          <span class="text-muted-foreground">Zapłacone</span>
          <p class="text-lg font-semibold tabular-nums">{{ format(totals.paid) }}</p>
        </div>
        <div>
          <span class="text-muted-foreground">Pozostało</span>
          <p class="text-lg font-semibold tabular-nums">{{ format(totals.left) }}</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Nowy wpis</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-2 sm:col-span-2">
            <Label>Nazwa</Label>
            <Input v-model="form.name" placeholder="np. ZUS, PIT" />
          </div>
          <div class="grid gap-2">
            <Label>Miesiąc (1–12)</Label>
            <Input v-model.number="form.month" type="number" min="1" max="12" />
          </div>
          <div class="grid gap-2">
            <Label>Należne</Label>
            <Input v-model="form.amountDue" type="number" step="0.01" />
          </div>
          <div class="grid gap-2">
            <Label>Zapłacone</Label>
            <Input v-model="form.amountPaid" type="number" step="0.01" />
          </div>
          <div class="grid gap-2">
            <Label>Termin</Label>
            <Input v-model="form.dueDate" type="date" />
          </div>
          <div class="grid gap-2">
            <Label>Status</Label>
            <Select v-model="form.status">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Oczekuje</SelectItem>
                <SelectItem value="partial">Częściowo</SelectItem>
                <SelectItem value="paid">Zapłacone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button @click="add">Dodaj</Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Lista</CardTitle>
      </CardHeader>
      <CardContent>
        <p v-if="loading" class="text-sm text-muted-foreground">Ładowanie…</p>
        <Table v-else-if="rows.length">
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>M-c</TableHead>
              <TableHead class="text-right">Należne</TableHead>
              <TableHead class="text-right">Zapłacone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right w-[150px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in rows" :key="r.id">
              <TableCell class="font-medium">{{ r.name }}</TableCell>
              <TableCell>{{ r.month }}</TableCell>
              <TableCell class="text-right tabular-nums">{{ format(r.amountDue) }}</TableCell>
              <TableCell class="text-right tabular-nums">{{ format(r.amountPaid) }}</TableCell>
              <TableCell>
                <Badge variant="outline">{{ statusLabel(r.status) }}</Badge>
              </TableCell>
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
      <DialogContent class="sm:max-w-lg">
        <form @submit.prevent="saveEdit">
          <DialogHeader>
            <DialogTitle>Edytuj wpis</DialogTitle>
            <DialogDescription>Zmień status, zapłaconą kwotę lub inne pola.</DialogDescription>
          </DialogHeader>
          <div v-if="editing" class="grid gap-4 py-2">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="grid gap-2 sm:col-span-2">
                <Label for="tax-edit-name">Nazwa</Label>
                <Input id="tax-edit-name" v-model="editForm.name" />
              </div>
              <div class="grid gap-2">
                <Label for="tax-edit-year">Rok</Label>
                <Input id="tax-edit-year" v-model.number="editForm.year" type="number" min="2000" max="2100" />
              </div>
              <div class="grid gap-2">
                <Label for="tax-edit-month">Miesiąc (1–12)</Label>
                <Input id="tax-edit-month" v-model.number="editForm.month" type="number" min="1" max="12" />
              </div>
              <div class="grid gap-2">
                <Label for="tax-edit-due">Należne</Label>
                <Input id="tax-edit-due" v-model="editForm.amountDue" type="number" step="0.01" />
              </div>
              <div class="grid gap-2">
                <Label for="tax-edit-paid">Zapłacone</Label>
                <Input id="tax-edit-paid" v-model="editForm.amountPaid" type="number" step="0.01" />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="tax-edit-date">Termin</Label>
                <Input id="tax-edit-date" v-model="editForm.dueDate" type="date" />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label>Status</Label>
                <Select v-model="editForm.status">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Oczekuje</SelectItem>
                    <SelectItem value="partial">Częściowo</SelectItem>
                    <SelectItem value="paid">Zapłacone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="tax-edit-notes">Notatki</Label>
                <Input id="tax-edit-notes" v-model="editForm.notes" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="editDialogOpen = false">Anuluj</Button>
            <Button type="submit">Zapisz</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
