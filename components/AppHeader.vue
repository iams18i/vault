<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import Kbd from '@/components/ui/kbd/Kbd.vue'
import { SidebarTrigger } from '@/components/ui/sidebar'
import CommandMenu from '~/components/CommandMenu.vue'
import ThemeToggle from '~/components/ThemeToggle.vue'

const { openPalette } = useCommandPalette()

const shortcutLabel = ref('Ctrl+K')

onMounted(() => {
  shortcutLabel.value = /Mac|iPhone|iPod|iPad/i.test(navigator.platform) ? '⌘K' : 'Ctrl+K'
})
</script>

<template>
  <header class="flex h-14 shrink-0 items-stretch bg-background px-4">
    <div class="flex min-w-0 flex-1 items-center">
      <SidebarTrigger sr-label="Przełącz panel boczny" />
    </div>
    <div class="flex min-w-0 shrink-0 items-center justify-end gap-2">
      <Button
        variant="outline"
        class="relative mr-6 h-9 w-[min(100vw-10rem,18rem)] justify-start text-sm text-muted-foreground sm:w-64 sm:pr-12 lg:w-72"
        @click="openPalette()"
      >
        <Search class="mr-2 size-4 shrink-0" />
        <span class="inline-flex truncate">Szukaj…</span>
        <span class="pointer-events-none absolute right-1.5 top-1.5 hidden sm:inline-flex">
          <Kbd>{{ shortcutLabel }}</Kbd>
        </span>
      </Button>
      <ThemeToggle />
      <CommandMenu />
    </div>
  </header>
</template>
