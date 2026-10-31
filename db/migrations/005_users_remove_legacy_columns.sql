DROP TABLE IF EXISTS users_rebuild;
CREATE TABLE users_rebuild (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  google_sub TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_sign_in_at TEXT
);
INSERT INTO users_rebuild (id, email, google_sub, is_admin, created_at, last_sign_in_at)
SELECT id, email, google_sub, is_admin, created_at, last_sign_in_at FROM users;
DROP TABLE users;
ALTER TABLE users_rebuild RENAME TO users;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL;
