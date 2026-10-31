import { getTurso } from "./client";
import { currentLicense } from "./license.server";
import { DEMO_ADMIN_EMAIL, findUserById, setSessionCookie, type SessionUser } from "./auth.server";

/**
 * Signs the visitor in as the local demo admin so the onboarding tour can walk
 * the real admin screens without Google OAuth.
 *
 * Deliberately limited to unlicensed stores with demo mode enabled. Activation
 * turns this off. The demo row is never treated as the store owner.
 */
export async function signInDemoAdmin(): Promise<SessionUser | null> {
  const license = await currentLicense();
  if (!license.demoMode || license.licensed) return null;

  const turso = getTurso();
  const now = new Date().toISOString();

  await turso.execute({
    sql: `INSERT INTO users (email, display_name, is_admin, is_guest, last_sign_in_at)
          VALUES (?, ?, 1, 0, ?)
          ON CONFLICT(email) DO UPDATE SET
            is_admin = 1,
            is_guest = 0,
            last_sign_in_at = excluded.last_sign_in_at`,
    args: [DEMO_ADMIN_EMAIL, "Demo Admin", now],
  });

  const result = await turso.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: [DEMO_ADMIN_EMAIL],
  });
  const id = Number(result.rows[0]?.id ?? 0);
  if (!Number.isFinite(id) || id <= 0) return null;

  await setSessionCookie(id);
  return findUserById(id);
}
