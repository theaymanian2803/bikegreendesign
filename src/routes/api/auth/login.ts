import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { mobileError, mobileJson } = await import("@/integrations/turso/mobile-api.server");
        try {
          const { loginEmailAccount } = await import("@/integrations/turso/email-auth.server");
          const { setSessionCookie } = await import("@/integrations/turso/auth.server");
          const result = await loginEmailAccount(await request.json());
          await setSessionCookie(result.user.id);
          return mobileJson({ user: result.user });
        } catch (error) {
          return mobileError(error);
        }
      },
    },
  },
});
