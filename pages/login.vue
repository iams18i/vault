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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({ layout: 'public' })

const route = useRoute()
const auth = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref<string | null>(null)

onMounted(() => {
  auth.hydrateFromStorage()
})

async function submit() {
  errorMsg.value = null
  loading.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    const redir = route.query.redirect
    const path =
      typeof redir === 'string' && redir.startsWith('/app')
        ? redir
        : '/app'
    await navigateTo(path)
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    errorMsg.value =
      err?.data?.message ?? err?.message ?? 'Nie udało się zalogować.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-svh items-center justify-center p-4">
    <Card class="w-full max-w-md">
      <div class="flex justify-center pt-6">
        <VaultLogo class="h-10 w-auto text-foreground" />
      </div>
      <CardHeader class="space-y-1">
        <CardTitle class="text-2xl">Logowanie</CardTitle>
        <CardDescription>
          Wpisz e-mail i hasło. Jeśli dopiero się rejestrowałeś, najpierw
          potwierdź link z wiadomości.
        </CardDescription>
      </CardHeader>
      <form @submit.prevent="submit">
        <CardContent class="space-y-4">
          <p
            v-if="errorMsg"
            class="text-destructive text-sm"
            role="alert"
          >
            {{ errorMsg }}
          </p>
          <div class="space-y-2">
            <Label for="login-email">E-mail</Label>
            <Input
              id="login-email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="login-password">Hasło</Label>
            <Input
              id="login-password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>
        </CardContent>
        <CardFooter class="flex-col gap-4 sm:flex-row sm:justify-between">
          <Button type="submit" class="w-full sm:w-auto" :disabled="loading">
            {{ loading ? 'Logowanie…' : 'Zaloguj' }}
          </Button>
          <NuxtLink
            to="/register"
            class="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >
            Nie masz konta? Zarejestruj się
          </NuxtLink>
        </CardFooter>
      </form>
    </Card>
  </div>
</template>
