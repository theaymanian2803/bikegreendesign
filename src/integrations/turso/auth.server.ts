// Server-only auth helpers for the self-hosted Turso backend.
//
// Storefront auth supports Google OAuth, email/password accounts, and guest
// sessions. Google uses the PKCE flow in /api/auth/google; email and guest
// routes live in /api/auth and /api/mobile/auth. Every method issues the same
// signed `pathway_session` token: a cookie on the website and a Bearer token
// on mobile.
//
// Admin access is granted by listing an email in ADMIN_EMAILS. The users page
// can still grant or revoke the role afterwards.
//
// `.server.ts` modules may only be imported by server code (middleware modules)
// or loaded lazily inside server function handlers — never from client code.
import { deleteCookie, getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server";

import { getTurso } from "./client";

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  isGuest: boolean;
};

export type GoogleProfile = {
  sub: string;
  email: string;
};

export const SESSION_COOKIE = "pathway_session";

/**
 * Local demo admin used by the onboarding tour while the store is unlicensed.
 * It never counts as the store owner, and demo sign-in is disabled as soon as
 * the store is activated.
 */
export const DEMO_ADMIN_EMAIL = "demo@pathway.local";
export const OAUTH_STATE_COOKIE = "pathway_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "pathway_oauth_verifier";
export const OAUTH_REDIRECT_COOKIE = "pathway_oauth_redirect";

// Cookie from the removed password-only admin gate; cleared on sign-out.
const LEGACY_ADMIN_COOKIE = "pathway_admin";

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const OAUTH_TTL_SECONDS = 10 * 60; // 10 minutes
const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

const encoder = new TextEncoder();

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export function googleClientId(): string {
  const value = process.env["GOOGLE_CLIENT_ID"];
  if (!value) throw new Error("Missing GOOGLE_CLIENT_ID environment variable");
  return value;
}

export function googleClientSecret(): string {
  const value = process.env["GOOGLE_CLIENT_SECRET"];
  if (!value) throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable");
  return value;
}

export function authSecret(): string {
  const value = process.env["AUTH_SECRET"];
  if (!value) {
    throw new Error(
      "Missing AUTH_SECRET environment variable (generate one with: openssl rand -base64 32)",
    );
  }
  return value;
}

export function adminEmails(): string[] {
  return (process.env["ADMIN_EMAILS"] ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Encoding / crypto helpers (Web Crypto so this works on Node and Workers)
// ---------------------------------------------------------------------------

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(authSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

// ---------------------------------------------------------------------------
// Redirects
// ---------------------------------------------------------------------------

/** Only allow same-site absolute paths, never protocol-relative URLs. */
export function safeRedirect(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

// ---------------------------------------------------------------------------
// Session cookie
// ---------------------------------------------------------------------------

function sessionCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env["NODE_ENV"] === "production",
    maxAge: SESSION_TTL_SECONDS,
  };
}

function oauthCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env["NODE_ENV"] === "production",
    maxAge: OAUTH_TTL_SECONDS,
  };
}

