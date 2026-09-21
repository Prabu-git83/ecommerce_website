# Arca — E-Commerce Platform (Phase 1: Customer Website · Phase 2: Admin Portal)

An API-first e-commerce platform: a customer-facing website and an operations admin
portal, both built as separate frontends against one standalone REST API (Fastify) —
so a future mobile app or super admin portal can reuse the exact same `/v1` endpoints
without changes.

Design language: **"1b — Atelier"** — warm paper background, oversized display type,
rule lines instead of card shadows, generous margins.

Everything runs on your local machine. No AWS, no cloud accounts required.

## Stack

| Layer | Technology | Why |
|---|---|---|
| Website | Next.js 15 (App Router) | SSR product/category pages for SEO, client components for cart/checkout/account |
| Admin portal | React 18 + Vite + TypeScript | SPA — no SEO need, fast HMR, data-dense screens |
| Backend API | Fastify 5 + TypeScript | Fast, schema-validated REST API under `/v1` (customer + `/v1/admin`) |
| Database | PostgreSQL 16 (Docker) | Primary transactional store |
| ORM | Drizzle ORM | Type-safe schema + SQL migrations |
| Cache/queue-ready | Redis 7 (Docker) | Reserved for sessions/rate-limiting as the platform grows |
| Object storage | MinIO (Docker) | S3-compatible, for future product image / avatar uploads |
| Email (dev) | Mailpit (Docker) | Captures outgoing email locally — view at http://localhost:8025 |
| Payments | Mock provider | Card/UPI/Wallet capture instantly, COD stays pending. Swappable for Razorpay/Stripe test mode later behind `PaymentProvider` — deferred per Phase 1 scope. |
| Auth | JWT access token (15 min) + rotating opaque refresh token | Bearer-token API, consistent with a future mobile client |
| Admin auth | Separate JWT (`role: admin`), 8-hour expiry, no refresh | Internal tool — re-login after a shift is an acceptable tradeoff |

## Prerequisites

- **Docker Desktop** — installed and running (WSL2 backend on Windows)
- **Node.js 20+** and npm

## First-time setup

```bash
# 1. Start Postgres, Redis, MinIO, Mailpit
npm run infra:up

# 2. Install all dependencies (root + backend + website workspaces)
npm install

# 3. Configure environment files
cp backend/.env.example backend/.env
cp website/.env.local.example website/.env.local
cp admin/.env.local.example admin/.env.local

# 4. Run database migrations
npm run db:migrate

# 5. Seed demo catalogue (14 products across Electronics/Fashion/Home/Beauty,
#    plus a default admin user)
npm run db:seed
```

## Running the app

**Windows: double-click `start-dev.bat`** — it starts Docker Desktop if it isn't
running, waits for it, brings up the four containers, then opens the backend, website
and admin dev servers each in their own terminal window (skipping anything already
running). Safe to re-run any time.

Or from a terminal:

```bash
# Runs the backend (http://localhost:4000), website (http://localhost:3000)
# and admin portal (http://localhost:5173) together
npm run dev
```

Or run them separately:

```bash
npm run dev:backend   # http://localhost:4000/v1
npm run dev:website   # http://localhost:3000
npm run dev:admin     # http://localhost:5173
```

## Local service URLs

| Service | URL |
|---|---|
| Website | http://localhost:3000 |
| Admin portal | http://localhost:5173 — sign in with `admin@arca.local` / `admin123` |
| API | http://localhost:4000/v1 |
| API health check | http://localhost:4000/health |
| Mailpit (dev email inbox) | http://localhost:8025 |
| MinIO console | http://localhost:9001 (user: `ecommerce` / password: `ecommerce_dev_password`) |
| PostgreSQL | `localhost:5433` (moved off 5432 — see note below) |

> **Note:** Postgres runs on host port **5433**, not 5432, because this machine already
> had a native PostgreSQL 18 Windows service listening on 5432. The Docker container is
> fully isolated from it.

