import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mobile/categories")({
  server: {
    handlers: {
      GET: async () => {
        const { mobileJson, mobileError } = await import("@/integrations/turso/mobile-api.server");
        try {
          const { listCatalogCategories } = await import("@/integrations/turso/catalog.functions");
          return mobileJson(await listCatalogCategories());
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
