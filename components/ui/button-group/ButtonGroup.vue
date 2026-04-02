<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

defineProps<{
  class?: HTMLAttributes['class']
  orientation?: 'horizontal' | 'vertical'
}>()
</script>

<template>
  <div
    data-slot="button-group"
    role="group"
    :data-orientation="orientation ?? 'horizontal'"
    :class="
      cn(
        'isolate inline-flex items-center',
        'data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
        '[&>*:not(:first-child)]:-ml-px data-[orientation=vertical]:[&>*:not(:first-child)]:ml-0 data-[orientation=vertical]:[&>*:not(:first-child)]:-mt-px',
        '[&>*:first-child]:rounded-r-none data-[orientation=vertical]:[&>*:first-child]:rounded-r-md data-[orientation=vertical]:[&>*:first-child]:rounded-b-none',
        '[&>*:last-child]:rounded-l-none data-[orientation=vertical]:[&>*:last-child]:rounded-l-md data-[orientation=vertical]:[&>*:last-child]:rounded-t-none',
        '[&>*:not(:first-child):not(:last-child)]:rounded-none',
        $props.class,
      )
    "
  >
    <slot />
  </div>
</template>

