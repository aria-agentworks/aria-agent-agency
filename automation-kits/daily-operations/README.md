# Daily Operations Kit

## Start with the two-step installation guide

Read `quick-start.md` first. It explains safe import/test, client-owned credential entry, the product-specific API checklist, and separately quoted installation/API support. Fill only non-secret business/provider details in `client-setup-template.json`; credentials belong in your own vault.

This is an **inactive n8n starter template**, not a deployed agent. It runs with synthetic inputs through a Manual Trigger and Code nodes so a client can inspect validation and an action draft without sending anything.

## Configuration required

- No credentials, outbound communications, production schedules, real patient/customer data, or live provider connections are included.
- Production requires the client's approved source systems and provider adapters, credentials stored in n8n credentials, consent/authorization, security review, and a named human owner for every review path.
- For calendar, CRM, HMS/EMR, property, messaging, review, or helpdesk integration, insert a client-owned adapter after validation. Map the adapter's documented response into the fields in `schemas.json`; do not guess an endpoint or API.
- A persistent idempotency store is required in production. The demo `duplicate_found` and `already_sent` flags are **not durable production deduplication**.
- Setup/run costs and vendor fees are excluded. “Production-ready” is not claimed.

## Run the demo

1. Import a JSON file from `workflows/` into a vanilla n8n instance.
2. Keep the workflow inactive. Click **Execute Workflow**; the Manual Trigger starts the synthetic input.
3. Inspect `Prepare synthetic input`, `Validate safety gates`, and `Draft action / human handoff`.
4. Replace only the preparation payload or add an approved adapter. Keep validation and human fallback paths intact.
5. Before activation, complete consent, privacy/security, credential, idempotency, error, monitoring, and human-approval review.

## Integration contract

Adapters must be explicit, authenticated, least-privilege, auditable, and approved by the client. They must return source-confirmed values, an error state, and a correlation ID. A missing or conflicting field must route to `NEEDS_HUMAN_REVIEW`; it must not be inferred. Write actions require a durable idempotency key and a current-status recheck immediately before the write. Human handoffs should create or update the client's exception queue; this template only drafts that handoff.

Messages in this kit are drafts. An approved client messaging adapter may send them only after consent and duplicate checks. Never use the template to diagnose, interpret a result, promise a slot, or invent pricing, availability, or clinical facts.

## Contents

- `workflows/*.json` — inactive importable n8n starters; no credentials or live endpoints.
- `schemas.json` — input/output JSON shapes and adapter boundary notes.
- `prompts.md` — configurable classification/drafting prompt and strict JSON schema. The deterministic Code nodes are **not AI executions**.
- `sample-payloads.json` — synthetic-only examples.
- `tests.json` — expected safety-gate cases.

## n8n references

These starters follow n8n's current documented JSON import/export and built-in Code/Webhook concepts. See the [Code node guide](https://docs.n8n.io/build/code-in-n8n/using-the-code-node), [Webhook node guide](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook), and [workflow import/export guide](https://docs.n8n.io/build/manage-workflows/export-and-import). A Webhook adapter may be added for a client source, but this starter stays on Manual Trigger and remains inactive.

## Operational contract and measurement

See `operational-contract.json` for the trigger, source data, AI/rules boundary, action, human fallback, audit logging, duplicate/error handling, and KPI definitions. These are measurement definitions, not guaranteed results. Starter audit output must be connected to the client’s approved durable logs and idempotency store before production.
