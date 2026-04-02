<script setup lang="ts">
const { format } = useCurrency()
const { currentYm } = useMonth()

type Row = {
  id: number
  month: string
  name: string
  amount: string
  category: string | null
  expenseDate: string | null
  notes: string | null
}

const filterMonth = ref(currentYm())
const filterCategory = ref("")
const rows = ref<Row[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const q: Record<string, string> = { month: filterMonth.value }
    if (filterCategory.value) q.category = filterCategory.value
    rows.value = await $fetch<Row[]>("/api/monthly-expenses", { query: q })
  } finally {
    loading.value = false
  }
}

watch([filterMonth, filterCategory], load)
onMounted(load)

const form = reactive({
  name: "",
  amount: "",
  category: "",
  expenseDate: "",
  notes: "",
})

async function add() {
  if (!form.name || !form.amount) return
  await $fetch("/api/monthly-expenses", {
    method: "POST",
    body: {
      month: filterMonth.value,
      name: form.name,
      amount: form.amount,
      category: form.category || null,
      expenseDate: form.expenseDate || null,
      notes: form.notes || null,
    },
  })
  form.name = ""
  form.amount = ""
  form.category = ""
  form.expenseDate = ""
  form.notes = ""
  await load()
}

async function remove(id: number) {
  if (!confirm("Usunąć?")) return
  await $fetch(`/api/monthly-expenses/${id}`, { method: "DELETE" })
  await load()
}

const editing = ref<Row | null>(null)
const editForm = reactive({
  month: "",
  name: "",
  amount: "",
  category: "",
  expenseDate: "",
  notes: "",
})

function openEdit(row: Row) {
  editing.value = row
  editForm.month = row.month
  editForm.name = row.name
  editForm.amount = row.amount
  editForm.category = row.category ?? ""
  editForm.expenseDate = row.expenseDate ?? ""
  editForm.notes = row.notes ?? ""
}

const editDialogOpen = computed({
  get: () => editing.value !== null,
  set: (v: boolean) => {
    if (!v) editing.value = null
  },
})

async function saveEdit() {
  if (!editing.value || !editForm.name || !editForm.amount) return
  await $fetch(`/api/monthly-expenses/${editing.value.id}`, {
    method: "PUT",
    body: {
      month: editForm.month,
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
  <div class="space-y-8 max-w-3xl">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Wydatki</h1>
        <p class="text-sm text-muted-foreground mt-1">Jednorazowe w wybranym miesiącu</p>
      </div>
      <div class="flex flex-wrap items-end gap-4">
        <div class="grid gap-2">
          <Label>Miesiąc</Label>
          <Input v-model="filterMonth" type="month" class="w-[11rem]" />
        </div>
        <div class="grid gap-2 min-w-[14rem] flex-1 max-w-xs">
          <Label>Kategoria (filtr)</Label>
          <CategoryCombobox
            v-model="filterCategory"
            allow-empty
            empty-label="Wszystkie kategorie"
            placeholder="Wszystkie kategorie"
            trigger-class="w-full justify-between"
          />
        </div>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Nowy wydatek</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="add">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid gap-2 sm:col-span-2">
              <Label for="exp-name">Nazwa</Label>
              <Input id="exp-name" v-model="form.name" />
            </div>
            <div class="grid gap-2">
              <Label for="exp-amount">Kwota</Label>
              <Input id="exp-amount" v-model="form.amount" type="number" step="0.01" />
            </div>
            <div class="grid gap-2">
              <Label>Kategoria</Label>
              <CategoryCombobox v-model="form.category" />
            </div>
            <div class="grid gap-2">
              <Label for="exp-date">Data</Label>
              <Input id="exp-date" v-model="form.expenseDate" type="date" />
            </div>
            <div class="grid gap-2 sm:col-span-2">
              <Label for="exp-notes">Notatki</Label>
              <Input id="exp-notes" v-model="form.notes" />
            </div>
          </div>
          <Button type="submit">Dodaj</Button>
        </form>
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
              <TableHead class="text-right">Kwota</TableHead>
              <TableHead>Kategoria</TableHead>
              <TableHead>Data</TableHead>
              <TableHead class="text-right w-[140px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in rows" :key="r.id">
              <TableCell>{{ r.name }}</TableCell>
              <TableCell class="text-right tabular-nums">{{ format(r.amount) }}</TableCell>
              <TableCell class="text-muted-foreground">{{ r.category || "—" }}</TableCell>
              <TableCell class="text-muted-foreground">{{ r.expenseDate || "—" }}</TableCell>
              <TableCell class="text-right space-x-2">
                <Button variant="ghost" size="sm" @click="openEdit(r)">Edytuj</Button>
                <Button variant="ghost" size="sm" class="text-destructive" @click="remove(r.id)">Usuń</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p v-else class="text-sm text-muted-foreground">Brak wydatków.</p>
      </CardContent>
    </Card>

    <Dialog v-model:open="editDialogOpen">
      <DialogContent class="sm:max-w-lg">
        <form @submit.prevent="saveEdit">
          <DialogHeader>
            <DialogTitle>Edytuj wydatek</DialogTitle>
            <DialogDescription>Możesz zmienić miesiąc wpisu (przeniesienie między okresami).</DialogDescription>
          </DialogHeader>
          <div v-if="editing" class="grid gap-4 py-2">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="grid gap-2 sm:col-span-2">
                <Label for="exp-edit-name">Nazwa</Label>
                <Input id="exp-edit-name" v-model="editForm.name" />
              </div>
              <div class="grid gap-2">
                <Label for="exp-edit-month">Miesiąc</Label>
                <Input id="exp-edit-month" v-model="editForm.month" type="month" class="w-full" />
              </div>
              <div class="grid gap-2">
                <Label for="exp-edit-amount">Kwota</Label>
                <Input id="exp-edit-amount" v-model="editForm.amount" type="number" step="0.01" />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label>Kategoria</Label>
                <CategoryCombobox v-model="editForm.category" />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="exp-edit-date">Data</Label>
                <Input id="exp-edit-date" v-model="editForm.expenseDate" type="date" />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="exp-edit-notes">Notatki</Label>
                <Input id="exp-edit-notes" v-model="editForm.notes" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="editing = null">Anuluj</Button>
            <Button type="submit">Zapisz</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
