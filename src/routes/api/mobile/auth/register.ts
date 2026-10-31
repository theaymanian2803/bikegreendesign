import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mobile/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { mobileError, mobileJson } = await import("@/integrations/turso/mobile-api.server");
        try {
          const { registerEmailAccount } = await import("@/integrations/turso/email-auth.server");
          return mobileJson(await registerEmailAccount(await request.json()), 201);
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
