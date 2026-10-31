import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/google/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const {
          codeChallenge,
          googleAuthorizeUrl,
          googleCallbackUrl,
          randomToken,
          safeRedirect,
          setOAuthCookies,
        } = await import("@/integrations/turso/auth.server");

        const url = new URL(request.url);
        const redirect = safeRedirect(url.searchParams.get("redirect"));

        const state = randomToken(32);
        const verifier = randomToken(32);
        const challenge = await codeChallenge(verifier);

        setOAuthCookies(state, verifier, redirect);

        return new Response(null, {
          status: 302,
          headers: {
            location: googleAuthorizeUrl({
              callbackUrl: googleCallbackUrl(request),
              state,
              challenge,
            }),
          },
        });
      },
    },
  },
});
