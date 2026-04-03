<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="sidebar-header"
    data-sidebar="header"
    :class="cn(
      'flex flex-col gap-2 p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2',
      props.class,
    )"
  >
    <slot />
  </div>
</template>
