<script setup lang="ts">
import { Check, ChevronsUpDown } from 'lucide-vue-next'

import { cn } from '@/lib/utils'

import {
  useIncomeCompanies,
  type IncomeCompanyRow,
} from '~/composables/useIncomeCompanies'

const props = withDefaults(
  defineProps<{
    modelValue: number | null
    placeholder?: string
    allowEmpty?: boolean
    emptyLabel?: string
    triggerClass?: string
  }>(),
  {
    placeholder: 'Wybierz lub utwórz kontrahenta…',
    allowEmpty: false,
    emptyLabel: 'Wszyscy kontrahenci',
    triggerClass: 'w-full min-w-0 justify-between',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const open = ref(false)
const popoverKey = ref(0)

const { data: serverItems, refresh } = await useIncomeCompanies()

const pending = ref<IncomeCompanyRow[]>([])

const items = computed((): IncomeCompanyRow[] => {
  const map = new Map<number, IncomeCompanyRow>()
  for (const c of serverItems.value ?? []) {
    map.set(c.id, c)
  }
  for (const c of pending.value) {
    if (!map.has(c.id)) map.set(c.id, c)
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'pl'))
})

function matchesExisting(raw: string) {
  const t = raw.trim()
  if (!t) return false
  return items.value.some((i) => i.name.toLowerCase() === t.toLowerCase())
}

const selectedName = computed(() => {
  if (props.modelValue == null) return ''
  return items.value.find((i) => i.id === props.modelValue)?.name ?? ''
})

const selectedLabel = computed(() => {
  if (props.allowEmpty && props.modelValue === null) return props.emptyLabel
  if (props.modelValue != null) {
    const n = selectedName.value
    return n || props.placeholder
  }
  return props.placeholder
})

watch(open, (isOpen) => {
  if (isOpen) popoverKey.value++
})

async function handleCreate(name: string) {
  const trimmed = name.trim()
  if (!trimmed || matchesExisting(trimmed)) return
  const row = await $fetch<IncomeCompanyRow>('/api/companies', {
    method: 'POST',
    body: { name: trimmed },
  })
  pending.value = [...pending.value.filter((p) => p.id !== row.id), row]
  emit('update:modelValue', row.id)
  open.value = false
  await refresh()
}

function handlePick(id: number) {
  emit('update:modelValue', id)
  open.value = false
}

function handleClear() {
  if (!props.allowEmpty) return
  emit('update:modelValue', null)
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
          <span class="min-w-0 flex-1 truncate text-left">
            {{ selectedLabel }}
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
                  modelValue === null ? 'opacity-100' : 'opacity-0',
                )
              "
            />
            {{ emptyLabel }}
          </button>
        </div>
        <Command :key="popoverKey" class="rounded-md border-0 shadow-none">
          <CompanyComboboxInner
            :items="items"
            :model-value="modelValue"
            :open="open"
            :search-on-open="allowEmpty ? 'empty' : 'model'"
            :selected-name="selectedName"
            @pick="handlePick"
            @create="handleCreate"
          />
        </Command>
      </PopoverContent>
    </Popover>
  </div>
</template>
