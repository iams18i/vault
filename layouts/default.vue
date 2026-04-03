<script setup lang="ts">
import {
  Building2,
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

const links = [
  { to: '/', label: 'Pulpit', icon: LayoutDashboard },
  { to: '/income', label: 'Dochód', icon: TrendingUp },
  { to: '/recurring-costs', label: 'Koszty stałe', icon: Repeat },
  { to: '/expenses', label: 'Wydatki', icon: Receipt },
  { to: '/categories', label: 'Kategorie', icon: Tags },
  { to: '/companies', label: 'Kontrahenci', icon: Building2 },
  { to: '/invoices', label: 'Faktury', icon: FileText },
  { to: '/taxes', label: 'Podatki', icon: Landmark },
] as const

function linkActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}
</script>

<template>
  <SidebarProvider class="h-svh overflow-hidden bg-background text-foreground">
    <Sidebar collapsible="icon" class="border-r border-sidebar-border">
      <SidebarHeader class="border-b border-sidebar-border gap-0.5 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" as-child tooltip="Vault">
              <NuxtLink to="/">
                <div
                  class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
                >
                  <LayoutDashboard class="size-4" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">Vault</span>
                  <span class="truncate text-xs text-muted-foreground">PLN · lokalnie</span>
                </div>
              </NuxtLink>
            </SidebarMenuButton>
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
