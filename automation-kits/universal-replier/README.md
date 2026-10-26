# Universal WhatsApp Replier

## Start with the two-step installation guide

Read `quick-start.md` first. Fill only non-secret business/provider details in `client-setup-template.json`; enter credentials in your own vault. `api-requirements.json` lists required and optional adapters. Installation/API support is separately quoted.


One replier engine that fits any business: a clinic, salon, coaching institute, restaurant, real-estate desk, online store, jeweller, contractor, gym, travel firm, or professional practice. The engine is built once around a per-client **business profile** — a single file of approved facts and module switches — so onboarding a new client is a new profile, not a new project.

This is an **inactive n8n starter template**, not a deployed agent. It runs with synthetic inputs through a Manual Trigger and Code nodes so a client can inspect intent routing, validation, and an action draft without sending anything to a customer.

## What the kit covers

- **Message intake** — classify an inbound message into the fixed intent set (greeting, booking, pricing, hours_location, service_info, order_status, quote_request, complaint, human_request, emergency, other) and draft a short reply **from approved profile facts only**.
- **Human handover** — complaints, emergencies, refunds, unclear requests, and "talk to a person" produce a handover package (contact, urgency, transcript summary, fields collected) and stop the replier for that conversation.
- **Booking module** — offer only slots returned by the client's scheduling source; never invent availability.
- **Opt-in follow-up** — reminders, recalls, and review requests drawn from the approved template list, gated by consent, opt-in expiry, and a frequency cap.
- **Multi-language replies** — the profile declares the languages the business supports (English, Hindi, Hinglish in the demo).

## Configuration required

- No credentials, WhatsApp/Meta connections, outbound communications, production schedules, real customer data, or live provider connections are included.
- Production requires a client-owned WhatsApp Business Platform (Cloud API) account with a dedicated number, an approved channel adapter, credentials in n8n Credentials, consent/opt-in records, a security review, and a named human owner for every handover path.
- Provider names and documentation links in `api-requirements.json` are planning references only; add no key values to this kit.
- A **persistent idempotency** store keyed to message/event IDs is required in production. Demo flags are not durable production deduplication.
- In health, law, and finance contexts the replier handles booking and document checklists only — it must never give advice. Keep those phrases in the profile's `never` list for every such client.

## Run the demo

1. Import a JSON file from `workflows/` into vanilla n8n.
2. Keep the workflow inactive and click Execute Workflow; Manual Trigger starts the synthetic input.
3. Inspect the preparation, validation, and draft/human-handoff Code nodes.
4. Try the Hinglish demo message (`Kal ka slot milega kya?`) in the intake starter; the rule-based intent layer routes it to the booking draft path.
5. Replace only the preparation payload or add an approved adapter; never bypass validation or approval.
6. Before activation, complete consent, privacy/security, credential, idempotency, error, monitoring, and human-approval review. Test with the awkward-message pack in `tests.json` on a test number before any customer sees it.

## Safety contract

All outputs are drafts. No message send, booking write, payment, transfer, or external write occurs from the starters. Missing, conflicting, opt-out, duplicate, over-capacity, sensitive, or unlisted-fact data becomes `NEEDS_HUMAN_REVIEW`. Prices, hours, slots, policies, and emergency notes are answered **only from the profile**; anything unlisted is checked with the team. Every step is designed to be logged so the client can review conversations and fix the profile rather than the bot.

## n8n references

These starters use current n8n JSON import/export and built-in Code concepts. See the [Code node guide](https://docs.n8n.io/build/code-in-n8n/using-the-code-node), [Webhook node guide](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook), and the [workflow import/export guide](https://docs.n8n.io/build/manage-workflows/export-and-import).

## Contents

- `workflows/*.json` — inactive importable starters: intake, handover, booking, opt-in follow-up; no credentials or live endpoints.
- `quick-start.md`, `api-requirements.json`, `config-template.json` — setup, adapter checklist, and client particulars.
- `client-setup-template.json` — the business profile template with approved facts and module switches.
- `schemas.json`, `prompts.md`, `sample-payloads.json`, `tests.json` — contracts, the approved-facts instruction, synthetic fixtures, and the test pack.

## Operational contract and measurement

See `operational-contract.json` for the trigger, source data, AI/rules boundary, action, human fallback, audit logging, duplicate/error handling, and KPI definitions (reply time, after-hours coverage, bookings captured, handovers). These are measurement definitions, not guaranteed results. Starter audit output must be connected to the client's approved durable logs and idempotency store before production.
