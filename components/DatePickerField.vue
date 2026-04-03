<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { DatePickerPreset } from '~/types/date-picker-preset'
import {
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  today,
  type DateValue,
} from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    modelValue: string
    id?: string
    disabled?: boolean
    placeholder?: string
    presets?: DatePickerPreset[]
    presetsTitle?: string
    triggerClass?: HTMLAttributes['class']
  }>(),
  {
    id: undefined,
    disabled: false,
    placeholder: 'Wybierz datę',
    presets: undefined,
    presetsTitle: 'Szybki wybór',
    triggerClass: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const df = new DateFormatter('pl-PL', {
  dateStyle: 'medium',
})

const defaultPlaceholder = today(getLocalTimeZone())

const calendarValue = ref<DateValue | undefined>()

watch(
  () => props.modelValue,
  (s) => {
    if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
      try {
        calendarValue.value = parseDate(s)
        return
      } catch {
        /* fall through */
      }
    }
    calendarValue.value = undefined
  },
  { immediate: true },
)

const labelText = computed(() => {
  if (!props.modelValue || !/^\d{4}-\d{2}-\d{2}$/.test(props.modelValue))
    return props.placeholder
  try {
    const d = parseDate(props.modelValue)
    return df.format(d.toDate(getLocalTimeZone()))
  } catch {
    return props.placeholder
  }
})

function toIso(v: DateValue): string {
  return `${v.year}-${String(v.month).padStart(2, '0')}-${String(v.day).padStart(2, '0')}`
}

function onCalendarUpdate(v: DateValue | undefined, close: () => void) {
  calendarValue.value = v
  if (v) {
    emit('update:modelValue', toIso(v))
    close()
  }
}

function applyPreset(value: string, close: () => void) {
  emit('update:modelValue', value)
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    try {
      calendarValue.value = parseDate(value)
    } catch {
      calendarValue.value = undefined
    }
  } else {
    calendarValue.value = undefined
  }
  close()
}

const showPresets = computed(() => (props.presets?.length ?? 0) > 0)
</script>

<template>
  <Popover v-slot="{ close }">
    <PopoverTrigger as-child>
      <Button
        :id="id"
        type="button"
        variant="outline"
        :disabled="disabled"
        :class="
          cn(
            'w-full justify-start text-left font-normal',
            !modelValue && 'text-muted-foreground',
            triggerClass,
          )
        "
      >
        <CalendarIcon class="size-4 shrink-0" />
        <span class="truncate">{{ labelText }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent
      class="z-[100] w-max max-w-[min(100vw-1.5rem,44rem)] min-w-0 border p-0 shadow-lg"
      align="start"
    >
      <div v-if="showPresets" class="flex divide-x divide-border">
        <Calendar
          :model-value="calendarValue"
          :default-placeholder="defaultPlaceholder"
          class="shrink-0 rounded-none border-0 shadow-none"
          layout="month-and-year"
          locale="pl-PL"
          :initial-focus="true"
          @update:model-value="
            (v: DateValue | undefined) => onCalendarUpdate(v, close)
          "
        />
        <div
          class="flex w-[min(17.5rem,calc(100vw-20rem))] min-w-[13rem] shrink-0 flex-col"
        >
          <p class="px-3 pt-3 text-center text-sm font-medium text-foreground">
            {{ presetsTitle }}
          </p>
          <ScrollArea class="h-[min(280px,50vh)]">
            <div class="grid gap-2 p-3 pt-2">
              <Button
                v-for="(p, i) in presets"
                :key="`${p.label}-${i}`"
                type="button"
                variant="outline"
                size="sm"
                class="h-auto w-full whitespace-normal py-2 text-center text-xs font-normal leading-snug"
                @click="applyPreset(p.value, close)"
              >
                {{ p.label }}
              </Button>
            </div>
          </ScrollArea>
        </div>
      </div>
      <Calendar
        v-else
        :model-value="calendarValue"
        :default-placeholder="defaultPlaceholder"
        layout="month-and-year"
        locale="pl-PL"
        :initial-focus="true"
        @update:model-value="
          (v: DateValue | undefined) => onCalendarUpdate(v, close)
        "
      />
    </PopoverContent>
  </Popover>
</template>
