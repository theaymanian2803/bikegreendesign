import { getRequestHost } from "@tanstack/react-start/server";

import { LICENSE_FALLBACK, normalizeHost, verifyGrant, type GrantMode } from "@/lib/license-token";
import { getTurso } from "./client";

export { LICENSE_FALLBACK, normalizeHost, verifyGrant } from "@/lib/license-token";
export type { GrantMode, GrantPayload } from "@/lib/license-token";

export type LicenseState = {
  licensed: boolean;
  domain: string;
  mode?: GrantMode | "disabled";
  key?: string;
  reason?: "missing" | "domain" | "expired" | "bad_signature";
  demoMode: boolean;
};

const CACHE_TTL_MS = 15_000;
let grantCache: { value: string | null; at: number } | null = null;
let demoCache: { value: boolean; at: number } | null = null;

export function licenseConfig() {
  return {
    serverUrl: (process.env["LICENSE_SERVER_URL"] || LICENSE_FALLBACK.serverUrl).replace(/\/$/, ""),
    publicKey: process.env["LICENSE_PUBLIC_KEY"] || LICENSE_FALLBACK.publicKey,
    product: process.env["LICENSE_PRODUCT"] || LICENSE_FALLBACK.product,
  };
}

export async function readGrant(): Promise<string | null> {
  if (grantCache && Date.now() - grantCache.at < CACHE_TTL_MS) return grantCache.value;
  try {
    const result = await getTurso().execute({
      sql: "SELECT value FROM settings WHERE key = 'license_grant'",
      args: [],
    });
    const value = result.rows.length ? String(result.rows[0].value ?? "") || null : null;
    grantCache = { value, at: Date.now() };
    return value;
  } catch {
    return null;
  }
}

export async function writeGrant(token: string): Promise<void> {
  await getTurso().execute({
    sql: "INSERT INTO settings (key, value, updated_at) VALUES ('license_grant', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    args: [token, new Date().toISOString()],
  });
  grantCache = { value: token, at: Date.now() };
}

export async function clearGrant(): Promise<void> {
  await getTurso().execute({
    sql: "DELETE FROM settings WHERE key = 'license_grant'",
    args: [],
  });
  grantCache = { value: null, at: Date.now() };
}

export async function readDemoMode(): Promise<boolean> {
  if (demoCache && Date.now() - demoCache.at < CACHE_TTL_MS) return demoCache.value;
  try {
    const result = await getTurso().execute({
      sql: "SELECT value FROM settings WHERE key = 'demo_mode'",
      args: [],
    });
    const raw = result.rows.length ? String(result.rows[0].value ?? "") : "";
    const value = raw === "" ? true : raw === "1";
    demoCache = { value, at: Date.now() };
    return value;
  } catch {
    return true;
  }
}

export async function writeDemoMode(enabled: boolean): Promise<void> {
  await getTurso().execute({
    sql: "INSERT INTO settings (key, value, updated_at) VALUES ('demo_mode', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    args: [enabled ? "1" : "0", new Date().toISOString()],
  });
  demoCache = { value: enabled, at: Date.now() };
}

export async function currentLicense(): Promise<LicenseState> {
  const domain = normalizeHost(getRequestHost());
  const demoMode = await readDemoMode();

  if (process.env["LICENSE_DISABLED"] === "1") {
    return { licensed: true, domain, mode: "disabled", demoMode };
  }

  const token = await readGrant();
  if (!token) return { licensed: false, domain, reason: "missing", demoMode };

  const result = await verifyGrant(token, domain, licenseConfig().publicKey);
  if (!result.ok) return { licensed: false, domain, reason: result.reason, demoMode };

  return {
    licensed: true,
    domain,
    mode: result.payload.mode,
    key: result.payload.key,
    demoMode,
  };
}

export async function assertLicensedRequest(): Promise<void> {
  if (process.env["LICENSE_DISABLED"] === "1") return;
  const state = await currentLicense();
  if (!state.licensed) throw new Error("Unlicensed");
}
