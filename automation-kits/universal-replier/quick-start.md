# Universal WhatsApp Replier — Two-Step Safe Setup

Draft workflow-kit price: **$299 USD**. Purchase pays for this distinct configurable kit, not live provider accounts or an already-connected business system.

## Step 1 — Import and test the synthetic kit

In your client-owned n8n workspace choose Workflows → Import from File and import one JSON from `workflows/`. Keep it inactive and execute only the synthetic Manual Trigger. Review output and exception/human-review paths.

## Step 2 — Add approved API connections in your own vault

Use the API checklist below. Create credentials in your client-owned n8n Credentials vault; never include secret values in the supplied config. Add a documented source/provider adapter or leave the staff handoff. Test schema, permissions, duplicate protection, consent, missing data, stale state, failure and owner review before production. A model/API key by itself does not configure an arbitrary business-system connector.

## Client particulars

Use `client-setup-template.json` to fill business name/website/location/country/timezone/languages, named owner/transfer destination, provider names and public docs. All `enabled` flags remain false. Do not place API keys, signed URLs, passwords, patient/client records or KYC documents in this file. The public setup guide `/automations/universal-replier/setup` can build a local JSON and copy non-secret details into an explicitly submitted inquiry.

## API and provider checklist

### n8n workspace — Required for the scoped production use

Imports and runs the inactive workflow starters.

Client provides: Your client-owned n8n URL and workspace owner.

Credential destination: **No credential is required to test the synthetic starter.**

1. Import the supplied JSON workflow.
2. Run the synthetic test and keep it inactive.

### WhatsApp Business Platform / Cloud API — Required for the scoped production use

The channel the replier listens on and replies through, with a dedicated business number.

Client provides: Meta business verification, a WhatsApp Business Platform account, and a dedicated number; Approved message templates for follow-ups and the client-owned webhook subscription; Decision on whether per-message fees are included in the monthly fee or passed through at cost.

Credential destination: **Client-owned n8n Credentials vault only.**

1. Connect the channel adapter to a test number first.
2. Run the full test pack, including handover and opt-out paths, before going live.

### Scheduling / calendar source (optional) — Optional, only if your scope uses it

Source of truth for open slots when the booking module is on; availability is never invented.

Client provides: Calendar or booking system name, API documentation, and service/provider mapping; Permitted scopes and a named booking owner.

Credential destination: **Client-owned n8n Credentials vault only.**

1. Return source-confirmed slots only.
2. Test lookup misses, stale availability, and double-booking protection.

### AI provider (optional) — Optional, only if your scope uses it

Adds language understanding beyond the deterministic intent rules after the demo is understood.

Client provides: Chosen provider/model and account/API documentation; Approved prompt, data-handling policy, and cost owner.

Credential destination: **n8n Credentials vault only.**

1. Create the provider credential in n8n.
2. Connect it only after the synthetic test, output schema, and prompt review are approved.

### Lead sheet / CRM (optional) — Optional, only if your scope uses it

Stores collected enquiry details for quote requests and lead capture, and alerts the team.

Client provides: Sheet or CRM name, vendor API documentation, field mapping, and permitted scopes; Team alert destination and consent/message policies.

Credential destination: **Client-owned n8n Credentials vault only.**

1. Test a synthetic event, error path, and duplicate protection.
2. Verify the human alert path before activation.

## Need Aria to install or cover API costs?

Installation/API integration/provider costs are additional. Request contact at `/implementation?automation=universal-replier` and select installation, installation plus API wiring, or a managed/covered-API-cost quote. Agree provider account ownership, usage allowance, overages, recurring fees, maintenance and cancellation before any connection or charge. All service estimates are draft. Never send keys to Aria’s public form.

## Operational boundaries

Classify intent and draft a short reply in the customer's language from approved profile facts only; prepare booking, lead-capture, or opt-in follow-up drafts, and a handover package with team alert for every escalation path. Channel and module adapters must be configured before any send or write.

Approved facts only: if it is not in the profile, it is not said. Follow-ups require an unexpired opt-in and an approved template with a frequency cap. Recheck current source status before writes/sends. Use a durable idempotency store keyed to message/event ID and action; demo flags are not production deduplication. Failed adapters must create an owned exception, not silently retry consequential actions. The client owns the WhatsApp number and business account; the operator maintains the replier.


