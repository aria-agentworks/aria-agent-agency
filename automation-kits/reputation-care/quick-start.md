# Feedback & Service Recovery — Two-Step Safe Setup

Draft workflow-kit price: **$99 USD**. Purchase pays for this distinct configurable kit, not live provider accounts or an already-connected business system.

## Step 1 — Import and test the synthetic kit

In your client-owned n8n workspace choose Workflows → Import from File and import one JSON from `workflows/`. Keep it inactive and execute only the synthetic Manual Trigger. Review output and exception/human-review paths.

## Step 2 — Add approved API connections in your own vault

Use the API checklist below. Create credentials in your client-owned n8n Credentials vault; never include secret values in the supplied config. Add a documented source/provider adapter or leave the staff handoff. Test schema, permissions, duplicate protection, consent, missing data, stale state, failure and owner review before production. A model/API key by itself does not configure an arbitrary business-system connector.

## Client particulars

Use `client-setup-template.json` to fill business name/website/location/country/timezone/languages, named owner/transfer destination, provider names and public docs. All `enabled` flags remain false. Do not place API keys, signed URLs, passwords, patient/client records or KYC documents in this file. The public setup guide `/automations/reputation-care/setup` can build a local JSON and copy non-secret details into an explicitly submitted inquiry.

## API and provider checklist

### Feedback/CRM/helpdesk source — Required for the scoped production use

Captures consented feedback and opens a private service task.

Client provides: Feedback source API docs, consent rules, response policy, assigned owner.

Credential destination: **n8n Credentials vault.**

1. Import and test synthetic ratings.
2. Connect the internal service queue; keep public replies manual.

## Need Aria to install or cover API costs?

Installation/API integration/provider costs are additional. Request contact at `/implementation?automation=reputation-care` and select installation, installation plus API wiring, or a managed/covered-API-cost quote. Agree provider account ownership, usage allowance, overages, recurring fees, maintenance and cancellation before any connection or charge. All service estimates are draft. Never send keys to Aria’s public form.

## Operational boundaries

Prepare an internal service-recovery task for concerns and a neutral follow-up draft; no fabricated reviews or review gating.

Recheck current source status before writes/sends. Use a durable idempotency store keyed to event/record and action; demo flags are not production deduplication. Failed adapters must create an owned exception, not silently retry consequential actions.


