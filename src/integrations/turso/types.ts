// Row shapes for the Turso (libSQL) tables (see db/schema.sql).
// These types describe what the server reads/writes; IDs are integer rowids.

export type UserRow = {
  id: number;
  email: string;
  google_sub: string | null;
  is_admin: number; // 0 | 1
  created_at: string;
  last_sign_in_at: string | null;
};

export type MegaMenuRow = {
  key: string;
  title: string;
  categories_title: string;
  products_title: string;
  left_banner_image: string | null;
  left_banner_alt: string | null;
  right_banner_image: string | null;
  right_banner_alt: string | null;
  sort_order: number;
};

export type MegaMenuCategoryRow = {
  id: number;
  menu_key: string;
  label: string;
  image_url: string;
  href: string;
  sort_order: number;
};

export type MegaMenuProductRow = {
  id: number;
  menu_key: string;
  name: string;
  price: number;
  old_price: number | null;
  badge: string | null;
  image_url: string;
  href: string;
  sort_order: number;
};

export type OrderRow = {
  id: number;
  public_id: string | null;
  email: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  created_at: string;
};

export type OrderItemRow = {
  id: number;
  order_id: number;
  name: string;
  price_cents: number;
  qty: number;
};
