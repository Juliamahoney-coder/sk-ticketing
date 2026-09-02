# Decisions

Short notes on non-obvious choices, kept close to the code they affect.

## Running Supabase migrations without touching local `.env`

`prisma migrate deploy` needs to run against the real Supabase database
(via `DIRECT_URL`), but local development runs against Docker Postgres
(via the same variable name in `.env`). Swapping values in and out of
`.env` by hand before/after every production migration was error-prone —
easy to forget to swap back, easy to accidentally commit real credentials.

**Workflow now:**

1. Once, locally: copy `.env.production.local.example` to
   `.env.production.local` and fill in the real Supabase values
   (`DATABASE_URL`, `DIRECT_URL`, and the `SUPABASE_*` Storage vars).
   This file is gitignored, same as `.env` — never commit it.
2. From then on, run `npm run migrate:prod` to apply pending migrations
   to Supabase. It loads `.env.production.local` and runs
   `prisma migrate deploy` against it.

`npm run migrate:prod` never reads from or writes to `.env` — the two
env files stay fully separate, so there's nothing to swap back after a
production migration and no risk of an accidental local-vs-prod mix-up.
See `scripts/migrate-prod.mjs` for how the separation is enforced (it
relies on `dotenv` not overriding variables that are already set, so
loading `.env.production.local` into the process first makes prisma's
own `dotenv/config` call in `prisma7.config.ts` a no-op for those keys).
