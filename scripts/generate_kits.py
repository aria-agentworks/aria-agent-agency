#!/usr/bin/env python3
"""Generate importable, inactive n8n starter kits using only vanilla built-in nodes.

This generator intentionally creates deterministic demo workflows. It never creates
credentials, live endpoints, schedules, or outbound communication nodes.
"""
from __future__ import annotations

import json
import shutil
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "automation-kits"

COMMON_README = """# {title}

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
"""

PROMPT_HEADER = """# Configurable prompt and schema

The following prompt is an insertion point for an approved AI/provider adapter. It is intentionally not connected to a live AI node. The built-in starter uses deterministic Code nodes, so importing it does not incur model calls.

## System instruction

You are an administrative operations assistant. Use only supplied facts. Do not diagnose, prescribe, interpret clinical results, make high-impact decisions, invent availability, invent prices or policies, or send messages. If a required fact is missing, conflicting, sensitive, or ambiguous, return `NEEDS_HUMAN_REVIEW`. Minimize personal data, preserve `correlation_id`, and return only the requested JSON object.

## Task

{task}

## Required JSON schema

```json
{schema}
```

If this adapter is later connected, validate its parsed JSON before any router, write, or message node. Keep credentials in n8n's credential store; do not paste secrets into prompts.
"""

COMMON_SCHEMA = {
    "input": {
        "type": "object",
        "required": ["correlation_id"],
        "properties": {"correlation_id": {"type": "string"}},
    },
    "output": {
        "type": "object",
        "required": ["status", "review_required", "reason", "correlation_id"],
        "properties": {
            "status": {"enum": ["READY", "NEEDS_HUMAN_REVIEW", "DRAFT_ONLY"]},
            "review_required": {"type": "boolean"},
            "reason": {"type": "string"},
            "correlation_id": {"type": "string"},
            "action_draft": {"type": "object"},
        },
    },
}


def js_prep(payload: dict, scenario: str) -> str:
    blob = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    return f'''// Synthetic-only preparation. Replace with an approved adapter at deployment time.
const input = {blob};
const correlation_id = input.correlation_id || "DEMO-{scenario.upper()}-SAMPLE";
return [{{ json: {{ ...input, correlation_id, _demo: true, _scenario: "{scenario}" }} }}];'''


