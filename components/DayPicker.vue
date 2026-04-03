<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const DAYS_PER_PAGE = 16
const TOTAL_DAYS = 31
const TOTAL_PAGES = Math.ceil(TOTAL_DAYS / DAYS_PER_PAGE)

const props = withDefaults(
  defineProps<{
    modelValue?: number | null
    id?: string
    placeholder?: string
    disabled?: boolean
    minDay?: number
    maxDay?: number
    triggerClass?: HTMLAttributes['class']
  }>(),
  {
    modelValue: null,
    id: undefined,
    placeholder: 'Wybierz dzień',
    disabled: false,
    minDay: 1,
    maxDay: 31,
    triggerClass: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const open = ref(false)
const page = ref(0)

function getDaysForPage(pageIndex: number): number[] {
  const start = pageIndex * DAYS_PER_PAGE + 1
  const end = Math.min(start + DAYS_PER_PAGE - 1, TOTAL_DAYS)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function isDayDisabled(day: number): boolean {
  return day < props.minDay || day > props.maxDay
}

function isDaySelected(day: number): boolean {
  return props.modelValue === day
}

function handleDaySelect(day: number) {
  emit('update:modelValue', day)
  open.value = false
}

const pageLabel = computed(() =>
  page.value === 0 ? 'Dni 1–16' : 'Dni 17–31',
)

const todayDay = computed(() => new Date().getDate())

const todayDisabled = computed(() => {
  const t = todayDay.value
  return t < props.minDay || t > props.maxDay
})

function selectToday() {
  const t = todayDay.value
  if (t < props.minDay || t > props.maxDay) return
  page.value = t <= 16 ? 0 : 1
  handleDaySelect(t)
}

const hasValue = computed(() => {
  const v = props.modelValue
  return (
    v != null &&
    Number.isFinite(v) &&
    v >= props.minDay &&
    v <= props.maxDay
  )
})

watch(open, (isOpen) => {
  if (!isOpen) return
  const v = props.modelValue
  if (
    v != null &&
    Number.isFinite(v) &&
    v >= 1 &&
    v <= TOTAL_DAYS
  ) {
    page.value = v <= 16 ? 0 : 1
  }
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        :id="id"
        type="button"
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        :disabled="disabled"
        :class="
          cn(
            'w-full min-w-0 justify-start text-left font-normal',
            !hasValue && 'text-muted-foreground',
            triggerClass,
          )
        "
      >
        <CalendarDays class="mr-2 size-4 shrink-0" />
        <span class="min-w-0 truncate">{{
          hasValue ? String(modelValue) : placeholder
        }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-60 p-0" align="start">
      <div class="p-3">
        <div class="mb-3 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="size-7"
            :disabled="page === 0"
            aria-label="Poprzednia strona"
            @click="page = Math.max(0, page - 1)"
          >
            <ChevronLeft class="size-4" />
          </Button>
          <span class="text-sm font-medium">{{ pageLabel }}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="size-7"
            :disabled="page === TOTAL_PAGES - 1"
            aria-label="Następna strona"
            @click="page = Math.min(TOTAL_PAGES - 1, page + 1)"
          >
            <ChevronRight class="size-4" />
          </Button>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <Button
            v-for="day in getDaysForPage(page)"
            :key="day"
            type="button"
            :variant="isDaySelected(day) ? 'default' : 'ghost'"
            size="sm"
            class="h-9 w-full"
            :disabled="isDayDisabled(day)"
            @click="handleDaySelect(day)"
          >
            {{ day }}
          </Button>
        </div>
        <div class="mt-3 border-t border-border pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="w-full"
            :disabled="todayDisabled"
            @click="selectToday"
          >
            Dzisiejszy dzień
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
