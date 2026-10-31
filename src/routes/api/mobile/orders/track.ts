import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mobile/orders/track")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { mobileJson, mobileError } = await import("@/integrations/turso/mobile-api.server");
        try {
          const phone = new URL(request.url).searchParams.get("phone") ?? "";
          const { trackOrdersByPhone } = await import("@/lib/orders.functions");
          return mobileJson(await trackOrdersByPhone({ data: phone }));
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
