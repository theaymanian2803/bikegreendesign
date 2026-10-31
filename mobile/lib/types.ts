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

export type Review = {
  id: number;
  productId: number;
  productSlug: string;
  productName: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type ProductReviews = {
  reviews: Review[];
  average: number;
  count: number;
};

export type LandingPlatform = "web" | "mobile" | "both";

export type LandingSection = {
  id: number;
  sectionKey: string;
  type: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  visible: boolean;
  sortOrder: number;
  platform: LandingPlatform;
  config: Record<string, unknown>;
};

export type StoreSettings = {
  freeShippingThresholdCents: number;
  flatShippingCents: number;
  storeEmail: string;
  storePhone: string;
};

export type TopBarSettings = {
  enabled: boolean;
  location: string;
  phone: string;
  email: string;
  trackOrderHref: string;
};

export type Bootstrap = {
  settings: StoreSettings;
  topBar: TopBarSettings;
  categories: CatalogCategory[];
  products: CatalogProduct[];
  sections: LandingSection[];
};

export type TrackedOrder = {
  id: number;
  publicId: string;
  status: "new" | "processing" | "shipped" | "delivered" | "cancelled";
  totalCents: number;
  createdAt: string;
  items: { name: string; priceCents: number; qty: number }[];
};

export type ProductDetail = {
  product: CatalogProduct;
  related: CatalogProduct[];
};
