<script setup lang="ts">
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'public' })
</script>

<template>
  <div class="flex min-h-svh flex-col items-center justify-center px-4 py-12">
    <div class="w-full max-w-sm text-center space-y-4">
      <VaultLogo class="mx-auto h-8 w-auto text-foreground" />
      <h1 class="text-xl font-semibold tracking-tight">Reset hasła</h1>
      <p class="text-sm text-muted-foreground leading-relaxed">
        Ta funkcja nie jest jeszcze dostępna. Skontaktuj się z administratorem
        konta lub użyj adresu e-mail przypisanego do konta przy rejestracji.
      </p>
      <Button as-child variant="outline" class="w-full">
        <NuxtLink to="/login">Wróć do logowania</NuxtLink>
      </Button>
    </div>
  </div>
</template>
