import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mobile/bootstrap")({
  server: {
    handlers: {
      GET: async () => {
        const { mobileJson, mobileError } = await import("@/integrations/turso/mobile-api.server");
        try {
          const [
            { getSettings },
            { getTopBarSettings },
            { listCatalogCategories, listCatalogProducts },
            { getMobileLandingSections },
          ] = await Promise.all([
            import("@/lib/settings.functions"),
            import("@/lib/topbar.functions"),
            import("@/integrations/turso/catalog.functions"),
            import("@/integrations/turso/landing.functions"),
          ]);

          const [settings, topBar, categories, products, sections] = await Promise.all([
            getSettings(),
            getTopBarSettings(),
            listCatalogCategories(),
            listCatalogProducts(),
            getMobileLandingSections(),
          ]);

          return mobileJson({ settings, topBar, categories, products, sections });
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
