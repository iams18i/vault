<script setup lang="ts">
import { Check, Plus } from 'lucide-vue-next'
import { computed, watch } from 'vue'

import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  useCommand,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

import type { CategoryListItem } from '~/composables/useCategoryColors'

const props = defineProps<{
  items: CategoryListItem[]
  modelValue: string
  open: boolean
  /** `empty`: open with blank search (category filter). `model`: prefill with current value (form). */
  searchOnOpen: 'empty' | 'model'
}>()

const emit = defineEmits<{
  pick: [value: string]
  create: [name: string]
}>()

const { filterState } = useCommand()

watch(
  () => props.open,
  (v) => {
    if (v) {
      filterState.search =
        props.searchOnOpen === 'empty' ? '' : props.modelValue || ''
    }
  },
  { immediate: true },
)

const trimmedSearch = computed(() => filterState.search.trim())

const exactMatch = computed(() =>
  props.items.some(
    (i) => i.name.toLowerCase() === trimmedSearch.value.toLowerCase(),
  ),
)

const showCreate = computed(() => Boolean(trimmedSearch.value && !exactMatch.value))

const showCreateAfterList = computed(
  () => showCreate.value && Boolean(filterState.search) && filterState.filtered.count > 0,
)

function onCreate() {
  const name = trimmedSearch.value
  if (name) emit('create', name)
}

/** Enter in search: create when no list matches (capture so Listbox does not eat Enter). */
function onEnterCapture(e: KeyboardEvent) {
  if (e.key !== 'Enter') return
  if (!showCreate.value) return
  if (filterState.filtered.count > 0) return
  e.preventDefault()
  e.stopPropagation()
  onCreate()
}
</script>

<template>
  <div @keydown.capture="onEnterCapture">
    <CommandInput placeholder="Szukaj lub utwórz…" class="h-8 py-1" />
  </div>
  <CommandList class="max-h-[280px] p-0">
    <div
      v-if="items.length === 0 && !filterState.search"
      class="text-muted-foreground px-2 py-2 text-center text-sm"
    >
      Brak kategorii — wpisz nazwę i utwórz.
    </div>

    <CommandEmpty class="p-0 py-0">
      <Button
        variant="ghost"
        type="button"
        class="h-8 w-full justify-start rounded-none px-2 py-1 font-normal"
        @click="onCreate"
      >
        <Plus class="mr-2 size-4 shrink-0" />
        Utwórz „{{ trimmedSearch }}”
      </Button>
    </CommandEmpty>

    <CommandGroup v-if="items.length" class="p-0">
      <CommandItem
        v-for="item in items"
        :key="item.name"
        :value="item.name"
        class="px-2 py-1.5"
        @select="emit('pick', item.name)"
      >
        <Check
          :class="
            cn(
              'mr-2 size-4 shrink-0',
              modelValue === item.name ? 'opacity-100' : 'opacity-0',
            )
          "
        />
        <span
          v-if="item.color"
          class="mr-2 size-2.5 shrink-0 rounded-sm border border-border"
          :style="{ backgroundColor: item.color }"
        />
        <span
          v-else
          class="border-muted-foreground/40 mr-2 inline-flex size-2.5 shrink-0 items-center justify-center rounded-sm border border-dashed"
        />
        {{ item.name }}
      </CommandItem>
    </CommandGroup>

    <template v-if="showCreateAfterList">
      <CommandSeparator class="my-0" />
      <CommandGroup class="p-0">
        <CommandItem value="__create__" class="px-2 py-1.5" @select="onCreate">
          <Plus class="mr-2 size-4 shrink-0" />
          Utwórz „{{ trimmedSearch }}”
        </CommandItem>
      </CommandGroup>
    </template>
  </CommandList>
</template>
