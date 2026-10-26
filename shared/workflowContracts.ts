import type { Automation } from "./catalog";
export type WorkflowContract = {
  trigger: string;
  data: string;
  aiRules: string;
  action: string;
  humanFallback: string;
  logging: string;
  safety: string;
  kpi: string;
};
const specific: Record<
  string,
  Partial<WorkflowContract>
> = {
  "front-office": {
    trigger: "Inbound website/form enquiry or an approved channel event.",
    data: "Supplied enquiry, contact permission, approved answers, owner mapping, and source record ID.",
    action:
      "Prepare a first-response draft and an owner-routed intake record; adapters must be configured before any send/write.",
    kpi: "First-response time and intake-to-staff-handoff rate, calculated from source timestamps and routed enquiries.",
  },
  "dental-desk": {
    trigger:
      "Appointment enquiry, confirmed no-show, approved follow-up, or pending coordination event.",
    data: "Minimum administrative patient ID, consent, source-confirmed slot/status, approved follow-up date, and responsible staff owner.",
    action:
      "Draft confirmations, rescheduling and approved follow-up tasks; any booking/send requires the practice adapter and approval.",
    kpi: "Enquiry-to-confirmed-appointment rate; recovered appointments divided by eligible no-shows; overdue administrative follow-up count.",
  },
  "lead-engine": {
    trigger:
      "A consented inbound lead from an approved form or acquisition source.",
    data: "Supplied contact information, enquiry, source, stated requirements, qualification rules, and sales-owner mapping.",
    action:
      "Prepare structured lead details, qualification flags, a reviewable follow-up draft, and next-owner handoff.",
    kpi: "Time to first sales review and qualified-lead-to-next-step rate; qualification follows the business’s explicit rules.",
  },
  "hospital-lifecycle": {
    trigger:
      "Lead, no-show, hospital-approved discharge event, or pending diagnostic administration event.",
    data: "Minimum approved administrative facts, source-confirmed scheduling/status, consent, approved follow-up instruction, department owner, and event ID.",
    action:
      "Draft appointment/reschedule messages, approved follow-up and service-recovery tasks, and pending-diagnostic staff escalation. No clinical interpretation.",
    kpi: "Lead-to-appointment conversion; eligible-no-show recovery rate; overdue approved follow-ups and exception-resolution time, using source records only.",
  },
  "support-assistant": {
    trigger: "An inbound support ticket or approved customer message.",
    data: "Supplied question, customer reference, approved policy/FAQ extracts, support categories, and queue-owner mapping.",
    action:
      "Prepare a policy-grounded answer draft or a staff handoff; live helpdesk writes and sends require documented adapters.",
    kpi: "Time to first staff-ready response and proportion correctly routed to a support owner; review answer accuracy before claiming resolution.",
  },
  "reputation-care": {
    trigger: "A consented feedback submission or approved post-service event.",
    data: "Supplied feedback, administrative reference, communication consent, service-recovery rules, and staff owner.",
    action:
      "Prepare an internal service-recovery task for concerns and a neutral follow-up draft; no fabricated reviews or review gating.",
    kpi: "Feedback-to-owner-assignment time and unresolved service-recovery task count; public ratings are not inferred.",
  },
  "property-enquiries": {
    trigger:
      "Inbound enquiry about a supplied listing or an approved viewing request.",
    data: "Stated preferences, approved listing details, source-confirmed viewing availability, contact permission, and agent mapping.",
    action:
      "Prepare preference fields, listing/availability checks, and an agent-owned viewing-request handoff; never invent properties or slots.",
    kpi: "Enquiry-to-agent-review time and eligible-enquiry-to-confirmed-viewing rate, measured from the CRM/scheduling source.",
  },
  "daily-operations": {
    trigger: "Approved metrics payload or a client-configured reporting event.",
    data: "Source-defined metrics, time window, overdue items, exception records, and report-owner mapping.",
    action:
      "Prepare a management brief with supplied wins, exceptions, overdue work, and questions; internal delivery needs an approved adapter.",
    kpi: "Report-preparation time, required-metric completeness, and count/age of unresolved exceptions. No fabricated business metrics.",
  },
  "realestate-lead-desk": {
    trigger:
      "Approved Meta lead-form, WhatsApp Business, or optional client voice-provider event; optional client-owned reviewed follow-up run.",
    data: "Consent/source, phone and supplied enquiry, stated location/budget/BHK/property type/intent, client-supplied listing records, broker roster and source-confirmed viewing slots.",
    action:
      "Normalize a lead, look up approved client inventory, and prepare a broker assignment or viewing request. Writes, booking confirmation, WhatsApp reply and outbound follow-up require staff approval and authorized APIs.",
    kpi: "Time from eligible source event to broker review; eligible lead-to-staff-confirmed viewing rate; duplicate/opt-out/exception counts. Do not treat fixture dashboard values as real metrics.",
  },
  "voice-front-desk": {
    trigger:
      "A provider-supplied inbound call event or approved synthetic call fixture.",
    data: "Provider event ID, consent/disclosure status, supported language, supplied call summary, client API facts, transfer destination and owner.",
    action:
      "Prepare an administrative handoff and optional approved lookup. Call connection, transfer, recording, messaging and business-system writes require configured client accounts and authorization.",
    kpi: "Call-containment and human-transfer rate, handoff completion time, failed call/provider count and approved task completion from provider/source logs; no guaranteed containment target.",
  },
  "local-site-leadgen": {
    trigger:
      "A manually supplied public business URL or a client-approved prospect-source run.",
    data: "Source, niche/location, authorized public website content, analyzer score, domain-level dedup key, sender details and opt-out/history state.",
    action:
      "Score and extract visible public site facts, queue a clearly watermarked private-preview draft and produce one personalized outreach draft. This starter does not discover contacts, host previews or send emails/contact forms automatically.",
    kpi: "Valid-site analysis rate, score-threshold precision sample, dedup collisions, human-approved preview rate, outreach opt-outs and error/manual-review counts; do not optimize by maximizing unsolicited volume.",
  },
  "gold-showroom": {
    trigger:
      "A client-owned ratebook/customer event, synthetic manual test, or separately approved schedule example: daily 10:30 rate broadcast and 11:00 reminders in Asia/Kolkata.",
    data: "Owner-maintained Rates/Subscribers/Scheme/Visits fields, current rate date, opted_in=yes, explicit making-charge/tax settings, approved scheme due date and showroom owner.",
    action:
      "Prepare current-rate, opt-in broadcast/reminder, estimate and staff-owned visit drafts. Reminders require exactly two days before the approved due date. No live sends, investment advice, binding quote, scheme payment or schedule activation.",
    kpi: "Rate freshness, staff-approved estimate corrections, opted-in reminder draft eligibility, booked-by-staff visits, duplicate suppression and owned exception count.",
  },
  "ca-practice": {
    trigger:
      "Approved firm website/email/WhatsApp event or manually tested support, document, deadline or invoice-status record.",
    data: "Firm-owned Clients, Leads, Documents_Tracker, Compliance_Calendar, Invoices, Query_Log and Error_Log fields; confidentiality permission, partner-approved source dates/status and staff owner.",
    action:
      "Prepare administrative intake, document/deadline/status reminder and partner handoff drafts. A partner approves all external communication; no tax advice, government filings, payment initiation, invoice changes or substantive professional decisions.",
    kpi: "Time to staff/partner review, approved deadline completeness, unresolved document count, overdue source-status reminders and exception age. Do not infer statutory compliance or financial outcomes.",
  },
  "universal-replier": {
    trigger:
      "Inbound customer message on the business's WhatsApp Business Platform number, or an approved channel event.",
    data: "The inbound message, recent conversation turns, the per-client business profile (approved services, prices, hours, policies, FAQs, handover contact, emergency note, module switches), consent/opt-in records, and source-returned availability or order data.",
    action:
      "Classify intent and draft a short reply in the customer's language from approved profile facts only; prepare booking, lead-capture, or opt-in follow-up drafts, and a handover package with team alert for every escalation path. Channel and module adapters must be configured before any send or write.",
    kpi: "First-response time, after-hours enquiries answered, bookings and leads captured, handovers completed and reminder-driven returns, calculated from message timestamps and the conversation log.",
    aiRules:
      "Starter Code nodes classify intent and prepare drafts using explicit deterministic rules. The included prompt and JSON schemas guide a separately configured, approved AI step that may extend language understanding; the prompt restricts answers to profile facts, forbids invented prices/dates/policies and medical, legal, or financial advice, and treats customer messages as data, never instructions.",
    humanFallback:
      "Complaints, emergencies, refunds, human requests, unclear or off-topic messages, unlisted facts, and provider failures go to the named business owner's review queue with a complete handover package, and the replier stops answering that conversation.",
    safety:
      "Approved facts only: if it is not in the profile, it is not said. Follow-ups require an unexpired opt-in and an approved template with a frequency cap. Recheck current source status before writes/sends. Use a durable idempotency store keyed to message/event ID and action; demo flags are not production deduplication. Failed adapters must create an owned exception, not silently retry consequential actions. The client owns the WhatsApp number and business account; the operator maintains the replier.",
  },
};
export const contractLabels: Record<keyof WorkflowContract, string> = {
  trigger: "Trigger",
  data: "Source data",
  aiRules: "AI + rules",
  action: "Action",
  humanFallback: "Human fallback",
  logging: "Logging",
  safety: "Errors & duplicate prevention",
  kpi: "What to measure",
};
export function getWorkflowContract(item: Automation): WorkflowContract {
  const healthcare = ["healthcare", "dental"].includes(item.industry);
  const overrides = specific[item.id] || {};
  return {
    ...overrides,
    aiRules:
      overrides.aiRules ??
      "Starter Code nodes validate synthetic data and prepare drafts using explicit rules. Included prompts and JSON schemas guide a separately configured, approved AI classification/extraction step; starter rules are not presented as AI execution.",
    humanFallback:
      overrides.humanFallback ??
      (healthcare
        ? "Missing, ambiguous, clinical, or high-impact requests go to the designated reception/department owner. Clinical decisions remain with qualified staff."
        : "Missing facts, uncertain answers, unsupported actions, and provider failures go to the named business owner’s review queue."),
    logging:
      overrides.logging ??
      "The starter returns a workflow name, correlation ID, status, and audit/action draft. Production adapters must persist event/version/owner/timestamps and communication outcomes in the approved source or log store.",
    safety:
      overrides.safety ??
      "Recheck current source status before writes/sends. Use a durable idempotency store keyed to event/record and action; demo flags are not production deduplication. Failed adapters must create an owned exception, not silently retry consequential actions.",
  } as WorkflowContract;
}
