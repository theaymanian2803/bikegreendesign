import { createClient } from "@libsql/client";

import schemaSql from "../../../db/schema.sql?raw";
import seedSql from "../../../db/seed.sql?raw";
import {
  clearSessionCookie,
  DEMO_ADMIN_EMAIL,
  setSessionCookie,
  type SessionUser,
} from "./auth.server";
import {
  currentDbConfig,
  getBootstrapTurso,
  getTurso,
  setRuntimeDbConfig,
  type TursoConfig,
} from "./client";

const CONFIG_TTL_MS = 30_000;
let lastRefresh = 0;

function maskUrl(url: string): string {
  const clean = url.replace(/^libsql:\/\//, "");
  return clean.length <= 18 ? clean : `${clean.slice(0, 18)}…`;
}

async function readStoredConfig(): Promise<Record<string, string>> {
  const result = await getBootstrapTurso().execute({
    sql: "SELECT key, value FROM settings WHERE key IN ('db_url','db_token')",
    args: [],
  });
  const map: Record<string, string> = {};
  for (const row of result.rows) map[String(row.key)] = String(row.value ?? "");
  return map;
}

/**
 * Loads the custom database credentials from the bootstrap database into the
 * runtime client. Cached briefly; called by the server request middleware.
 */
export async function refreshDbConfig(force = false): Promise<void> {
  if (!force && Date.now() - lastRefresh < CONFIG_TTL_MS) return;
  lastRefresh = Date.now();
  try {
    const map = await readStoredConfig();
    const next: TursoConfig | null =
      map.db_url && map.db_token ? { url: map.db_url, token: map.db_token } : null;
    const current = currentDbConfig();
    const changed =
      (!next && current) ||
      (next &&
        (!current || current.url !== next.url || (current.token ?? "") !== (next.token ?? "")));
    if (changed) setRuntimeDbConfig(next);
  } catch {
    // Bootstrap unreachable — keep the current client.
  }
}

export async function readDbConfig(): Promise<{ usingCustom: boolean; url: string | null }> {
  try {
    const map = await readStoredConfig();
    return {
      usingCustom: Boolean(map.db_url && map.db_token),
      url: map.db_url ? maskUrl(map.db_url) : null,
    };
  } catch {
    return { usingCustom: false, url: null };
  }
}

export async function testTursoConnection(
  url: string,
  token: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const probe = createClient({ url: url.trim(), authToken: token.trim() });
    await probe.execute("SELECT 1");
    return { ok: true, message: "Connected" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

async function ensureOwner(targetUrl: string, targetToken: string, user: SessionUser) {
  const target = createClient({ url: targetUrl, authToken: targetToken });
  await target.execute({
    sql: `INSERT INTO users (email, display_name, is_admin, is_guest)
          VALUES (?, ?, 1, 0)
          ON CONFLICT(email) DO UPDATE SET
            is_admin = 1,
            display_name = excluded.display_name`,
    args: [user.email, user.name ?? ""],
  });
  const row = await target.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: [user.email],
  });
  const id = Number(row.rows[0]?.id ?? 0);
  if (!Number.isFinite(id) || id <= 0) return;

  const owner = await target.execute("SELECT value FROM settings WHERE key = 'owner_email'");
  if (!owner.rows[0]) {
    await target.execute({
      sql: "INSERT INTO settings (key, value, updated_at) VALUES ('owner_email', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
      args: [user.email, new Date().toISOString()],
    });
  }
  await setSessionCookie(id);
}

/**
 * Provisions and switches to the buyer's database. The env database keeps the
 * `db_url` / `db_token` settings so the switch survives restarts.
 */
export async function connectDatabase(input: {
  url: string;
  token: string;
  keepSeed: boolean;
  user: SessionUser;
}): Promise<{ ok: true; url: string; signedOut: boolean }> {
  const url = input.url.trim();
  const token = input.token.trim();
  const probe = await testTursoConnection(url, token);
  if (!probe.ok) throw new Error(probe.message);

  const target = createClient({ url, authToken: token });
  try {
    await target.executeMultiple(schemaSql);
  } catch (error) {
    throw new Error(
      `Could not create the schema: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
  if (input.keepSeed) {
    try {
      await target.executeMultiple(seedSql);
    } catch (error) {
      throw new Error(
        `Could not copy the sample data: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  // Carry over store settings and the license grant so switching databases does
  // not drop activation or the shop configuration.
  try {
    const current = getTurso();
    const rows = await current.execute({
      sql: "SELECT key, value FROM settings WHERE key NOT IN ('db_url','db_token','owner_email')",
      args: [],
    });
    const now = new Date().toISOString();
    for (const row of rows.rows) {
      await target.execute({
        sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        args: [String(row.key), String(row.value ?? ""), now],
      });
    }
  } catch {
    // Settings are optional; provisioning still succeeds without them.
  }

  let carried = false;
  if (input.user.email !== DEMO_ADMIN_EMAIL) {
    try {
      await ensureOwner(url, token, input.user);
      carried = true;
    } catch {
      carried = false;
    }
  }

  try {
    const boot = getBootstrapTurso();
    const now = new Date().toISOString();
    await boot.execute({
      sql: "INSERT INTO settings (key, value, updated_at) VALUES ('db_url', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
      args: [url, now],
    });
    await boot.execute({
      sql: "INSERT INTO settings (key, value, updated_at) VALUES ('db_token', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
      args: [token, now],
    });
  } catch (error) {
    throw new Error(
      `Could not save the database settings: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }

  setRuntimeDbConfig({ url, token });
  lastRefresh = Date.now();

  if (!carried) clearSessionCookie();
  return { ok: true, url: maskUrl(url), signedOut: !carried };
}

/**
 * Returns to the env database. The session is cleared because the current user
 * row belongs to the previous database.
 */
export async function resetDatabase(): Promise<void> {
  await getBootstrapTurso().execute({
    sql: "DELETE FROM settings WHERE key IN ('db_url','db_token')",
    args: [],
  });
  setRuntimeDbConfig(null);
  lastRefresh = Date.now();
  clearSessionCookie();
}
