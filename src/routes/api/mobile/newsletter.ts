import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mobile/newsletter")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { mobileJson, mobileError } = await import("@/integrations/turso/mobile-api.server");
        try {
          const body = await request.json();
          const { subscribeNewsletter } = await import("@/lib/newsletter.functions");
          return mobileJson(await subscribeNewsletter({ data: body }), 201);
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
