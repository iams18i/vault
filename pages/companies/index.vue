<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'

import type { IncomeCompanyRow } from '~/composables/useIncomeCompanies'

const rows = ref<IncomeCompanyRow[]>([])
const loading = ref(true)

const addOpen = ref(false)
const addName = ref('')

const showAppleShortcut = ref(true)

const route = useRoute()
const router = useRouter()

function openAdd() {
  addName.value = ''
  addOpen.value = true
}

function consumeAddQuery() {
  if (route.query.add === '1') {
    openAdd()
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
    openAdd()
  },
)

async function load() {
  loading.value = true
  try {
    rows.value = await $fetch<IncomeCompanyRow[]>('/api/companies')
  } finally {
    loading.value = false
  }
}

watch(() => route.query.add, consumeAddQuery)

onMounted(() => {
  load()
  showAppleShortcut.value = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)
  consumeAddQuery()
})

const editOpen = ref(false)
const editing = ref<IncomeCompanyRow | null>(null)
const editName = ref('')

function openEdit(row: IncomeCompanyRow) {
  editing.value = row
  editName.value = row.name
  editOpen.value = true
}

async function saveEdit() {
  if (!editing.value) return
  const name = editName.value.trim()
  if (!name) return
  try {
    await $fetch(`/api/companies/${editing.value.id}`, {
      method: 'PUT',
      body: { name },
    })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    alert(err?.data?.message ?? err?.message ?? 'Błąd zapisu')
    return
  }
  editOpen.value = false
  editing.value = null
  await refreshNuxtData('income-companies')
  await load()
}

async function removeRow(row: IncomeCompanyRow) {
  if (!confirm(`Usunąć kontrahenta „${row.name}”?`)) return
  try {
    await $fetch(`/api/companies/${row.id}`, { method: 'DELETE' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    alert(err?.data?.message ?? err?.message ?? 'Błąd usuwania')
    return
  }
  await refreshNuxtData('income-companies')
  await load()
}

async function saveAdd() {
  const name = addName.value.trim()
  if (!name) return
  try {
    await $fetch('/api/companies', {
      method: 'POST',
      body: { name },
    })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    alert(err?.data?.message ?? err?.message ?? 'Błąd')
    return
  }
  addOpen.value = false
  await refreshNuxtData('income-companies')
  await load()
}
</script>

<template>
  <div class="space-y-8 max-w-4xl">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Kontrahenci</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Firmy przypisane do wpisów dochodu — wybór z listy przy dodawaniu
          dochodu
        </p>
      </div>
      <Button
        type="button"
        class="w-full shrink-0 sm:w-auto"
        size="lg"
        aria-keyshortcuts="Meta+N Control+N"
        @click="openAdd"
      >
        <span
          class="inline-flex w-full items-center justify-center gap-2 sm:w-auto sm:justify-start"
        >
          Nowy kontrahent
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

    <Card>
      <CardContent class="pt-6">
        <p v-if="loading" class="text-sm text-muted-foreground">Ładowanie…</p>
        <p
          v-else-if="!rows.length"
          class="text-sm text-muted-foreground"
        >
          Brak kontrahentów — dodaj pierwszego lub utwórz przy wpisie dochodu.
        </p>
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead class="w-40 text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in rows" :key="r.id">
              <TableCell class="font-medium">{{ r.name }}</TableCell>
              <TableCell class="space-x-2 text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="openEdit(r)"
                >
                  Edytuj
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="removeRow(r)"
                >
                  Usuń
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog v-model:open="editOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edytuj kontrahenta</DialogTitle>
          <DialogDescription>Zmiana nazwy jest widoczna we wszystkich wpisach.</DialogDescription>
        </DialogHeader>
        <div v-if="editing" class="grid gap-4 py-2">
          <div class="grid gap-2">
            <Label for="co-edit-name">Nazwa</Label>
            <Input id="co-edit-name" v-model="editName" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="editOpen = false">
            Anuluj
          </Button>
          <Button type="button" @click="saveEdit">Zapisz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="addOpen">
      <DialogContent class="sm:max-w-md">
        <form @submit.prevent="saveAdd">
          <DialogHeader>
            <DialogTitle>Nowy kontrahent</DialogTitle>
            <DialogDescription>Nazwa musi być unikalna.</DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-2">
            <div class="grid gap-2">
              <Label for="co-add-name">Nazwa</Label>
              <Input id="co-add-name" v-model="addName" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="addOpen = false">
              Anuluj
            </Button>
            <Button type="submit">Dodaj</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
