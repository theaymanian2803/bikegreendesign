/**
 * Mega menu content model.
 *
 * Types live here rather than beside a data-access module so both the server
 * functions and the site header can import them without dragging a backend
 * client into the other's bundle.
 */

export type MegaMenuCategory = {
  id: string;
  label: string;
  image: string;
  href: string;
};

export type MegaMenuProduct = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  badge?: string;
  href: string;
};

export type MegaMenuBanner = {
  image: string;
  alt: string;
};

export type MegaMenuContent = {
  key: string;
  title: string;
  categoriesTitle: string;
  categories: MegaMenuCategory[];
  productsTitle: string;
  products: MegaMenuProduct[];
  leftBanner?: MegaMenuBanner;
  rightBanner?: MegaMenuBanner;
};

/** Menu tabs that render a dropdown. Mirrors the seeded rows in `mega_menus`. */
export const megaMenuKeys = ["shop", "categories", "products", "top-deals", "elements"];

const cache = new Map<string, MegaMenuContent>();

/** Cached content for the first (synchronous) render. */
export function getMegaMenuSync(menuKey: string): MegaMenuContent | undefined {
  return cache.get(menuKey);
}

/** Single data entry point — reads the mega menu tables on the server. */
export async function getMegaMenu(menuKey: string): Promise<MegaMenuContent | undefined> {
  const { getMegaMenuData } = await import("@/integrations/turso/mega-menu.functions");
  const content = await getMegaMenuData({ data: menuKey });
  if (!content) return undefined;
  cache.set(menuKey, content);
  return content;
}
