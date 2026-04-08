<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'

import AddInvoiceDialog from '~/components/AddInvoiceDialog.vue'
import { fromYm, toYm } from '~/lib/month'

definePageMeta({ layout: 'default' })

const { format } = useCurrency()
const { currentYm } = useMonth()
const api = useApiFetch()
const auth = useAuth()

type Row = {
  id: string
  month: string
  invoiceNumber: string | null
  vendor: string | null
  grossAmount: string
  netAmount: string
  vatAmount: string
  status: string
  dueDate: string | null
}

const filterMonth = ref(fromYm(currentYm()))
const filterStatus = ref('all')
const rows = ref<Row[]>([])
const loading = ref(true)

const addDialogOpen = ref(false)
const showAppleShortcut = ref(true)

const monthYm = computed(() => toYm(filterMonth.value))

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
    const q: Record<string, string> = { month: monthYm.value }
    if (filterStatus.value && filterStatus.value !== 'all')
      q.status = filterStatus.value
    rows.value = await api<Row[]>('/api/invoices', { query: q })
  } finally {
    loading.value = false
  }
}

watch([filterMonth, filterStatus], load)
watch(() => auth.currentVaultId.value, () => {
  void load()
})

onMounted(() => {
  load()
  showAppleShortcut.value = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)
})

async function remove(id: string) {
  if (!confirm('Usunąć?')) return
  await api(`/api/invoices/${id}`, { method: 'DELETE' })
  await load()
}

async function markPaid(id: string) {
  await api(`/api/invoices/${id}`, {
    method: 'PUT',
    body: { status: 'paid', paidDate: new Date().toISOString().slice(0, 10) },
  })
  await load()
}

function statusBadgeVariant(s: string) {
  if (s === 'paid') return 'default' as const
  if (s === 'overdue') return 'destructive' as const
  return 'secondary' as const
}
</script>

<template>
  <div class="space-y-8 max-w-3xl">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Faktury</h1>
        <p class="text-sm text-muted-foreground mt-1">Koszty zakupu</p>
      </div>
      <div
        class="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end"
      >
        <div class="flex flex-wrap gap-4">
          <div class="grid gap-2">
            <Label>Miesiąc</Label>
            <MonthPicker v-model="filterMonth" class="w-44" />
          </div>
          <div class="grid min-w-[140px] gap-2">
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
        <Button
          type="button"
          class="w-full shrink-0 sm:w-auto"
          size="lg"
          aria-keyshortcuts="Meta+N Control+N"
          @click="openAddDialog"
        >
          <span
            class="inline-flex w-full items-center justify-center gap-2 sm:w-auto sm:justify-start"
          >
            Dodaj fakturę
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

    <AddInvoiceDialog
      v-model:open="addDialogOpen"
      :month="monthYm"
      @saved="load"
    />

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
              <TableCell class="font-medium">{{ r.vendor || '—' }}</TableCell>
              <TableCell class="text-sm text-muted-foreground">{{
                r.invoiceNumber || '—'
              }}</TableCell>
              <TableCell>
                <Badge :variant="statusBadgeVariant(r.status)">{{
                  r.status
                }}</Badge>
              </TableCell>
              <TableCell class="text-right tabular-nums">{{
                format(r.grossAmount)
              }}</TableCell>
              <TableCell class="space-x-1 text-right">
                <Button
                  v-if="r.status !== 'paid'"
                  variant="outline"
                  size="sm"
                  @click="markPaid(r.id)"
                >
                  Opłacono
                </Button>
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
        <p v-else class="text-sm text-muted-foreground">Brak faktur.</p>
      </CardContent>
    </Card>
  </div>
</template>
