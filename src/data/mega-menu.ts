import helmetRed from "@/assets/p-helmet-red.jpg";
import helmetBlack from "@/assets/p-helmet-black.jpg";
import helmetPink from "@/assets/p-helmet-pink.jpg";
import derailleur from "@/assets/p-derailleur.jpg";
import crank from "@/assets/p-crank.jpg";
import suspension from "@/assets/p-suspension.jpg";
import stem from "@/assets/p-stem.jpg";
import wheel from "@/assets/p-wheel.jpg";
import heroSnow from "@/assets/hero-bike-snow.jpg";
import ctaRoad from "@/assets/cta-road.jpg";

/**
 * Mega menu content model.
 *
 * Everything below is shaped so it can be swapped for a database source later:
 * `getMegaMenu(menuKey)` is async and is the only thing components call. When a
 * backend exists, replace the body of `getMegaMenu` with a query (server fn /
 * table read) that returns the exact same shapes — no component changes needed.
 */

export type MegaMenuCategory = {
  id: string;
  label: string;
  image: string;
  /** Route path to open, e.g. "/shop". Kept as data for CMS-driven links. */
  href: string;
};

export type MegaMenuProduct = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  badge?: string;
  /** Optional product route id; falls back to `id`. */
  productId?: string;
};

export type MegaMenuBanner = {
  image: string;
  alt: string;
};

export type MegaMenuContent = {
  key: string;
  categoriesTitle: string;
  categories: MegaMenuCategory[];
  productsTitle: string;
  products: MegaMenuProduct[];
  leftBanner?: MegaMenuBanner;
  rightBanner?: MegaMenuBanner;
};

const cat = (id: string, label: string, image: string): MegaMenuCategory => ({
  id,
  label,
  image,
  href: "/shop",
});

const sharedCategories: MegaMenuCategory[] = [
  cat("helmets", "Helmets", helmetRed),
  cat("folding-bikes", "Folding Bikes", suspension),
  cat("repair-stands", "Repair Stands", derailleur),
  cat("road-bikes", "Road Bikes", crank),
  cat("chain-lubricants", "Chain Lubricants", crank),
  cat("kickstands", "Kickstands", stem),
  cat("monocycles", "Monocycles", wheel),
  cat("mountain-bikes", "Mountain Bikes", helmetBlack),
];

const sharedProducts: MegaMenuProduct[] = [
  {
    id: "calandis-stem",
    name: "110mm Adjustable Adustable Stem Bicycle Handlebar",
    price: 195,
    image: stem,
  },
  {
    id: "djc-chainring",
    name: "Shimano Alivio Crank Crankset Chainring 170mm",
    price: 372,
    oldPrice: 400,
    image: crank,
    badge: "-7%",
  },
  {
    id: "giro-syntax",
    name: "Schrodinger Adult Bicycle Cycle Road Helmet",
    price: 340,
    image: helmetBlack,
  },
  {
    id: "fcc-racing",
    name: "4pcs Mountain Bike Lock Bicycle Disc Rotor",
    price: 333,
    oldPrice: 370,
    image: suspension,
    badge: "-10%",
  },
  {
    id: "toronto-crank",
    name: "Moxic Aluminium Alloy Bicycle Stem Riser",
    price: 299,
    image: crank,
  },
  {
    id: "bullseye-wheels",
    name: "Trending Fuji Silhouette 1.7 Disc Wheelset",
    price: 650,
    image: wheel,
    badge: "Pack",
  },
];

const menus: Record<string, MegaMenuContent> = {
  shop: {
    key: "shop",
    categoriesTitle: "Shop By",
    categories: sharedCategories,
    productsTitle: "Top Rated",
    products: sharedProducts,
    leftBanner: { image: heroSnow, alt: "Mountain bike in the snow" },
    rightBanner: { image: ctaRoad, alt: "Road bike wheel close up" },
  },
  categories: {
    key: "categories",
    categoriesTitle: "Shop By",
    categories: sharedCategories,
    productsTitle: "Top Rated",
    products: sharedProducts,
    leftBanner: { image: heroSnow, alt: "Mountain bike in the snow" },
    rightBanner: { image: ctaRoad, alt: "Road bike wheel close up" },
  },
  products: {
    key: "products",
    categoriesTitle: "Shop By",
    categories: sharedCategories,
    productsTitle: "Best Sellers",
    products: sharedProducts,
    leftBanner: { image: heroSnow, alt: "Mountain bike in the snow" },
    rightBanner: { image: ctaRoad, alt: "Road bike wheel close up" },
  },
  "top-deals": {
    key: "top-deals",
    categoriesTitle: "Shop By",
    categories: sharedCategories,
    productsTitle: "Top Deals",
    products: sharedProducts,
    leftBanner: { image: heroSnow, alt: "Mountain bike in the snow" },
    rightBanner: { image: ctaRoad, alt: "Road bike wheel close up" },
  },
  elements: {
    key: "elements",
    categoriesTitle: "Shop By",
    categories: sharedCategories,
    productsTitle: "Top Rated",
    products: sharedProducts,
    leftBanner: { image: heroSnow, alt: "Mountain bike in the snow" },
    rightBanner: { image: ctaRoad, alt: "Road bike wheel close up" },
  },
};

/** Synchronous fallback used for the first render / SSR. */
export function getMegaMenuSync(menuKey: string): MegaMenuContent | undefined {
  return menus[menuKey];
}

/** Single data entry point — swap this for a DB/server-fn call later. */
export async function getMegaMenu(menuKey: string): Promise<MegaMenuContent | undefined> {
  return menus[menuKey];
}

export const megaMenuKeys = Object.keys(menus);
