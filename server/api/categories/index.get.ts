import { asc } from "drizzle-orm"
import { categories } from "../../db/schema"

export default defineEventHandler(async () => {
  const db = getDb()
  return db.select().from(categories).orderBy(asc(categories.name))
})
