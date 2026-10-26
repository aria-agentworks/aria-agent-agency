# Aria Platform — Access, Usage, Client Onboarding & Dodo Payments Guide

This guide explains how to start Aria, access each area, onboard a client, use the storefront and Growth Engine, operate the client portal, and connect Dodo Payments.

## 1. Important product boundaries

Aria currently combines:

- a storefront for configurable automation kits;
- monthly installation/managed-plan checkout;
- a client onboarding wizard;
- a client portal;
- a private agency/admin console;
- a Growth Engine for lead research and outreach drafting;
- a public website widget and widget inquiry capture;
- inactive n8n starter workflows and per-product setup documentation.

The kits are **configurable starters**, not automatically connected production systems. A purchase does not automatically connect a client CRM, HMS/EMR, calendar, WhatsApp account, voice provider, email provider, or AI provider. Client credentials must be entered into the client-owned n8n credential vault or another separately approved secure route.

Prices in the current source are draft/test prices until the owner approves the commercial terms. Do not switch to live commerce until final prices, licensing, refunds, cancellation rules, support commitments, privacy/security terms, and provider-cost ownership are approved.

## 2. Requirements

- Node.js 22 recommended; Node 20 is supported by the package notes.
- pnpm 10.18.
- An HTTPS domain for production.
- Dodo Payments test/live credentials for Dodo checkout.
- A persistent writable `data/` directory for SQLite and the generated auth secret.

## 3. Run the application locally

From the project directory:

```bash
pnpm install
pnpm dev
```

Open:

```text
http://localhost:3000
```

The SQLite database is created automatically at:

```text
data/aria.sqlite3
```

The session secret is generated and persisted at:

```text
data/auth-secret
```

Useful local checks:

```bash
pnpm check
pnpm test
pnpm build
```

The health endpoint is:

```text
http://localhost:3000/api/health
```

Expected response:

```json
{ "status": "ok" }
```

## 4. Run the production build

Build the client and server:

```bash
pnpm install
pnpm build
```

Start the production server:

```bash
pnpm start
```

The `start` script runs `NODE_ENV=production node dist/index.js`. Set `PORT` in the environment before running it when the default port `3000` is not suitable.

Or use Docker:

```bash
docker build -t aria .
docker run --name aria -p 3000:3000 -v aria_data:/app/data aria
```

Put HTTPS in front of the application using the approved reverse proxy or hosting platform. Set `PUBLIC_SITE_ORIGIN` to the canonical HTTPS origin.

## 5. Environment variables

Create a private `.env` file for local development or configure equivalent secret/environment settings in production. Never commit this file.

| Variable                              | Purpose                                                                                                   |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                            | `development` or `production`                                                                             |
| `PORT`                                | HTTP port; defaults to `3000`                                                                             |
| `SQLITE_DB_PATH`                      | Optional SQLite path; default is `data/aria.sqlite3`                                                      |
| `AUTH_SECRET`                         | Session signing secret; generated automatically if omitted                                                |
| `CLAIM_FIRST_ADMIN`                   | Defaults to `1`; first local account becomes admin. Set to `0` when you do not want this behavior.        |
| `DISABLE_LOCAL_AUTH`                  | Set to `1` to disable local email/password auth                                                           |
| `PUBLIC_SITE_ORIGIN`                  | Canonical public HTTPS origin and SEO origin                                                              |
| `PUBLIC_APP_ORIGIN`                   | Approved application origin for checkout redirects                                                        |
| `APPROVED_SITE_ORIGIN`                | Additional approved checkout origin                                                                       |
| `DODO_PAYMENTS_API_KEY`               | Dodo API key; enables Dodo checkout                                                                       |
| `DODO_PAYMENTS_MODE`                  | `test_mode` or `live_mode`                                                                                |
| `DODO_WEBHOOK_KEY`                    | Dodo Standard Webhooks signing key                                                                        |
| `DODO_RETURN_ORIGIN`                  | Optional explicit Dodo return origin                                                                      |
| `DODO_RECOVERY_PRODUCT_ID`            | Optional existing Dodo product ID for the DenialsDoctor recovery product; otherwise admin sync creates it |
| `DODO_RECOVERY_MINIMUM_CENTS`         | Minimum one-time recovery amount in USD cents; defaults to `100` ($1.00)                                  |
| `DODO_RECOVERY_SUGGESTED_PRICE_CENTS` | Suggested recovery amount in USD cents; defaults to the minimum                                           |
| `STRIPE_SECRET_KEY`                   | Legacy Stripe test fallback                                                                               |
| `STRIPE_WEBHOOK_SECRET`               | Legacy Stripe webhook signing secret                                                                      |

