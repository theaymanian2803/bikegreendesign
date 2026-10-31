# TODOS

## Deploy — tomorrow

1. **Environment variables in the host** (Cloudflare dashboard / CI secrets — never a
   file in the repo): `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `ADMIN_EMAILS`,
   `APP_URL`. Values are in the local `.env`; `.env.example` lists the keys.

2. **Point Google OAuth at production.** Add
   `https://<your-domain>/api/auth/google/callback` as an authorised redirect URI
   on the Google client, and set `APP_URL` to `https://<your-domain>`. Without
   this, Google sign-in fails only in production.

3. **Build and deploy.** `bun install` then `bun run build`. Output lands in
   `.output/` with the Nitro Cloudflare Workers preset; deploy that (wrangler or
   the host's Git integration).

4. **Check the database is already provisioned.** Development ran against the
   live Turso database, so the schema and all 12 migrations are applied. Run
   `bun run db:setup` once against production and confirm it prints
   "All migrations already applied" with row counts unchanged.

5. **Make sure you are an admin in production.** `ADMIN_EMAILS` must contain the
   Google address you will sign in with, otherwise `/admin` redirects you out.
   Existing `is_admin` rows carry over with the database.

6. **Decide on the licence.** Admin reads work unlicensed; every write redirects
   to `/activate`. Either activate with your key, or set `LICENSE_DISABLED=1` in
   the host environment if this deployment is your own shop.

7. **Smoke test after deploy**, in this order: `/` (design intact, products and
   reviews load) → `/shop` (13 products, filters, sort) → `/product/<slug>`
   (gallery, reviews, add to cart) → `/auth` (Google sign-in) → `/checkout`
   (guest checkout writes an order) → `/account/orders` (the order appears) →
   `/admin` → `/admin/orders` (the order is visible, change its status) →
   `/admin/products` (save a change) → `/api/mobile/bootstrap` (JSON, no auth).

8. **Point the mobile app at production.** Set `EXPO_PUBLIC_API_URL` to the
   deployed origin before building the Expo app; it defaults to
   `http://10.0.2.2:8080`, which only works against a local server on the Android
   emulator.

## Fix before showing customers

- **Products have no category.** All 13 rows have `category_id = NULL`, so every
  category count on `/shop` is `0` and filtering returns nothing. Assign
  categories in `/admin/products`.
- **Demo mode is on.** `settings.demo_mode` is unset, so `DemoBanner` and the
  setup tour appear for every visitor. Turn it off in `/admin/settings`.
- **Admin writes need the licence decision from step 6.**

## Deferred — known, accepted for now

- `MegaMenu` has no `.catch` on its fetch; a failed call leaves the panel closed.
- `/shop?q=` is accepted by the search schema but nothing filters on it.
- Checkout can bounce a guest to `/auth` while the session query is still loading.
- The homepage loads landing sections and the popup even when rendering the
  designed page (`home_source = static`).
- `mobile:typecheck` is not part of any CI run.
- The order-history rows use a grey placeholder instead of a product thumbnail:
  `order_items` stores no image.

## Later

- Order detail page for customers (currently the list expands inline).
- Admin: create/edit users without the demo step; password reset flow.
- Newsletter double opt-in and unsubscribe.
- Payment gateway — orders are persisted, not charged.
- Re-check the mobile theme against the web tokens whenever `src/styles.css`
  changes; the mapping table is in `mobile/lib/theme.ts`.
