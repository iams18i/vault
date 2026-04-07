declare module 'h3' {
  interface H3EventContext {
    auth?: {
      userId: string
      email: string
      /** Set on vault-scoped routes (not on /api/auth/me). */
      vaultId?: string
    }
  }
}

export {}
