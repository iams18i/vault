export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return

  const auth = useAuth()
  auth.hydrateFromStorage()

  const publicPaths = new Set(['/', '/login', '/register', '/verify-email'])

  if (to.path.startsWith('/app')) {
    if (!auth.token.value) {
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
    if (!auth.currentVaultId.value && auth.vaults.value.length > 0) {
      auth.switchVault(auth.vaults.value[0]!.id)
    }
  }

  if (publicPaths.has(to.path) || to.path.startsWith('/verify-email')) {
    if (auth.token.value && to.path !== '/') {
      return navigateTo('/app')
    }
  }
})
