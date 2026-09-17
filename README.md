# Merc

A considered lifestyle storefront built with Next.js App Router, TypeScript, Tailwind CSS, Zustand, TanStack Query, Axios, Formik, Yup, Supabase, and StarPay.

Public browsing, searchable categories, sorting, product details, a persistent shopping bag, email authentication, checkout, and private order history are implemented. Payments use StarPay's hosted sandbox checkout and server-side verification.

## Run locally

Requires Node.js 22 and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. `DEMO_CATALOG=true` serves the 18 sample products without a database; authentication and payments require configured services. There is no fake successful checkout or automatic fallback when a configured database fails.

The source challenge document and all `.env` files except `.env.example` are ignored. Never commit the supplied key or document. In the original implementation workspace, `.env.local` already contains the supplied StarPay key; do not overwrite it with the example.

## Configure Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/202609160001_store.sql` in its SQL editor (or apply it with the Supabase CLI migration workflow). It creates tables, RLS policies, the atomic checkout function, profile trigger, and public product-image bucket.
3. Add the project's URL, publishable key, and server-only service-role key to `.env.local`.
4. Run `npm run db:seed`. This upserts the three categories and 18 deterministic products, downloads the sample photography, uploads it to Supabase Storage, and stores the public object URLs. Rerunning is safe, but intentionally restores seed product values.
5. Set `DEMO_CATALOG=false`.
6. In Authentication → URL Configuration, set Site URL to your app URL and allow `http://localhost:3000/auth/callback` and `https://YOUR-DEPLOYMENT/auth/callback` as redirect URLs. Add preview domains only if needed.
7. Enable email/password authentication and email confirmation. Configure SMTP for reliable external delivery; Supabase's default email service may restrict recipients or throttle requests.

The seed uses curated Unsplash sample photographs as illustrative product imagery. Real merchandising should replace these with accurate, licensed product photographs and specifications. Storage upload errors stop the seed instead of silently saving broken URLs.

If your network prevents Node from downloading the photos, cache them as `<product-slug>.jpg` in a directory and run `SEED_IMAGE_DIR=/path/to/images npm run db:seed`. The same script still uploads every image into Supabase Storage and saves its public URL.

## Environment

| Variable                               | Purpose                                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL                                                                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public project key; access is protected by RLS                                                  |
| `SUPABASE_SERVICE_ROLE_KEY`            | Server-only database/storage administration                                                     |
| `APP_URL`                              | Canonical app/auth origin: localhost locally, the deployed HTTPS origin on Vercel               |
| `STARPAY_PUBLIC_URL`                   | Optional HTTPS origin for payment callbacks/returns; defaults to `APP_URL`                      |
| `STARPAY_API_SECRET`                   | Server-only merchant API secret, sent as `x-api-secret`                                         |
| `STARPAY_WEBHOOK_SECRET`               | Separate callback signing secret from the merchant dashboard                                    |
| `STARPAY_BASE_URL`                     | Defaults to `https://sandbox-api.starpayethiopia.com/v1/starpay-api`; other values are rejected |
| `DEMO_CATALOG`                         | Set `true` for explicit read-only sample data; `false` for Supabase                             |

Never prefix payment or service-role secrets with `NEXT_PUBLIC_`. Missing configuration returns a service-unavailable error. Without Supabase configuration, development also permits the sample catalog; production requires explicit `DEMO_CATALOG=true` or a configured project.

Use the **Secret Key** from the sandbox merchant account for `STARPAY_API_SECRET` and the **Webhook Secret Code** from that same account for `STARPAY_WEBHOOK_SECRET`. The challenge document's API key is only usable if StarPay still recognizes it and grants it access to that merchant; it cannot be paired with a webhook secret from another merchant. A provider HTTP 401 is reported as `PAYMENT_CREDENTIALS_REJECTED` in the `/api/checkout` response; server logs record the provider HTTP status and error code without logging secrets. Replace the rejected sandbox key in `.env.local` and Vercel, restart locally, and redeploy Vercel. A 401 attempt is known to have failed authentication, so checkout uses a new idempotency key on the next submission. Other ambiguous failures remain unresolved to avoid a possible duplicate charge.

### Local checkout with a deployed callback

Use separate app and payment origins in `.env.local`:

```dotenv
APP_URL=http://localhost:3000
STARPAY_PUBLIC_URL=https://merc-lac.vercel.app
```

Keep `APP_URL=https://merc-lac.vercel.app` on Vercel. The optional `STARPAY_PUBLIC_URL` may be the same or omitted there. Restart the local development server after changing environment variables. Allow the localhost auth callback in Supabase's redirect configuration.

