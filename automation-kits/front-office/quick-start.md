# AI Front Office — Two-Step Safe Setup

Draft workflow-kit price: **$149 USD**. Purchase pays for this distinct configurable kit, not live provider accounts or an already-connected business system.

## Step 1 — Import and test the synthetic kit

In your client-owned n8n workspace choose Workflows → Import from File and import one JSON from `workflows/`. Keep it inactive and execute only the synthetic Manual Trigger. Review output and exception/human-review paths.

## Step 2 — Add approved API connections in your own vault

Use the API checklist below. Create credentials in your client-owned n8n Credentials vault; never include secret values in the supplied config. Add a documented source/provider adapter or leave the staff handoff. Test schema, permissions, duplicate protection, consent, missing data, stale state, failure and owner review before production. A model/API key by itself does not configure an arbitrary business-system connector.

## Client particulars

Use `client-setup-template.json` to fill business name/website/location/country/timezone/languages, named owner/transfer destination, provider names and public docs. All `enabled` flags remain false. Do not place API keys, signed URLs, passwords, patient/client records or KYC documents in this file. The public setup guide `/automations/front-office/setup` can build a local JSON and copy non-secret details into an explicitly submitted inquiry.

## API and provider checklist

### n8n workspace — Required for the scoped production use

Imports and runs the inactive workflow starters.

Client provides: Your client-owned n8n URL and workspace owner.

Credential destination: **No credential is required to test the synthetic starter.**

1. Import the supplied JSON workflow.
2. Run the synthetic test and keep it inactive.

### AI provider (optional) — Optional, only if your scope uses it

Adds real extraction/classification after the deterministic demo is understood.

Client provides: Chosen provider/model and account/API documentation; Approved prompt, data-handling policy, and cost owner.

Credential destination: **n8n Credentials vault only.**

1. Create the provider credential in n8n.
2. Connect it only after test data and output schema are approved.

### CRM / intake source (production) — Optional, only if your scope uses it

Receives approved form events and stores the reviewed handoff.

Client provides: CRM/form name, vendor API documentation, event schema, and permitted scopes; Named staff queue/owner.

Credential destination: **n8n Credentials vault only.**

1. Provide a documented API and least-privilege service account.
2. Test a synthetic event, error path, and idempotency check.

## Need Aria to install or cover API costs?

Installation/API integration/provider costs are additional. Request contact at `/implementation?automation=front-office` and select installation, installation plus API wiring, or a managed/covered-API-cost quote. Agree provider account ownership, usage allowance, overages, recurring fees, maintenance and cancellation before any connection or charge. All service estimates are draft. Never send keys to Aria’s public form.

## Operational boundaries

Prepare a first-response draft and an owner-routed intake record; adapters must be configured before any send/write.

Recheck current source status before writes/sends. Use a durable idempotency store keyed to event/record and action; demo flags are not production deduplication. Failed adapters must create an owned exception, not silently retry consequential actions.


