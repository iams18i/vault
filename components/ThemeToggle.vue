<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const colorMode = useColorMode()

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    class="relative h-9 w-9"
    :aria-label="
      colorMode.value === 'dark' ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'
    "
    @click="toggleTheme"
  >
    <Sun class="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
    <Moon
      class="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
    />
    <span class="sr-only">Motyw</span>
  </Button>
</template>
