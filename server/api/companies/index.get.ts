import { asc } from 'drizzle-orm'

import { companies } from '../../db/schema'

export default defineEventHandler(async () => {
  const db = getDb()
  return db.select().from(companies).orderBy(asc(companies.name))
})
