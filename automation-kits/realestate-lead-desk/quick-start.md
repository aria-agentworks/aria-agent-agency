# Real Estate Lead-to-Viewing Desk — Two-Step Safe Setup

Draft workflow-kit price: **$399 USD**. Purchase pays for this distinct configurable kit, not live provider accounts or an already-connected business system.

## Step 1 — Import and test the synthetic kit

In your client-owned n8n workspace choose Workflows → Import from File and import one JSON from `workflows/`. Keep it inactive and execute only the synthetic Manual Trigger. Review output and exception/human-review paths.

## Step 2 — Add approved API connections in your own vault

Use the API checklist below. Create credentials in your client-owned n8n Credentials vault; never include secret values in the supplied config. Add a documented source/provider adapter or leave the staff handoff. Test schema, permissions, duplicate protection, consent, missing data, stale state, failure and owner review before production. A model/API key by itself does not configure an arbitrary business-system connector.

## Client particulars

Use `client-setup-template.json` to fill business name/website/location/country/timezone/languages, named owner/transfer destination, provider names and public docs. All `enabled` flags remain false. Do not place API keys, signed URLs, passwords, patient/client records or KYC documents in this file. The public setup guide `/automations/realestate-lead-desk/setup` can build a local JSON and copy non-secret details into an explicitly submitted inquiry.

## API and provider checklist

### Meta Lead Ads (optional source) — Optional, only if your scope uses it

Supplies configured lead-form webhook events.

Client provides: Business-owned Meta app/page access, lead-form ID, webhook subscription, privacy notice, vendor docs.

Credential destination: **Meta token in n8n Credentials; never paste it in this form.**

1. Configure one approved webhook source.
2. Test with a synthetic or approved sandbox lead.

### WhatsApp Business (optional channel) — Optional, only if your scope uses it

Receives consented inbound messages and optionally routes an approved reply draft.

Client provides: WhatsApp Business/provider account, sender/phone-number ID, approved templates, messaging opt-in.

Credential destination: **Client provider/API credential stored in n8n Credentials.**

1. Connect the provider webhook and credential.
2. Keep outbound reply nodes inactive pending opt-in and staff approval.

### Property inventory + broker roster — Required for the scoped production use

Checks supplied property facts and prepares a human-owned broker/viewing request.

Client provides: Inventory/CRM API docs or approved Sheets table IDs/columns, broker/area mapping, time slots source.

Credential destination: **Use least-privilege service credential in n8n Credentials.**

1. Map the read-only property lookup and broker rules.
2. Have staff approve every booking before write/send.

### Voice/notifications (optional) — Optional, only if your scope uses it

Accepts a configured provider call payload and alerts the assigned broker.

Client provides: Provider (e.g. VAPI/Twilio or client choice), callback/webhook docs, notification destination and transfer owner.

Credential destination: **Provider tokens in n8n Credentials; all usage billed to client account.**

1. Confirm provider KYC, permissions, and human-transfer target.
2. Exercise a synthetic call and error/handoff case.

## Need Aria to install or cover API costs?

Installation/API integration/provider costs are additional. Request contact at `/implementation?automation=realestate-lead-desk` and select installation, installation plus API wiring, or a managed/covered-API-cost quote. Agree provider account ownership, usage allowance, overages, recurring fees, maintenance and cancellation before any connection or charge. All service estimates are draft. Never send keys to Aria’s public form.

## Operational boundaries

Normalize a lead, look up approved client inventory, and prepare a broker assignment or viewing request. Writes, booking confirmation, WhatsApp reply and outbound follow-up require staff approval and authorized APIs.

Recheck current source status before writes/sends. Use a durable idempotency store keyed to event/record and action; demo flags are not production deduplication. Failed adapters must create an owned exception, not silently retry consequential actions.


