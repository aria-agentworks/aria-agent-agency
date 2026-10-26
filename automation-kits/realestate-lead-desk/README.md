# Real Estate Lead-to-Viewing Desk

## Start with the two-step installation guide

Read `quick-start.md` first. Fill only non-secret business/provider details in `client-setup-template.json`; enter credentials in your own vault. `api-requirements.json` lists required and optional adapters. Installation/API support is separately quoted.


This is an **inactive n8n starter template**, not a deployed agent. It runs with synthetic inputs through a Manual Trigger and Code nodes so a client can inspect validation and an action draft without sending anything.

## Configuration required

- No credentials, outbound communications, production schedules, real customer data, or live provider connections are included.
- Production requires client-owned source systems, approved provider adapters, credentials in n8n Credentials, consent/authorization, security review, and a named human owner for every review path.
- Provider names and documentation links in `api-requirements.json` are planning references only; add no key values to this kit.
- A persistent idempotency store is required in production. Demo flags are not durable production deduplication.

## Run the demo

1. Import a JSON file from `workflows/` into vanilla n8n.
2. Keep the workflow inactive and click Execute Workflow; Manual Trigger starts the synthetic input.
3. Inspect the preparation, validation, and draft/human-handoff Code nodes.
4. Replace only the preparation payload or add an approved adapter; never bypass validation or approval.
5. Before activation, complete consent, privacy/security, credential, idempotency, error, monitoring, and human-approval review.

## Safety contract

All outputs are drafts. No send, filing, payment, booking, transfer, hosting, or external write occurs. Missing, conflicting, stale, opt-out, duplicate, over-capacity, or high-impact data becomes `NEEDS_HUMAN_REVIEW`. Source-confirmed slots, rates, dates, identity, and owner-approved settings are never invented.

## n8n references

These starters use current n8n JSON import/export and built-in Code concepts. See the [Code node guide](https://docs.n8n.io/build/code-in-n8n/using-the-code-node), [Webhook node guide](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook), and [workflow import/export guide](https://docs.n8n.io/build/manage-workflows/export-and-import).

## Contents

- `workflows/*.json` — inactive importable starters; no credentials or live endpoints.
- `quick-start.md`, `api-requirements.json`, `config-template.json` — setup and client particulars.
- `schemas.json`, `prompts.md`, `sample-payloads.json`, `tests.json` — contracts and synthetic fixtures.

## Operational contract and measurement

See `operational-contract.json` for the trigger, source data, AI/rules boundary, action, human fallback, audit logging, duplicate/error handling, and KPI definitions. These are measurement definitions, not guaranteed results. Starter audit output must be connected to the client’s approved durable logs and idempotency store before production.
