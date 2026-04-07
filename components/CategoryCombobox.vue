<script setup lang="ts">
import { Check, ChevronsUpDown } from 'lucide-vue-next'

import { cn } from '@/lib/utils'

import {
  categoryColorForName,
  useExpenseCategories,
  type CategoryListItem,
  type ExpenseCategoryRow,
} from '~/composables/useCategoryColors'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    allowEmpty?: boolean
    emptyLabel?: string
    triggerClass?: string
  }>(),
  {
    placeholder: 'Wybierz lub utwórz kategorię…',
    allowEmpty: false,
    emptyLabel: 'Wszystkie kategorie',
    triggerClass: 'w-full min-w-0 justify-between',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const popoverKey = ref(0)

const { data: serverItems, refresh } = await useExpenseCategories()

const pendingNames = ref<string[]>([])

const items = computed((): CategoryListItem[] => {
  const map = new Map<string, CategoryListItem>()
  for (const c of serverItems.value ?? []) {
    map.set(c.name.toLowerCase(), {
      name: c.name,
      color: c.color ?? null,
    })
  }
  for (const name of pendingNames.value) {
    const key = name.toLowerCase()
    if (!map.has(key)) map.set(key, { name, color: null })
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'pl'))
})

function matchesExisting(raw: string) {
  const t = raw.trim()
  if (!t) return false
  return items.value.some((i) => i.name.toLowerCase() === t.toLowerCase())
}

const selectedLabel = computed(() => {
  if (props.allowEmpty && props.modelValue === '') return props.emptyLabel
  if (props.modelValue) return props.modelValue
  return props.placeholder
})

const selectedColor = computed(() =>
  categoryColorForName(serverItems.value ?? [], props.modelValue),
)

watch(open, (isOpen) => {
  if (isOpen) popoverKey.value++
})

async function handleCreate(name: string) {
  const trimmed = name.trim()
  if (!trimmed || matchesExisting(trimmed)) return
  const api = useApiFetch()
  const row = await api<ExpenseCategoryRow>('/api/categories', {
    method: 'POST',
    body: { name: trimmed },
  })
  pendingNames.value = [...new Set([...pendingNames.value, row.name])]
  emit('update:modelValue', row.name)
  open.value = false
  await refresh()
}

function handlePick(value: string) {
  emit('update:modelValue', value)
  open.value = false
}

function handleClear() {
  if (!props.allowEmpty) return
  emit('update:modelValue', '')
  open.value = false
}
</script>

<template>
  <div class="w-full min-w-0">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          :class="cn(triggerClass)"
        >
          <span
            class="flex min-w-0 flex-1 items-center gap-2 truncate text-left"
          >
            <span
              v-if="selectedColor"
              class="size-2.5 shrink-0 rounded-sm border border-border"
              :style="{ backgroundColor: selectedColor }"
            />
            <span class="min-w-0 truncate">{{ selectedLabel }}</span>
          </span>
          <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        class="min-w-[var(--reka-popper-anchor-width)] w-[var(--reka-popper-anchor-width)] p-0"
        align="start"
      >
        <div v-if="allowEmpty" class="border-b border-border p-1">
          <button
            type="button"
            class="hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-left text-sm"
            @click="handleClear"
          >
            <Check
              :class="
                cn(
                  'mr-2 size-4 shrink-0',
                  modelValue === '' ? 'opacity-100' : 'opacity-0',
                )
              "
            />
            {{ emptyLabel }}
          </button>
        </div>
        <Command :key="popoverKey" class="rounded-md border-0 shadow-none">
          <CategoryComboboxInner
            :items="items"
            :model-value="modelValue"
            :open="open"
            :search-on-open="allowEmpty ? 'empty' : 'model'"
            @pick="handlePick"
            @create="handleCreate"
          />
        </Command>
      </PopoverContent>
    </Popover>
  </div>
</template>
