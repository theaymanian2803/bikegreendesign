import { supabase } from "@/integrations/supabase/client";

/**
 * Mega menu content model — now database driven.
 *
 * Tables: `mega_menus`, `mega_menu_categories`, `mega_menu_products`.
 * Components only ever call `getMegaMenu(menuKey)` / `getMegaMenuSync(menuKey)`.
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

function banner(image: string | null, alt: string | null): MegaMenuBanner | undefined {
  return image ? { image, alt: alt ?? "" } : undefined;
}

/** Cached content for the first (synchronous) render. */
export function getMegaMenuSync(menuKey: string): MegaMenuContent | undefined {
  return cache.get(menuKey);
}

/** Single data entry point — reads the mega menu tables. */
export async function getMegaMenu(menuKey: string): Promise<MegaMenuContent | undefined> {
  const [menuRes, catRes, prodRes] = await Promise.all([
    supabase.from("mega_menus").select("*").eq("key", menuKey).maybeSingle(),
    supabase
      .from("mega_menu_categories")
      .select("*")
      .eq("menu_key", menuKey)
      .order("sort_order", { ascending: true }),
    supabase
      .from("mega_menu_products")
      .select("*")
      .eq("menu_key", menuKey)
      .order("sort_order", { ascending: true }),
  ]);

  const menu = menuRes.data;
  if (!menu) return undefined;

  const content: MegaMenuContent = {
    key: menu.key,
    title: menu.title,
    categoriesTitle: menu.categories_title,
    productsTitle: menu.products_title,
    categories: (catRes.data ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      image: c.image_url,
      href: c.href,
    })),
    products: (prodRes.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      oldPrice: p.old_price === null ? undefined : Number(p.old_price),
      image: p.image_url,
      badge: p.badge ?? undefined,
      href: p.href,
    })),
    leftBanner: banner(menu.left_banner_image, menu.left_banner_alt),
    rightBanner: banner(menu.right_banner_image, menu.right_banner_alt),
  };

  cache.set(menuKey, content);
  return content;
}
