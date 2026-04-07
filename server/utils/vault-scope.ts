import type { H3Event } from 'h3'

export function requireVaultAuth(event: H3Event): { userId: string; vaultId: string } {
  const a = event.context.auth
  if (!a?.vaultId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  return { userId: a.userId, vaultId: a.vaultId }
}
