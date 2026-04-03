<script setup lang="ts">
import {
  categoryColorForName,
  useExpenseCategories,
} from '~/composables/useCategoryColors'

const props = withDefaults(
  defineProps<{
    name: string | null
    /** `true`: dashboard-style `Badge`; `false`: plain table cell */
    asBadge?: boolean
  }>(),
  { asBadge: false },
)

const { data: categoryRows } = useExpenseCategories()

const hex = computed(() =>
  categoryColorForName(categoryRows.value ?? [], props.name),
)
</script>

<template>
  <template v-if="name">
    <Badge v-if="asBadge" variant="tag">
      <span
        v-if="hex"
        class="size-2 shrink-0 rounded-full"
        :style="{ backgroundColor: hex }"
      />
      {{ name }}
    </Badge>
    <span
      v-else
      class="inline-flex items-center gap-2 text-sm"
      :class="hex ? 'text-foreground' : 'text-muted-foreground'"
    >
      <span
        v-if="hex"
        class="size-2 shrink-0 rounded-full"
        :style="{ backgroundColor: hex }"
      />
      {{ name }}
    </span>
  </template>
  <span v-else class="text-sm text-muted-foreground">—</span>
</template>