Example test-mode configuration:

```env
NODE_ENV=development
PORT=3000
PUBLIC_SITE_ORIGIN=http://localhost:3000
PUBLIC_APP_ORIGIN=http://localhost:3000
DODO_PAYMENTS_API_KEY=your_dodo_test_key
DODO_PAYMENTS_MODE=test_mode
DODO_WEBHOOK_KEY=whsec_your_test_webhook_key
```

## 6. First access and account roles

Open `/login` or click the sign-in link in the navigation.

### First local account

With the default `CLAIM_FIRST_ADMIN=1`, the first local account registered in an empty database becomes the agency administrator. Register the owner account first:

1. Open `/login`.
2. Choose **Create account**.
3. Enter the agency owner name, email, and password.
4. Sign in.
5. Confirm that `/admin` is available.

For a public production deployment, do not leave “first public registrant becomes admin” enabled indefinitely. Register the owner during controlled deployment, then set `CLAIM_FIRST_ADMIN=0` and restart.

### Customer accounts

Every later local account is a customer account. Customers can use:

- `/automations`;
- `/industries` and `/industries/:id`;
- `/voice-setup`;
- `/pricing`;
- `/get-started`;
- `/implementation`;
- `/cart`;
- `/orders`;
- `/portal`;
- `/demo`;
- `/faq`, `/how-it-works`, `/privacy`, and `/terms`.

### Administrator-only areas

The following are for the agency administrator:

- `/admin` — revenue, subscriptions, inquiries, Dodo catalog provisioning;
- `/growth` — lead research, lead management, outreach drafting, and Growth statistics.

Growth API routes enforce agency-admin access server-side. A normal customer should receive `403` if they try to call them directly.

## 7. Main public functions

### Home — `/`

Use the homepage to:

- understand the Aria offer;
- enter the onboarding wizard;
- browse automation categories;
- open the demo;
- download the lead magnet;
- subscribe to the newsletter.

### Automation catalog — `/automations`

Use the catalog to:

1. Filter by industry.
2. Open an automation detail page.
3. Review outcomes, requirements, included workflows, safety boundaries, and price.
4. Open the setup guide.
5. Add the kit to the cart.
6. Request agency implementation instead of self-installing.

Current product families include front office, dental, healthcare/hospital, lead qualification, customer support, reputation/service recovery, property/real estate, daily operations, voice, local website lead generation, gold showroom, CA practice operations, and universal WhatsApp response.

### Automation detail — `/automations/:id`

Each detail page explains:

- what the kit is for;
- what it does and does not do;
- what is included;
- client/provider requirements;
- workflow boundaries;
- synthetic/demo behavior;
- draft/test price;
- setup guide and implementation-request links.

### Setup guide — `/automations/:id/setup`

Use this page after choosing a kit.

The normal safe procedure is:

1. Buy the kit or otherwise obtain verified purchase access.
2. Open **My purchases** at `/orders`.
3. Download the purchased ZIP.
4. Sign into the client-owned n8n workspace.
5. Import one JSON workflow from the kit’s `workflows` folder.
6. Run only the supplied synthetic/manual-trigger example.
7. Keep the workflow inactive.
8. Create client-owned provider credentials directly in n8n Credentials.
9. Map only documented APIs or the documented staff handoff.
10. Test missing data, duplicates, consent/opt-out, errors, and human handoff.
11. Obtain named client-owner approval before activation.

The setup page can generate a local secret-free `client-setup.json`. It accepts provider names and public documentation URLs, not API keys, passwords, tokens, signed URLs, patient records, or identity documents.

