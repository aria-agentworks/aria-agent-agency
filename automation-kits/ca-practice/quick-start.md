# CA Practice Operations Desk — Two-Step Safe Setup

Draft workflow-kit price: **$499 USD**. Purchase pays for this distinct configurable kit, not live provider accounts or an already-connected business system.

## Step 1 — Import and test the synthetic kit

In your client-owned n8n workspace choose Workflows → Import from File and import one JSON from `workflows/`. Keep it inactive and execute only the synthetic Manual Trigger. Review output and exception/human-review paths.

## Step 2 — Add approved API connections in your own vault

Use the API checklist below. Create credentials in your client-owned n8n Credentials vault; never include secret values in the supplied config. Add a documented source/provider adapter or leave the staff handoff. Test schema, permissions, duplicate protection, consent, missing data, stale state, failure and owner review before production. A model/API key by itself does not configure an arbitrary business-system connector.

## Client particulars

Use `client-setup-template.json` to fill business name/website/location/country/timezone/languages, named owner/transfer destination, provider names and public docs. All `enabled` flags remain false. Do not place API keys, signed URLs, passwords, patient/client records or KYC documents in this file. The public setup guide `/automations/ca-practice/setup` can build a local JSON and copy non-secret details into an explicitly submitted inquiry.

## API and provider checklist

### Firm records / Google Sheets — Required for the scoped production use

Sources Clients, Leads, Documents_Tracker, Compliance_Calendar, Invoices, Query_Log and Error_Log.

Client provides: Firm-owned source/table IDs, APIs, field mapping and data owners; Partner-approved deadlines, document state and invoice status; Minimum approved client data and confidentiality review.

Credential destination: **Client-owned n8n Credentials vault; no tax/customer records in public inquiry.**

1. Map the table schema using fictional firm records.
2. Test lookup misses, stale status and partner approval before any write.

### Gmail / WhatsApp / Telegram (optional) — Optional, only if your scope uses it

Captures approved communications and routes human-reviewed drafts/escalations.

Client provides: Provider documentation, business-owned email/WhatsApp identity and allowed scopes; Partner/team alert destination, consent and message policies.

Credential destination: **OAuth/API credentials in firm-owned n8n Credentials.**

1. Add one least-privilege messaging provider at a time.
2. Keep outgoing nodes paused until the partner approves the communication.

### Groq or approved OpenAI-compatible AI (optional) — Optional, only if your scope uses it

Drafts administrative answers and classifications using only supplied firm facts.

Client provides: Client-selected compatible endpoint/model, data policy and budget owner.

Credential destination: **Client n8n Credentials vault only.**

1. Add the provider credential and approved endpoint through documented configuration.
2. Test no-advice/no-filing cases and structured-output validation.

## Need Aria to install or cover API costs?

Installation/API integration/provider costs are additional. Request contact at `/implementation?automation=ca-practice` and select installation, installation plus API wiring, or a managed/covered-API-cost quote. Agree provider account ownership, usage allowance, overages, recurring fees, maintenance and cancellation before any connection or charge. All service estimates are draft. Never send keys to Aria’s public form.

## Operational boundaries

Prepare administrative intake, document/deadline/status reminder and partner handoff drafts. A partner approves all external communication; no tax advice, government filings, payment initiation, invoice changes or substantive professional decisions.

Recheck current source status before writes/sends. Use a durable idempotency store keyed to event/record and action; demo flags are not production deduplication. Failed adapters must create an owned exception, not silently retry consequential actions.

Firm partner review remains mandatory for deadlines, client requests and all external communications. No tax advice, government filing, payment initiation or substantive professional decision is enabled.
