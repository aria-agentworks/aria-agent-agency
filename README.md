# Aria Agent Agency — Storefront & Automation Kit Platform

A complete, self-hostable storefront that sells ready-made AI automation kits
(one-time) **and** monthly managed plans (subscriptions), with built-in email
marketing capture, first-party analytics, promo codes, and a Dodo Payments
integration (merchant of record).

## Quick start (zero external dependencies)

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

The database is **SQLite** — no MySQL/Postgres server needed. The schema is
created automatically at `data/aria.sqlite3` on first start.

The **first account you register** at `/login` → "Create account" becomes the
agency owner (admin). Everyone else becomes a customer account.

## Payments

The platform supports two gateways. **Dodo Payments is preferred** (it acts as
merchant of record: it handles global taxes, invoices, refunds and payment
methods for you — ideal for selling from India to the world).

### Connect Dodo Payments (recommended)

1. Create an account at <https://app.dodopayments.com>.
2. **Developer → API Keys** → copy your secret key.
3. **Developer → Webhooks** → add an endpoint pointing to
   `https://your-domain.com/api/dodo/webhook` and copy the signing key
   (`whsec_...`). Subscribe at minimum to:
   `payment.succeeded`, `payment.failed`, `subscription.active`,
   `subscription.past_due`, `subscription.cancelled`, `subscription.expired`.
4. Put the values in `.env`:

   ```env
   DODO_PAYMENTS_API_KEY=your_key
   DODO_PAYMENTS_MODE=test_mode      # switch to live_mode when ready
   DODO_WEBHOOK_KEY=whsec_...
   ```

5. Restart, sign in as admin, open **/admin** and click
   **“Sync catalog to Dodo Payments”** — the app creates a matching product in
   Dodo for every automation kit and every subscription plan automatically
   (mapping is stored in `dodo_product_map`).
6. **Discounts:** create any promo codes you want in the Dodo dashboard
   (Discounts → New). Codes that exist in both the app (`promo_codes` table)
   and Dodo are validated twice and applied natively at checkout.

### Stripe (legacy fallback)

If no Dodo key is present, the store falls back to Stripe **test** checkout
exactly as before (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`).

## Environment reference

| Variable                                      | Purpose                                                          |
| --------------------------------------------- | ---------------------------------------------------------------- |
| `PORT`                                        | HTTP port (default 3000)                                         |
| `DODO_PAYMENTS_API_KEY`                       | Enables the Dodo gateway when set                                |
| `DODO_PAYMENTS_MODE`                          | `test_mode` (default) or `live_mode`                             |
| `DODO_WEBHOOK_KEY`                            | Verifies `/api/dodo/webhook` signatures                          |
| `DODO_RECOVERY_PRODUCT_ID`                    | Optional existing one-time pay-what-you-want recovery product ID |
| `DODO_RECOVERY_MINIMUM_CENTS`                 | Minimum recovery amount in USD cents (default `100`)             |
| `DODO_RECOVERY_SUGGESTED_PRICE_CENTS`         | Suggested recovery amount in USD cents                           |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Legacy Stripe test fallback                                      |
| `AUTH_SECRET`                                 | Session signing secret (auto-generated + persisted if unset)     |
| `CLAIM_FIRST_ADMIN`                           | `1` (default): first registered account becomes admin            |
| `DISABLE_LOCAL_AUTH`                          | `1` disables email/password endpoints                            |
| `PUBLIC_SITE_ORIGIN`                          | Canonical origin for sitemap/robots/SEO                          |
| `SQLITE_DB_PATH`                              | Custom SQLite file location (default `data/aria.sqlite3`)        |

## What's inside

- **Storefront** — 13 independently priced automation kits with detail pages,
  industry pages, install guides, cart + checkout, and account-linked kit
  downloads after verified payment.
- **Subscription plans** — Starter / Business / Office Max monthly plans
  (`shared/plans.ts`) billed via Dodo; `/pricing` page + `/api/store/subscribe`.
- **Dodo integration** (`server/dodo.ts`) — auto product provisioning,
  checkout sessions, signed webhook verification (Standard Webhooks),
  idempotent event processing, subscription lifecycle sync, and an exact-amount
  pay-what-you-want recovery checkout for contingency fees.
- **Accounts** — built-in email/password auth (`/login`) with scrypt hashing;
  platform OAuth still works when configured.
- **Marketing** — newsletter capture + free “50 AI Automation Systems”
  playbook lead magnet, first-party funnel analytics (`marketing_events`),
  promo codes, one-click unsubscribe.
- **Owner console** (`/admin`) — revenue/orders/plans/subscribers/events
  overview, inquiry inbox, one-click Dodo catalog sync.
- **SEO** — route-specific titles/descriptions/OG tags, `sitemap.xml`,
  `robots.txt`, canonical URLs, SSR meta for public pages.

## Scripts

```bash
pnpm dev         # development server (tsx watch + vite)
pnpm build       # production build (vite + esbuild)
pnpm start       # run production server (NODE_ENV=production node dist/index.js)
   pnpm test        # automated tests
   pnpm check       # typescript check
   pnpm dodo:check  # read-only Dodo product/account connectivity check
node scripts/simulate-dodo-webhook.mjs   # local end-to-end payment simulation
```

## Production deployment

1. `pnpm install && pnpm build`
2. Set env (at minimum `NODE_ENV=production`, `PORT`, Dodo keys, and
   `PUBLIC_SITE_ORIGIN=https://your-domain`).
3. Run behind any process manager (systemd, PM2, Docker) or the included
   Dockerfile. Put HTTPS in front (Caddy/nginx) — sessions automatically use
   `Secure/SameSite=None` cookies on HTTPS.
4. Point the Dodo webhook endpoint at `https://your-domain/api/dodo/webhook`.
5. Register your admin account, run **Sync catalog to Dodo Payments**, then
   switch `DODO_PAYMENTS_MODE=live_mode` once commercial terms are final.

## Data & safety notes

- Kit files are served only to signed-in owners of **paid** orders — access is
  granted by the payment webhook, never by the redirect back from checkout.
- Webhook processing is idempotent (`dodo_events` / `stripe_events` tables).
- The public demo uses synthetic data only; no PHI or secrets are accepted.
- Newsletter subscribers can unsubscribe with a one-click link
  (`/api/marketing/unsubscribe?email=...`).