def js_validate(kind: str) -> str:
    return {
        "lead": '''const d = $input.first().json;
const missing = [];
for (const key of ["full_name", "phone", "enquiry_text", "source"]) if (!String(d[key] || "").trim()) missing.push(key);
const clinical = /diagnos|symptom|pain|bleed|urgent|emergency|medication|result|treatment/i.test(String(d.enquiry_text || ""));
const review = missing.length > 0 || clinical || d.consent_status !== "granted" || d.department === "NEEDS_HUMAN_REVIEW";
return [{json: {...d, _validation: {status: review ? "NEEDS_HUMAN_REVIEW" : "READY", review_required: review, missing, clinical_request: clinical, reason: missing.length ? "Required intake data is missing" : clinical ? "Clinical or high-impact language needs staff review" : d.consent_status !== "granted" ? "Consent is not confirmed" : d.department === "NEEDS_HUMAN_REVIEW" ? "Department is unresolved" : "Validated administrative lead"}}}];''',
        "no_show": '''const d = $input.first().json;
const missing = [];
for (const key of ["appointment_id", "patient_name", "phone", "appointment_date"]) if (!String(d[key] || "").trim()) missing.push(key);
const stale = d.current_status !== "no_show";
const duplicate = d.already_sent === true || d.duplicate_found === true;
const review = missing.length > 0 || stale || duplicate || d.consent_status !== "granted";
return [{json: {...d, _validation: {status: review ? "NEEDS_HUMAN_REVIEW" : "READY", review_required: review, missing, stale_status: stale, duplicate, reason: missing.length ? "Required appointment data is missing" : stale ? "Appointment status changed; stop" : duplicate ? "Recovery message already recorded; stop" : d.consent_status !== "granted" ? "Consent is not confirmed" : "Current no-show status and duplicate check passed"}}}];''',
        "discharge": '''const d = $input.first().json;
const missing = [];
for (const key of ["patient_id", "approved_followup_date", "category", "owner"]) if (!String(d[key] || "").trim()) missing.push(key);
const review = missing.length > 0 || d.approved_followup !== true || d.discharge_status !== "approved";
return [{json: {...d, _validation: {status: review ? "NEEDS_HUMAN_REVIEW" : "READY", review_required: review, missing, reason: missing.length ? "Required follow-up data is missing" : d.approved_followup !== true ? "Follow-up date is not approved" : d.discharge_status !== "approved" ? "Discharge is not approved" : "Approved administrative follow-up"}}}];''',
        "diagnostic": '''const d = $input.first().json;
const missing = [];
for (const key of ["diagnostic_id", "patient_id", "owner", "review_status"]) if (!String(d[key] || "").trim()) missing.push(key);
const forbidden = /diagnos|normal|abnormal|cancer|treatment|medication/i.test(String(d.report_text || ""));
const review = missing.length > 0 || d.review_status !== "pending" || forbidden;
return [{json: {...d, _validation: {status: review ? "NEEDS_HUMAN_REVIEW" : "READY", review_required: review, missing, forbidden_interpretation: forbidden, reason: missing.length ? "Required diagnostic task data is missing" : forbidden ? "Result interpretation is forbidden; clinical staff must review" : d.review_status !== "pending" ? "Diagnostic state is not pending" : "Pending diagnostic staff escalation"}}}];''',
        "front_office": '''const d = $input.first().json;
const missing = ["name", "contact", "request"].filter((key) => !String(d[key] || "").trim());
const sensitive = /legal|refund|complaint|urgent|medical|emergency|password/i.test(String(d.request || ""));
const review = missing.length > 0 || sensitive || d.consent_status !== "granted";
return [{json: {...d, _validation: {status: review ? "NEEDS_HUMAN_REVIEW" : "READY", review_required: review, missing, reason: missing.length ? "Required enquiry data is missing" : sensitive ? "Sensitive request needs a human" : d.consent_status !== "granted" ? "Consent is not confirmed" : "Administrative enquiry validated"}}}];''',
        "support": '''const d = $input.first().json;
const missing = ["ticket_id", "customer_name", "request"].filter((key) => !String(d[key] || "").trim());
const sensitive = /security|password|payment|legal|threat|emergency/i.test(String(d.request || ""));
const review = missing.length > 0 || sensitive || d.verified_customer !== true;
return [{json: {...d, _validation: {status: review ? "NEEDS_HUMAN_REVIEW" : "READY", review_required: review, missing, reason: missing.length ? "Required ticket data is missing" : sensitive ? "Sensitive support request needs a human" : d.verified_customer !== true ? "Customer verification is not confirmed" : "Support request validated"}}}];''',
        "reputation": '''const d = $input.first().json;
const missing = ["review_id", "rating", "review_text"].filter((key) => d[key] === undefined || d[key] === null || String(d[key]).trim() === "");
const sensitive = /injury|discrimination|fraud|legal|threat|medical/i.test(String(d.review_text || ""));
const duplicate = d.response_already_posted === true;
const review = missing.length > 0 || sensitive || duplicate || d.consent_status !== "granted";
return [{json: {...d, _validation: {status: review ? "NEEDS_HUMAN_REVIEW" : "READY", review_required: review, missing, duplicate, reason: missing.length ? "Required review data is missing" : sensitive ? "Sensitive review needs a human" : duplicate ? "Response already recorded; stop" : d.consent_status !== "granted" ? "Approval is not confirmed" : "Review response can be drafted"}}}];''',
        "property": '''const d = $input.first().json;
const missing = ["enquiry_id", "name", "contact", "property_request"].filter((key) => !String(d[key] || "").trim());
const unsupported = /guarantee|exact availability|best price|legal|deposit/i.test(String(d.property_request || ""));
const review = missing.length > 0 || unsupported || d.consent_status !== "granted";
return [{json: {...d, _validation: {status: review ? "NEEDS_HUMAN_REVIEW" : "READY", review_required: review, missing, unsupported, reason: missing.length ? "Required enquiry data is missing" : unsupported ? "Availability, pricing, or legal claim needs an agent" : d.consent_status !== "granted" ? "Consent is not confirmed" : "Property enquiry validated without making claims"}}}];''',
        "operations": '''const d = $input.first().json;
const metrics = d.metrics;
const missing = !metrics || typeof metrics !== "object";
const review = missing || d.reporting_date === undefined || d.reporting_date === null || String(d.reporting_date).trim() === "";
return [{json: {...d, _validation: {status: review ? "NEEDS_HUMAN_REVIEW" : "READY", review_required: review, missing: missing ? ["metrics"] : [], reason: missing ? "Metrics object is missing" : !d.reporting_date ? "Reporting date is missing" : "Supplied operational metrics validated"}}}];''',
    }[kind]


