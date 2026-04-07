/** Authenticated $fetch: Bearer + X-Vault-Id for /api/* (except public auth routes). */
export function useApiFetch() {
  const auth = useAuth()
  return $fetch.create({
    onRequest({ request, options }) {
      const url = typeof request === 'string' ? request : String(request)
      const path = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0]
      if (
        path === '/api/auth/register' ||
        path === '/api/auth/login' ||
        path === '/api/auth/verify-email'
      ) {
        return
      }
      const headers = new Headers(options.headers as HeadersInit)
      if (auth.token.value) {
        headers.set('Authorization', `Bearer ${auth.token.value}`)
      }
      if (path !== '/api/auth/me' && auth.currentVaultId.value) {
        headers.set('X-Vault-Id', auth.currentVaultId.value)
      }
      options.headers = headers
    },
    async onResponseError({ response, request }) {
      if (response.status === 401) {
        const u = typeof request === 'string' ? request : String(request)
        if (
          !u.includes('/api/auth/login') &&
          !u.includes('/api/auth/register') &&
          !u.includes('/api/auth/verify-email')
        ) {
          auth.clearSession()
          await navigateTo('/login')
        }
      }
    },
  })
}
