<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({ layout: 'public' })

const auth = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
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
  <div class="relative flex min-h-svh flex-col items-center justify-center px-4 py-10 sm:py-16">
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]"
    />
    <div class="relative z-10 w-full max-w-[400px]">
      <div class="mb-8 flex flex-col items-center text-center sm:mb-10">
        <VaultLogo class="h-9 w-auto text-foreground sm:h-10" />
        <h1 class="mt-6 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
          Rejestracja
        </h1>
        <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
          Utworzymy konto i domyślną przestrzeń danych. Na podany adres wyślemy
          link aktywacyjny.
        </p>
      </div>

      <form class="space-y-5" @submit.prevent="submit">
        <div
          v-if="successMsg"
          class="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2.5 text-sm text-green-600 dark:text-green-400"
          role="status"
        >
          {{ successMsg }}
        </div>
        <div
          v-else-if="errorMsg"
          class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          role="alert"
        >
          {{ errorMsg }}
        </div>

        <div class="space-y-2">
          <Label for="reg-name" class="text-sm font-medium"
            >Imię lub nazwa <span class="font-normal text-muted-foreground">(opcjonalnie)</span></Label
          >
          <Input
            id="reg-name"
            v-model="name"
            autocomplete="name"
            class="h-11"
            placeholder="Jan Kowalski"
            :disabled="!!successMsg"
          />
        </div>

        <div class="space-y-2">
          <Label for="reg-email" class="text-sm font-medium">E-mail</Label>
          <Input
            id="reg-email"
            v-model="email"
            type="email"
            autocomplete="email"
            class="h-11"
            placeholder="twoj@email.pl"
            required
            :disabled="!!successMsg"
          />
        </div>

        <div class="space-y-2">
          <Label for="reg-password" class="text-sm font-medium"
            >Hasło <span class="font-normal text-muted-foreground">(min. 8 znaków)</span></Label
          >
          <div class="relative">
            <Input
              id="reg-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              class="h-11 pr-11"
              required
              minlength="8"
              :disabled="!!successMsg"
            />
            <button
              type="button"
              class="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              :aria-pressed="showPassword"
              :aria-label="showPassword ? 'Ukryj hasło' : 'Pokaż hasło'"
              :disabled="!!successMsg"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="size-4" />
              <Eye v-else class="size-4" />
            </button>
          </div>
        </div>

        <Button
          type="submit"
          class="h-11 w-full text-base"
          :disabled="loading || !!successMsg"
        >
          {{ loading ? 'Tworzenie konta…' : 'Zarejestruj się' }}
        </Button>
      </form>

      <p class="mt-8 text-center text-sm text-muted-foreground">
        Masz już konto?
        <NuxtLink
          to="/login"
          class="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Zaloguj się
        </NuxtLink>
      </p>

      <p class="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
        Rejestrując się, potwierdzasz zapoznanie z regulaminem i polityką
        prywatności serwisu Vault.
      </p>
    </div>
  </div>
</template>