def js_action(kind: str, scenario: str) -> str:
    common = '''const d = $input.first().json;
const v = d._validation || {status: "NEEDS_HUMAN_REVIEW", review_required: true, reason: "Validation output missing"};
const correlation_id = d.correlation_id || "DEMO-UNKNOWN";
const audit = {workflow: "SCENARIO", action: "draft_only", record_id: d.record_id || d.lead_id || d.appointment_id || d.ticket_id || d.enquiry_id || d.patient_id || "sample", correlation_id};'''.replace("SCENARIO", scenario)
    bodies = {
        "lead": '''const ready = v.status === "READY" && d.available_slot && d.available_slot.confirmed === true;
const finalStatus = ready ? "DRAFT_ONLY" : "NEEDS_HUMAN_REVIEW";
const reason = !ready && v.status === "READY" ? "No source-confirmed synthetic slot; do not invent availability" : v.reason;
return [{json: {...d, status: finalStatus, review_required: finalStatus !== "DRAFT_ONLY", reason, action_draft: {lead_status: ready ? "qualified_admin" : "review", confirmed_slot: ready ? d.available_slot : null, message: ready ? `Draft only: ${d.full_name}, your ${d.department} enquiry is noted for ${d.available_slot.start}. A coordinator must confirm this through the approved system.` : "Route to a coordinator; no appointment or outbound message was created."}, audit}}];''',
        "no_show": '''const ready = v.status === "READY";
return [{json: {...d, status: ready ? "DRAFT_ONLY" : "NEEDS_HUMAN_REVIEW", review_required: !ready, reason: ready ? "Draft only; current no-show and duplicate checks passed" : v.reason, action_draft: {message: ready ? `Draft only: Hi ${d.patient_name}, we noticed the appointment on ${d.appointment_date} was missed. If you would like to reschedule, please contact the coordinator or use the approved options.` : "Do not send. Verify current status and communication history with staff.", next_step: ready ? "Human/provider approval before send" : "Human review"}, audit}}];''',
        "discharge": '''const ready = v.status === "READY";
const recovery = ready && Number.isFinite(Number(d.feedback_rating)) && Number(d.feedback_rating) <= 2;
return [{json: {...d, status: ready ? "DRAFT_ONLY" : "NEEDS_HUMAN_REVIEW", review_required: !ready, reason: ready ? "Approved administrative task drafted; no clinical instruction" : v.reason, action_draft: {task: ready ? {title: `Follow up: ${d.category}`, due_date: d.approved_followup_date, owner: d.owner, status: "DRAFT"} : null, feedback_message: ready ? "Draft only: Please share feedback about your administrative experience through the approved channel." : null, service_recovery: recovery ? {queue: "SERVICE_RECOVERY", priority: "high", reason: "Low supplied feedback rating", requires_human: true} : null}, audit}}];''',
        "diagnostic": '''const ready = v.status === "READY";
return [{json: {...d, status: ready ? "DRAFT_ONLY" : "NEEDS_HUMAN_REVIEW", review_required: true, reason: ready ? "Pending item escalated to staff; no result interpretation" : v.reason, action_draft: {staff_task: {owner: d.owner, diagnostic_id: d.diagnostic_id, status: "DRAFT", instruction: "Review the pending diagnostic item in the approved clinical system. This workflow does not interpret results."}, patient_message: null}, audit}}];''',
        "front_office": '''const ready = v.status === "READY";
return [{json: {...d, status: ready ? "DRAFT_ONLY" : "NEEDS_HUMAN_REVIEW", review_required: !ready, reason: v.reason, action_draft: {reply: ready ? `Draft only: Thanks ${d.name}; a team member will follow up about your request.` : "Route the enquiry to a human owner without making promises.", owner: ready ? (d.owner || "front-office") : "human-review"}, audit}}];''',
        "support": '''const ready = v.status === "READY";
return [{json: {...d, status: ready ? "DRAFT_ONLY" : "NEEDS_HUMAN_REVIEW", review_required: !ready, reason: v.reason, action_draft: {reply: ready ? `Draft only: Hi ${d.customer_name}, we have your request and a support specialist will follow up.` : "Do not answer automatically; assign to a human support owner.", ticket_update: ready ? "DRAFT" : "HUMAN_REVIEW"}, audit}}];''',
        "reputation": '''const ready = v.status === "READY";
const low = Number(d.rating) <= 3;
return [{json: {...d, status: ready ? "DRAFT_ONLY" : "NEEDS_HUMAN_REVIEW", review_required: !ready || low, reason: low ? "Low rating requires human service recovery" : v.reason, action_draft: {public_reply: ready && !low ? `Draft only: Thank you for sharing your experience. Our team appreciates the feedback.` : null, private_followup: low ? "Draft an internal service-recovery task; do not auto-post." : null}, audit}}];''',
        "property": '''const ready = v.status === "READY";
return [{json: {...d, status: ready ? "DRAFT_ONLY" : "NEEDS_HUMAN_REVIEW", review_required: !ready, reason: v.reason, action_draft: {reply: ready ? `Draft only: Thanks ${d.name}; a property specialist will review your enquiry and reply with source-confirmed details.` : "Route to a property specialist; do not state availability, pricing, or legal terms.", adapter_request: ready ? "Lookup via approved property system before any claim" : "Human review"}, audit}}];''',
        "operations": '''const ready = v.status === "READY";
const metricKeys = ready ? Object.keys(d.metrics || {}) : [];
return [{json: {...d, status: ready ? "DRAFT_ONLY" : "NEEDS_HUMAN_REVIEW", review_required: !ready, reason: v.reason, action_draft: {headline: ready ? `Operational summary for ${d.reporting_date}` : "No summary drafted", supplied_metric_keys: metricKeys, exceptions: ready ? (d.exceptions || []) : [], next_step: ready ? "Manager review before distribution" : "Collect complete metrics"}, audit}}];''',
    }[kind]
    return common + "\n" + bodies


