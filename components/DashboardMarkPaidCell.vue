<script setup lang="ts">
import { Check, Undo2 } from 'lucide-vue-next'

import { formatPaidMarkedAt } from '~/lib/formatPaidMarkedAt'

const props = withDefaults(
  defineProps<{
    paid: boolean
    paidAt?: string | null
    /** When false, paid state is shown but undo is hidden (e.g. VAT covered by other entries). */
    reversible?: boolean
  }>(),
  { reversible: true },
)

const emit = defineEmits<{
  markPaid: []
  unmarkPaid: []
}>()
</script>

<template>
  <div class="text-right">
    <Button
      v-if="!paid"
      type="button"
      variant="ghost"
      size="sm"
      class="text-muted-foreground"
      @click.prevent="emit('markPaid')"
    >
      Zapłać
    </Button>
    <div
      v-else
      class="flex items-center text-xs font-medium text-green-500 no-underline flex-nowrap whitespace-nowrap gap-1"
    >
      <div class="flex flex-col items-center justify-end">
        <span class="inline-flex items-center gap-1">
          <Check class="size-4 shrink-0" aria-hidden="true" />
          Zapłacono
        </span>
        <span
          v-if="formatPaidMarkedAt(paidAt)"
          class="text-[10px] font-normal leading-tight text-muted-foreground"
          title="Data oznaczenia jako zapłacone"
        >
          {{ formatPaidMarkedAt(paidAt) }}
        </span>
      </div>
      <Button
        v-if="props.reversible"
        type="button"
        variant="ghost"
        size="icon"
        class="size-8 shrink-0 text-muted-foreground hover:text-foreground"
        aria-label="Cofnij płatność"
        @click.prevent="emit('unmarkPaid')"
      >
        <Undo2 class="size-4" />
      </Button>
    </div>
  </div>
</template>
