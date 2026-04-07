<script setup lang="ts">
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'public' })
</script>

<template>
  <div
    class="relative flex min-h-svh flex-col items-center justify-center px-4 py-16"
  >
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)]"
    />
    <div class="relative z-10 max-w-lg text-center space-y-8">
      <div class="space-y-3">
        <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
          Księgowość dla freelancera
        </h1>
        <p class="text-muted-foreground text-sm leading-relaxed sm:text-base">
          Dochody, wydatki, koszty stałe, faktury i podatki — w jednym miejscu,
          z danymi izolowanymi w przestrzeni (vault).
        </p>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-3">
        <Button as-child size="lg">
          <NuxtLink to="/register">Załóż konto</NuxtLink>
        </Button>
        <Button as-child variant="outline" size="lg">
          <NuxtLink to="/login">Zaloguj się</NuxtLink>
        </Button>
      </div>
      <p class="text-muted-foreground text-xs">
        Po rejestracji potwierdź adres e-mail, aby móc się zalogować.
      </p>
    </div>
  </div>
</template>