def make_workflow(title: str, scenario: str, kind: str, payload: dict) -> dict:
    effective_kind = kind
    if "no-show" in scenario:
        effective_kind = "no_show"
    elif "discharge" in scenario:
        effective_kind = "discharge"
    elif "diagnostic" in scenario:
        effective_kind = "diagnostic"
    ids = [str(uuid.uuid4()) for _ in range(4)]
    nodes = [
        {"parameters": {}, "id": ids[0], "name": "Manual Trigger", "type": "n8n-nodes-base.manualTrigger", "typeVersion": 1, "position": [0, 0]},
        {"parameters": {"mode": "runOnceForAllItems", "jsCode": js_prep(payload, scenario)}, "id": ids[1], "name": "Prepare synthetic input", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [260, 0]},
        {"parameters": {"mode": "runOnceForAllItems", "jsCode": js_validate(effective_kind)}, "id": ids[2], "name": "Validate safety gates", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [560, 0]},
        {"parameters": {"mode": "runOnceForAllItems", "jsCode": js_action(effective_kind, scenario)}, "id": ids[3], "name": "Draft action / human handoff", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [880, 0]},
    ]
    return {
        "name": title,
        "nodes": nodes,
        "connections": {
            "Manual Trigger": {"main": [[{"node": "Prepare synthetic input", "type": "main", "index": 0}]]},
            "Prepare synthetic input": {"main": [[{"node": "Validate safety gates", "type": "main", "index": 0}]]},
            "Validate safety gates": {"main": [[{"node": "Draft action / human handoff", "type": "main", "index": 0}]]},
        },
        "pinData": {},
        "active": False,
        "settings": {"executionOrder": "v1"},
        "versionId": str(uuid.uuid4()),
        "meta": {"templateCredsSetupCompleted": False},
        "tags": [],
    }


