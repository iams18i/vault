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

const auth = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)

onMounted(() => {
  auth.hydrateFromStorage()
})

async function submit() {
  errorMsg.value = null
  successMsg.value = null
  loading.value = true
  try {
    const res = await auth.register({
      email: email.value.trim(),
      password: password.value,
      name: name.value.trim() || null,
    })
    successMsg.value = res.message
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    errorMsg.value =
      err?.data?.message ?? err?.message ?? 'Nie udało się zarejestrować.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-svh items-center justify-center p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1">
        <CardTitle class="text-2xl">Rejestracja</CardTitle>
        <CardDescription>
          Utworzymy konto i domyślną przestrzeń danych. Na podany adres wyślemy
          link aktywacyjny.
        </CardDescription>
      </CardHeader>
      <form @submit.prevent="submit">
        <CardContent class="space-y-4">
          <p
            v-if="successMsg"
            class="text-sm text-green-500 dark:text-green-400"
            role="status"
          >
            {{ successMsg }}
          </p>
          <p
            v-else-if="errorMsg"
            class="text-destructive text-sm"
            role="alert"
          >
            {{ errorMsg }}
          </p>
          <div class="space-y-2">
            <Label for="reg-name">Imię lub nazwa (opcjonalnie)</Label>
            <Input id="reg-name" v-model="name" autocomplete="name" />
          </div>
          <div class="space-y-2">
            <Label for="reg-email">E-mail</Label>
            <Input
              id="reg-email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="reg-password">Hasło (min. 8 znaków)</Label>
            <Input
              id="reg-password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
              minlength="8"
            />
          </div>
        </CardContent>
        <CardFooter class="flex-col gap-4 sm:flex-row sm:justify-between">
          <Button
            type="submit"
            class="w-full sm:w-auto"
            :disabled="loading || !!successMsg"
          >
            {{ loading ? 'Tworzenie…' : 'Zarejestruj' }}
          </Button>
          <NuxtLink
            to="/login"
            class="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >
            Masz konto? Zaloguj się
          </NuxtLink>
        </CardFooter>
      </form>
    </Card>
  </div>
</template>
