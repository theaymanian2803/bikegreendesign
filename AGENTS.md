# Project

Pathway Bike Shop — a TanStack Start (React + Vite) e-commerce store with a
self-hosted Turso (libSQL) database backend for storage, admin roles and order
persistence. Storefront auth supports Google OAuth, email/password, and guest
sessions; checkout requires a signed-in email or guest account.

## Commands

- `bun run dev` — start the dev server
- `bun run build` — production build
- `bun run lint` — lint with ESLint
- `bun run format` — format with Prettier
- `bun run db:setup` — apply `db/schema.sql` + `db/seed.sql` to the Turso database

## Notes

- Canonical onboarding/setup/preview-mode spec:
  `C:\Users\PC\Desktop\workflow\onboarding-workflow.md`. Follow its step order
  and invariants; never gate the storefront or move activation before the tour.
- Storefront theme: cream + terracotta + deep green + pale lime, defined once per
  app. Web tokens/utilities live in `src/styles.css` (`:root`, `.dark`,
  `@theme inline`, `btn-brand`, `section-label`, `site-container`,
  `site-eyebrow`, `site-section`, `admin-panel`); mobile tokens live in
  `mobile/lib/theme.ts` (`colors`, `fonts`, `radius`, `shadows`). The mobile file
  holds the sRGB equivalents of the web `oklch()` tokens — React Native cannot
  parse oklch, so change both together and keep the mapping comment accurate.
  Style components through those tokens rather than hard-coded colors so web and
  mobile stay in sync.
- Server-only code lives in `src/integrations/turso/` (the libSQL client and
  auth helpers) and inside `*.functions.ts` server function handlers. Load
  server-only modules lazily (`await import(...)`) inside handlers so they stay
  out of the client bundle.
- Auth is cookie/Bearer based on the HMAC-signed `pathway_session` token
  (30 days). `GET /api/auth/google` sets `state` + PKCE cookies and redirects to
  Google; the callback upserts the local `users` row (`google_sub`, `email`).
  Email/password and guest sessions use `/api/auth/*` on the web and
  `/api/mobile/auth/*` on mobile; guest rows have `is_guest = 1`, and guests
  can upgrade to an email account without changing their user id. Password
  hashes use PBKDF2-HMAC-SHA512 in
  `src/integrations/turso/password.server.ts`. Session signing, OAuth helpers,
  and the Bearer fallback live in `src/integrations/turso/auth.server.ts` and use
  Web Crypto (`AUTH_SECRET`). `getSessionUser` / `logout` live in
  `src/lib/auth.functions.ts`. Mobile stores the token in SecureStore. Checkout
  requires auth; `orders.user_id` links the order to the account. There is no
  automated password reset; auth screens show shop contact details, and admins
  can set a temporary password for non-guest accounts on `/admin/users`.
- Landing page content is database-driven. `landing_sections` rows store a
  `type`, visibility, order and a JSON `config`; the public homepage reads
  `getLandingSections` (and `getPromoPopup`) from
  `src/integrations/turso/landing.functions.ts`. Edit it at `/admin/landing` and
  `/admin/popup`; shared types and zod config schemas live in
  `src/lib/landing.ts`. Re-run `bun run db:setup` to apply new seeds or
  migrations (existing edits are preserved).
- Admin access is granted when a verified Google sign-in email is listed in
  `ADMIN_EMAILS` (comma-separated). Email/password accounts are not auto-promoted
  because email ownership is unverified; admins can promote them manually.
  Existing `is_admin` grants are preserved and can be changed
  on `/admin/users`. `src/integrations/turso/auth.ts` exposes the `requireAuth`
  server-function middleware, which resolves the session cookie to a local
  `users` row and provides `context.userId`/`context.user`. The `_authenticated`
  route gate requires `user.isAdmin` and redirects to `/auth?redirect=...`.
  Never import `@libsql/client` from client code.
- Keep the git history intact; avoid force-pushing to the shared remote.
- Licensing is a soft gate. Grants are Ed25519 JWTs stored in
  `settings.license_grant` and verified locally by
  `src/integrations/turso/license.server.ts`; the public key is safe to ship,
  the private key lives only on the license Worker. The storefront, `/auth`,
  checkout and mobile APIs work without a license. Admin reads also work so the
  tour can show the dashboard, but admin writes require activation: the UI
  redirects to `/activate` and `assertAdminAccess` rejects unlicensed POSTs.
  `LICENSE_DISABLED=1` is a dev/test escape hatch.
- Onboarding runs welcome → sign-in → admin → activate license last. The admin
  section shows for signed-in admins (activation is not required), so the tour
  covers the real dashboard. Activation is optional and must never block the
  storefront: the tour passes clicks through to the page, and non-admins skip
  the admin section and land on the final activation step.
- While unlicensed in demo mode, the tour signs in a local
  `demo@pathway.local` admin (created on demand) so the admin walkthrough works
  without Google. That row is excluded from ownership claiming, and demo
  sign-in stops as soon as the store is activated.
- Setup lives at `/admin/setup`. It can switch to the buyer's Turso database:
  `db_url`/`db_token` are stored in the env database's settings, the target is
  provisioned from `db/schema.sql` plus optional `db/seed.sql`, and the current
  Google admin is carried across. Reset returns to the env database and signs
  out. Setup writes obey the same preview-mode gate as the rest of admin.
- The first Google sign-in claims ownership whenever `settings.owner_email` is
  absent and no admin exists, licensed or not. Do not bake the seller's
  `ADMIN_EMAILS` into buyer builds.
- Onboarding/demo UI is driven by the `demo_mode` setting. Tour progress lives
  in `sessionStorage` so it survives the Google OAuth redirect; completion and
  banner dismissal live in `localStorage`.

## Added in this project

- **Homepage source.** `settings.home_source` selects the renderer: `static`
  (default) draws `src/components/site/HomeStatic.tsx`, `cms` draws the landing
  sections from `getLandingSections`. Toggle it at the top of `/admin/landing`.
  Never default to `cms`: this database already holds landing sections from the
  previous store and they would replace the design.
- **Mega menu admin** lives at `/admin/menu` (the backend had the server
  functions but no screen for them).
- **Mobile API base URL** is `EXPO_PUBLIC_API_URL`, defaulting to
  `http://10.0.2.2:8080` in `mobile/lib/api.ts` (Android emulator loopback).
- **Storefront loaders never throw on a database error** - they fall back to
  empty data via `src/lib/safe-load.ts`, so the shop renders an empty state
  instead of a 500 page.
- **Category filtering** matches `products.categorySlug` (the stored slug), never
  a slug re-derived from the category name.
