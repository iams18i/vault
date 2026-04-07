import { eq } from 'drizzle-orm'

import { users, vaultMembers, vaults } from '../../db/schema'
import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth?.userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = getDb()

  const [user] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const vaultRows = await db
    .select({
      id: vaults.id,
      name: vaults.name,
    })
    .from(vaultMembers)
    .innerJoin(vaults, eq(vaultMembers.vaultId, vaults.id))
    .where(eq(vaultMembers.userId, user.id))

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: !!user.emailVerifiedAt,
    },
    vaults: vaultRows,
  }
})
