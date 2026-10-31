import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mobile/orders/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { mobileJson, mobileError } = await import("@/integrations/turso/mobile-api.server");
        try {
          const body = await request.json();
          const { placeOrder } = await import("@/lib/orders.functions");
          return mobileJson(await placeOrder({ data: body }), 201);
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
