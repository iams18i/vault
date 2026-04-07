export type AuthUser = {
  id: string
  email: string
  name: string | null
}

export type AuthVault = {
  id: string
  name: string
}

const TOKEN_KEY = 'vault_token'
const VAULT_KEY = 'vault_current_vault_id'

export function useAuth() {
  const token = useState<string | null>('auth-token', () => null)
  const currentVaultId = useState<string | null>('auth-vault-id', () => null)
  const user = useState<AuthUser | null>('auth-user', () => null)
  const vaults = useState<AuthVault[]>('auth-vaults', () => [])

  const isLoggedIn = computed(() => !!token.value)

  function hydrateFromStorage() {
    if (!import.meta.client) return
    token.value = localStorage.getItem(TOKEN_KEY)
    currentVaultId.value = localStorage.getItem(VAULT_KEY)
  }

  function persistToken(t: string) {
    token.value = t
    if (import.meta.client) localStorage.setItem(TOKEN_KEY, t)
  }

  function persistVault(id: string | null) {
    currentVaultId.value = id
    if (import.meta.client) {
      if (id) localStorage.setItem(VAULT_KEY, id)
      else localStorage.removeItem(VAULT_KEY)
    }
  }

  function setSession(
    t: string,
    u: AuthUser,
    vlist: AuthVault[],
    preferredVaultId?: string | null,
  ) {
    persistToken(t)
    user.value = u
    vaults.value = vlist
    const pick =
      preferredVaultId && vlist.some((v) => v.id === preferredVaultId)
        ? preferredVaultId
        : vlist[0]?.id ?? null
    persistVault(pick)
  }

  function clearSession() {
    token.value = null
    currentVaultId.value = null
    user.value = null
    vaults.value = []
    if (import.meta.client) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(VAULT_KEY)
    }
  }

  function switchVault(vaultId: string) {
    if (!vaults.value.some((v) => v.id === vaultId)) return
    persistVault(vaultId)
  }

  async function login(email: string, password: string) {
    const res = await $fetch<{
      token: string
      user: AuthUser
      vaults: AuthVault[]
    }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    setSession(res.token, res.user, res.vaults)
    return res
  }

  async function register(body: {
    email: string
    password: string
    name?: string | null
  }) {
    return $fetch<{ ok: boolean; message: string }>('/api/auth/register', {
      method: 'POST',
      body,
    })
  }

  async function verifyEmail(tokenStr: string) {
    const res = await $fetch<{
      token: string
      user: AuthUser
      vaults: AuthVault[]
    }>('/api/auth/verify-email', {
      method: 'POST',
      body: { token: tokenStr },
    })
    setSession(res.token, res.user, res.vaults)
    return res
  }

  async function fetchMe() {
    const t = token.value
    if (!t) return null
    const res = await $fetch<{
      user: AuthUser & { emailVerified: boolean }
      vaults: AuthVault[]
    }>('/api/auth/me', {
      headers: { Authorization: `Bearer ${t}` },
    })
    user.value = {
      id: res.user.id,
      email: res.user.email,
      name: res.user.name,
    }
    vaults.value = res.vaults
    if (
      currentVaultId.value &&
      !res.vaults.some((v) => v.id === currentVaultId.value)
    ) {
      persistVault(res.vaults[0]?.id ?? null)
    }
    return res
  }

  function logout() {
    clearSession()
    navigateTo('/login')
  }

  return {
    token,
    currentVaultId,
    user,
    vaults,
    isLoggedIn,
    hydrateFromStorage,
    setSession,
    clearSession,
    switchVault,
    login,
    register,
    verifyEmail,
    fetchMe,
    logout,
  }
}