export async function issueSessionToken(userId: number): Promise<string> {
  const payload = base64UrlEncode(
    encoder.encode(JSON.stringify({ uid: userId, exp: Date.now() + SESSION_TTL_SECONDS * 1000 })),
  );
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function setSessionCookie(userId: number): Promise<void> {
  setCookie(SESSION_COOKIE, await issueSessionToken(userId), sessionCookieOptions());
}

function bearerToken(): string | undefined {
  try {
    const header = getRequestHeader("authorization");
    if (!header) return undefined;
    const [scheme, token] = header.split(/\s+/);
    return scheme?.toLowerCase() === "bearer" && token ? token : undefined;
  } catch {
    return undefined;
  }
}

export function clearSessionCookie(): void {
  deleteCookie(SESSION_COOKIE, { path: "/" });
  deleteCookie(LEGACY_ADMIN_COOKIE, { path: "/" });
}

/** Resolves the signed-in user from the cookie or Bearer token, or `null`. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = getCookie(SESSION_COOKIE) ?? bearerToken();
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!timingSafeEqualString(signature, await sign(payload))) return null;

  let data: { uid?: number; exp?: number };
  try {
    data = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
  } catch {
    return null;
  }
  if (typeof data.uid !== "number" || typeof data.exp !== "number" || data.exp < Date.now()) {
    return null;
  }

  return findUserById(data.uid);
}

export async function findUserById(userId: number): Promise<SessionUser | null> {
  const result = await getTurso().execute({
    sql: "SELECT id, email, display_name, is_admin, is_guest FROM users WHERE id = ?",
    args: [userId],
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  const email = String(row["email"]);
  return {
    id: Number(row["id"]),
    email,
    name: String(row["display_name"] || ""),
    isAdmin: Number(row["is_admin"]) === 1,
    isGuest: Number(row["is_guest"]) === 1,
  };
}

// ---------------------------------------------------------------------------
// OAuth one-time cookies
// ---------------------------------------------------------------------------

export function setOAuthCookies(state: string, verifier: string, redirect: string): void {
  setCookie(OAUTH_STATE_COOKIE, state, oauthCookieOptions());
  setCookie(OAUTH_VERIFIER_COOKIE, verifier, oauthCookieOptions());
  setCookie(OAUTH_REDIRECT_COOKIE, redirect, oauthCookieOptions());
}

export function clearOAuthCookies(): void {
  deleteCookie(OAUTH_STATE_COOKIE, { path: "/" });
  deleteCookie(OAUTH_VERIFIER_COOKIE, { path: "/" });
  deleteCookie(OAUTH_REDIRECT_COOKIE, { path: "/" });
}

export function getOAuthStateCookie(): string | undefined {
  return getCookie(OAUTH_STATE_COOKIE);
}

export function getOAuthVerifierCookie(): string | undefined {
  return getCookie(OAUTH_VERIFIER_COOKIE);
}

export function getOAuthRedirectCookie(): string | undefined {
  return getCookie(OAUTH_REDIRECT_COOKIE);
}

// ---------------------------------------------------------------------------
// Google endpoints
// ---------------------------------------------------------------------------

export function googleCallbackUrl(request: Request): string {
  const configured = process.env["APP_URL"];
  const origin = configured ? configured.replace(/\/+$/, "") : new URL(request.url).origin;
  return `${origin}/api/auth/google/callback`;
}

export function googleAuthorizeUrl(input: {
  callbackUrl: string;
  state: string;
  challenge: string;
}): string {
  const params = new URLSearchParams({
    client_id: googleClientId(),
    redirect_uri: input.callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    state: input.state,
    code_challenge: input.challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCode(input: {
  code: string;
  verifier: string;
  callbackUrl: string;
}): Promise<{ accessToken: string }> {
  const body = new URLSearchParams({
    code: input.code,
    client_id: googleClientId(),
    client_secret: googleClientSecret(),
    redirect_uri: input.callbackUrl,
    grant_type: "authorization_code",
    code_verifier: input.verifier,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    console.error("[auth] Google token exchange failed", response.status, await response.text());
    throw new Error("token_exchange_failed");
  }

  const data = (await response.json()) as { access_token?: unknown };
  if (typeof data.access_token !== "string" || !data.access_token) {
    throw new Error("token_exchange_failed");
  }
  return { accessToken: data.access_token };
}

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    console.error("[auth] Google userinfo failed", response.status);
    throw new Error("profile_fetch_failed");
  }

  const data = (await response.json()) as {
    sub?: unknown;
    email?: unknown;
    email_verified?: unknown;
  };
  if (
    typeof data.sub !== "string" ||
    !data.sub ||
    typeof data.email !== "string" ||
    !data.email ||
    data.email_verified !== true
  ) {
    throw new Error("profile_incomplete");
  }

  return { sub: data.sub, email: data.email };
}

// ---------------------------------------------------------------------------
// User rows
// ---------------------------------------------------------------------------

/** Records the first admin as the owner so later visitors cannot claim it. */
async function recordOwnerIfMissing(email: string): Promise<void> {
  try {
    const turso = getTurso();
    const existing = await turso.execute("SELECT value FROM settings WHERE key = 'owner_email'");
    if (existing.rows[0]) return;
    await turso.execute({
      sql: "INSERT INTO settings (key, value, updated_at) VALUES ('owner_email', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
      args: [email, new Date().toISOString()],
    });
  } catch {
    // Best-effort: a missing settings table or unavailable DB must not block sign-in.
  }
}

/**
 * With no recorded owner and no admin, the first Google account to sign in
 * becomes admin. Activation is a later, optional onboarding step, so ownership
 * must be claimable before the store is licensed.
 */
async function claimOwnership(user: SessionUser): Promise<SessionUser> {
  if (user.isGuest) return user;

  if (user.isAdmin) {
    await recordOwnerIfMissing(user.email);
    return user;
  }

  try {
    const turso = getTurso();
    const owner = await turso.execute("SELECT value FROM settings WHERE key = 'owner_email'");
    if (owner.rows[0]) return user;

    const admins = await turso.execute({
      sql: "SELECT COUNT(*) AS n FROM users WHERE is_admin = 1 AND email <> ?",
      args: [DEMO_ADMIN_EMAIL],
    });
    if (Number(admins.rows[0]?.n ?? 0) > 0) return user;

    await turso.batch(
      [
        { sql: "UPDATE users SET is_admin = 1 WHERE id = ?", args: [user.id] },
        {
          sql: "INSERT INTO settings (key, value, updated_at) VALUES ('owner_email', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
          args: [user.email, new Date().toISOString()],
        },
      ],
      "write",
    );

    return { ...user, isAdmin: true };
  } catch {
    return user;
  }
}

/**
 * Find or create the local user row for a Google profile.
 * - Match `google_sub` first.
 * - Otherwise link an existing row by email.
 * - Otherwise insert a new account.
 * An email listed in ADMIN_EMAILS is granted admin on sign-in; an existing
 * manual admin grant is never removed here.
 */
export async function upsertGoogleUser(profile: GoogleProfile): Promise<SessionUser> {
  const turso = getTurso();
  const now = new Date().toISOString();
  const email = profile.email.trim().toLowerCase();
  const shouldBeAdmin = adminEmails().includes(email);

  const bySub = await turso.execute({
    sql: "SELECT id FROM users WHERE google_sub = ?",
    args: [profile.sub],
  });
  if (bySub.rows[0]) {
    const id = Number(bySub.rows[0]["id"]);
    await turso.execute({
      sql: "UPDATE users SET email = ?, last_sign_in_at = ?, is_admin = CASE WHEN ? = 1 THEN 1 ELSE is_admin END WHERE id = ?",
      args: [email, now, shouldBeAdmin ? 1 : 0, id],
    });
    return claimOwnership(
      (await findUserById(id)) ?? {
        id,
        email,
        name: "",
        isAdmin: shouldBeAdmin,
        isGuest: false,
      },
    );
  }

  const byEmail = await turso.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: [email],
  });
  if (byEmail.rows[0]) {
    const id = Number(byEmail.rows[0]["id"]);
    await turso.execute({
      sql: "UPDATE users SET google_sub = ?, last_sign_in_at = ?, is_admin = CASE WHEN ? = 1 THEN 1 ELSE is_admin END WHERE id = ?",
      args: [profile.sub, now, shouldBeAdmin ? 1 : 0, id],
    });
    return claimOwnership(
      (await findUserById(id)) ?? {
        id,
        email,
        name: "",
        isAdmin: shouldBeAdmin,
        isGuest: false,
      },
    );
  }

  const insert = await turso.execute({
    sql: "INSERT INTO users (email, google_sub, is_admin, created_at, last_sign_in_at) VALUES (?, ?, ?, ?, ?)",
    args: [email, profile.sub, shouldBeAdmin ? 1 : 0, now, now],
  });
  return claimOwnership({
    id: Number(insert.lastInsertRowid),
    email,
    name: "",
    isAdmin: shouldBeAdmin,
    isGuest: false,
  });
}
