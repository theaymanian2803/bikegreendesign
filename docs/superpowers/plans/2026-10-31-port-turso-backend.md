# Port Turso Backend & Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the entire `bike replet two-v2` backend, admin and landing-page system into this redesigned storefront and connect the finished frontend to it.

**Architecture:** Strict transplant. Server code, schema, API routes and admin screens are copied from the source project with as few edits as possible; the redesigned storefront keeps its markup and gains loaders and server calls. Supabase is deleted. The homepage renders the current design by default and can be switched to the database-driven landing sections through a `home_source` setting.

**Tech Stack:** TanStack Start (React 19 + Vite 8), Tailwind 4, Turso/libSQL via `@libsql/client`, `jose` for session cookies, Ed25519 license JWTs, Vitest, Nitro → Cloudflare Workers, Expo app in `mobile/`.

**Spec:** `docs/superpowers/specs/2026-10-31-turso-backend-transplant-design.md`

**Source project:** `C:\Users\PC\Desktop\bike replet two-v2` (referred to below as `$SRC`).

## Global Constraints

- **No remote git operations.** No push, no merge, no fetch that writes, no publishing `main`. Commits are local only. A new repository is created afterwards by the user.
- **The design does not move.** `src/styles.css`, the storefront markup and class names stay as they are. Only data plumbing changes.
- **Server-only import rule.** `@libsql/client` is imported only inside server handlers, via `await import(...)`. Never at module top level of a file reachable from the client bundle.
- **Same credentials.** `.env` keeps `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `ADMIN_EMAILS`, `APP_URL` with the values already on disk.
- **`.env` is untracked** and stays on disk; `.env.example` is the committed template.
- **Schema changes are additive.** `db/schema.sql` + `db/migrations/*` are applied to the live database; no table is dropped or recreated.
- **Bun is the package manager** (`bun.lock`, `bunfig.toml`); scripts run through `bun run`.
- **Admin is server-guarded.** `_authenticated` is a client-side convenience gate; `requireAuth` + `assertAdminAccess` are the boundary.

## Review Focus

1. **Database unreachable or empty** — `/`, `/shop` and `/product/:slug` must render (empty states or the static homepage), not throw a 500.
2. **Unknown product slug** (`/product/does-not-exist`) — must reach the 404 component, not an unhandled error.
3. **Signed-out review submission** — `createReview` is public; the storefront form must work without login and store the review as `pending`.
4. **Guest checkout, then upgrade** — the order must stay attached to the same user row after a guest upgrades to email/password.
5. **Admin without an activated license on the live database** — reads must work, writes must redirect to `/activate` rather than 500 or silently no-op.

---

### Task 1: Local branch and baseline

**Files:**

- Modify: none (git state only)

**Interfaces:**

- Produces: branch `port-turso-backend` containing the design doc; `main` untouched and no remote refs updated.

- [ ] **Step 1: Confirm the working tree state**

Run: `git status --short`
Expected: only `.env`, `AGENTS.md`, `TODOS.md`, `db/schema.sql`, `db/seed.sql`, and `mobile/**` appear from the source project — if this is the target repo, it should instead show only `docs/superpowers/specs/2026-10-31-turso-backend-transplant-design.md` as new.

- [ ] **Step 2: Create and switch to the branch**

Run: `git checkout -b port-turso-backend`
Expected: `Switched to a new branch 'port-turso-backend'`

- [ ] **Step 3: Commit the design doc as the baseline**

Run: `git add docs/superpowers/specs/2026-10-31-turso-backend-transplant-design.md && git commit -m "docs: design for turso backend transplant"`
Expected: one commit; `git status --short` shows a clean tree.

- [ ] **Step 4: Confirm no remote is touched**

Run: `git log --oneline -1 --decorate && git remote -v`
Expected: branch line reads `port-turso-backend`; `remote -v` output unchanged from before the task.

---

### Task 2: Dependencies, env and build config

**Files:**

- Modify: `package.json`, `vite.config.ts`, `bunfig.toml`, `.prettierrc`, `.gitignore`, `AGENTS.md`
- Create: `.env.example`, `vitest.config.ts`
- Copy: `$SRC/vitest.config.ts`, `$SRC/.env.example`

**Interfaces:**

- Produces: `bun run db:setup`, `bun run test`, `bun run test:watch` scripts; a Vite config that builds the SSR bundle for Nitro/Cloudflare with `@libsql/client` server-side.

- [ ] **Step 1: Add the server dependencies**

Run: `bun add @libsql/client@^0.17.4 jose@^5.9.0`
Expected: both appear under `dependencies` in `package.json`; `bun.lock` updated.

- [ ] **Step 2: Add the test dependencies and scripts**

Run: `bun add -d vitest@^4.1.10 happy-dom@^20.11.1 @testing-library/react@^16.3.2`
Then add to `package.json` `scripts`: `"db:setup": "bun run scripts/setup-db.ts"`, `"test": "vitest run"`, `"test:watch": "vitest"`, `"mobile": "bun --cwd mobile run start"`, `"mobile:typecheck": "bun --cwd mobile run typecheck"`.
Expected: `bun run test --help` exits without a missing-script error.

- [ ] **Step 3: Replace the Vite config with the source project's**

Copy `$SRC/vite.config.ts` over `vite.config.ts`. Keep the `server: { entry: "server" }` behaviour; the source config already sets it.
Expected: file imports `tanstackStart` from `@tanstack/react-start/plugin/vite` and pushes `nitro({ defaultPreset: "cloudflare-module" })` on build.

- [ ] **Step 4: Drop the Lovable config package**

Run: `bun remove @lovable.dev/vite-tanstack-config`
Expected: `package.json` no longer lists it; `grep -r "lovable.dev/vite-tanstack-config" . --exclude-dir=node_modules` returns nothing.

- [ ] **Step 5: Stop tracking `.env` and add the template**

Run: `git rm --cached .env`
Then append `.env` to `.gitignore`, and copy `$SRC/.env.example` to `.env.example`.
Expected: `git check-ignore -v .env` reports a match; `.env` still exists on disk with its current contents.

- [ ] **Step 6: Copy the test config and replace `AGENTS.md`**

Copy `$SRC/vitest.config.ts` to `vitest.config.ts` and `$SRC/AGENTS.md` to `AGENTS.md`.
Expected: `bun run test` runs and reports "No test files found" rather than a config error.

- [ ] **Step 7: Install and verify resolution**

Run: `bun install`
Expected: completes with no peer-dependency errors; `bun pm ls @libsql/client jose vitest` lists all three.

- [ ] **Step 8: Commit**

```bash
git add package.json bun.lock vite.config.ts vitest.config.ts .gitignore .env.example AGENTS.md .prettierrc bunfig.toml
git commit -m "build: add turso, jose and vitest; drop lovable vite config; untrack .env"
```

---

### Task 3: Database layer and schema

**Files:**

- Copy: `$SRC/db/` → `db/`, `$SRC/scripts/setup-db.ts` → `scripts/setup-db.ts`
- Copy: `$SRC/src/integrations/turso/{client.ts,types.ts,db-config.server.ts,auth.server.ts,auth.ts,password.server.ts,email-auth.server.ts}`
- Create: `scripts/probe-db.ts` (throwaway, deleted at the end of the task)

**Interfaces:**

- Produces: `getTurso(): Client`, `getBootstrapTurso(): Client`, `refreshDbConfig(force?: boolean): Promise<void>`, `readDbConfig()`, `currentDbConfig()`, `setRuntimeDbConfig(config)`, `getSessionUser` cookie helpers in `auth.server.ts`, `assertPassword`/`hashPassword` in `password.server.ts`, `requireAuth` middleware in `auth.ts`.

- [ ] **Step 1: Copy the database files and server modules**

Run: `cp -r "$SRC/db" . && cp "$SRC/scripts/setup-db.ts" scripts/setup-db.ts` then create `src/integrations/turso/` and copy the seven files listed above.
Expected: `db/migrations/` contains `001_orders_status.sql` … `012_email_guest_auth.sql`.

- [ ] **Step 2: Write a read-only probe**

Create `scripts/probe-db.ts` that loads `.env`, opens the bootstrap client, runs `SELECT key, value FROM settings WHERE key IN ('db_url','db_token')`, then with the resolved runtime client runs `SELECT COUNT(*) FROM products`, `SELECT COUNT(*) FROM orders`, `SELECT COUNT(*) FROM landing_sections`, and prints the counts. It must never write.

- [ ] **Step 3: Run the probe and record the answers**

Run: `bun run scripts/probe-db.ts`
Expected: prints whether a custom database is configured, and non-zero product and order counts consistent with the live shop. Record the counts — later tasks compare against them.

- [ ] **Step 4: Compare live schema against `db/schema.sql`**

Run: the same probe with `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name` and compare to the tables in `db/schema.sql`.
Expected: every table in the schema exists live. If any live table is missing from the schema, stop and add a migration before continuing — do not recreate tables.

- [ ] **Step 5: Apply migrations only**

Run: `bun run db:setup`
Expected: `[db:setup]` logs schema, migrations and seed stages; the probe counts from Step 3 are unchanged or higher; no table is dropped.

- [ ] **Step 6: Delete the probe**

Run: `rm scripts/probe-db.ts`
Expected: `git status --short` no longer lists it.

- [ ] **Step 7: Commit**

```bash
git add db scripts src/integrations/turso
git commit -m "feat: add turso schema, migrations and server data layer"
```

---

### Task 4: Server functions and ported unit tests

**Files:**

- Copy: `$SRC/src/lib/{admin,auth,dashboard,orders,settings,setup,topbar,newsletter,license}.functions.ts`, `$SRC/src/lib/{catalog,money,landing,license-token,onboarding,demo-banner,storefront-nav,error-capture,error-page,utils}.ts`, `$SRC/src/lib/{cart,favorites}.tsx`
- Copy: `$SRC/src/integrations/turso/{catalog,mega-menu,reviews,landing}.functions.ts`, `$SRC/src/integrations/turso/{admin-guard.server,license.server,demo-admin.server,mobile-api.server}.ts`
- Copy: `$SRC/src/lib/__tests__/` in full

**Interfaces:**

- Consumes: `requireAuth` (Task 3), `getTurso()` (Task 3).
- Produces: every server function the admin and storefront call — `listCatalogProducts(): Promise<CatalogProduct[]>`, `getCatalogProduct({ data: slug })`, `loadCatalogAdmin()`, `createProduct`, `updateProduct`, `deleteProduct`, `createCategory`, `updateCategory`, `deleteCategory`, `listOrders`, `getOrder`, `placeOrder`, `updateOrderStatus`, `listProductReviews`, `createReview`, `setReviewStatus`, `getLandingSections`, `getLandingAdmin`, `createLandingSection`, `updateLandingSection`, `moveLandingSection`, `savePromoPopup`, `getMegaMenuData`, `loadMegaMenuAdmin`, `saveMegaMenu`, `getSettings`, `saveSettings`, `getDashboardStats`, `assertAdminAccess(userId: number): Promise<void>`.

- [ ] **Step 1: Copy the files unchanged**

Copy the files listed above verbatim, preserving relative paths.
Expected: `ls src/lib/*.functions.ts | wc -l` reports 9; `ls src/integrations/turso/*.functions.ts` reports 4.

- [ ] **Step 2: Run the ported tests**

Run: `bun run test`
Expected: `catalog.test.ts`, `landing.test.ts`, `license-token.test.ts`, `onboarding.test.ts` and `password.test.ts` all pass. If a test imports a module that was not copied, copy that module rather than editing the test.

- [ ] **Step 3: Add a test for the admin write gate**

Create `src/lib/__tests__/admin-guard.test.ts` asserting three cases against the test database: a non-admin id throws `Forbidden: admin role required`; an admin id resolves on a `GET` request; an admin id throws the preview-mode error on a `POST` when `settings.license_grant` is absent. Seed a temporary user with `is_admin = 0` and one with `is_admin = 1`.

- [ ] **Step 4: Run the new test to verify it passes**

Run: `bun run test src/lib/__tests__/admin-guard.test.ts`
Expected: PASS for all three cases.

- [ ] **Step 5: Commit**

```bash
git add src/lib src/integrations/turso
git commit -m "feat: port server functions, admin guard and unit tests"
```

---

### Task 5: Auth API routes

**Files:**

- Copy: `$SRC/src/routes/api/auth/` in full (eight route files)

**Interfaces:**

- Consumes: `auth.server.ts`, `password.server.ts`, `email-auth.server.ts` (Task 3); `auth.functions.ts` (Task 4).
- Produces: `GET /api/auth/google`, `GET /api/auth/google/callback`, `POST /api/auth/{login,register,guest,logout}`, `GET /api/auth/session`, `POST /api/auth/upgrade`.

- [ ] **Step 1: Copy the routes**

Copy `$SRC/src/routes/api/auth/` to `src/routes/api/auth/`.
Expected: eight files present, including `google/index.ts` and `google/callback.ts`.

- [ ] **Step 2: Start the dev server**

Run: `bun run dev` (background) then wait for `Local: http://localhost:8080`.

- [ ] **Step 3: Verify guest session creation**

Run: `curl -i -X POST http://localhost:8080/api/auth/guest -H "content-type: application/json" -d '{}'`
Expected: `200` and a `Set-Cookie: pathway_session=…; HttpOnly` header.

- [ ] **Step 4: Verify session read-back**

Run: `curl -s http://localhost:8080/api/auth/session -H "cookie: <value from Step 3>"`
Expected: JSON with `{ "user": { "isAdmin": false, "isGuest": true, … } }`.

- [ ] **Step 5: Verify Google start redirect**

Run: `curl -i http://localhost:8080/api/auth/google`
Expected: `302` to `accounts.google.com` with `state` and PKCE cookies set. A `500` means `GOOGLE_CLIENT_ID`/`AUTH_SECRET` are not loaded.

- [ ] **Step 6: Commit**

```bash
git add src/routes/api/auth
git commit -m "feat: port cookie auth api routes"
```

---

### Task 6: Start middleware, license and onboarding

**Files:**

- Copy: `$SRC/src/start.ts` → `src/start.ts`, `$SRC/src/server.ts` → `src/server.ts`
- Copy: `$SRC/src/hooks/{use-session-user,use-mobile,use-license,use-admin-write-guard}.tsx`
- Copy: `$SRC/src/components/site/{DemoBanner,PromoPopup}.tsx`, `$SRC/src/components/onboarding/OnboardingDialog.tsx`
- Modify: `src/routes/__root.tsx`, `src/routes/activate.tsx` (new), `src/router.tsx`

**Interfaces:**

- Consumes: `getLicenseStatus`, `activateLicense`, `heartbeatLicense` (Task 4).
- Produces: request pipeline `[errorMiddleware, dbConfigMiddleware, csrfMiddleware]`; `useLicense()` returning `{ licensed, loading, refresh }`; root layout wrapping `<Outlet />` in `QueryClientProvider`, `CartProvider`, `FavoritesProvider`, `DemoBanner`, `OnboardingDialog`, `Toaster`, `PromoPopup`.

- [ ] **Step 1: Copy `start.ts` and `server.ts`**

Expected: `src/start.ts` exports `startInstance` with all three middlewares in that order. The CSRF middleware must not be dropped — without it, server functions accept cross-site POSTs.

- [ ] **Step 2: Copy the license, demo and onboarding pieces**

Expected: `src/routes/activate.tsx`, both components and `PromoPopup.tsx` exist; `use-license.tsx` compiles.

- [ ] **Step 3: Merge the root layout**

Take `$SRC/src/routes/__root.tsx` as the base and keep the target's existing head/links. Keep providers in this order: `QueryClientProvider` → `CartProvider` → `FavoritesProvider` → `DemoBanner` → `OnboardingDialog` → `<Outlet />` → `Toaster` → `PromoPopup`.

- [ ] **Step 4: Verify the root renders**

Run: `curl -s http://localhost:8080/ | head -40`
Expected: HTML containing the storefront header; no `Supabase` or `supabase` string; no error boundary markup.

- [ ] **Step 5: Verify the CSRF middleware rejects a cross-site server-fn POST**

Run: `curl -i -X POST http://localhost:8080/_serverFn/does-not-exist -H "origin: https://evil.example"`
Expected: a `4xx` (CSRF/origin rejection), not `200`.

- [ ] **Step 6: Commit**

```bash
git add src/start.ts src/server.ts src/router.tsx src/routes/__root.tsx src/routes/activate.tsx src/hooks src/components/site/DemoBanner.tsx src/components/onboarding
git commit -m "feat: port request pipeline, license gate and onboarding shell"
```

---

### Task 7: Admin screens

**Files:**

- Copy: `$SRC/src/routes/_authenticated/route.tsx`
- Copy: `$SRC/src/routes/_authenticated/admin/{route,orders/index,orders/$orderId,products,categories,reviews,users,settings,landing,popup,setup}.tsx`
- Copy: `$SRC/src/components/admin/{ProductForm,ImageField,order-status}.tsx`
- Delete: the Supabase `_authenticated/admin/{route,users}.tsx` versions and `src/lib/admin.functions.ts`
- Modify: `src/routes/routeTree.gen.ts` (regenerated)

**Interfaces:**

- Consumes: all admin server functions (Task 4), `getSessionUser` (Task 4).
- Produces: admin routes at `/admin`, `/admin/orders`, `/admin/orders/$orderId`, `/admin/products`, `/admin/categories`, `/admin/reviews`, `/admin/users`, `/admin/settings`, `/admin/landing`, `/admin/popup`, `/admin/setup`.

- [ ] **Step 1: Copy the gate and the screens**

Expected: `_authenticated/route.tsx` redirects to `/auth?redirect=…` when `user.isAdmin` is false.

- [ ] **Step 2: Delete the Supabase admin layer**

Run: `rm src/lib/admin.functions.ts` (the Supabase one is overwritten by the ported file in Task 4 — confirm the ported version contains `setUserPassword` and no `supabase` import), then remove any remaining Supabase-only admin route files.
Expected: `grep -r "supabase" src/routes/_authenticated` returns nothing.

- [ ] **Step 3: Get an admin session over the API**

The `/auth` page is still the Supabase form until Task 11, so obtain the cookie directly:
`curl -i -X POST http://localhost:8080/api/auth/login -H "content-type: application/json" -d '{"email":"<admin email>","password":"<password>"}'` and keep the `pathway_session` value.
Expected: `200` with a session cookie. If the account has no password (Google-only), set one with `UPDATE users SET password_hash = ? WHERE email = ?` using a hash from `password.server.ts`, or sign in with Google in a browser.

- [ ] **Step 4: Walk every admin route**

Run: `curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" -b <cookie> http://localhost:8080/admin/{orders,products,categories,reviews,users,settings,landing,popup,setup}`
Expected: `200` for each. A `302` back to `/auth` means the session cookie is not being forwarded.

- [ ] **Step 5: Verify the license behaviour on the live database**

Run: open `/admin/products` and attempt to save a product.
Expected: either the save succeeds (licence grant present) or the UI redirects to `/activate` with the "Preview mode" message. A `500` or a silent no-op is a failure — check that `assertAdminAccess` still reads `settings.license_grant`.

- [ ] **Step 6: Commit**

```bash
git add src/routes/_authenticated src/components/admin src/routeTree.gen.ts
git commit -m "feat: port admin screens and gate"
```

---

### Task 8: Mega-menu admin screen

**Files:**

- Create: `src/routes/_authenticated/admin/menu.tsx`
- Modify: `src/routes/_authenticated/admin/route.tsx` (navigation entry)

**Interfaces:**

- Consumes: `loadMegaMenuAdmin()`, `saveMegaMenu`, `addMegaMenuCategory`, `addMegaMenuProduct`, `removeMegaMenuCategory`, `removeMegaMenuProduct` (Task 4).
- Produces: `/admin/menu`.

- [ ] **Step 1: Move the existing editor**

Copy the current Supabase-backed mega-menu screen — which Task 7 removed from the branch — out of the original branch: `git show main:src/routes/_authenticated/admin/index.tsx > src/routes/_authenticated/admin/menu.tsx`. Rename the route to `/_authenticated/admin/menu`, and replace the `supabase.from("mega_menu*")` calls with the loader/server functions above.
Expected: `grep -n "supabase" src/routes/_authenticated/admin/menu.tsx` returns nothing.

- [ ] **Step 2: Add the navigation entry**

Add `{ to: "/admin/menu", label: "Mega menu", icon: Menu }` to the nav list in `admin/route.tsx`.
Expected: the item appears between "Products" and "Orders".

- [ ] **Step 3: Verify the screen round-trips data**

Run: open `/admin/menu`, change a category label, save, reload.
Expected: the new label persists, and the storefront mega menu shows it after a refresh.

- [ ] **Step 4: Commit**

```bash
git add src/routes/_authenticated/admin/menu.tsx src/routes/_authenticated/admin/route.tsx
git commit -m "feat: restore mega menu editor on turso"
```

---

### Task 9: Remove Supabase

**Files:**

- Delete: `supabase/`, `src/integrations/supabase/`, `src/routes/auth.tsx` (Supabase version — replaced in Task 11)
- Modify: `.env`, `.env.example`, `package.json`, `src/lib/lovable-error-reporting.ts` (delete if unused)

**Interfaces:**

- Produces: a tree where no Supabase import, dependency, env var or migration exists.

- [ ] **Step 1: Delete the files and the dependency**

Run: `rm -rf supabase src/integrations/supabase` then `bun remove @supabase/supabase-js`.
Expected: `bun.lock` no longer contains `@supabase`. `/auth` now returns 404 until Task 11 builds the replacement — that is expected.

- [ ] **Step 2: Remove the env values**

Delete `SUPABASE_PROJECT_ID`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `VITE_SUPABASE_*` from `.env` and `.env.example`.
Expected: `.env` keeps only the Turso, Google, auth and license values.

- [ ] **Step 3: Verify nothing references Supabase**

Run: `grep -ri "supabase" src package.json .env .env.example --exclude-dir=node_modules`
Expected: no output.

- [ ] **Step 4: Build**

Run: `bun run build`
Expected: build succeeds. Any remaining error names a file that still imports Supabase; fix that file rather than reverting the removal.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove supabase entirely"
```

---

### Task 10: Storefront wiring — catalog surfaces

**Files:**

- Modify: `src/routes/shop.tsx`, `src/routes/product.$id.tsx`, `src/components/site/{ProductCard,MegaMenu,Header,Footer}.tsx`
- Delete: `src/data/products.ts`, `src/data/mega-menu.ts`

**Interfaces:**

- Consumes: `listCatalogProducts`, `listCatalogCategories`, `getCatalogProduct`, `listProductReviews`, `createReview`, `getMegaMenuData`, `getTopBarSettings`, `subscribeNewsletter` (Task 4).
- Produces: `ProductCard({ product }: { product: CatalogProduct })` — same classes, new prop type.

- [ ] **Step 1: Switch `ProductCard` to `CatalogProduct`**

Keep every className. Map `product.image_url`, `product.old_price`, `product.badge`, `product.rating`. The `Link` target becomes `/product/$id` with `product.slug`.
Expected: the homepage still compiles; its static imports are removed in Task 12.

- [ ] **Step 2: Wire `/shop`**

Add the source's `loader` and `validateSearch` schema. Keep the redesigned grid, list toggle and filter rail; filter against the loaded `CatalogProduct[]` in memory.
Expected: `/shop`, `/shop?category=bicycle-parts`, `/shop?sort=price-asc` all render and filter correctly.

- [ ] **Step 3: Wire `/product/$id`**

Loader calls `getCatalogProduct({ data: params.id })` and throws `notFound()` on `null`. Keep the redesigned layout. Replace the two hardcoded quotes with `listProductReviews`, compute the header count and average from those rows, and add a compact submit form calling `createReview` with `{ slug, authorName, rating, title, body }`, showing a "pending moderation" toast on success.
Expected: `/product/mtb-derailleur` renders with real reviews; `/product/nope` renders the 404 component.

Review submission calls `createReview({ data: { productSlug, author, rating, title, body } })`, which returns `{ ok: true }` and always stores `status = 'pending'`. The form must be usable while signed out.

- [ ] **Step 4: Wire `MegaMenu` and `Header`**

`MegaMenu` takes its data from the loader in `__root` (or a route loader) calling `getMegaMenuData`. `Header` shows the signed-in user, cart count and favorites link from `useSessionUser` and the ported cart/favorites stores.
Expected: the menu contents match `/admin/menu`; signing in changes the header affordance.

- [ ] **Step 5: Wire `Footer` newsletter**

Submit posts to `subscribeNewsletter`; success and duplicate-email both show a confirmation toast, never an unhandled rejection.
Expected: `curl` of the server function with a duplicate email returns a handled result.

- [ ] **Step 6: Note the deferred deletion**

`src/data/products.ts` and `src/data/mega-menu.ts` are still imported by `src/routes/index.tsx`
and are deleted in Task 12, once `HomeStatic` carries the markup that uses them.
Expected: `grep -rn "@/data/mega-menu" src` shows only `index.tsx`; nothing else.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: wire shop, product, header, footer and mega menu to turso"
```

---

### Task 11: Storefront wiring — cart, checkout, auth, favorites

**Files:**

- Modify: `src/routes/cart.tsx`, `src/routes/checkout.tsx`
- Create: `src/routes/auth.tsx` (rebuilt in the target's design), `src/routes/favorites.tsx`

**Interfaces:**

- Consumes: `placeOrder`, `getSessionUser`, `logout`, `getSettings` (Task 4); `useCart`, `useFavorites` (Task 4).
- Produces: `placeOrder({ data: { firstName, lastName, email, phone, address, city, postcode, country, notes?, items: { name, price, qty }[] } })` returning `{ publicId, email, total }` where `total` is in major units.

- [ ] **Step 1: Wire the cart to catalog products**

Cart lines store `{ slug, qty }` and resolve name, price and image from the loaded catalog; totals use integer cents via `money.ts`. Shipping uses `free_shipping_threshold_cents` and `flat_shipping_cents` from `getSettings`.
Expected: changing quantity updates the total identically to the product page price.

- [ ] **Step 2: Replace the fake checkout submit**

Keep the redesigned form and validation. On submit, redirect to `/auth?redirect=/checkout` when signed out, otherwise call `placeOrder` and render the returned `public_id` in the existing confirmation block.
Expected: `grep -n "PW-" src/routes/checkout.tsx` returns nothing.

- [ ] **Step 3: Build `/auth` in the target's design**

Three modes in one page: sign in, register, continue as guest; plus "Continue with Google" linking to `/api/auth/google`. Honor `?redirect=` after success.
Expected: guest sign-in lands back on `/checkout`; Google redirects to Google and returns signed in.

- [ ] **Step 4: Build `/favorites`**

List favorited products from `useFavorites` resolved against the catalog, with an empty state matching the target's styling.
Expected: hearting a product on `/shop` shows it here and survives reload.

- [ ] **Step 5: Verify the guest-to-email upgrade keeps the order**

Place an order as a guest, upgrade to email on `/auth`, then open `/admin/orders`: the order still lists the same customer.
Expected: `orders.user_id` unchanged across the upgrade.

- [ ] **Step 6: Commit**

```bash
git add src/routes/cart.tsx src/routes/checkout.tsx src/routes/auth.tsx src/routes/favorites.tsx
git commit -m "feat: real checkout, auth and favorites on the redesigned storefront"
```

---

### Task 12: Homepage and landing-source switch

**Files:**

- Modify: `src/routes/index.tsx`, `src/lib/settings.functions.ts` (add `home_source`), `src/routes/_authenticated/admin/landing.tsx` (add the switch)
- Create: `src/components/site/HomeStatic.tsx`
- Copy: `$SRC/src/components/site/landing/landing-sections.tsx`

**Interfaces:**

- Consumes: `getLandingSections`, `getPromoPopup`, `getSettings`, `listCatalogProducts`, `listApprovedReviews` (Task 4).
- Produces: `home_source: "static" | "cms"` in `settings`, defaulting to `"static"` when unset.

- [ ] **Step 1: Extract the current homepage into `HomeStatic`**

Move the existing JSX of `src/routes/index.tsx` into `src/components/site/HomeStatic.tsx` unchanged, taking `products` and `reviews` as props (possibly empty arrays when the database is unreachable). Then delete `src/data/products.ts` and `src/data/mega-menu.ts` and run `grep -rn "@/data/products\|@/data/mega-menu" src` — it must return nothing.
Expected: rendering `HomeStatic` produces markup identical to today's homepage; no import of the deleted modules remains.

- [ ] **Step 2: Add the `home_source` setting**

Read it in `getSettings` and default to `"static"`. Add a labelled toggle at the top of `/admin/landing` calling `saveSettings({ home_source })`.
Expected: `grep -n "home_source" src/lib/settings.functions.ts src/routes/_authenticated/admin/landing.tsx` shows both.

- [ ] **Step 3: Switch the homepage on the setting**

Loader loads sections, products and reviews. `home_source === "cms"` renders the ported `LandingSections`; otherwise renders `HomeStatic`. If the loader fails, render `HomeStatic` with the bundled catalog rather than throwing.
Expected: `/` renders the design with `home_source` unset; flipping the toggle renders the landing sections.

- [ ] **Step 4: Add a test for the fallback**

Create `src/lib/__tests__/home-source.test.ts`: `resolveHomeSource(undefined)` returns `"static"`, `resolveHomeSource("cms")` returns `"cms"`, and `"anything-else"` returns `"static"`.
Expected: PASS.

- [ ] **Step 5: Verify the homepage is byte-stable**

Run: `curl -s http://localhost:8080/ > /tmp/home-after.html` and compare against a capture taken before Task 10.
Expected: the visible markup is unchanged apart from product/review values that came from the database.

- [ ] **Step 6: Commit**

```bash
git add src/routes/index.tsx src/components/site/HomeStatic.tsx src/lib/settings.functions.ts src/routes/_authenticated/admin/landing.tsx src/lib/__tests__/home-source.test.ts
git commit -m "feat: homepage renders current design by default, landing cms behind a setting"
```

---

### Task 13: Mobile app and mobile API

**Files:**

- Copy: `$SRC/mobile/` in full, `$SRC/src/routes/api/mobile/` in full
- Modify: `package.json` (mobile scripts, already added in Task 2)

**Interfaces:**

- Consumes: `mobile-api.server.ts` (Task 4), the `/api/mobile/auth/*` routes.
- Produces: `bun run mobile`, `bun run mobile:typecheck`.

- [ ] **Step 1: Copy the app and the API**

Expected: `mobile/app.config.ts`, `mobile/app/**`, and `src/routes/api/mobile/{auth,bootstrap,categories,products,orders,reviews,newsletter}.ts` all present.

- [ ] **Step 2: Point the app at this server**

Set the API base URL in `mobile/app.config.ts`/env to `http://localhost:8080` for development, matching the source's setting.
Expected: the value is documented in `AGENTS.md`.

- [ ] **Step 3: Typecheck the app**

Run: `bun run mobile:typecheck`
Expected: no errors.

- [ ] **Step 4: Smoke the mobile bootstrap endpoint**

Run: `curl -s http://localhost:8080/api/mobile/bootstrap`
Expected: JSON with categories and featured products, no auth required.

- [ ] **Step 5: Commit**

```bash
git add mobile src/routes/api/mobile package.json
git commit -m "feat: port expo app and mobile api"
```

---

### Task 14: Final verification

**Files:**

- Modify: none (verification only)

**Interfaces:**

- Consumes: everything above.

- [ ] **Step 1: Lint, test and build**

Run: `bun run lint && bun run test && bun run build`
Expected: all three exit 0.

- [ ] **Step 2: Confirm no Supabase and no Lovable leftovers**

Run: `grep -ri "supabase\|lovable" src package.json .env --exclude-dir=node_modules`
Expected: no output other than unrelated prose in comments; fix any code reference.

- [ ] **Step 3: Walk the storefront**

Home, shop with each filter, a product, add to cart, checkout as guest, confirmation, favorites, sign in, sign out.
Expected: every step completes; the order appears in `/admin/orders`.

- [ ] **Step 4: Walk the admin**

Dashboard, orders (status change), products (create/edit/delete), categories, reviews (approve a pending one), mega menu, landing (toggle `home_source`), popup, users, setup.
Expected: each action persists and is visible on the storefront.

- [ ] **Step 5: Confirm the design is untouched**

Run: `git diff main -- src/styles.css src/components/site src/routes/index.tsx | head -200`
Expected: only data plumbing and the extracted `HomeStatic` component; no class-name or token changes.

- [ ] **Step 6: Confirm nothing left the machine**

Run: `git log --oneline main..port-turso-backend && git status -sb`
Expected: local commits only, `main` unchanged, nothing pushed.
