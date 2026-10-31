import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/guest")({
  server: {
    handlers: {
      POST: async () => {
        const { mobileError, mobileJson } = await import("@/integrations/turso/mobile-api.server");
        try {
          const { createGuestAccount } = await import("@/integrations/turso/email-auth.server");
          const { setSessionCookie } = await import("@/integrations/turso/auth.server");
          const result = await createGuestAccount();
          await setSessionCookie(result.user.id);
          return mobileJson({ user: result.user }, 201);
        } catch (error) {
          return mobileError(error);
        }
      },
    },
  },
});
