<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

definePageMeta({ layout: 'public' })

const route = useRoute()
const auth = useAuth()

const status = ref<'idle' | 'loading' | 'ok' | 'err'>('idle')
const message = ref<string | null>(null)

onMounted(async () => {
  auth.hydrateFromStorage()
  const token =
    typeof route.query.token === 'string' ? route.query.token.trim() : ''
  if (!token) {
    status.value = 'err'
    message.value = 'Brak tokenu w linku. Użyj adresu z wiadomości e-mail.'
    return
  }
  status.value = 'loading'
  try {
    await auth.verifyEmail(token)
    status.value = 'ok'
    message.value = 'Adres potwierdzony. Przekierowujemy do aplikacji…'
    await navigateTo('/app')
  } catch (e: unknown) {
    status.value = 'err'
    const err = e as { data?: { message?: string }; message?: string }
    message.value =
      err?.data?.message ??
      err?.message ??
      'Link jest nieważny lub wygasł. Spróbuj zarejestrować się ponownie lub skontaktuj się z pomocą.'
  }
})
</script>

<template>
  <div class="flex min-h-svh items-center justify-center p-4">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="text-2xl">Potwierdzanie e-maila</CardTitle>
        <CardDescription>
          Trwa weryfikacja tokenu z linku.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p v-if="status === 'loading'" class="text-muted-foreground text-sm">
          Chwila…
        </p>
        <p
          v-else
          class="text-sm"
          :class="status === 'ok' ? 'text-green-500 dark:text-green-400' : 'text-destructive'"
          role="alert"
        >
          {{ message }}
        </p>
      </CardContent>
      <CardFooter v-if="status === 'err'" class="gap-2">
        <Button as-child variant="outline">
          <NuxtLink to="/register">Rejestracja</NuxtLink>
        </Button>
        <Button as-child>
          <NuxtLink to="/login">Logowanie</NuxtLink>
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
