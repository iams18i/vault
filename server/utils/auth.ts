import type { H3Event } from 'h3'
import argon2 from 'argon2'
import * as jose from 'jose'

const TOKEN_EXPIRY = '7d'

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain)
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain)
  } catch {
    return false
  }
}

const DEV_JWT_FALLBACK =
  'dev-only-insecure-jwt-secret-min-16-chars'

function getJwtSecretKey(): Uint8Array {
  const config = useRuntimeConfig()
  let s = (config.jwtSecret as string)?.trim() ?? ''
  if (s.length < 16) {
    if (import.meta.dev) {
      console.warn(
        '[auth] JWT_SECRET missing or too short; using dev fallback. Set JWT_SECRET in .env (≥16 chars) before production.',
      )
      s = DEV_JWT_FALLBACK
    } else {
      throw createError({
        statusCode: 500,
        message: 'JWT_SECRET is not configured (min 16 characters)',
      })
    }
  }
  return new TextEncoder().encode(s)
}

export async function signAccessToken(userId: string, email: string): Promise<string> {
  const key = getJwtSecretKey()
  return new jose.SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(key)
}

export async function verifyAccessToken(
  token: string,
): Promise<{ sub: string; email: string }> {
  const key = getJwtSecretKey()
  const { payload } = await jose.jwtVerify(token, key)
  const sub = payload.sub
  const email = typeof payload.email === 'string' ? payload.email : ''
  if (!sub) {
    throw createError({ statusCode: 401, message: 'Invalid token' })
  }
  return { sub, email }
}

export function getBearerToken(event: H3Event): string | null {
  const h = getHeader(event, 'authorization')
  if (!h) return null
  const m = /^Bearer\s+(.+)$/i.exec(h.trim())
  return m?.[1]?.trim() ?? null
}

export function getVaultIdHeader(event: H3Event): string | null {
  const v = getHeader(event, 'x-vault-id')
  return v?.trim() || null
}
