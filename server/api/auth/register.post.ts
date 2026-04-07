import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import {
  emailVerificationTokens,
  users,
  vaultMembers,
  vaults,
} from '../../db/schema'
import { hashPassword } from '../../utils/auth'
import { sendVerificationEmail } from '../../utils/email'
import { getDb } from '../../utils/db'

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email?: string
    password?: string
    name?: string | null
  }>(event)

  const email = body?.email?.trim().toLowerCase()
  const password = body?.password ?? ''
  const name = body?.name?.trim() || null

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Podaj prawidłowy adres e-mail.' })
  }
  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      message: 'Hasło musi mieć co najmniej 8 znaków.',
    })
  }

  const db = getDb()

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'Konto z tym adresem e-mail już istnieje.',
    })
  }

  const passwordHash = await hashPassword(password)

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
    })
    .returning()

  if (!user) {
    throw createError({ statusCode: 500, message: 'Nie udało się utworzyć konta.' })
  }

  const [vault] = await db
    .insert(vaults)
    .values({
      name: 'Vault',
      ownerId: user.id,
    })
    .returning()

  if (!vault) {
    throw createError({ statusCode: 500, message: 'Nie udało się utworzyć Vault.' })
  }

  await db.insert(vaultMembers).values({
    vaultId: vault.id,
    userId: user.id,
    role: 'owner',
  })

  const rawToken = nanoid(48)
  const expiresAt = new Date(Date.now() + VERIFY_TTL_MS)

  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    token: rawToken,
    expiresAt,
  })

  const config = useRuntimeConfig()
  const appUrl = (config.appUrl as string).replace(/\/$/, '')
  const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(rawToken)}`

  try {
    await sendVerificationEmail({ to: email, verifyUrl })
  } catch (e) {
    if (!config.resendApiKey) {
      // dev: no key — still ok
    } else {
      throw e
    }
  }

  return {
    ok: true,
    message:
      'Konto utworzone. Sprawdź skrzynkę e-mail i potwierdź adres, aby się zalogować.',
  }
})
