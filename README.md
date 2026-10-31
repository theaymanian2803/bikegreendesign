# Pathway Bike Shop

A TanStack Start (React + Vite) bike shop: storefront, customer accounts, order
persistence and an admin area, backed by a self-hosted Turso (libSQL) database.

The storefront is the redesigned Pathway design. Everything behind it — auth,
catalogue, orders, reviews, landing sections, licensing, the Expo app — is the
Pathway backend that previously lived in a separate project.

## Run it

```sh
bun install
cp .env.example .env      # then fill in the values below
bun run db:setup          # applies db/schema.sql, migrations and db/seed.sql
bun run dev               # http://localhost:8080
```

Other scripts: `bun run build`, `bun run lint`, `bun run format`,
`bun run test`, `bun run mobile`, `bun run mobile:typecheck`.

## Environment

| Key                                         | Purpose                                                        |
| ------------------------------------------- | -------------------------------------------------------------- |
| `TURSO_DATABASE_URL`                        | libSQL database URL (the bootstrap database)                   |
| `TURSO_AUTH_TOKEN`                          | Turso auth token                                               |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth client for storefront and admin sign-in           |
| `AUTH_SECRET`                               | signs the `pathway_session` cookie (`openssl rand -base64 32`) |
| `ADMIN_EMAILS`                              | comma-separated Google addresses granted admin on sign-in      |
| `APP_URL`                                   | canonical origin used to build the OAuth callback URL          |
| `LICENSE_DISABLED`                          | `1` bypasses the admin write gate in development only          |

`.env` is **not** committed. This repository is public, so the live credentials
live only in the host's environment settings. `.env.example` lists every key the
app needs; copy it to `.env` for local development.

## How it fits together

- **Data** — `src/integrations/turso/` holds the libSQL client and the
  server-only helpers. `@libsql/client` is never imported from client code; it is
  loaded lazily inside server handlers.
- **Auth** — HMAC-signed `pathway_session` cookie (or Bearer token for the
  mobile app). Email/password, guest sessions and Google OAuth all live under
  `src/routes/api/auth/`; the Expo app uses `/api/mobile/auth/`.
- **Admin** — `/admin` (dashboard), orders, products, categories, reviews,
  users, settings, mega menu, landing page, popup and setup. Reads work without a
  licence; writes require activation, and unlicensed attempts redirect to
  `/activate`.
- **Homepage** — `settings.home_source` chooses the renderer:
  `static` (default) draws the designed page from `src/components/site/HomeStatic.tsx`,
  `cms` draws the landing sections managed at `/admin/landing`. The toggle lives
  at the top of that screen.
- **Mobile** — `mobile/` is an Expo app talking to `/api/mobile/**`.

## Tests

`bun run test` runs Vitest. Coverage is focused on the seams most likely to rot:
the admin write gate, the homepage switch, catalogue filtering, the checkout
payload contract, money formatting, gallery selection, password hashing and
licence tokens.
