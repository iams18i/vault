<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { cn } from '~/lib/utils'
import type { ButtonVariants } from './ui/button'

const YEARS_PER_PAGE = 12

type Props = {
  id?: string
  minYear?: number
  maxYear?: number
  placeholder?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
  triggerVariant?: ButtonVariants['variant']
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  minYear: 1900,
  maxYear: 2100,
  placeholder: 'Wybierz rok',
  disabled: false,
  triggerVariant: 'outline',
})

const modelValue = defineModel<number | undefined>()

const open = ref(false)
const currentYear = new Date().getFullYear()

function getStartYear(y: number) {
  return Math.floor(y / YEARS_PER_PAGE) * YEARS_PER_PAGE
}

const pageStartYear = ref(getStartYear(modelValue.value ?? currentYear))

const years = computed(() =>
  Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageStartYear.value + i),
)

watch([open, modelValue], () => {
  if (open.value) {
    pageStartYear.value = getStartYear(modelValue.value ?? currentYear)
  }
})

function handleYearSelect(y: number) {
  modelValue.value = y
  open.value = false
}

function handlePreviousPage() {
  pageStartYear.value -= YEARS_PER_PAGE
}

function handleNextPage() {
  pageStartYear.value += YEARS_PER_PAGE
}

function isYearDisabled(y: number) {
  return y < props.minYear || y > props.maxYear
}

function isYearSelected(y: number) {
  return modelValue.value === y
}

function isCurrentYear(y: number) {
  return y === currentYear
}

const canGoPrevious = computed(() => pageStartYear.value > props.minYear)
const canGoNext = computed(
  () => pageStartYear.value + YEARS_PER_PAGE <= props.maxYear,
)

function selectCurrentYear() {
  pageStartYear.value = getStartYear(currentYear)
  if (currentYear < props.minYear || currentYear > props.maxYear) return
  handleYearSelect(currentYear)
}

const currentYearDisabled = computed(
  () => currentYear < props.minYear || currentYear > props.maxYear,
)
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        :id="id"
        type="button"
        role="combobox"
        :aria-expanded="open"
        aria-label="Wybierz rok"
        :variant="triggerVariant"
        :disabled="disabled"
        :class="
          cn(
            'w-[200px] justify-start text-left font-normal',
            modelValue == null && 'text-muted-foreground',
            props.class,
          )
        "
      >
        <CalendarDays class="mr-2 size-4 shrink-0" />
        <span v-if="modelValue != null">{{ modelValue }}</span>
        <span v-else>{{ placeholder }}</span>
      </Button>
    </PopoverTrigger>

    <PopoverContent class="w-[280px] p-0" align="start">
      <div class="p-3">
        <div class="mb-3 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            :disabled="!canGoPrevious"
            @click="handlePreviousPage"
          >
            <ChevronLeft class="size-4" />
            <span class="sr-only">Poprzednie lata</span>
          </Button>
          <span class="text-sm font-medium">
            {{ pageStartYear }} – {{ pageStartYear + YEARS_PER_PAGE - 1 }}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            :disabled="!canGoNext"
            @click="handleNextPage"
          >
            <ChevronRight class="size-4" />
            <span class="sr-only">Następne lata</span>
          </Button>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <Button
            v-for="y in years"
            :key="y"
            type="button"
            :variant="isYearSelected(y) ? 'default' : 'ghost'"
            size="sm"
            :disabled="isYearDisabled(y)"
            :class="
              cn(
                'h-9',
                isCurrentYear(y) &&
                  !isYearSelected(y) &&
                  'border border-primary text-primary',
              )
            "
            @click="handleYearSelect(y)"
          >
            {{ y }}
          </Button>
        </div>

        <div class="mt-3 border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="w-full"
            :disabled="currentYearDisabled"
            @click="selectCurrentYear"
          >
            Bieżący rok
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
