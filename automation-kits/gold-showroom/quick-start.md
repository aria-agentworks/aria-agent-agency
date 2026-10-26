# Gold Showroom AI Desk — Two-Step Safe Setup

Draft workflow-kit price: **$449 USD**. Purchase pays for this distinct configurable kit, not live provider accounts or an already-connected business system.

## Step 1 — Import and test the synthetic kit

In your client-owned n8n workspace choose Workflows → Import from File and import one JSON from `workflows/`. Keep it inactive and execute only the synthetic Manual Trigger. Review output and exception/human-review paths.

## Step 2 — Add approved API connections in your own vault

Use the API checklist below. Create credentials in your client-owned n8n Credentials vault; never include secret values in the supplied config. Add a documented source/provider adapter or leave the staff handoff. Test schema, permissions, duplicate protection, consent, missing data, stale state, failure and owner review before production. A model/API key by itself does not configure an arbitrary business-system connector.

## Client particulars

Use `client-setup-template.json` to fill business name/website/location/country/timezone/languages, named owner/transfer destination, provider names and public docs. All `enabled` flags remain false. Do not place API keys, signed URLs, passwords, patient/client records or KYC documents in this file. The public setup guide `/automations/gold-showroom/setup` can build a local JSON and copy non-secret details into an explicitly submitted inquiry.

## API and provider checklist

### Google Sheet ratebook and client tables — Required for the scoped production use

Reads owner-verified Rates, Subscribers, Scheme, and Visits data.

Client provides: Spreadsheet ID and approved columns/field mapping; Owner-verified date/rates and making-charge/tax settings; Showroom timezone Asia/Kolkata and named staff owner.

Credential destination: **Google OAuth/service-account credential in client-owned n8n Credentials.**

1. Create the four named tabs and enter synthetic fixtures.
2. Connect the sheet read adapter and verify current-day rate freshness.

### Meta WhatsApp Cloud API (optional) — Optional, only if your scope uses it

Can receive opt-in customer requests and queue approved rate/reminder drafts.

Client provides: Business-owned WhatsApp account, Phone Number ID and approved messaging templates; System-user token (enter only in vault), opt-in list and opt-out process.

Credential destination: **Meta credential in client n8n Credentials; do not paste token in Aria form.**

1. Complete client provider onboarding and map a secure webhook.
2. Keep broadcast/send nodes paused until showroom owner approval.

### OpenAI / approved AI provider (optional) — Optional, only if your scope uses it

Classifies bounded showroom enquiries; deterministic calculations use approved source values.

Client provides: Client-selected provider/model, data/privacy review and budget owner.

Credential destination: **Client n8n Credentials vault.**

1. Add the approved provider credential.
2. Test unknown/stale rates, scheme and sensitive requests before use.

## Need Aria to install or cover API costs?

Installation/API integration/provider costs are additional. Request contact at `/implementation?automation=gold-showroom` and select installation, installation plus API wiring, or a managed/covered-API-cost quote. Agree provider account ownership, usage allowance, overages, recurring fees, maintenance and cancellation before any connection or charge. All service estimates are draft. Never send keys to Aria’s public form.

## Operational boundaries

Prepare current-rate, opt-in broadcast/reminder, estimate and staff-owned visit drafts. Reminders require exactly two days before the approved due date. No live sends, investment advice, binding quote, scheme payment or schedule activation.

Recheck current source status before writes/sends. Use a durable idempotency store keyed to event/record and action; demo flags are not production deduplication. Failed adapters must create an owned exception, not silently retry consequential actions.

The source’s 10:30 rate and 11:00 two-days-before reminder cadences in Asia/Kolkata are reference metadata, not live schedules. Only opted-in subscribers are eligible. Rates, making charges, tax basis/rate/effective date and estimate wording require the showroom/accountant’s approval. No binding quotes, investment advice or payments.
