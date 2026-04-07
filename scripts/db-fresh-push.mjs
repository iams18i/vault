/**
 * Wipes the Postgres `public` schema and runs `drizzle-kit push`.
 * Use when legacy tables (serial ids, no vault_id) block an in-place push.
 * Requires DATABASE_URL; connecting user must be allowed to DROP SCHEMA public.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const envFile = path.join(root, '.env')

if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    if (process.env[k] === undefined) process.env[k] = v
  }
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL missing (set in .env)')
  process.exit(1)
}

console.error('Dropping schema public (all data)…')
const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  await client.query('DROP SCHEMA public CASCADE')
  await client.query('CREATE SCHEMA public')
} finally {
  await client.end()
}

console.error('Applying schema (drizzle-kit push)…')
const r = spawnSync('pnpm', ['exec', 'drizzle-kit', 'push'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
})
process.exit(r.status ?? 1)
