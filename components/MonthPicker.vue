<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { cn } from '~/lib/utils'
import type { ButtonVariants } from './ui/button'

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const
const MONTHS_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

type Props = {
  modelValue?: Date | null
  minDate?: Date
  maxDate?: Date
  placeholder?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
  triggerVariant?: ButtonVariants['variant']
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pick a month',
  disabled: false,
  triggerVariant: 'ghost',
})

const emit = defineEmits<{
  'update:modelValue': [value: Date | null]
}>()

const open = ref(false)
const viewYear = ref(
  props.modelValue?.getFullYear() ?? new Date().getFullYear(),
)

watch(
  () => props.modelValue,
  (v) => {
    if (v) viewYear.value = v.getFullYear()
  },
)

function firstOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function isMonthDisabled(monthIndex: number) {
  const date = new Date(viewYear.value, monthIndex, 1)
  if (props.minDate && date < firstOfMonth(props.minDate)) return true
  if (props.maxDate && date > firstOfMonth(props.maxDate)) return true
  return false
}

function isMonthSelected(monthIndex: number) {
  const v = props.modelValue
  if (!v) return false
  return v.getFullYear() === viewYear.value && v.getMonth() === monthIndex
}

function isCurrentMonth(monthIndex: number) {
  const now = new Date()
  return now.getFullYear() === viewYear.value && now.getMonth() === monthIndex
}

function handleMonthSelect(monthIndex: number) {
  const next = new Date(viewYear.value, monthIndex, 1)
  emit('update:modelValue', next)
  open.value = false
}

function handlePrevYear() {
  viewYear.value -= 1
}
function handleNextYear() {
  viewYear.value += 1
}

function isCurrentMonthDisabled() {
  const now = new Date()
  const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1)
  if (props.minDate && currentMonthDate < firstOfMonth(props.minDate))
    return true
  if (props.maxDate && currentMonthDate > firstOfMonth(props.maxDate))
    return true
  return false
}

function selectCurrentMonth() {
  const now = new Date()
  viewYear.value = now.getFullYear()
  handleMonthSelect(now.getMonth())
}

const label = computed(() => {
  const v = props.modelValue
  if (!v) return null
  return `${MONTHS_FULL[v.getMonth()]} ${v.getFullYear()}`
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        type="button"
        :variant="triggerVariant"
        :disabled="disabled"
        :class="
          cn(
            'w-60 justify-start text-left font-normal',
            !modelValue && 'text-muted-foreground',
            props.class,
          )
        "
      >
        <CalendarIcon class="mr-2 size-4" />
        <span v-if="label">{{ label }}</span>
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
            :disabled="minDate && viewYear <= minDate.getFullYear()"
            @click="handlePrevYear"
          >
            <ChevronLeft class="size-4" />
            <span class="sr-only">Previous year</span>
          </Button>
          <div class="text-sm font-semibold">{{ viewYear }}</div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            :disabled="maxDate && viewYear >= maxDate.getFullYear()"
            @click="handleNextYear"
          >
            <ChevronRight class="size-4" />
            <span class="sr-only">Next year</span>
          </Button>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <Button
            v-for="(m, index) in MONTHS_SHORT"
            :key="m"
            type="button"
            :variant="isMonthSelected(index) ? 'default' : 'ghost'"
            size="sm"
            :disabled="isMonthDisabled(index)"
            :class="
              cn(
                'h-9',
                isCurrentMonth(index) &&
                  !isMonthSelected(index) &&
                  'border border-primary text-primary',
              )
            "
            @click="handleMonthSelect(index)"
          >
            {{ m }}
          </Button>
        </div>

        <div class="mt-3 border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="w-full"
            :disabled="isCurrentMonthDisabled()"
            @click="selectCurrentMonth"
          >
            Current Month
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
