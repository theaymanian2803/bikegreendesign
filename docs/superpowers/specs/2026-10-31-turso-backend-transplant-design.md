# Design — Port the Pathway backend and admin into the redesigned storefront

Date: 2026-10-31
Status: awaiting approval
Source of truth: `C:\Users\PC\Desktop\bike replet two-v2`
Target: `C:\Users\PC\Desktop\replitthreebike` (the finished redesign)

## Intent

The redesign in this folder is finished and is not to be redesigned. What it
lacks is everything behind it: the catalog is hardcoded, checkout fakes an order
id, and the only backend is a Supabase project serving three admin screens.

The old project is the working shop. We move its entire backend, admin and
landing-page system into this folder and connect the finished frontend to it.
Nothing is pushed or merged anywhere — this stays a local working tree, and a
new repository will be created afterwards.

## Scope: full functional parity

Everything in `bike replet two-v2` comes over, including the pieces that exist
to sell the template:

- Turso (libSQL) database, schema, seed and all twelve migrations
- The bootstrap/custom database switch layer and `/admin/setup`
- Cookie auth: Google OAuth, email/password, guest sessions, guest upgrade
- The Ed25519 license gate and `/activate`
- The onboarding tour and demo-mode banner
- The Expo app in `mobile/` and `/api/mobile/**`
- Every admin screen: dashboard, orders, products, categories, reviews, users,
  settings, mega menu, landing page, popup, setup
- Catalogs, orders, order tracking, reviews, newsletter, top bar, settings

Only Supabase is removed.

## What moves in

### Database and scripts

`db/schema.sql`, `db/seed.sql`, `db/migrations/001…012`,
`scripts/setup-db.ts`, and the `db:setup`, `test`, `test:watch` scripts.

### Server, straight copy

`src/integrations/turso/` in full: `client.ts`, `types.ts`,
`db-config.server.ts`, `auth.server.ts`, `auth.ts`, `password.server.ts`,
`email-auth.server.ts`, `admin-guard.server.ts`, `catalog.functions.ts`,
`mega-menu.functions.ts`, `reviews.functions.ts`, `landing.functions.ts`,
`license.server.ts`, `demo-admin.server.ts`, `mobile-api.server.ts`.

`src/lib/` in full: `admin.functions.ts`, `auth.functions.ts`, `catalog.ts`,
`dashboard.functions.ts`, `money.ts`, `newsletter.functions.ts`,
`orders.functions.ts`, `settings.functions.ts`, `setup.functions.ts`,
`topbar.functions.ts`, `storefront-nav.ts`, `landing.ts`, `license-token.ts`,
`license.functions.ts`, `onboarding.ts`, `demo-banner.ts`, `error-capture.ts`,
`error-page.ts`, `utils.ts`, `cart.tsx`, `favorites.tsx`.

65 server functions in total, unchanged.

### Routes, straight copy

- `src/routes/api/auth/{google/index,google/callback,guest,login,logout,register,session,upgrade}.ts`
- `src/routes/api/mobile/**` in full
- `src/routes/_authenticated/route.tsx`
- `src/routes/_authenticated/admin/{route,index,orders/index,orders/$orderId,products,categories,reviews,users,settings,landing,popup,setup}.tsx` — except `index.tsx`, see below
- `src/routes/activate.tsx`
- `src/components/admin/{ProductForm,ImageField,order-status}.tsx`
- `src/components/onboarding/OnboardingDialog.tsx`, `src/components/site/DemoBanner.tsx`
- `src/hooks/{use-session-user,use-mobile,use-license,use-admin-write-guard}.tsx`
- `src/start.ts`, `src/server.ts`, `vitest.config.ts`
- `mobile/` in full, including its Expo config and app routes
- `docs/superpowers/{specs,plans}` for reference

### Removed from the target

- `supabase/` and `src/integrations/supabase/**`
- `@supabase/supabase-js`, all `SUPABASE_*` and `VITE_SUPABASE_*` values
- The Supabase `/auth` form and the Supabase mega-menu admin screen, both
  replaced by the source's equivalents

## Connecting the finished frontend

The redesigned storefront keeps its markup, class names and layout. Each screen
gains a loader or a server call and keeps its JSX:

