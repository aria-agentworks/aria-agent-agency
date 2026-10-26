# Local Website Audit & Lead Engine — Two-Step Safe Setup

Draft workflow-kit price: **$329 USD**. Purchase pays for this distinct configurable kit, not live provider accounts or an already-connected business system.

## Step 1 — Import and test the synthetic kit

In your client-owned n8n workspace choose Workflows → Import from File and import one JSON from `workflows/`. Keep it inactive and execute only the synthetic Manual Trigger. Review output and exception/human-review paths.

## Step 2 — Add approved API connections in your own vault

Use the API checklist below. Create credentials in your client-owned n8n Credentials vault; never include secret values in the supplied config. Add a documented source/provider adapter or leave the staff handoff. Test schema, permissions, duplicate protection, consent, missing data, stale state, failure and owner review before production. A model/API key by itself does not configure an arbitrary business-system connector.

## Client particulars

Use `client-setup-template.json` to fill business name/website/location/country/timezone/languages, named owner/transfer destination, provider names and public docs. All `enabled` flags remain false. Do not place API keys, signed URLs, passwords, patient/client records or KYC documents in this file. The public setup guide `/automations/local-site-leadgen/setup` can build a local JSON and copy non-secret details into an explicitly submitted inquiry.

## API and provider checklist

### Prospect source (optional automation) — Optional, only if your scope uses it

Finds eligible local businesses from a permitted data source.

Client provides: Licensed directory or client-approved search/Maps API, local business niche, location, permitted-use terms.

Credential destination: **Provider credential in client n8n Credentials; source/analyzer local demo needs no API key.**

1. Enter the city, niches, score threshold, and daily cap in config.json.
2. Supply one authorized public URL or approved prospect source.

### Website analyzer — Required for the scoped production use

Scores mobile/responsive/site basics and extracts visible public business content.

Client provides: Python 3 and an authorized public business website URL; the standalone scorer uses the Python standard library.

Credential destination: **No key is required by the analyzer.**

1. Run `python3 website-analyzer.py https://example-business.com`.
2. Review the score and every extracted fact before preview generation.

### Optional AI/site generation + hosting — Optional, only if your scope uses it

Turns reviewed business facts into a watermarked preview website.

Client provides: Approved site-generation tool/provider, hosting account or destination, owner permission to create/store the preview.

Credential destination: **Provider credential in client vault; do not put it in outreach messages.**

1. Generate a preview using only reviewed facts and mark it “not the live site”.
2. Publish only with owner permission and a planned removal date.

### Optional CRM/email — Optional, only if your scope uses it

Stores a reviewed prospect/outreach draft; no email sends are wired in this kit.

Client provides: CRM/list owner, sender name/email/business address, recipient jurisdiction, provider documentation and approved send policy.

Credential destination: **Client’s n8n/email connector secure credential store only.**

1. Connect a prospect log and keep send/outreach nodes paused.
2. Have a person review recipient eligibility, jurisdiction, message, opt-out and address before sending.

## Need Aria to install or cover API costs?

Installation/API integration/provider costs are additional. Request contact at `/implementation?automation=local-site-leadgen` and select installation, installation plus API wiring, or a managed/covered-API-cost quote. Agree provider account ownership, usage allowance, overages, recurring fees, maintenance and cancellation before any connection or charge. All service estimates are draft. Never send keys to Aria’s public form.

## Operational boundaries

Score and extract visible public site facts, queue a clearly watermarked private-preview draft and produce one personalized outreach draft. This starter does not discover contacts, host previews or send emails/contact forms automatically.

Recheck current source status before writes/sends. Use a durable idempotency store keyed to event/record and action; demo flags are not production deduplication. Failed adapters must create an owned exception, not silently retry consequential actions.

The user-export schedules (weekdays 04:00 and Friday 17:00) are reference examples, not installed jobs. Automatic discovery/generation/hosting/email/contact-form APIs are not connected. The revised pipeline requires human review before publishing or contacting any recipient; opt-outs and source rights require local/jurisdiction review.
