// Shared catalog model for the storefront. Client-safe (no server imports).
// The database source of truth lives in src/integrations/turso/catalog.functions.ts.

export type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  rating: number;
  image: string;
  badge?: string;
  category: string;
  brand?: string;
  sku?: string;
  description?: string;
  highlights?: string[];
  specs?: { label: string; value: string }[];
};

export type CatalogCategory = {
  id: number;
  name: string;
  slug: string;
  image: string;
  description: string;
  count: number;
};

export type StorefrontNavigation = {
  categories: CatalogCategory[];
  products: CatalogProduct[];
};

const galleryPool = [
  "/menu/p-derailleur.jpg",
  "/menu/p-wheel.jpg",
  "/menu/p-crank.jpg",
  "/menu/p-stem.jpg",
  "/menu/p-suspension.jpg",
];

export function productGallery(p: CatalogProduct) {
  return [p.image, ...galleryPool.filter((g) => g !== p.image).slice(0, 3)];
}