### One-time cart — `/cart`

Use the cart for one-time automation kits:

1. Add one or more kits from the catalog.
2. Review the draft/test total.
3. Apply a promo code if configured.
4. Sign in.
5. Continue to hosted checkout.
6. Wait for the verified payment webhook.
7. Open `/orders` to download the kit.

Kit access is not granted merely because the browser returns from checkout. It is granted after the signed payment webhook marks the order paid.

### Purchases — `/orders`

Use `/orders` to:

- see pending, paid, failed, or cancelled orders;
- refresh payment status;
- download purchased kits;
- open the setup guide;
- access the admin area if the signed-in account is an administrator.

Subscription and installation billing items are displayed separately from downloadable kit items.

### Pricing — `/pricing`

The current plan definitions are:

| Plan             |    Installation |               Monthly |
| ---------------- | --------------: | --------------------: |
| Starter          | $149 draft/test |  $29/month draft/test |
| Growing Business | $249 draft/test |  $79/month draft/test |
| Office Max       | $499 draft/test | $199/month draft/test |

The plan checkout charges the one-time installation product together with the recurring plan in the Dodo cart. If Dodo is not configured with both API and webhook credentials, subscription checkout remains unavailable.

### Client onboarding wizard — `/get-started`

The wizard has three functional stages:

#### Stage 1 — Business discovery

Choose one:

- **Share my website** — Aria reads the public homepage and suggests a category;
- **Answer 3 questions** — choose business type, enquiry channel, and primary pain point.

You can provide business name and email for the setup plan.

#### Stage 2 — Category confirmation

Review the detected category, then confirm it or select another category. The customer always has the final category choice.

#### Stage 3 — Delivery and plan

Choose:

- **On my website** — website widget delivery;
- **In my Aria portal** — portal delivery;
- **Both** — website widget plus portal.

Select Starter, Growing Business, or Office Max, then sign in and start checkout.

After verified payment, the onboarding record moves to the paid state. The agency administrator can advance the record through `/api/store/admin/onboarding/:id` or the corresponding admin tooling as the implementation proceeds.

### Implementation request — `/implementation`

Use this when the client wants agency help instead of only downloading a kit.

The form captures:

- name and email;
- business and industry;
- selected automation or custom scope;
- current tools;
- goals;
- phone and website;
- location/country/timezone;
- languages;
- handoff owner;
- provider names and public API documentation;
- support level;
- consent.

Available support choices:

| Choice                           | Meaning                                                                   |
| -------------------------------- | ------------------------------------------------------------------------- |
| Discuss a scope                  | Discovery and quote                                                       |
| Install my purchased kit         | Import/configuration, agreed source connection, testing, handover         |
| Installation + API wiring        | Installation plus documented provider API connection                      |
| Installation + covered API costs | Separately agreed setup plus capped usage budget and recurring-cost terms |

Do not put secrets in this form. Submit only public provider documentation and non-secret business particulars.

### Demo — `/demo`

Use the demo to exercise synthetic administrative scenarios such as:

- appointment handling;
- no-show recovery;
- approved discharge follow-up;
- pending diagnostic escalation;
- lead qualification;
- clinical-question human review.

The demo is synthetic. It does not process real patient data, make clinical decisions, send real messages, or activate real integrations.

### Website widget — `/embed/aria.js`

The client portal can provide a widget snippet for website delivery. The widget captures a visitor name, email, message, business identifier, and consent, then creates a private agency inquiry.

The widget is an inquiry capture path. It is not a complete live AI chat or CRM integration by itself.

## 8. Client onboarding procedure for the agency

Use this sequence for every client.

### Step 1 — Receive the request

The request arrives through either:

- `/get-started` followed by subscription checkout; or
- `/implementation` for an agency-led scope.

Open `/admin` and review the private inquiry or onboarding record.

### Step 2 — Confirm commercial scope

Before connecting anything, confirm in writing:

- selected kit or plan;
- installation fee;
- monthly fee;
- included workflows;
- implementation/API-wiring scope;
- third-party provider ownership;
- usage-cost ownership and overage policy;
- support expectations;
- refund/cancellation terms;
- client owner and escalation contact;
- go-live date and acceptance criteria.

