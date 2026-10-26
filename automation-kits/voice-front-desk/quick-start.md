# Voice Front Desk Starter — Two-Step Safe Setup

Draft workflow-kit price: **$249 USD**. Purchase pays for this distinct configurable kit, not live provider accounts or an already-connected business system.

## Step 1 — Import and test the synthetic kit

In your client-owned n8n workspace choose Workflows → Import from File and import one JSON from `workflows/`. Keep it inactive and execute only the synthetic Manual Trigger. Review output and exception/human-review paths.

## Step 2 — Add approved API connections in your own vault

Use the API checklist below. Create credentials in your client-owned n8n Credentials vault; never include secret values in the supplied config. Add a documented source/provider adapter or leave the staff handoff. Test schema, permissions, duplicate protection, consent, missing data, stale state, failure and owner review before production. A model/API key by itself does not configure an arbitrary business-system connector.

## Client particulars

Use `client-setup-template.json` to fill business name/website/location/country/timezone/languages, named owner/transfer destination, provider names and public docs. All `enabled` flags remain false. Do not place API keys, signed URLs, passwords, patient/client records or KYC documents in this file. The public setup guide `/automations/voice-front-desk/setup` can build a local JSON and copy non-secret details into an explicitly submitted inquiry.

## API and provider checklist

### Indian voice/telephony provider — Required for the scoped production use

Rents and routes a number through the client’s direct provider account.

Client provides: Provider plan, eligible number type, KYC/compliance approval, supported languages, transfer destination.

Credential destination: **Provider/API credential only in the client-owned n8n Credentials vault.**

1. Complete KYC and rent a number with the provider.
2. Route synthetic calls, consent/disclosures, and human transfer before go-live.

### Business API / human queue — Required for the scoped production use

Looks up approved business facts and hands exceptions to staff.

Client provides: CRM/scheduling/helpdesk API docs, allowed read/write scopes, working-hours and fallback owner.

Credential destination: **n8n Credentials vault.**

1. Use a read-only/sandbox adapter first.
2. Approve required actions and transfer path with the business owner.

## Need Aria to install or cover API costs?

Installation/API integration/provider costs are additional. Request contact at `/implementation?automation=voice-front-desk` and select installation, installation plus API wiring, or a managed/covered-API-cost quote. Agree provider account ownership, usage allowance, overages, recurring fees, maintenance and cancellation before any connection or charge. All service estimates are draft. Never send keys to Aria’s public form.

## Operational boundaries

Prepare an administrative handoff and optional approved lookup. Call connection, transfer, recording, messaging and business-system writes require configured client accounts and authorization.

Recheck current source status before writes/sends. Use a durable idempotency store keyed to event/record and action; demo flags are not production deduplication. Failed adapters must create an owned exception, not silently retry consequential actions.


