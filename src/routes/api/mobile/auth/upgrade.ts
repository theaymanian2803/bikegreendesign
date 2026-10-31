import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mobile/auth/upgrade")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { mobileError, mobileJson } = await import("@/integrations/turso/mobile-api.server");
        try {
          const { getSessionUser } = await import("@/integrations/turso/auth.server");
          const { upgradeGuestAccount } = await import("@/integrations/turso/email-auth.server");
          const user = await getSessionUser();
          if (!user) return mobileError(new Error("Sign in required."), 401);
          return mobileJson(await upgradeGuestAccount(user.id, await request.json()));
        } catch (error) {
          return mobileError(error);
        }
      },
      OPTIONS: async () => {
        const { mobileOptions } = await import("@/integrations/turso/mobile-api.server");
        return mobileOptions();
      },
    },
  },
});
