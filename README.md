# Arca — E-Commerce Platform (Phase 1: Customer Website)

Phase 1 of an API-first e-commerce platform: a customer-facing website (Next.js) backed
by a standalone REST API (Fastify), designed so the same API can later serve a mobile
app, admin portal, and super admin portal without changes.

Design language: **"1b — Atelier"** — warm paper background, oversized display type,
rule lines instead of card shadows, generous margins.

Everything runs on your local machine. No AWS, no cloud accounts required.

## Stack

| Layer | Technology | Why |
|---|---|---|
| Website | Next.js 15 (App Router) | SSR product/category pages for SEO, client components for cart/checkout/account |
| Backend API | Fastify 5 + TypeScript | Fast, schema-validated REST API under `/v1` |
| Database | PostgreSQL 16 (Docker) | Primary transactional store |
| ORM | Drizzle ORM | Type-safe schema + SQL migrations |
| Cache/queue-ready | Redis 7 (Docker) | Reserved for sessions/rate-limiting as the platform grows |
| Object storage | MinIO (Docker) | S3-compatible, for future product image / avatar uploads |
| Email (dev) | Mailpit (Docker) | Captures outgoing email locally — view at http://localhost:8025 |
| Payments | Mock provider | Card/UPI/Wallet capture instantly, COD stays pending. Swappable for Razorpay/Stripe test mode later behind `PaymentProvider` — deferred per Phase 1 scope. |
| Auth | JWT access token (15 min) + rotating opaque refresh token | Bearer-token API, consistent with a future mobile client |

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

# 4. Run database migrations
npm run db:migrate

# 5. Seed demo catalogue (14 products across Electronics/Fashion/Home/Beauty)
npm run db:seed
```

## Running the app

```bash
# Runs both the backend (http://localhost:4000) and website (http://localhost:3000)
npm run dev
```

Or run them separately:

```bash
npm run dev:backend   # http://localhost:4000/v1
npm run dev:website   # http://localhost:3000
```

## Local service URLs

| Service | URL |
|---|---|
| Website | http://localhost:3000 |
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

**Out of scope for Phase 1** (per the blueprint's later phases): admin portal, super
admin portal, mobile app, real payment gateway integration, Elasticsearch search,
shipping carrier integration, support ticket system.

## Project structure

```
backend/            Fastify REST API (TypeScript, Drizzle ORM)
  src/db/schema/     Table definitions
  src/db/migrations/ Generated SQL migrations
  src/modules/       auth, customers, catalogue, cart, checkout, orders, contact, payments
website/            Next.js 15 App Router site
  app/               Routes (pages)
  components/        Shared UI (Header, Footer, ProductCard, forms, …)
  lib/               API client, Zustand stores (auth, cart), types
docker-compose.yml   Postgres, Redis, MinIO, Mailpit
```

## Common tasks

```bash
npm run infra:up      # start Docker services
npm run infra:down    # stop Docker services
npm run infra:logs    # tail Docker service logs
npm run db:migrate    # apply migrations
npm run db:seed       # reseed demo catalogue (safe to rerun on a fresh DB)
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
