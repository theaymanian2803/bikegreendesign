import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mobile/reviews")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { mobileJson, mobileError } = await import("@/integrations/turso/mobile-api.server");
        try {
          const url = new URL(request.url);
          const productId = url.searchParams.get("productId");
          if (productId) {
            const { listProductReviews } = await import("@/integrations/turso/reviews.functions");
            return mobileJson(await listProductReviews({ data: productId }));
          }
          const limitRaw = Number(url.searchParams.get("limit") ?? "6");
          const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 24) : 6;
          const { listApprovedReviews } = await import("@/integrations/turso/reviews.functions");
          return mobileJson(await listApprovedReviews({ data: limit }));
        } catch (error) {
          return mobileError(error, 500);
        }
      },
      POST: async ({ request }) => {
        const { mobileJson, mobileError } = await import("@/integrations/turso/mobile-api.server");
        try {
          const body = await request.json();
          const { createReview } = await import("@/integrations/turso/reviews.functions");
          return mobileJson(await createReview({ data: body }), 201);
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
