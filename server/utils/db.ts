import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"
import * as schema from "../db/schema"

let pool: pg.Pool | null = null

export function getDb() {
  const config = useRuntimeConfig()
  const url = config.databaseUrl as string | undefined
  if (!url) {
    throw createError({
      statusCode: 500,
      message: "DATABASE_URL is not configured",
    })
  }
  if (!pool) {
    pool = new pg.Pool({ connectionString: url })
  }
  return drizzle(pool, { schema })
}
