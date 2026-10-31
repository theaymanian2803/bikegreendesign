// Bootstrap the Turso database: applies db/schema.sql, db/seed.sql, and
// runs versioned migrations from db/migrations/. Each migration file runs
// only once — tracked in a schema_migrations table.
//
// Run with: bun run db:setup
//
// Reads TURSO_DATABASE_URL / TURSO_AUTH_TOKEN from .env (Bun loads it
// automatically). For a local database, set:
//   TURSO_DATABASE_URL="file:./dev.db"
import { createClient, type Client } from "@libsql/client";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const url = process.env["TURSO_DATABASE_URL"];
if (!url) {
  console.error(
    [
      "Missing TURSO_DATABASE_URL.",
      "",
      "Add your Turso database credentials to .env:",
      '  TURSO_DATABASE_URL="libsql://your-db.turso.io"',
      '  TURSO_AUTH_TOKEN="your-token"',
      "",
      "For a local file database during development:",
      '  TURSO_DATABASE_URL="file:./dev.db"',
    ].join("\n"),
  );
  process.exit(1);
}

console.log(`[db:setup] Connecting to ${url}`);
const client = createClient({
  url,
  authToken: process.env["TURSO_AUTH_TOKEN"] || undefined,
});

async function ensureMigrationTable(client: Client): Promise<void> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `);
}

async function isMigrationApplied(client: Client, filename: string): Promise<boolean> {
  const result = await client.execute({
    sql: "SELECT 1 FROM schema_migrations WHERE filename = ?",
    args: [filename],
  });
  return result.rows.length > 0;
}

async function markMigrationApplied(client: Client, filename: string): Promise<void> {
  await client.execute({
    sql: "INSERT INTO schema_migrations (filename) VALUES (?)",
    args: [filename],
  });
}

async function runMigrations(client: Client): Promise<void> {
  const migrationsDir = resolve(root, "db", "migrations");
  let files: string[];
  try {
    files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
  } catch {
    console.log("[db:setup] No migrations directory found, skipping.");
    return;
  }

  let applied = 0;
  for (const filename of files) {
    if (await isMigrationApplied(client, filename)) {
      continue;
    }

    const sql = readFileSync(resolve(migrationsDir, filename), "utf8");
    console.log(`[db:setup] Running migration: ${filename}`);
    try {
      // Split on semicolons to execute one statement at a time — allows
      // partial recovery when some statements already ran on the live DB.
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const stmt of statements) {
        try {
          await client.execute(stmt);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("duplicate column") || msg.includes("already exists")) {
            console.log(`[db:setup]   (skipped, already applied)`);
          } else {
            throw err;
          }
        }
      }
      await markMigrationApplied(client, filename);
      applied++;
    } catch (error) {
      console.error(`[db:setup] Migration ${filename} failed:`, error);
      throw error;
    }
  }

  console.log(
    applied > 0
      ? `[db:setup] Applied ${applied} new migration(s).`
      : "[db:setup] All migrations already applied.",
  );
}

try {
  const schema = readFileSync(resolve(root, "db", "schema.sql"), "utf8");
  const seed = readFileSync(resolve(root, "db", "seed.sql"), "utf8");

  console.log("[db:setup] Applying schema…");
  await client.executeMultiple(schema);

  console.log("[db:setup] Running migrations…");
  await ensureMigrationTable(client);
  await runMigrations(client);

  console.log("[db:setup] Seeding data…");
  await client.executeMultiple(seed);

  console.log("[db:setup] Done.");
} catch (error) {
  console.error("[db:setup] Failed:", error);
  process.exit(1);
} finally {
  client.close();
}
