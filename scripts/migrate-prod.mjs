#!/usr/bin/env node
// Runs `prisma migrate deploy` against Supabase using .env.production.local
// instead of the normal .env — so production migrations never depend on
// manually swapping values in (or overwriting) the local dev env file.
//
// prisma7.config.ts itself does `import "dotenv/config"`, which loads .env
// but never overrides variables that are already set in process.env. By
// loading .env.production.local into process.env *before* spawning prisma,
// our values win and .env is never read for DATABASE_URL/DIRECT_URL — and
// never written to either.

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), ".env.production.local");

if (!existsSync(envPath)) {
  console.error(
    `Nicht gefunden: ${envPath}\n` +
      "Kopiere .env.production.local.example dorthin und trage die echten Supabase-Werte ein (siehe DECISIONS.md)."
  );
  process.exit(1);
}

const { error } = dotenv.config({ path: envPath });
if (error) {
  console.error(`Konnte ${envPath} nicht laden: ${error.message}`);
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  console.error("DIRECT_URL fehlt in .env.production.local — wird von `prisma migrate deploy` benötigt.");
  process.exit(1);
}

console.log(`Wende Migrationen an gegen: ${maskConnectionString(process.env.DIRECT_URL)}`);

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);

function maskConnectionString(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "(URL konnte nicht geparst werden)";
  }
}
