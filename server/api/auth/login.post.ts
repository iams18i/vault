import { eq } from 'drizzle-orm'

import { users, vaultMembers, vaults } from '../../db/schema'
import { signAccessToken, verifyPassword } from '../../utils/auth'
import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = body?.email?.trim().toLowerCase()
  const password = body?.password ?? ''

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'E-mail i hasło są wymagane.' })
  }

  const db = getDb()

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    throw createError({ statusCode: 401, message: 'Nieprawidłowy e-mail lub hasło.' })
  }

  if (!user.emailVerifiedAt) {
    throw createError({
      statusCode: 403,
      message: 'Potwierdź adres e-mail przed logowaniem.',
    })
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