### Step 3 — Request safe technical inputs

Ask for:

- provider names;
- public API documentation;
- required permission scopes;
- client-owned n8n workspace;
- source-of-truth system;
- approved data fields;
- consent/opt-out rules;
- named human owner;
- test/sandbox account where available.

Never ask the client to send passwords, API keys, bearer tokens, signed URLs, KYC documents, patient records, or customer exports through the storefront form or ordinary email.

### Step 4 — Import and test the inactive kit

In the client-owned n8n workspace:

1. Import the workflow JSON.
2. Run the synthetic Manual Trigger.
3. Check output schema.
4. Check duplicate prevention.
5. Check missing-data behavior.
6. Check opt-out behavior.
7. Check human handoff.
8. Keep all send/write/schedule nodes disabled.

### Step 5 — Add approved credentials

Credentials belong in the client-owned n8n credential vault. Add one provider at a time, using least privilege. Test read-only access before enabling writes, sends, or schedules.

### Step 6 — Test with approved sandbox data

Record:

- test case;
- input;
- expected output;
- actual output;
- exception behavior;
- human owner;
- approval date.

### Step 7 — Approve activation

Do not activate until the client approves:

- source systems;
- provider identity;
- message templates;
- consent/opt-out handling;
- human fallback;
- error ownership;
- duplicate/idempotency behavior;
- retention/security boundaries;
- go-live scope.

### Step 8 — Update onboarding status

The supported status model is:

```text
new → paid → contacted → installing → live
                         ↘ blocked
```

Use `blocked` when client input, provider access, API support, or approval is missing. Do not mark a client live merely because a kit was purchased.

## 9. Admin console — `/admin`

The admin console provides:

- paid orders;
- pending orders;
- revenue summary;
- active subscriptions;
- newsletter count;
- funnel event count;
- implementation inquiry inbox;
- Dodo catalog provisioning.

### Sync the Dodo catalog

After adding Dodo credentials:

1. Sign in as admin.
2. Open `/admin`.
3. Click **Sync catalog to Dodo Payments**.
4. Wait for the result showing existing, newly created, and failed products.
5. Resolve failures before selling.

The sync creates/maps:

- one-time kit products;
- recurring subscription products;
- one-time installation products for each plan.
- the one-time **DenialsDoctor — Recovery** pay-what-you-want product, with a
  configurable minimum amount.

The local mapping is stored in `dodo_product_map` and is kept separate for
`test_mode` and `live_mode`, so test product IDs are never reused for live
checkout.

### Create a contingency recovery link

After the recovery product has been provisioned, an administrator can create a
one-time exact-amount link from `/admin`:

1. Enter the customer email and optional name.
2. Enter an internal claim/recovery reference.
3. Enter the recovered-fee amount in USD.
4. Click **Create recovery link**.
5. Send the generated hosted checkout URL through the approved communication
   channel.

The customer is charged the exact amount entered by the administrator.
Subscriptions remain fixed-price plans. Recovery payments are recorded as paid
orders but do not grant an automation-kit download or subscription entitlement.

## 10. Growth Engine — `/growth`

The Growth Engine is agency-admin-only.

### Seed or add leads

Use the UI **Add lead** action or seed the researched sample set:

```bash
pnpm exec tsx scripts/seed-growth-leads.ts
```

The lead record can include:

- niche;
- business name;
- website;
- owner/contact details;
- city;
- source name and URL;
- notes.

### Research a lead

1. Open a lead.
2. Choose **Research**.
3. Aria fetches the public website through an SSRF-safe public fetcher.
4. Review website reachability, quality, automation signals, booking, WhatsApp, forms, social links, and opportunity score.
5. Manually verify the result before outreach.

Private/loopback hosts are blocked, redirects are revalidated, and responses are bounded.

### Generate outreach drafts

The lead drawer supports:

- call script;
- WhatsApp/SMS draft;
- three-touch email sequence;
- activity logging.

Generated content is a draft. Copy, review, and send through the approved human/provider workflow.

