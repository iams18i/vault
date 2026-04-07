import { and, eq } from 'drizzle-orm'

import { vaultMembers } from '../db/schema'
import { getBearerToken, getVaultIdHeader, verifyAccessToken } from '../utils/auth'
import { getDb } from '../utils/db'

const PUBLIC_AUTH_PATHS = new Set([
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/verify-email',
])

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  if (!path.startsWith('/api/')) return

  if (PUBLIC_AUTH_PATHS.has(path)) return

  const token = getBearerToken(event)
  if (!token) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  let userId: string
  let email: string
  try {
    const p = await verifyAccessToken(token)
    userId = p.sub
    email = p.email
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid or expired token' })
  }

  if (path === '/api/auth/me') {
    event.context.auth = { userId, email }
    return
  }

  const vaultId = getVaultIdHeader(event)
  if (!vaultId) {
    throw createError({
      statusCode: 400,
      message: 'X-Vault-Id header is required',
    })
  }

  const db = getDb()
  const [member] = await db
    .select({ id: vaultMembers.id })
    .from(vaultMembers)
    .where(
      and(eq(vaultMembers.vaultId, vaultId), eq(vaultMembers.userId, userId)),
    )
    .limit(1)

  if (!member) {
    throw createError({ statusCode: 403, message: 'Vault access denied' })
  }

  event.context.auth = { userId, email, vaultId }
})
