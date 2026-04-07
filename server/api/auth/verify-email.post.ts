import { and, eq, isNull } from 'drizzle-orm'

import {
  emailVerificationTokens,
  users,
  vaultMembers,
  vaults,
} from '../../db/schema'
import { signAccessToken } from '../../utils/auth'
import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: string }>(event)
  const raw = body?.token?.trim()
  if (!raw) {
    throw createError({ statusCode: 400, message: 'Brak tokenu weryfikacyjnego.' })
  }

  const db = getDb()

  const [row] = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.token, raw),
        isNull(emailVerificationTokens.usedAt),
      ),
    )
    .limit(1)

  if (!row) {
    throw createError({
      statusCode: 400,
      message: 'Nieprawidłowy lub już użyty link.',
    })
  }

  if (row.expiresAt.getTime() < Date.now()) {
    throw createError({ statusCode: 400, message: 'Link wygasł. Zarejestruj się ponownie.' })
  }

  await db
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, row.userId))

  await db
    .update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationTokens.id, row.id))

  const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1)

  if (!user) {
    throw createError({ statusCode: 500, message: 'Użytkownik nie został znaleziony.' })
  }

  const vaultRows = await db
    .select({
      id: vaults.id,
      name: vaults.name,
    })
    .from(vaultMembers)
    .innerJoin(vaults, eq(vaultMembers.vaultId, vaults.id))
    .where(eq(vaultMembers.userId, user.id))

  const token = await signAccessToken(user.id, user.email)

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    vaults: vaultRows,
  }
})