If a lead is marked not interested or otherwise suppressed, further outreach generation/logging is blocked.

### Growth statuses

```text
new → researched → contacted → replied → booked → won
                                           ↘ lost
```

Use `lost` or suppression for leads that must not be contacted again.

## 11. Dodo Payments setup

### 11.1 Create the Dodo account

Create or access the Dodo Payments merchant account. Complete the required business, payout, tax, and merchant verification steps in Dodo.

### 11.2 Create a test API key

In the Dodo dashboard:

1. Open the developer/API-key area.
2. Create or copy the test API key.
3. Put it in the private environment configuration as `DODO_PAYMENTS_API_KEY`.
4. Set:

```env
DODO_PAYMENTS_MODE=test_mode
```

### 11.3 Create the webhook

Create a webhook endpoint pointing to:

```text
https://YOUR_DOMAIN/api/dodo/webhook
```

For local development, use a secure tunnel or test the application with the included local simulation. Do not expose an unauthenticated local development port directly to the internet.

Copy the webhook signing key and set:

```env
DODO_WEBHOOK_KEY=whsec_...
```

Subscribe to at least:

- `payment.succeeded`;
- `payment.failed`;
- `payment.processing`;
- `payment.cancelled`;
- `subscription.active`;
- `subscription.renewed`;
- `subscription.updated`;
- `subscription.past_due`;
- `subscription.on_hold`;
- `subscription.cancelled`;
- `subscription.expired`;
- `subscription.paused`;
- `subscription.unpaused`.

The application verifies the raw request body, webhook ID, timestamp, signature, and five-minute timestamp tolerance. Do not proxy or transform the JSON body before it reaches `/api/dodo/webhook`.

### 11.4 Configure approved origins

Set the public origin used for the hosted checkout return URL:

```env
PUBLIC_SITE_ORIGIN=https://your-domain.com
PUBLIC_APP_ORIGIN=https://your-domain.com
```

For local use:

```env
PUBLIC_SITE_ORIGIN=http://localhost:3000
PUBLIC_APP_ORIGIN=http://localhost:3000
```

### 11.5 Restart and provision products

Restart Aria after changing environment variables:

```bash
pnpm dev
```

Then:

1. Sign in as admin.
2. Open `/admin`.
3. Click **Sync catalog to Dodo Payments**.
4. Confirm that all kits, plans, and installation products are mapped.

### 11.6 Test checkout

Use Dodo test mode and Dodo’s test payment method. Test both:

- one-time kit checkout;
- subscription plus installation checkout.

Verify:

- hosted checkout opens;
- the order is created as pending;
- the signed webhook is accepted;
- `payment.processing` does not grant access;
- `payment.succeeded` marks the order paid;
- the purchase/download appears in `/orders`;
- `subscription.active` activates the subscription;
- `/portal` shows the plan and onboarding status;
- cancellation works from the portal.

### 11.7 Run the local webhook simulation

With the server running and test webhook configuration available:

```bash
node scripts/simulate-dodo-webhook.mjs
```

The simulation verifies signed/unsigned webhook handling, paid-order transition, purchase creation, protected download, duplicate delivery, and subscription activation.

### 11.8 Create promo codes

For a promo code to work with Dodo, it must exist in both places:

1. The local `promo_codes` table/database configuration.
2. The Dodo dashboard discount configuration.

If the code exists locally but not in Dodo, Aria refuses the checkout rather than silently charging an inconsistent amount.

### 11.9 Switch to live mode

Do this only after the test flow is complete:

1. Approve final pricing and currency.
2. Approve refunds and cancellation terms.
3. Approve kit licensing and support commitments.
4. Complete a signed test checkout and webhook verification.
5. Replace the test API key with the live Dodo API key.
6. Set `DODO_PAYMENTS_MODE=live_mode`.
7. Set the live webhook signing key.
8. Restart the application.
9. Run the admin catalog sync against the live environment.
10. Perform a controlled live transaction and reconcile it manually.

Never put Dodo keys in Git, screenshots, support tickets, client forms, or this document.

