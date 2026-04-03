<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'

import type { ExpenseCategoryRow } from '~/composables/useCategoryColors'

const rows = ref<ExpenseCategoryRow[]>([])
const loading = ref(true)

const addOpen = ref(false)
const addName = ref('')
const addColorHex = ref('#22c55e')
const addColorCleared = ref(true)

/** Apple-style ⌘N vs Ctrl + N (set on client). */
const showAppleShortcut = ref(true)

function openAdd() {
  addName.value = ''
  addColorHex.value = '#22c55e'
  addColorCleared.value = true
  addOpen.value = true
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
    rows.value = await $fetch<ExpenseCategoryRow[]>('/api/categories')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  showAppleShortcut.value = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)
})

const editOpen = ref(false)
const editing = ref<ExpenseCategoryRow | null>(null)
const editName = ref('')
const editColorHex = ref('#64748b')
const editColorCleared = ref(false)

function openEdit(row: ExpenseCategoryRow) {
  editing.value = row
  editName.value = row.name
  editColorHex.value = row.color ?? '#64748b'
  editColorCleared.value = !row.color
  editOpen.value = true
}

async function saveEdit() {
  if (!editing.value) return
  const name = editName.value.trim()
  if (!name) return
  try {
    await $fetch(`/api/categories/${editing.value.id}`, {
      method: 'PUT',
      body: {
        name,
        color: editColorCleared.value ? null : editColorHex.value,
      },
    })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    alert(err?.data?.message ?? err?.message ?? 'Błąd zapisu')
    return
  }
  editOpen.value = false
  editing.value = null
  await refreshNuxtData('expense-categories')
  await load()
}

async function removeRow(row: ExpenseCategoryRow) {
  if (!confirm(`Usunąć kategorię „${row.name}”?`)) return
  try {
    await $fetch(`/api/categories/${row.id}`, { method: 'DELETE' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    alert(err?.data?.message ?? err?.message ?? 'Błąd usuwania')
    return
  }
  await refreshNuxtData('expense-categories')
  await load()
}

async function saveAdd() {
  const name = addName.value.trim()
  if (!name) return
  try {
    await $fetch('/api/categories', {
      method: 'POST',
      body: {
        name,
        ...(!addColorCleared ? { color: addColorHex } : {}),
      },
    })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    alert(err?.data?.message ?? err?.message ?? 'Błąd')
    return
  }
  addOpen.value = false
  await refreshNuxtData('expense-categories')
  await load()
}

function onColorPickerInput() {
  editColorCleared.value = false
}

function onAddColorPickerInput() {
  addColorCleared.value = false
}
</script>

<template>
  <div class="space-y-8 max-w-4xl">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Kategorie</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Kolory i nazwy używane przy wydatkach i kosztach stałych
        </p>
      </div>
      <Button
        type="button"
        class="w-full sm:w-auto shrink-0"
        size="lg"
        aria-keyshortcuts="Meta+N Control+N"
        @click="openAdd"
      >
        <span
          class="inline-flex w-full items-center justify-center gap-2 sm:w-auto sm:justify-start"
        >
          Nowa kategoria
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
          Brak kategorii — dodaj pierwszą lub utwórz ją przy wpisie wydatku.
        </p>
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead class="w-14" />
              <TableHead>Nazwa</TableHead>
              <TableHead class="text-right w-40">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in rows" :key="r.id">
              <TableCell>
                <span
                  v-if="r.color"
                  class="inline-block size-6 rounded-md border border-border shadow-xs"
                  :style="{ backgroundColor: r.color }"
                  :title="r.color"
                />
                <span
                  v-else
                  class="inline-flex size-6 items-center justify-center rounded-md border border-dashed border-muted-foreground/40 text-[10px] text-muted-foreground"
                  title="Brak koloru"
                >
                  —
                </span>
              </TableCell>
              <TableCell class="font-medium">{{ r.name }}</TableCell>
              <TableCell class="text-right space-x-2">
                <Button type="button" variant="outline" size="sm" @click="openEdit(r)">
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
          <DialogTitle>Edytuj kategorię</DialogTitle>
          <DialogDescription>Zmiana nazwy zaktualizuje przypisania w wydatkach i kosztach stałych.</DialogDescription>
        </DialogHeader>
        <div v-if="editing" class="grid gap-4 py-2">
          <div class="grid gap-2">
            <Label for="cat-edit-name">Nazwa</Label>
            <Input id="cat-edit-name" v-model="editName" />
          </div>
          <div class="grid gap-2">
            <Label>Kolor</Label>
            <div class="flex flex-wrap items-center gap-3">
              <input
                type="color"
                class="border-input size-10 cursor-pointer rounded-md border bg-transparent p-0.5 shadow-xs"
                :value="editColorHex"
                @input="
                  editColorHex = ($event.target as HTMLInputElement).value;
                  onColorPickerInput();
                "
              >
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="editColorCleared = true"
              >
                Usuń kolor
              </Button>
            </div>
            <p v-if="editColorCleared" class="text-xs text-muted-foreground">
              Zapis bez koloru (domyślny wygląd w aplikacji).
            </p>
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
            <DialogTitle>Nowa kategoria</DialogTitle>
            <DialogDescription>Nazwa musi być unikalna.</DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-2">
            <div class="grid gap-2">
              <Label for="cat-add-name">Nazwa</Label>
              <Input id="cat-add-name" v-model="addName" />
            </div>
            <div class="grid gap-2">
              <Label>Kolor (opcjonalnie)</Label>
              <div class="flex flex-wrap items-center gap-3">
                <input
                  type="color"
                  class="border-input size-10 cursor-pointer rounded-md border bg-transparent p-0.5 shadow-xs"
                  :value="addColorHex"
                  @input="
                    addColorHex = ($event.target as HTMLInputElement).value;
                    onAddColorPickerInput();
                  "
                >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="addColorCleared = true"
                >
                  Bez koloru
                </Button>
              </div>
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