KITS = {
    "front-office": {
        "title": "Front Office Intake Kit",
        "kind": "front_office",
        "workflows": [("front-office-intake", "Front Office | Intake and safe reply", {"record_id": "FO-DEMO-001", "name": "Alex Morgan", "contact": "demo@example.test", "request": "Please tell me your opening hours.", "consent_status": "granted", "owner": "front-office", "correlation_id": "DEMO-FO-001"})],
        "task": "Draft a concise administrative reply or route a sensitive enquiry to a human owner.",
        "schema": {"status": "DRAFT_ONLY|NEEDS_HUMAN_REVIEW", "review_required": True, "reply": "string", "owner": "string", "reason": "string", "correlation_id": "string"},
    },
    "dental-desk": {
        "title": "Dental Desk Kit",
        "kind": "lead",
        "workflows": [
            ("dental-lead-intake", "Dental Desk | Lead validation and confirmed synthetic slot", {"lead_id": "DENTAL-DEMO-001", "full_name": "Jamie Lee", "phone": "+15550001001", "department": "Dental desk", "preferred_date": "2030-05-15", "enquiry_text": "I would like a routine consultation.", "source": "demo-form", "consent_status": "granted", "available_slot": {"confirmed": True, "start": "2030-05-15T10:00:00Z", "source": "synthetic-calendar"}, "correlation_id": "DEMO-DENTAL-LEAD-001"}),
            ("dental-no-show", "Dental Desk | No-show verify and duplicate-safe draft", {"appointment_id": "DENTAL-APPT-001", "patient_name": "Jamie Lee", "phone": "+15550001001", "appointment_date": "2030-05-10", "current_status": "no_show", "already_sent": False, "duplicate_found": False, "consent_status": "granted", "correlation_id": "DEMO-DENTAL-NOSHOW-001"}),
            ("dental-discharge-followup", "Dental Desk | Approved follow-up and service recovery", {"patient_id": "DENTAL-PAT-001", "approved_followup": True, "discharge_status": "approved", "approved_followup_date": "2030-05-20", "category": "administrative check-in", "owner": "dental-coordinator", "feedback_rating": 2, "correlation_id": "DEMO-DENTAL-DISCHARGE-001"}),
            ("dental-diagnostic-escalation", "Dental Desk | Pending diagnostic staff escalation", {"diagnostic_id": "DENTAL-DIAG-001", "patient_id": "DENTAL-PAT-001", "owner": "dental-clinical-review", "review_status": "pending", "test_category": "imaging", "report_text": "", "correlation_id": "DEMO-DENTAL-DIAG-001"}),
        ],
        "task": "Classify an administrative dental enquiry and draft a safe confirmation only from a source-confirmed slot; otherwise request human review.",
        "schema": {"status": "DRAFT_ONLY|NEEDS_HUMAN_REVIEW", "review_required": True, "lead_status": "qualified_admin|review", "confirmed_slot": "object|null", "message": "string", "correlation_id": "string"},
    },
    "lead-engine": {
        "title": "Lead Engine Kit",
        "kind": "lead",
        "workflows": [("lead-qualification", "Lead Engine | Safe qualification draft", {"lead_id": "LEAD-DEMO-001", "full_name": "Taylor Chen", "phone": "+15550001002", "department": "Sales", "enquiry_text": "I need a demo of the reporting plan.", "source": "demo-form", "consent_status": "granted", "available_slot": {"confirmed": False}, "correlation_id": "DEMO-LEAD-001"})],
        "task": "Classify an incoming business lead into an administrative route and identify missing information without inventing fit, budget, or availability.",
        "schema": {"status": "DRAFT_ONLY|NEEDS_HUMAN_REVIEW", "review_required": True, "lead_status": "qualified_admin|review", "confirmed_slot": "object|null", "message": "string", "correlation_id": "string"},
    },
    "hospital-lifecycle": {
        "title": "Hospital Administrative Lifecycle Kit",
        "kind": "lead",
        "workflows": [
            ("hospital-lead-intake", "Hospital Lifecycle | Lead validation and confirmed synthetic slot", {"lead_id": "HOSP-DEMO-001", "full_name": "Sam Rivera", "phone": "+15550001003", "department": "General Medicine", "preferred_date": "2030-06-12", "enquiry_text": "I want to book an administrative consultation.", "source": "demo-form", "consent_status": "granted", "available_slot": {"confirmed": True, "start": "2030-06-12T09:30:00Z", "source": "synthetic-calendar"}, "correlation_id": "DEMO-HOSP-LEAD-001"}),
            ("hospital-no-show", "Hospital Lifecycle | No-show verify and duplicate-safe draft", {"appointment_id": "HOSP-APPT-001", "patient_name": "Sam Rivera", "phone": "+15550001003", "appointment_date": "2030-06-05", "current_status": "no_show", "already_sent": False, "duplicate_found": False, "consent_status": "granted", "correlation_id": "DEMO-HOSP-NOSHOW-001"}),
            ("hospital-discharge-followup", "Hospital Lifecycle | Approved discharge follow-up and service recovery", {"patient_id": "HOSP-PAT-001", "approved_followup": True, "discharge_status": "approved", "approved_followup_date": "2030-06-20", "category": "administrative follow-up", "owner": "care-coordinator", "feedback_rating": 2, "correlation_id": "DEMO-HOSP-DISCHARGE-001"}),
            ("hospital-diagnostic-escalation", "Hospital Lifecycle | Pending diagnostic staff escalation", {"diagnostic_id": "HOSP-DIAG-001", "patient_id": "HOSP-PAT-001", "owner": "diagnostic-review-team", "review_status": "pending", "test_category": "laboratory", "report_text": "", "correlation_id": "DEMO-HOSP-DIAG-001"}),
        ],
        "task": "Classify an administrative hospital enquiry and draft a safe confirmation only from a source-confirmed slot; never diagnose or interpret results.",
        "schema": {"status": "DRAFT_ONLY|NEEDS_HUMAN_REVIEW", "review_required": True, "lead_status": "qualified_admin|review", "confirmed_slot": "object|null", "message": "string", "correlation_id": "string"},
    },
    "support-assistant": {
        "title": "Support Assistant Kit",
        "kind": "support",
        "workflows": [("support-intake", "Support Assistant | Verify and draft safe response", {"ticket_id": "SUP-DEMO-001", "customer_name": "Casey Patel", "request": "Where can I find the setup guide?", "verified_customer": True, "consent_status": "granted", "correlation_id": "DEMO-SUP-001"})],
        "task": "Draft a support acknowledgement only after customer verification; escalate security, payment, legal, or emergency language.",
        "schema": {"status": "DRAFT_ONLY|NEEDS_HUMAN_REVIEW", "review_required": True, "reply": "string", "ticket_update": "DRAFT|HUMAN_REVIEW", "correlation_id": "string"},
    },
    "reputation-care": {
        "title": "Reputation Care Kit",
        "kind": "reputation",
        "workflows": [("reputation-review", "Reputation Care | Draft response and service recovery", {"review_id": "REV-DEMO-001", "rating": 5, "review_text": "Friendly team and clear communication.", "response_already_posted": False, "consent_status": "granted", "correlation_id": "DEMO-REV-001"})],
        "task": "Draft a non-argumentative public acknowledgement for a supplied review; route low ratings or sensitive claims to service recovery.",
        "schema": {"status": "DRAFT_ONLY|NEEDS_HUMAN_REVIEW", "review_required": True, "public_reply": "string|null", "private_followup": "string|null", "correlation_id": "string"},
    },
    "property-enquiries": {
        "title": "Property Enquiries Kit",
        "kind": "property",
        "workflows": [("property-enquiry", "Property Enquiries | Validate and draft human handoff", {"enquiry_id": "PROP-DEMO-001", "name": "Morgan Diaz", "contact": "+15550001004", "property_request": "I am looking for a two-bedroom rental near transit.", "consent_status": "granted", "correlation_id": "DEMO-PROP-001"})],
        "task": "Draft a property enquiry acknowledgement without claiming availability, price, legal terms, or an exact match.",
        "schema": {"status": "DRAFT_ONLY|NEEDS_HUMAN_REVIEW", "review_required": True, "reply": "string", "adapter_request": "string", "correlation_id": "string"},
    },
    "daily-operations": {
        "title": "Daily Operations Kit",
        "kind": "operations",
        "workflows": [("daily-operations-summary", "Daily Operations | Supplied metrics summary draft", {"reporting_date": "2030-07-01", "metrics": {"new_leads": 12, "open_tasks": 4, "resolved_tickets": 9}, "exceptions": ["One adapter response pending"], "correlation_id": "DEMO-OPS-001"})],
        "task": "Summarize only supplied operational metrics and list supplied exceptions; do not infer clinical or business conclusions.",
        "schema": {"status": "DRAFT_ONLY|NEEDS_HUMAN_REVIEW", "review_required": True, "headline": "string", "supplied_metric_keys": "array", "exceptions": "array", "correlation_id": "string"},
    },
}