Because a live secret key was pasted into chat, rotate that key in the Dodo
dashboard before using the integration in production. Configure the replacement
key only in the deployment secret store or private process environment; do not
place it in this repository.

## 12. Marketing and newsletter functions

### Newsletter capture

The homepage/footer can collect newsletter subscribers. Records are stored locally in SQLite.

### Lead magnet

The playbook is available from the public site and tracked through:

```text
/api/marketing/leadmagnet
```

### Unsubscribe

The unsubscribe endpoint is:

```text
/api/marketing/unsubscribe?email=customer@example.com
```

### Funnel analytics

First-party events are stored in `marketing_events`, including page/checkout/newsletter interactions sent by the client.

## 13. Troubleshooting

### The app does not start

Run:

```bash
pnpm install
pnpm check
pnpm dev
```

Check:

```text
/api/health
```

### Subscription buttons are disabled

Confirm all of the following:

- `DODO_PAYMENTS_API_KEY` is set;
- `DODO_WEBHOOK_KEY` is set;
- `DODO_PAYMENTS_MODE` is valid;
- the application was restarted;
- `PUBLIC_APP_ORIGIN` or `PUBLIC_SITE_ORIGIN` matches the browser origin;
- the admin has synchronized the Dodo catalog.

### Checkout says the origin is not approved

Set the correct origin:

```env
PUBLIC_APP_ORIGIN=https://your-domain.com
PUBLIC_SITE_ORIGIN=https://your-domain.com
```

Do not include a path such as `/pricing` in these variables.

### Payment stays pending

Check:

- Dodo webhook URL;
- webhook signing key;
- application logs;
- whether the webhook reaches `/api/dodo/webhook`;
- whether the raw body is preserved;
- whether the event is `payment.succeeded` rather than only `payment.processing`.

### Kit download is unavailable

The user must:

- be signed in as the purchasing account;
- have an order marked `paid`;
- have the automation in the order’s downloadable kit items.

### The widget does not display

Confirm the client pasted the exact snippet from the portal and that the page can load:

```text
/embed/aria.js
```

The widget submits inquiries to `/api/widget/inquiry`; production sites must allow the Aria origin and use HTTPS.

### Growth Engine access is denied

Growth is agency-admin-only. Confirm the signed-in account has `role=admin`. Do not attempt to bypass the UI; the server also enforces the role.

## 14. Recommended operating checklist

### Daily

- review new implementation inquiries;
- review pending/failed payments;
- review Growth activity and suppressed leads;
- review blocked onboarding records;
- verify webhook/application logs.

### Per client

- confirm scope and owner;
- record provider/API documentation;
- import and test inactive kit;
- add credentials to the client vault;
- run synthetic and error-path tests;
- obtain activation approval;
- update onboarding status;
- document handover and support owner.

### Before live launch

- run `pnpm check`;
- run `pnpm test`;
- run `pnpm build`;
- run the local Dodo simulation;
- complete a Dodo test checkout;
- verify downloads and subscription activation;
- verify admin-only Growth access;
- verify widget inquiry capture;
- verify HTTPS and webhook delivery;
- back up `data/aria.sqlite3` and the auth secret securely.

## 15. Key routes at a glance

| Function               | Route                               |
| ---------------------- | ----------------------------------- |
| Home                   | `/`                                 |
| Client onboarding      | `/get-started`                      |
| Catalog                | `/automations`                      |
| Industry catalog       | `/industries` and `/industries/:id` |
| Kit setup              | `/automations/:id/setup`            |
| Voice setup            | `/voice-setup`                      |
| Pricing                | `/pricing`                          |
| Cart                   | `/cart`                             |
| Orders/downloads       | `/orders`                           |
| Client portal          | `/portal`                           |
| Implementation request | `/implementation`                   |
| Demo                   | `/demo`                             |
| Growth Engine          | `/growth`                           |
| Admin                  | `/admin`                            |
| Login                  | `/login`                            |
| Health                 | `/api/health`                       |
| Dodo webhook           | `/api/dodo/webhook`                 |
| Website widget script  | `/embed/aria.js`                    |
| Widget inquiry         | `/api/widget/inquiry`               |
