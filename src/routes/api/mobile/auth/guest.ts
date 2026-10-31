import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mobile/auth/guest")({
  server: {
    handlers: {
      POST: async () => {
        const { mobileError, mobileJson } = await import("@/integrations/turso/mobile-api.server");
        try {
          const { createGuestAccount } = await import("@/integrations/turso/email-auth.server");
          return mobileJson(await createGuestAccount(), 201);
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
