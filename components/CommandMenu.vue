<script setup lang="ts">
import {
  Building2,
  FileText,
  Landmark,
  Laptop,
  LayoutDashboard,
  Moon,
  Receipt,
  Repeat,
  Sun,
  Tags,
  TrendingUp,
} from 'lucide-vue-next'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'

const router = useRouter()
const colorMode = useColorMode()
const { open, closePalette } = useCommandPalette()

const navLinks = [
  { to: '/', label: 'Pulpit', icon: LayoutDashboard },
  { to: '/income', label: 'Dochód', icon: TrendingUp },
  { to: '/recurring-costs', label: 'Koszty stałe', icon: Repeat },
  { to: '/expenses', label: 'Wydatki', icon: Receipt },
  { to: '/categories', label: 'Kategorie', icon: Tags },
  { to: '/companies', label: 'Kontrahenci', icon: Building2 },
  { to: '/invoices', label: 'Faktury', icon: FileText },
  { to: '/taxes', label: 'Podatki', icon: Landmark },
] as const

const quickActions = [
  { to: '/expenses', label: 'Nowy wydatek', icon: Receipt },
  {
    to: '/income',
    label: 'Nowy dochód',
    icon: TrendingUp,
    query: { add: '1' } as Record<string, string>,
  },
  { to: '/categories', label: 'Nowa kategoria', icon: Tags },
  {
    to: '/companies',
    label: 'Nowy kontrahent',
    icon: Building2,
    query: { add: '1' } as Record<string, string>,
  },
  { to: '/invoices', label: 'Nowa faktura', icon: FileText },
  { to: '/taxes', label: 'Nowe podatki', icon: Landmark },
] as const

function run(fn: () => void) {
  closePalette()
  fn()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    open.value = !open.value
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <CommandDialog
    v-model:open="open"
    title="Paleta poleceń"
    description="Szukaj lub wybierz polecenie"
  >
    <CommandInput placeholder="Szukaj…" />
    <CommandList>
      <CommandEmpty>Brak wyników.</CommandEmpty>

      <CommandGroup heading="Nawigacja">
        <CommandItem
          v-for="l in navLinks"
          :key="l.to"
          :value="`nav-${l.label}`"
          @select="run(() => router.push(l.to))"
        >
          <component :is="l.icon" class="size-4" />
          {{ l.label }}
        </CommandItem>
      </CommandGroup>

      <CommandSeparator />

      <CommandGroup heading="Szybkie akcje">
        <CommandItem
          v-for="a in quickActions"
          :key="a.to + a.label"
          :value="`quick-${a.label}`"
          @select="
            run(() =>
              router.push(
                'query' in a && a.query
                  ? { path: a.to, query: a.query }
                  : a.to,
              ),
            )
          "
        >
          <component :is="a.icon" class="size-4" />
          {{ a.label }}
        </CommandItem>
      </CommandGroup>

      <CommandSeparator />

      <CommandGroup heading="Motyw">
        <CommandItem value="theme-light" @select="run(() => (colorMode.preference = 'light'))">
          <Sun class="size-4" />
          Jasny
        </CommandItem>
        <CommandItem value="theme-dark" @select="run(() => (colorMode.preference = 'dark'))">
          <Moon class="size-4" />
          Ciemny
        </CommandItem>
        <CommandItem value="theme-system" @select="run(() => (colorMode.preference = 'system'))">
          <Laptop class="size-4" />
          System
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>