def write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def tests_for(kind: str, workflows: list[tuple[str, str, dict]]) -> dict:
    cases = []
    for slug, _, payload in workflows:
        cases.append({"id": f"{slug}-happy-path", "input_file": "sample-payloads.json", "select": slug, "expected": ["workflow is inactive", "status is DRAFT_ONLY or NEEDS_HUMAN_REVIEW", "correlation_id is preserved", "no outbound send occurs"]})
        if "no-show" in slug:
            cases.extend([
                {"id": f"{slug}-status-changed", "select": slug, "change": {"current_status": "booked"}, "expect": "NEEDS_HUMAN_REVIEW and stop before draft send"},
                {"id": f"{slug}-duplicate", "select": slug, "change": {"already_sent": True}, "expect": "NEEDS_HUMAN_REVIEW and stop before draft send"},
            ])
        elif "discharge" in slug:
            cases.append({"id": f"{slug}-unapproved-date", "select": slug, "change": {"approved_followup": False}, "expect": "NEEDS_HUMAN_REVIEW and no task date inferred"})
        elif "diagnostic" in slug:
            cases.append({"id": f"{slug}-result-text", "select": slug, "change": {"report_text": "abnormal result"}, "expect": "NEEDS_HUMAN_REVIEW and staff escalation only; no result interpretation"})
    safety = {
        "lead": [
            {"id": "missing-slot", "change": {"available_slot": {"confirmed": False}}, "expect": "NEEDS_HUMAN_REVIEW and no invented appointment"},
            {"id": "clinical-language", "change": {"enquiry_text": "I have severe pain; diagnose me"}, "expect": "NEEDS_HUMAN_REVIEW and no clinical advice"},
            {"id": "no-show-duplicate", "change": {"current_status": "no_show", "already_sent": True}, "expect": "stop before draft send"},
        ],
        "front_office": [{"id": "missing-contact", "change": {"contact": ""}, "expect": "NEEDS_HUMAN_REVIEW"}],
        "support": [{"id": "security-request", "change": {"request": "I forgot my password"}, "expect": "NEEDS_HUMAN_REVIEW"}],
        "reputation": [{"id": "low-rating", "change": {"rating": 1}, "expect": "human service recovery; no public auto-post"}],
        "property": [{"id": "exact-availability", "change": {"property_request": "Guarantee exact availability and best price"}, "expect": "NEEDS_HUMAN_REVIEW"}],
        "operations": [{"id": "missing-metrics", "change": {"metrics": None}, "expect": "NEEDS_HUMAN_REVIEW"}],
    }.get(kind, [])
    return {"how_to_run": "Import one workflow, execute manually, and inspect all three Code node outputs.", "cases": cases + safety, "production_note": "Add adapter, durable idempotency, credentials, consent, approval, logging, and human fallback before activation."}


