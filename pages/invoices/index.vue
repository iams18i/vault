<script setup lang="ts">
const { format } = useCurrency()
const { currentYm } = useMonth()

type Row = {
  id: number
  month: string
  invoiceNumber: string | null
  vendor: string | null
  grossAmount: string
  netAmount: string
  vatAmount: string
  status: string
  dueDate: string | null
}

const filterMonth = ref(currentYm())
const filterStatus = ref("all")
const rows = ref<Row[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const q: Record<string, string> = { month: filterMonth.value }
    if (filterStatus.value && filterStatus.value !== "all") q.status = filterStatus.value
    rows.value = await $fetch("/api/invoices", { query: q })
  } finally {
    loading.value = false
  }
}

watch([filterMonth, filterStatus], load)
onMounted(load)

const form = reactive({
  invoiceNumber: "",
  vendor: "",
  description: "",
  netAmount: "",
  vatAmount: "",
  grossAmount: "",
  issueDate: "",
  dueDate: "",
  status: "pending" as "pending" | "paid" | "overdue",
  notes: "",
})

async function add() {
  if (!form.grossAmount) return
  await $fetch("/api/invoices", {
    method: "POST",
    body: {
      month: filterMonth.value,
      grossAmount: form.grossAmount,
      netAmount: form.netAmount || "0",
      vatAmount: form.vatAmount || "0",
      invoiceNumber: form.invoiceNumber || null,
      vendor: form.vendor || null,
      description: form.description || null,
      issueDate: form.issueDate || null,
      dueDate: form.dueDate || null,
      status: form.status,
      notes: form.notes || null,
    },
  })
  Object.assign(form, {
    invoiceNumber: "",
    vendor: "",
    description: "",
    netAmount: "",
    vatAmount: "",
    grossAmount: "",
    issueDate: "",
    dueDate: "",
    status: "pending",
    notes: "",
  })
  await load()
}

async function remove(id: number) {
  if (!confirm("Usunąć?")) return
  await $fetch(`/api/invoices/${id}`, { method: "DELETE" })
  await load()
}

async function markPaid(id: number) {
  await $fetch(`/api/invoices/${id}`, {
    method: "PUT",
    body: { status: "paid", paidDate: new Date().toISOString().slice(0, 10) },
  })
  await load()
}

function statusBadgeVariant(s: string) {
  if (s === "paid") return "default" as const
  if (s === "overdue") return "destructive" as const
  return "secondary" as const
}
</script>

<template>
  <div class="space-y-8 max-w-3xl">
    <div class="flex flex-wrap items-end gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Faktury</h1>
        <p class="text-sm text-muted-foreground mt-1">Koszty zakupu</p>
      </div>
      <div class="flex flex-wrap gap-4">
        <div class="grid gap-2">
          <Label>Miesiąc</Label>
          <Input v-model="filterMonth" type="month" class="w-[11rem]" />
        </div>
        <div class="grid gap-2 min-w-[140px]">
          <Label>Status</Label>
          <Select v-model="filterStatus">
            <SelectTrigger>
              <SelectValue placeholder="Wszystkie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="pending">Oczekuje</SelectItem>
              <SelectItem value="paid">Opłacona</SelectItem>
              <SelectItem value="overdue">Po terminie</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Nowa faktura</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <Label>Kontrahent</Label>
            <Input v-model="form.vendor" />
          </div>
          <div class="grid gap-2">
            <Label>Nr faktury</Label>
            <Input v-model="form.invoiceNumber" />
          </div>
          <div class="grid gap-2">
            <Label>Netto</Label>
            <Input v-model="form.netAmount" type="number" step="0.01" />
          </div>
          <div class="grid gap-2">
            <Label>VAT</Label>
            <Input v-model="form.vatAmount" type="number" step="0.01" />
          </div>
          <div class="grid gap-2">
            <Label>Brutto</Label>
            <Input v-model="form.grossAmount" type="number" step="0.01" />
          </div>
          <div class="grid gap-2">
            <Label>Termin</Label>
            <Input v-model="form.dueDate" type="date" />
          </div>
          <div class="grid gap-2 sm:col-span-2">
            <Label>Opis</Label>
            <Input v-model="form.description" />
          </div>
          <div class="grid gap-2">
            <Label>Status</Label>
            <Select v-model="form.status">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Oczekuje</SelectItem>
                <SelectItem value="paid">Opłacona</SelectItem>
                <SelectItem value="overdue">Po terminie</SelectItem>
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
              <TableHead>Kontrahent</TableHead>
              <TableHead>Nr</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">Brutto</TableHead>
              <TableHead class="text-right w-[140px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in rows" :key="r.id">
              <TableCell class="font-medium">{{ r.vendor || "—" }}</TableCell>
              <TableCell class="text-muted-foreground text-sm">{{ r.invoiceNumber || "—" }}</TableCell>
              <TableCell>
                <Badge :variant="statusBadgeVariant(r.status)">{{ r.status }}</Badge>
              </TableCell>
              <TableCell class="text-right tabular-nums">{{ format(r.grossAmount) }}</TableCell>
              <TableCell class="text-right space-x-1">
                <Button v-if="r.status !== 'paid'" variant="outline" size="sm" @click="markPaid(r.id)">
                  Opłacono
                </Button>
                <Button variant="ghost" size="sm" class="text-destructive" @click="remove(r.id)">Usuń</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p v-else class="text-sm text-muted-foreground">Brak faktur.</p>
      </CardContent>
    </Card>
  </div>
</template>
