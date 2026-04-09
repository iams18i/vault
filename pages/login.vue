<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({ layout: 'public' })

const route = useRoute()
const auth = useAuth()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
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
  <div class="relative flex min-h-svh flex-col items-center justify-center px-4 py-10 sm:py-16">
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]"
    />
    <div class="relative z-10 w-full max-w-[400px]">
      <div class="mb-8 flex flex-col items-center text-center sm:mb-10">
        <VaultLogo class="h-9 w-auto text-foreground sm:h-10" />
        <h1 class="mt-6 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
          Logowanie
        </h1>
        <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
          Zaloguj się adresem e-mail i hasłem. Jeśli dopiero się rejestrowałeś,
          najpierw potwierdź link z wiadomości.
        </p>
      </div>

      <form class="space-y-5" @submit.prevent="submit">
        <div
          v-if="errorMsg"
          class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          role="alert"
        >
          {{ errorMsg }}
        </div>

        <div class="space-y-2">
          <Label for="login-email" class="text-sm font-medium">E-mail</Label>
          <Input
            id="login-email"
            v-model="email"
            type="email"
            autocomplete="email"
            class="h-11"
            placeholder="twoj@email.pl"
            required
          />
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <Label for="login-password" class="text-sm font-medium"
              >Hasło</Label
            >
            <NuxtLink
              to="/forgot-password"
              class="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Zapomniałeś hasła?
            </NuxtLink>
          </div>
          <div class="relative">
            <Input
              id="login-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              class="h-11 pr-11"
              required
            />
            <button
              type="button"
              class="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              :aria-pressed="showPassword"
              :aria-label="showPassword ? 'Ukryj hasło' : 'Pokaż hasło'"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="size-4" />
              <Eye v-else class="size-4" />
            </button>
          </div>
        </div>

        <Button type="submit" class="h-11 w-full text-base" :disabled="loading">
          {{ loading ? 'Logowanie…' : 'Zaloguj się' }}
        </Button>
      </form>

      <p class="mt-8 text-center text-sm text-muted-foreground">
        Nie masz konta?
        <NuxtLink
          to="/register"
          class="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Zarejestruj się
        </NuxtLink>
      </p>

      <p class="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
        Logując się, potwierdzasz zapoznanie z regulaminem i polityką
        prywatności serwisu Vault.
      </p>
    </div>
  </div>
</template>