| File                              | Change                                                                                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `routes/index.tsx`                | Renders the finished design by default, with products and reviews from the database; renders the ported landing sections when `home_source = "cms"`             |
| `routes/shop.tsx`                 | `listCatalogProducts` / `listCatalogCategories`; the redesigned grid and filters stay; search, category and sort use the ported search schema                   |
| `routes/product.$id.tsx`          | `getCatalogProduct` (slug-keyed, same URL shape), real reviews in place of the two hardcoded quotes, real rating and count                                      |
| `routes/cart.tsx`                 | Cart lines reference database products and prices                                                                                                               |
| `routes/checkout.tsx`             | `placeOrder` instead of the fake `PW-` id; auth-gated, with guest checkout                                                                                      |
| `routes/auth.tsx`                 | Rebuilt in the target's design: email/password, Google, guest, `?redirect=`                                                                                     |
| `routes/favorites.tsx`            | Built in the target's design over the ported favorites store                                                                                                    |
| `components/site/Header.tsx`      | Account menu, cart count, favorites link, top-bar settings                                                                                                      |
| `components/site/Footer.tsx`      | Newsletter posts to `subscribeNewsletter`                                                                                                                       |
| `components/site/MegaMenu.tsx`    | `getMegaMenuData` instead of `src/data/mega-menu.ts`                                                                                                            |
| `components/site/ProductCard.tsx` | Takes `CatalogProduct`; markup unchanged                                                                                                                        |
| `components/site/PromoPopup.tsx`  | Ported; mounted in the root layout                                                                                                                              |
| `_authenticated/admin/index.tsx`  | Becomes the source's dashboard; the current mega-menu editor UI is moved to `admin/menu.tsx` and rewired to the mega-menu functions, so that screen is not lost |

`src/data/products.ts` and `src/data/mega-menu.ts` are deleted once nothing
imports them. The static catalog and `db/seed.sql` are the same 12 products with
identical slugs, prices and images, so no URL changes and nothing disappears.

### Homepage: design first, landing CMS behind a switch

The live database already has `landing_sections` rows, so rendering them by
default would replace the finished design with the old generated page. Instead a
setting, `home_source`, defaults to `"static"`: the homepage renders the finished
design, with catalog products and approved reviews loaded from the database.
Setting it to `"cms"` — from a toggle on `/admin/landing` — renders the ported
landing sections instead. The landing system is fully present and linked, and it
cannot displace the design until someone chooses it.

## Config, environment, handoff

- `package.json`: add `@libsql/client`, `jose`, `vitest`, `happy-dom`,
  `@testing-library/react`; remove `@supabase/supabase-js`.
- `vite.config.ts`: replaced with the source's explicit TanStack Start + Nitro
  (Cloudflare module) config.
- `.env`: same credentials as the source — `TURSO_DATABASE_URL`,
  `TURSO_AUTH_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`,
  `ADMIN_EMAILS`, `APP_URL`.
- `.env` stops being tracked (`git rm --cached .env`, added to `.gitignore`).
  It currently holds live database credentials and an OAuth secret, and the file
  stays on disk untouched. `.env.example` becomes the committed template.
- `AGENTS.md` is replaced with the source's, which documents the real
  architecture.

## Constraints and risks

1. **No remote operations.** No pushes, no merges, no branch published, no
   changes to `main`. The work happens in this working tree and stops there;
   the new repository is created afterwards.
2. **The design does not move.** Every storefront file keeps its current markup
   and classes. Where a page has to be built from nothing (`/auth`,
   `/favorites`) it is built in the target's design tokens, not the source's.
3. **Same database.** The bootstrap/custom switch layer is kept intact, so the
   store keeps talking to whatever database it talks to today.
4. **Server-only imports.** `@libsql/client` is only ever imported inside server
   handlers via `await import(...)`.
5. **Schema is applied additively.** `setup-db.ts` is checked against the live
   database before it runs; drift is handled with a migration, never by
   recreating a table.
6. **Admin is server-guarded.** The `_authenticated` gate is client-side
   convenience; `assertAdminAccess` and `requireAuth` are the real boundary.

## Build order

1. Backend in: `db/`, `scripts/`, `src/integrations/turso/`, `src/lib/`, API
   routes, `start.ts`.
2. Supabase out: delete the integration, the dependency and the env keys.
3. Admin in: twelve screens, navigation, onboarding and license wrappers.
4. Frontend wiring: the storefront files above, one at a time, verified against
   the current rendering.
5. Mobile app and `/api/mobile/**`.
6. Config, env, `.gitignore`, `AGENTS.md`, build.

## Verification

- `bun run dev` boots; the homepage renders exactly as it does today.
- Shop filters and sorts; product detail shows database reviews and ratings.
- Guest checkout places a real order; the confirmation shows its `public_id`.
- Admin signs in, sees that order, changes its status, and the customer-facing
  state follows.
- Admin CRUD: product, category, mega menu, review moderation, settings, users.
- `/admin/landing` edits a section; switching `home_source` to `cms` makes the
  homepage reflect it, and switching back restores the design; the promo popup
  saves and renders.
- A review submitted from the storefront lands in the admin queue as `pending`.
- `grep -ri supabase src package.json` returns nothing.
- `bun run lint`, `bun run test`, `bun run build` pass.

## Calls I made

- The homepage is controlled by a `home_source` setting that defaults to the
  current design, because the live database already holds landing sections that
  would otherwise take over the page on first load.
- The mega-menu editor is moved to `/admin/menu` rather than deleted, keeping a
  working screen the source project never had.
- `.env` is untracked; credentials stay on disk and out of the new repository.
- `/auth` and `/favorites` are built in the target's design language, because
  copying the source versions would introduce `font-poster` / `PageHeader`
  classes that do not exist here.