def workflow_schemas(spec: dict) -> dict:
    """Return a schema for every workflow in a kit, including hospital/dental extras."""
    outputs = {}
    for wf_slug, _title, _payload in spec["workflows"]:
        if "no-show" in wf_slug:
            outputs[wf_slug] = {"status": "DRAFT_ONLY|NEEDS_HUMAN_REVIEW", "review_required": True, "message": "string", "next_step": "string", "correlation_id": "string"}
        elif "discharge" in wf_slug:
            outputs[wf_slug] = {"status": "DRAFT_ONLY|NEEDS_HUMAN_REVIEW", "review_required": True, "task": "object|null", "feedback_message": "string|null", "service_recovery": "object|null", "correlation_id": "string"}
        elif "diagnostic" in wf_slug:
            outputs[wf_slug] = {"status": "DRAFT_ONLY|NEEDS_HUMAN_REVIEW", "review_required": True, "staff_task": "object", "patient_message": "null", "correlation_id": "string"}
        else:
            outputs[wf_slug] = spec["schema"]
    return outputs


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    inventory = {}
    for slug, spec in KITS.items():
        folder = OUT / slug
        wfdir = folder / "workflows"
        wfdir.mkdir(parents=True)
        sample = {}
        for wf_slug, title, payload in spec["workflows"]:
            sample[wf_slug] = payload
            write_json(wfdir / f"{wf_slug}.json", make_workflow(title, wf_slug, spec["kind"], payload))
        (folder / "README.md").write_text(COMMON_README.format(title=spec["title"]), encoding="utf-8")
        schemas = workflow_schemas(spec)
        (folder / "prompts.md").write_text(PROMPT_HEADER.format(task=spec["task"], schema=json.dumps(schemas, indent=2)), encoding="utf-8")
        write_json(folder / "schemas.json", {**COMMON_SCHEMA, "kit": slug, "workflow_outputs": schemas, "adapter_contract": "Return source-confirmed fields plus correlation_id and explicit error state; never infer missing values."})
        write_json(folder / "sample-payloads.json", sample)
        write_json(folder / "tests.json", tests_for(spec["kind"], spec["workflows"]))
        inventory[slug] = {"workflows": [f"workflows/{x[0]}.json" for x in spec["workflows"]], "files": ["README.md", "prompts.md", "schemas.json", "sample-payloads.json", "tests.json"]}
    write_json(OUT / "KIT_INVENTORY.json", inventory)
    print(f"generated {len(KITS)} kits under {OUT}")


if __name__ == "__main__":
    main()
