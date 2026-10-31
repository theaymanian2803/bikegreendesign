import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mobile/auth/session")({
  server: {
    handlers: {
      GET: async () => {
        const { mobileError, mobileJson } = await import("@/integrations/turso/mobile-api.server");
        try {
          const { getSessionUser } = await import("@/integrations/turso/auth.server");
          return mobileJson({ user: await getSessionUser() });
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
