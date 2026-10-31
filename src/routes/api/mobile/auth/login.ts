import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mobile/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { mobileError, mobileJson } = await import("@/integrations/turso/mobile-api.server");
        try {
          const { loginEmailAccount } = await import("@/integrations/turso/email-auth.server");
          return mobileJson(await loginEmailAccount(await request.json()));
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
