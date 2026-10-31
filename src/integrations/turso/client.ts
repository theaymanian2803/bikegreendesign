import { createClient, type Client } from "@libsql/client";

// Server-only Turso (libSQL) client. Never import this module from client
// code; load it lazily inside server handlers:
//   const { getTurso } = await import("@/integrations/turso/client");
//
// The env database is the "bootstrap" database. It stores the optional custom
// database credentials (`db_url` / `db_token` in settings) that the Setup page
// writes. Once set, getTurso() returns the buyer's database instead.

export type TursoConfig = { url: string; token?: string };

let _client: Client | undefined;
let _clientKey = "";
let _bootstrap: Client | undefined;
let _bootstrapKey = "";
let _custom: TursoConfig | null = null;

function envConfig(): TursoConfig {
  const url = process.env["TURSO_DATABASE_URL"];
  if (!url) {
    const message =
      "Missing TURSO_DATABASE_URL. Add your Turso database URL to the .env file (see .env.example).";
    console.error(`[Turso] ${message}`);
    throw new Error(message);
  }
  return { url, token: process.env["TURSO_AUTH_TOKEN"] || undefined };
}

/** The env database, used to read and write the custom database config. */
export function getBootstrapTurso(): Client {
  const config = envConfig();
  const key = `${config.url}::${config.token ?? ""}`;
  if (!_bootstrap || key !== _bootstrapKey) {
    _bootstrap = createClient({ url: config.url, authToken: config.token || undefined });
    _bootstrapKey = key;
  }
  return _bootstrap;
}

export function currentDbConfig(): TursoConfig | null {
  return _custom;
}

/** Switches the runtime client between the env database and a custom one. */
export function setRuntimeDbConfig(config: TursoConfig | null): void {
  _custom = config;
  _client = undefined;
  _clientKey = "";
}

export function getTurso(): Client {
  const config = _custom ?? envConfig();
  const key = `${config.url}::${config.token ?? ""}`;
  if (!_client || key !== _clientKey) {
    _client = createClient({ url: config.url, authToken: config.token || undefined });
    _clientKey = key;
  }
  return _client;
}
