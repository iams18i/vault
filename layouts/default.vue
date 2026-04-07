<script setup lang="ts">
import {
  Building2,
  Check,
  ChevronDown,
  FileText,
  Landmark,
  LayoutDashboard,
  Receipt,
  Repeat,
  Tags,
  TrendingUp,
} from 'lucide-vue-next'
import AppHeader from '~/components/AppHeader.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from '@/components/ui/sidebar'

const route = useRoute()
const auth = useAuth()

onMounted(() => {
  auth.hydrateFromStorage()
})

const links = [
  { to: '/app', label: 'Pulpit', icon: LayoutDashboard },
  { to: '/app/income', label: 'Dochód', icon: TrendingUp },
  { to: '/app/recurring-costs', label: 'Koszty stałe', icon: Repeat },
  { to: '/app/expenses', label: 'Wydatki', icon: Receipt },
  { to: '/app/categories', label: 'Kategorie', icon: Tags },
  { to: '/app/companies', label: 'Kontrahenci', icon: Building2 },
  { to: '/app/invoices', label: 'Faktury', icon: FileText },
  { to: '/app/taxes', label: 'Podatki', icon: Landmark },
] as const

function linkActive(to: string) {
  if (to === '/app')
    return route.path === '/app' || route.path === '/app/'
  return route.path === to || route.path.startsWith(`${to}/`)
}

const currentVaultName = computed(() => {
  const id = auth.currentVaultId.value
  return auth.vaults.value.find((v) => v.id === id)?.name ?? 'Przestrzeń'
})
</script>

<template>
  <SidebarProvider class="h-svh overflow-hidden bg-background text-foreground">
    <Sidebar collapsible="icon" class="border-r border-sidebar-border">
      <SidebarHeader class="border-b border-sidebar-border gap-0.5 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <SidebarMenuButton
                  size="lg"
                  class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div
                    class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
                  >
                    <LayoutDashboard class="size-4" />
                  </div>
                  <div class="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{{
                      currentVaultName
                    }}</span>
                    <span class="truncate text-xs text-muted-foreground"
                      >Przełącz przestrzeń</span
                    >
                  </div>
                  <ChevronDown class="ml-auto size-4 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-56" align="start" side="bottom">
                <DropdownMenuLabel>Przestrzenie</DropdownMenuLabel>
                <DropdownMenuItem
                  v-for="v in auth.vaults.value"
                  :key="v.id"
                  class="cursor-pointer"
                  @click="auth.switchVault(v.id)"
                >
                  <Check
                    class="size-4"
                    :class="
                      auth.currentVaultId.value === v.id
                        ? 'opacity-100'
                        : 'opacity-0'
                    "
                  />
                  <span class="truncate">{{ v.name }}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem as-child>
                  <NuxtLink to="/" class="cursor-pointer">
                    Strona główna
                  </NuxtLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent class="px-2 py-2 group-data-[collapsible=icon]:px-0">
        <SidebarGroup>
          <SidebarGroupLabel>Nawigacja</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem v-for="l in links" :key="l.to">
              <SidebarMenuButton
                as-child
                :is-active="linkActive(l.to)"
                :tooltip="l.label"
              >
                <NuxtLink :to="l.to">
                  <component :is="l.icon" />
                  <span>{{ l.label }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
    <SidebarInset class="min-h-0 flex flex-col">
      <AppHeader />
      <div class="flex-1 overflow-y-auto p-6 md:p-8">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
