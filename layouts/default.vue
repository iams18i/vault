<script setup lang="ts">
const route = useRoute()
const links = [
  { to: "/", label: "Pulpit" },
  { to: "/income", label: "Dochód" },
  { to: "/recurring-costs", label: "Koszty stałe" },
  { to: "/expenses", label: "Wydatki" },
  { to: "/invoices", label: "Faktury" },
  { to: "/taxes", label: "Podatki" },
]

function linkActive(to: string) {
  return to === "/" ? route.path === "/" : route.path.startsWith(to)
}
</script>

<template>
  <SidebarProvider class="h-svh overflow-hidden bg-background text-foreground">
    <Sidebar collapsible="none" class="border-r border-sidebar-border">
      <SidebarHeader class="border-b border-sidebar-border gap-0.5 px-5 py-4 md:px-2 md:py-2">
        <h1 class="text-lg font-semibold tracking-tight">Finanse</h1>
        <p class="text-xs text-muted-foreground">PLN · lokalnie</p>
      </SidebarHeader>
      <SidebarContent class="px-3 py-2 md:px-2 md:py-1">
        <SidebarMenu>
          <SidebarMenuItem v-for="l in links" :key="l.to">
            <SidebarMenuButton as-child :is-active="linkActive(l.to)">
              <NuxtLink :to="l.to">{{ l.label }}</NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
    <SidebarInset class="min-h-0">
      <div class="flex-1 overflow-y-auto p-6 md:p-8">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
