import { createServerFn } from "@tanstack/react-start";

// Server-only imports are loaded lazily so they stay out of the client bundle.
const server = () => import("@/integrations/turso/auth.server");

/** Resolves the signed-in user, or `null`. */
export const getSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await server();
  return getSessionUser();
});

/** Clears the user session cookie. */
export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const { clearSessionCookie } = await server();
  clearSessionCookie();
  return { ok: true };
});

/**
 * Signs in the local demo admin while the store is unlicensed and demo mode is
 * on. Used by the onboarding tour so it can cover the admin screens without
 * Google OAuth. Returns `null` once the store is activated.
 */
export const signInDemoAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { signInDemoAdmin } = await import("@/integrations/turso/demo-admin.server");
  return signInDemoAdmin();
});
