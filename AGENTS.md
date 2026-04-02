# AGENTS

Notes for automated agents working on this repo.

## Stack

- Nuxt 3 / Vue 3 / TypeScript
- Tailwind CSS v4 + shadcn-vue (reka-ui)
- PostgreSQL + Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- Package manager: pnpm

## Product scope

- Personal finance / bookkeeping for freelancers
- Modules: dashboard, income, expenses, recurring costs, invoices, taxes, categories

## Conventions

- **UI language**: Polish (user-facing copy is Polish)
- **Theme**: dark only (`nuxt.config.ts` sets `htmlAttrs.class = "dark"`)
- **Month key**: `"YYYY-MM"` string used across routes and DB
- **Money fields**: stored as Postgres `decimal(14,2)`; treat as strings in JS/TS (avoid float math)
- **shadcn components**: live in `components/ui/` (no prefix configured)

## Coding standards

- **Formatter**: follow Prettier (don’t fight it).
- **Quotes**: single quotes in JS/TS/Vue (per Prettier).
- **Imports**: group type imports first, then value imports; keep 1 blank line between groups.
- **Nuxt alias**: prefer `~/` for app code imports.
- **UI patterns**: prefer shadcn wrappers (`components/ui/*`) + `cn()` for class composition.
- **Tailwind**: prefer named utilities when equivalent exists (e.g. `w-60` over `w-[240px]`).

## Architecture map

- UI routes: `pages/`
- Shared UI logic: `composables/`
- Server API: `server/api/` (Nuxt server routes)
- DB schema/migrations: `server/db/schema.ts`, `server/db/migrations/`
- DB access: `server/utils/db.ts`

## Database workflow

- Edit schema in `server/db/schema.ts`
- Generate migrations: `pnpm db:generate`
- Apply migrations: `pnpm db:migrate`
- Dev-only shortcut: `pnpm db:push`

## Docker

- `docker-compose.yml` provides Postgres (`db`) and optional app container (`app`)
- Local dev typically: `docker compose up -d db` then `pnpm dev`