The local server calls StarPay over HTTPS; StarPay sends callbacks and browser returns to the deployed HTTPS site. Both environments must use the same Supabase project and payment secrets. You may need to sign in again on the deployed site to view the order because localhost cookies are separate. If StarPay restricts the initiating server's network, complete sandbox checkout on Vercel instead.

To test through an HTTPS tunnel, open the **store itself** through the tunnel and set `APP_URL` and `STARPAY_PUBLIC_URL` to that same tunnel origin. Add its `/auth/callback` URL to Supabase's redirect allowlist. `STARPAY_PUBLIC_URL` only sets StarPay's callback and browser return URLs; it does not proxy the server's outbound request to StarPay. Opening the store on localhost while returning to the tunnel creates a separate browser origin and loses the localhost session cookie.

### Checkout reports a database setup error

Supabase authentication does not create the store tables. `DEMO_CATALOG=true` makes browsing work without those tables, but checkout still requires them. `PGRST205` means a required table is missing; `PGRST202` means the checkout function is missing. Apply the migration above, run `npm run db:seed`, then set `DEMO_CATALOG=false` locally and on Vercel. Redeploy Vercel after environment changes. Do not rerun the initial migration on a database where it was already successfully applied.

## Architecture

- `src/app`: routes, page composition, and thin HTTP handlers.
- `src/features`: catalog, cart, authentication, checkout, and order UI. Shared UI and providers live in `src/components`.
- `src/server`: server-only configuration, Supabase access, catalog services, order orchestration, and the StarPay adapter. Pure price/signature functions are separately testable.
- Zustand persists only cart IDs/quantities and already-settled order IDs in this browser. Hydration is explicit. Purchased quantities are subtracted once only after verified payment, preserving other items and additional quantities.
- TanStack Query owns server data. Axios calls same-origin API handlers. Server-rendered catalog pages call server services directly instead of making HTTP requests back to themselves.
- Supabase SSR cookies and Proxy refresh manage authentication. Protected APIs call `getUser()` and scope reads to the authenticated user. Client redirects improve navigation but are not security boundaries.
- Formik manages forms; Yup validates input on both client and server. Prices, order ownership, and paid status never come from trusted browser input.
- Catalog and images are publicly readable. Customers may read only their orders and profile. Order and payment mutations are restricted to server services. Service-role operations explicitly supply or verify ownership.
- Mutating browser API calls require the canonical same origin. Callbacks instead require HMAC authentication. Personalized responses are not publicly cached. Errors avoid exposing upstream bodies or credentials.

### Application API

| Endpoint                              | Behavior                                                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `GET /api/products`                   | Public catalog; search/filter/sort operates on this bounded sample catalog                                 |
| `GET /api/products/:slug`             | Product details or 404                                                                                     |
| `GET /api/auth/session`               | Current safe user summary and configuration status                                                         |
| `POST /api/auth/:action`              | `login`, `signup`, `logout`, `forgot-password`, `reset-password`                                           |
| `POST /api/checkout`                  | Authenticated `{ items: [{ productId, quantity }], delivery, idempotencyKey }` → `{ orderId, paymentUrl }` |
| `GET /api/orders`                     | Current customer's orders                                                                                  |
| `GET /api/orders/:id`                 | Current customer's order with item snapshots                                                               |
| `POST /api/orders/:id/verify`         | Reconciled order and `verification: verified                                                               | unavailable` |
| `POST /api/payments/starpay/callback` | Signed callback; verified independently before updating an order                                           |

Errors use `{ error: { code, message, fields?, orderId? } }` and an appropriate HTTP status. Delivery contains `name`, `email`, `phone`, `city`, `address`, and `instructions`. Quantities are integers from 1 to 10, with at most 50 distinct products. Local cart values are untrusted and revalidated.

## Payments and recovery

1. Checkout validates identity and configuration, then reads current catalog prices. Monetary values are stored in integer ETB minor units.
2. A Postgres function locks the `(user, idempotency key)` operation, checks cart rows, locks product prices, and writes the order, snapshots, and payment attempt in one transaction. Reusing a key with different input is rejected. Only the winning request initializes StarPay.
3. The server calls `/trdp/order` and stores the provider ID, hosted payment URL, and expiration. Only HTTPS URLs on StarPay's domain are accepted. Amounts are converted to major units at this boundary.
4. StarPay redirects to the order page. That page verifies through `/trdp/verify`; redirects and browser parameters never mark an order paid.
5. Callback signatures use HMAC-SHA256 over `${timestamp}.${JSON.stringify(payload)}`, with constant-time comparison and five-minute clock tolerance. The handler accepts documented `billRefNo` or `order_id` at the top level or inside `data`, resolves the saved attempt, then independently verifies it. Unknown callback shapes fail closed.
6. Paid status requires a matching bill reference when StarPay echoes one, a matching order reference when provided, and the expected amount and ETB currency. StarPay may return a separate internal UUID as `order_id` for a queried bill reference. Duplicate callbacks are harmless. Database updates exclude already-paid rows, preventing late failures from reversing success.
7. Status polling runs every five seconds for up to two minutes while the page is open. A manual check remains available; authenticated order history supports returning later.

