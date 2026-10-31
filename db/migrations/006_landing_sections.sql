CREATE TABLE IF NOT EXISTS landing_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_key TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  visible INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  config TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_landing_sections_sort ON landing_sections(sort_order, id);
