import { createFileRoute } from "@tanstack/react-router";

function redirectTo(location: string): Response {
  return new Response(null, { status: 302, headers: { location } });
}

export const Route = createFileRoute("/api/auth/google/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const {
          clearOAuthCookies,
          exchangeCode,
          fetchGoogleProfile,
          getOAuthRedirectCookie,
          getOAuthStateCookie,
          getOAuthVerifierCookie,
          googleCallbackUrl,
          safeRedirect,
          setSessionCookie,
          timingSafeEqualString,
          upsertGoogleUser,
        } = await import("@/integrations/turso/auth.server");

        const url = new URL(request.url);

        const googleError = url.searchParams.get("error");
        if (googleError) {
          clearOAuthCookies();
          return redirectTo(
            `/auth?error=${googleError === "access_denied" ? "access_denied" : "oauth_failed"}`,
          );
        }

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const expectedState = getOAuthStateCookie();
        const verifier = getOAuthVerifierCookie();
        const redirect = safeRedirect(getOAuthRedirectCookie());

        clearOAuthCookies();

        if (!code || !state || !expectedState || !timingSafeEqualString(state, expectedState)) {
          return redirectTo("/auth?error=oauth_state");
        }
        if (!verifier) {
          return redirectTo("/auth?error=oauth_state");
        }

        try {
          const { accessToken } = await exchangeCode({
            code,
            verifier,
            callbackUrl: googleCallbackUrl(request),
          });
          const profile = await fetchGoogleProfile(accessToken);
          const user = await upsertGoogleUser(profile);
          await setSessionCookie(user.id);
          return redirectTo(redirect);
        } catch (error) {
          console.error("[auth] Google callback failed", error);
          return redirectTo("/auth?error=oauth_failed");
        }
      },
    },
  },
});
