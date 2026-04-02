# Vault

Self-hosted personal finance tracker for freelancers: expenses, invoices, income, recurring costs, taxes, and a monthly dashboard.

## Features

- Monthly dashboard (income / costs / invoices / taxes summary)
- Income tracking (hourly + flat-rate)
- Expenses (one-off) + recurring costs
- Invoices (track status / paid date)
- Tax entries (due vs paid)
- Categories

## Tech stack

- Nuxt 3 / Vue 3 / TypeScript
- Tailwind CSS v4 + shadcn-vue (reka-ui)
- PostgreSQL + Drizzle ORM / drizzle-kit
- Docker (optional, recommended)

## Quick start (Docker)

1) Create env file:

```bash
cp .env.example .env
```

2) Start Postgres:

```bash
docker compose up -d db
```

3) Install deps + run migrations:

```bash
pnpm install
pnpm db:migrate
```

4) Run the app:

```bash
pnpm dev
```

App runs on `http://localhost:3000`.

## Quick start (Docker app + db)

```bash
docker compose up --build
```

## Scripts

- `pnpm dev` — run dev server
- `pnpm build` — production build
- `pnpm preview` — run built app locally
- `pnpm generate` — static generation
- `pnpm db:generate` — generate migrations from schema
- `pnpm db:migrate` — apply migrations
- `pnpm db:push` — push schema to DB (dev convenience)

## Project structure

- `pages/` — UI routes (dashboard, income, expenses, invoices, taxes, recurring costs)
- `components/` — app components + `components/ui/` shadcn components
- `server/api/` — API endpoints
- `server/db/` — Drizzle schema + migrations
- `composables/` — shared UI logic

