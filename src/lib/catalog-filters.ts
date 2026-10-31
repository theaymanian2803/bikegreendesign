import type { CatalogProduct } from "./catalog";

/**
 * Filters the catalogue by the category's stored slug.
 *
 * The product only carries the category's display name, so matching on a
 * re-derived slug from that name breaks the moment an admin edits the slug in
 * `/admin/categories`. Always compare against `categorySlug`.
 */
export function filterByCategory(
  products: CatalogProduct[],
  categorySlug: string | undefined,
): CatalogProduct[] {
  if (!categorySlug) return products;
  return products.filter((p) => p.categorySlug === categorySlug);
}