## What's implemented (Phase 1 scope)

**Public pages:** Home, product listing (with category/sort/search filters), product
detail, About Us, Contact Us.

**Customer pages:** Login/register (password or emailed one-time code), forgot/reset
password, cart, multi-step checkout (address → shipping → payment — Card, UPI, Wallet,
or Cash on Delivery), profile, saved addresses, order history, order detail with
cancellation.

**Backend:** Auth (JWT + refresh rotation, plus email-OTP passwordless login), catalogue
(categories/products/variants/inventory), guest + authenticated cart with coupon
support, checkout with stock reservation, mock payment capture (Card/UPI/Wallet capture
instantly, COD stays `pending` until delivery), order lifecycle, transactional email
(order confirmation, password reset, sign-in codes, contact acknowledgement) via
Mailpit.

**Admin portal (Phase 2), all under `/v1/admin` and gated by a single `admin` role:**

- **Products** — create/update/deactivate, images (by URL), variants (SKU, price,
  compare-at/discount price, tax rate override, attributes), stock on creation.
- **Categories** — create/update/deactivate, subcategories, sort order.
- **Inventory** — stock in / stock out / adjustment (recount), low-stock threshold per
  variant, full movement history per SKU. Every change writes a `stock_movements` audit
  row (type, before/after quantity, reason, admin).
- **Orders** — list/search/filter by status, view payment + delivery status, move an
  order through its status lifecycle, process refunds (writes a `refunds` row and
  updates payment/order status).
- **Customers** — list/search, profile + saved addresses + full order history, suspend
  or reactivate an account, log support interactions (a lightweight notes log — see the
  scope note below).

**Out of scope for this build** (per the blueprint's later phases): super admin portal
(multi-role RBAC, permission matrix, supplier management), mobile app, real payment
gateway integration, Elasticsearch search, shipping carrier integration, and a full
support-ticket system — the admin Customers screen logs support interactions as simple
timestamped notes rather than a ticket queue.

## Project structure

```
backend/            Fastify REST API (TypeScript, Drizzle ORM)
  src/db/schema/     Table definitions
  src/db/migrations/ Generated SQL migrations
  src/modules/       auth, customers, catalogue, cart, checkout, orders, contact, payments
  src/modules/admin/ auth, dashboard, products, categories, inventory, orders, customers
website/            Next.js 15 App Router site (customer-facing)
  app/               Routes (pages)
  components/        Shared UI (Header, Footer, ProductCard, forms, …)
  lib/               API client, Zustand stores (auth, cart), types
admin/               React + Vite admin portal (operations)
  src/pages/         Dashboard, Products, Categories, Inventory, Orders, Customers
  src/components/    Sidebar, PageHeader, Field, StatusText
  src/lib/           API client, Zustand auth store, types
docker-compose.yml   Postgres, Redis, MinIO, Mailpit
```

## Common tasks

```bash
npm run infra:up      # start Docker services
npm run infra:down    # stop Docker services
npm run infra:logs    # tail Docker service logs
npm run db:migrate    # apply migrations
npm run db:seed       # seed demo catalogue (fresh DB only — inserts, doesn't upsert)
```

If your database already has data from an earlier run (so `db:seed` would hit unique
constraint conflicts), use the non-destructive enrichment script instead — it only adds
what's missing (admin user, Electronics images/discounts, coupon) and never touches
existing rows:

```bash
cd backend && npx tsx src/db/seed-admin.ts
```

To change the schema: edit files under `backend/src/db/schema/`, then run
`npx drizzle-kit generate` inside `backend/` to create a new migration, and
`npm run db:migrate` to apply it.

## Adding real payments later

Checkout talks only to the `PaymentProvider` interface in
`backend/src/modules/payments/provider.ts`. To enable Razorpay or Stripe test mode,
implement that interface (see `mockProvider.ts` for the shape) and point
`backend/src/modules/payments/registry.ts` at it — no changes needed to checkout or
order code.
