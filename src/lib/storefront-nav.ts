import { getStorefrontNavigationData } from "@/integrations/turso/catalog.functions";
import type { StorefrontNavigation } from "@/lib/catalog";

let cached: StorefrontNavigation | null = null;
let pending: Promise<StorefrontNavigation> | null = null;

/** Shared navigation data, fetched once per browser session. */
export function getStorefrontNavigation(): Promise<StorefrontNavigation> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = getStorefrontNavigationData()
      .then((data) => {
        cached = data;
        pending = null;
        return data;
      })
      .catch((error) => {
        pending = null;
        throw error;
      });
  }
  return pending;
}
