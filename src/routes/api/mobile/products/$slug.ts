import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mobile/products/$slug")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { mobileJson, mobileError } = await import("@/integrations/turso/mobile-api.server");
        try {
          const slug = decodeURIComponent(new URL(request.url).pathname.split("/").pop() ?? "");
          const { getCatalogProduct } = await import("@/integrations/turso/catalog.functions");
          const data = await getCatalogProduct({ data: slug });
          if (!data) return mobileJson({ error: "Product not found" }, 404);
          return mobileJson(data);
        } catch (error) {
          return mobileError(error, 500);
        }
      },
      OPTIONS: async () => {
        const { mobileOptions } = await import("@/integrations/turso/mobile-api.server");
        return mobileOptions();
      },
    },
  },
});
