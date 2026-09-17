# Merc

Mini e-commerce storefront for home goods, accessories, and everyday essentials. Built for the frontend technical challenge with server-side StarPay sandbox checkout.

**Demo:** [merc-lac.vercel.app](https://merc-lac.vercel.app)

## Features

- Product catalog with category filters, search, sorting, and product details
- Persistent bag with quantity controls
- Supabase email authentication and private order history
- Checkout with server-calculated totals and hosted StarPay sandbox payment
- Verified payment status, callback handling, and retry-safe order creation
- Responsive storefront, accessible navigation, social previews, and sitemap

## Stack

| Area         | Technology                       |
| ------------ | -------------------------------- |
| App          | Next.js App Router, TypeScript   |
| UI           | Tailwind CSS, CSS, Lucide icons  |
| Client state | Zustand                          |
| Server data  | TanStack Query, Axios            |
| Forms        | Formik, Yup                      |
| Backend      | Supabase Auth, Postgres, Storage |
| Payments     | StarPay sandbox                  |
| Tests        | Vitest, Playwright               |

## Quick start

Requires Node.js 22 and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The example configuration enables a read-only sample catalog. Sign-in, orders, and payment need Supabase and StarPay credentials.

### Environment

Set these in `.env.local` and in Vercel for the deployed app. Keep server secrets out of `NEXT_PUBLIC_` variables.

| Variable                               | Use                                                        |
| -------------------------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL                                       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key                                  |
| `SUPABASE_SERVICE_ROLE_KEY`            | Server-only database access                                |
| `APP_URL`                              | Canonical site origin and auth redirect origin             |
| `STARPAY_PUBLIC_URL`                   | Public HTTPS callback/return origin; defaults to `APP_URL` |
| `STARPAY_API_SECRET`                   | Secret Key from the StarPay sandbox merchant account       |
| `STARPAY_WEBHOOK_SECRET`               | Webhook Secret Code from the same merchant account         |
| `STARPAY_BASE_URL`                     | StarPay sandbox API URL from `.env.example`                |
| `DEMO_CATALOG`                         | `true` for sample products; `false` for Supabase products  |

Use the Secret Key and Webhook Secret Code from **the same StarPay merchant account**. Payment initialization runs in the Next.js server API; the browser never receives either secret.

### Database and authentication

1. Create a Supabase project and apply [`supabase/migrations/202609160001_store.sql`](supabase/migrations/202609160001_store.sql).
2. Add the Supabase variables to `.env.local`, then run `npm run db:seed`. This upserts 18 products and uploads their sample images to Supabase Storage.
3. Set `DEMO_CATALOG=false`.
4. In Supabase Auth, enable email/password sign-in and allow your site's `/auth/callback` URL. Configure email delivery for external users.

The seed replaces values for its known products when rerun. Replace sample product images and descriptions before using the catalog for real sales.

### StarPay sandbox

- Set `APP_URL` to the origin where users open the store. On Vercel, use the deployed HTTPS URL.
- For local payment testing, expose the app through an HTTPS tunnel, open the store through that tunnel, and set both `APP_URL` and `STARPAY_PUBLIC_URL` to its origin. Allow the tunnel's `/auth/callback` URL in Supabase.
- Use **`0900000000`** in the sandbox checkout form. Do not use a real customer number.
- StarPay's callback endpoint is `/api/payments/starpay/callback`; checkout passes this URL during initialization.

Restart the local server or redeploy Vercel after changing environment variables. `STARPAY_PUBLIC_URL` changes callback and return URLs; it does not proxy outbound API requests.

## Architecture

| Location              | Responsibility                                                     |
| --------------------- | ------------------------------------------------------------------ |
| `src/app`             | Pages, metadata, and HTTP routes                                   |
| `src/features`        | Catalog, cart, auth, checkout, and order UI                        |
| `src/components`      | Shared shell, providers, and UI elements                           |
| `src/server`          | Supabase access, pricing, order orchestration, and StarPay adapter |
| `supabase/migrations` | Schema, row-level security, and atomic checkout function           |

Zustand persists the bag in browser storage. TanStack Query caches server data; Axios calls same-origin APIs. Formik and Yup handle forms and validation. Supabase Auth manages sessions, while order reads are scoped to the signed-in user.

Checkout recalculates prices on the server and creates an order with an idempotency key. The server initializes StarPay, validates the returned payment URL, and saves the attempt. A redirect or callback alone cannot mark an order paid: the server verifies the provider result and expected amount first. Uncertain initialization remains pending to avoid a duplicate payment; the order page supports later status checks.

## SEO

Public pages have canonical URLs, descriptions, social cards, and a generated sitemap. Product pages use their own descriptions and images. Auth, bag, checkout, and order pages are marked `noindex`. Set `APP_URL` to the final public origin so canonical and sitemap URLs are correct.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Playwright covers desktop and mobile shopping flows. Its auth and payment responses are mocked; complete a separate StarPay sandbox transaction on the deployment before treating payment integration as verified.

## Deployment

Deploy the repository to Vercel with Node.js 22. Add the environment variables, apply the database migration, seed products, and configure the production `/auth/callback` URL in Supabase. Use the StarPay sandbox account's matching API and webhook secrets. After deployment, confirm sign-in, checkout with the sandbox number, paid order status, and private order access.

## Scope

This challenge implementation uses ETB prices, English copy, a small catalog, local browser carts, and StarPay sandbox payments. It has no inventory reservations, product variants, refunds, fulfillment management, or live payment mode. A larger catalog would need server-side indexed search and pagination; a live store would also need operational payment reconciliation.
