-- Pathway Bike Shop — Turso (libSQL) schema.
-- Apply with: bun run db:setup

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  google_sub TEXT, -- Google account subject id from OpenID Connect
  password_hash TEXT,
  display_name TEXT NOT NULL DEFAULT '',
  is_guest INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_sign_in_at TEXT
);

CREATE TABLE IF NOT EXISTS landing_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_key TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  visible INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  platform TEXT NOT NULL DEFAULT 'both' CHECK(platform IN ('web','mobile','both')),
  config TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_landing_sections_sort ON landing_sections(sort_order, id);

CREATE TABLE IF NOT EXISTS mega_menus (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  categories_title TEXT NOT NULL DEFAULT 'Shop By',
  products_title TEXT NOT NULL DEFAULT 'Top Rated',
  left_banner_image TEXT,
  left_banner_alt TEXT,
  right_banner_image TEXT,
  right_banner_alt TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS mega_menu_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_key TEXT NOT NULL REFERENCES mega_menus(key) ON DELETE CASCADE,
  label TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  href TEXT NOT NULL DEFAULT '/shop',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS mega_menu_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_key TEXT NOT NULL REFERENCES mega_menus(key) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  old_price REAL,
  badge TEXT,
  image_url TEXT NOT NULL DEFAULT '',
  href TEXT NOT NULL DEFAULT '/shop',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT NOT NULL,
  notes TEXT,
  subtotal_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  qty INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  old_price REAL,
  badge TEXT,
  rating REAL NOT NULL DEFAULT 5,
  image_url TEXT NOT NULL DEFAULT '',
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  brand TEXT NOT NULL DEFAULT '',
  sku TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  highlights TEXT NOT NULL DEFAULT '[]',
  specs TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK(rating BETWEEN 1 AND 5),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_mega_menu_categories_menu ON mega_menu_categories(menu_key);
CREATE INDEX IF NOT EXISTS idx_mega_menu_products_menu ON mega_menu_products(menu_key);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
