<script setup lang="ts">
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

const filterCategory = ref("")
const rows = ref<Row[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const q = filterCategory.value ? { category: filterCategory.value } : {}
    rows.value = await $fetch<Row[]>("/api/recurring-costs", { query: q })
  } finally {
    loading.value = false
  }
}

watch(filterCategory, load)
onMounted(load)

const form = reactive({
  name: "",
  amount: "",
  category: "",
  startDate: `${currentYm()}-01`,
  endDate: "",
  dayOfMonth: 1,
  notes: "",
})

async function add() {
  if (!form.name || !form.amount || !form.startDate) return
  await $fetch("/api/recurring-costs", {
    method: "POST",
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
  form.name = ""
  form.amount = ""
  form.category = ""
  form.endDate = ""
  form.notes = ""
  await load()
}

async function remove(id: number) {
  if (!confirm("Usunąć?")) return
  await $fetch(`/api/recurring-costs/${id}`, { method: "DELETE" })
  await load()
}

const editing = ref<Row | null>(null)
const editForm = reactive({
  name: "",
  amount: "",
  category: "",
  startDate: "",
  endDate: "",
  dayOfMonth: 1,
  notes: "",
})

function openEdit(row: Row) {
  editing.value = row
  editForm.name = row.name
  editForm.amount = row.amount
  editForm.category = row.category ?? ""
  editForm.startDate = row.startDate
  editForm.endDate = row.endDate ?? ""
  editForm.dayOfMonth = row.dayOfMonth
  editForm.notes = row.notes ?? ""
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
    const key = r.category?.trim() || "Bez kategorii"
    map.set(key, (map.get(key) ?? 0) + Number(r.amount))
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1])
})

async function saveEdit() {
  if (!editing.value || !editForm.name || !editForm.amount || !editForm.startDate) return
  await $fetch(`/api/recurring-costs/${editing.value.id}`, {
    method: "PUT",
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
  <div class="space-y-8 max-w-3xl">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Koszty stałe</h1>
        <p class="text-sm text-muted-foreground mt-1">Miesięczne z okresem obowiązywania</p>
      </div>
      <div class="grid gap-2 min-w-[14rem] max-w-xs w-full sm:w-auto">
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

    <Card>
      <CardHeader>
        <CardTitle>Nowy koszt</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="add">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid gap-2">
              <Label for="rc-name">Nazwa</Label>
              <Input id="rc-name" v-model="form.name" />
            </div>
            <div class="grid gap-2">
              <Label for="rc-amount">Kwota / mies. (PLN)</Label>
              <Input id="rc-amount" v-model="form.amount" type="number" step="0.01" />
            </div>
            <div class="grid gap-2">
              <Label>Kategoria</Label>
              <CategoryCombobox v-model="form.category" />
            </div>
            <div class="grid gap-2">
              <Label for="rc-dom">Dzień miesiąca</Label>
              <Input id="rc-dom" v-model.number="form.dayOfMonth" type="number" min="1" max="31" />
            </div>
            <div class="grid gap-2">
              <Label for="rc-start">Początek</Label>
              <Input id="rc-start" v-model="form.startDate" type="date" />
            </div>
            <div class="grid gap-2">
              <Label for="rc-end">Koniec (opcj.)</Label>
              <Input id="rc-end" v-model="form.endDate" type="date" />
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="rc-notes">Notatki</Label>
            <Input id="rc-notes" v-model="form.notes" />
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
        <template v-else-if="rows.length">
          <div class="mb-6 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Podsumowanie</p>
              <div class="mt-2 flex flex-wrap items-baseline justify-between gap-4">
                <span class="text-sm text-muted-foreground">Suma miesięczna (lista)</span>
                <span class="text-xl font-semibold tabular-nums tracking-tight">{{ format(totalMonthly) }}</span>
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
          <Table>
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
              <TableCell class="text-right tabular-nums">{{ format(r.amount) }}</TableCell>
              <TableCell class="text-sm text-muted-foreground">{{ r.category || "—" }}</TableCell>
              <TableCell class="text-sm text-muted-foreground">
                {{ r.startDate }} → {{ r.endDate || "—" }}
              </TableCell>
              <TableCell class="text-right space-x-2">
                <Button variant="ghost" size="sm" @click="openEdit(r)">Edytuj</Button>
                <Button variant="ghost" size="sm" class="text-destructive" @click="remove(r.id)">Usuń</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        </template>
        <p v-else class="text-sm text-muted-foreground">Brak wpisów.</p>
      </CardContent>
    </Card>

    <Dialog v-model:open="editDialogOpen">
      <DialogContent class="sm:max-w-lg">
        <form @submit.prevent="saveEdit">
          <DialogHeader>
            <DialogTitle>Edytuj koszt stały</DialogTitle>
            <DialogDescription>Zmiany zapisują się od razu po kliknięciu Zapisz.</DialogDescription>
          </DialogHeader>
          <div v-if="editing" class="grid gap-4 py-2">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="grid gap-2 sm:col-span-2">
                <Label for="rc-edit-name">Nazwa</Label>
                <Input id="rc-edit-name" v-model="editForm.name" />
              </div>
              <div class="grid gap-2">
                <Label for="rc-edit-amount">Kwota / mies. (PLN)</Label>
                <Input id="rc-edit-amount" v-model="editForm.amount" type="number" step="0.01" />
              </div>
              <div class="grid gap-2">
                <Label>Kategoria</Label>
                <CategoryCombobox v-model="editForm.category" />
              </div>
              <div class="grid gap-2">
                <Label for="rc-edit-dom">Dzień miesiąca</Label>
                <Input id="rc-edit-dom" v-model.number="editForm.dayOfMonth" type="number" min="1" max="31" />
              </div>
              <div class="grid gap-2">
                <Label for="rc-edit-start">Początek</Label>
                <Input id="rc-edit-start" v-model="editForm.startDate" type="date" />
              </div>
              <div class="grid gap-2">
                <Label for="rc-edit-end">Koniec (opcj.)</Label>
                <Input id="rc-edit-end" v-model="editForm.endDate" type="date" />
              </div>
            </div>
            <div class="grid gap-2">
              <Label for="rc-edit-notes">Notatki</Label>
              <Input id="rc-edit-notes" v-model="editForm.notes" />
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