**Ambiguous initialization:** the provider may have accepted a request even if its response timed out. Such attempts stay unresolved; the app does not automatically initialize again. The checkout error links to the saved order. If the provider ID was never saved, an operator must reconcile the internal order reference against the merchant dashboard before any new payment attempt. This deliberately favors avoiding duplicate charges over automatically recovering every network failure.

**Older `GEN_019` attempts:** StarPay returned HTTP 400 before creating a payment when the server sent `0900000000` directly. After confirming that an affected order has no payment in the StarPay dashboard, remove the `merc-checkout` key from browser session storage and submit a fresh checkout. The old unresolved order will remain pending until an operator cleans it up. The server now sends `+251900000000`, and future `GEN_019` rejections are recorded as failed attempts.

Payment verification failures preserve the current order status and show a retry message. Callbacks return 503 when verification or attempt lookup is temporarily unavailable. Signed callback verification requires the separate webhook secret; without it, browser-initiated verification can still check known provider IDs, but webhook verification cannot pass.

StarPay's sandbox verification response can send `amount` as a decimal string, even though its API reference models a number. The adapter validates and converts that value before comparing it with the stored order total. Provider errors are logged by category without response bodies or customer data.

Use **0900000000 only** in the checkout form. The server sends its equivalent E.164 form, `+251900000000`, to StarPay because the transaction API rejects the local format with `GEN_019`. Both the input schema and server adapter restrict this implementation to sandbox behavior. No production payments or real customer phone numbers are supported.

Official references: [create transaction](https://developer.starpayethiopia.com/api/endpoint/transaction), [verify payment](https://developer.starpayethiopia.com/api/endpoint/verification), [callback signatures](https://developer.starpayethiopia.com/api/sign), [test number](https://developer.starpayethiopia.com/api/test-numbers). Merchant gateway activation and domain/network approval are external prerequisites; putting calls on the server does not itself grant access.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

If using an existing Chrome installation:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/google-chrome npm run test:e2e
```

Unit tests cover pricing, validation, redirect safety, cart settlement, callback signatures, and verification matching. Service tests cover duplicate claims, timeouts, ownership, and paid-state preservation. Database tests execute the migration in embedded Postgres (PGlite) with minimal Supabase auth/storage scaffolding to check real SQL/RLS behavior. They do not replace testing the migration against hosted Supabase.

Playwright exercises catalog discovery, cart persistence, authentication handoff, checkout validation, pending/retry/paid states, and desktop/mobile navigation. External authentication and payment responses are intercepted in these browser contract tests; they **do not prove a real StarPay transaction**. The real deployment acceptance check below is separate. CI runs lint, types, tests, build, and browser tests.

## GitHub and Vercel deployment

1. Push the source to a GitHub repository and import it into Vercel using the Next.js preset and Node 22.
2. Set environment variables in Vercel. Use a stable public deployment URL for `APP_URL`. Start with `DEMO_CATALOG=true` only for a catalog preview; seed Supabase and set it to `false` for the full application.
3. Configure Supabase Site URL and auth redirects for that domain. Add the StarPay callback secret and any merchant approval required for the deployed server.
4. Deploy/redeploy after configuration. Use `/api/payments/starpay/callback` as the callback endpoint; payment initialization supplies it automatically.
5. Acceptance check: register and confirm a test account, add products, check out with `0900000000`, complete the hosted sandbox flow, confirm the order becomes paid, reload it, check cart settlement, and verify private order access from a second account. Check the merchant dashboard and Vercel logs for any unresolved attempts; logs should never contain secrets or personal delivery data.

No hosted Supabase project, Vercel deployment, or real sandbox transaction should be considered verified until that final check is completed with the account credentials.

## Assumptions and tradeoffs

English UI, ETB prices, tax included, free illustrative Addis Ababa delivery, and no physical fulfillment. The catalog uses availability flags rather than inventory reservations. Product administration happens in Supabase. Guest browsing and carts are supported; checkout requires login. Carts are local to a browser and are not synchronized across devices or users sharing that browser. No variants, coupons, refunds, shipping integration, or fulfillment management.

This small catalog is fetched as a list; a larger catalog should add indexed server-side search and pagination. Payment reconciliation is callback/page-driven, with manual operator recovery for unknown initialization outcomes; a production store should add a durable reconciliation worker and operational alerting. These are documented limits, not simulated capabilities.
