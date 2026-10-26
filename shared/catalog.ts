export type Automation = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  industry: string;
  icon: string;
  color: string;
  price: number;
  badge?: string;
  popular?: boolean;
  bundle: string;
  outcomes: string[];
  includes: string[];
  requirements: string[];
  steps: string[];
};

export const PRICING = {
  currency: "USD",
  status: "draft",
  label: "Draft pricing · test checkout only",
} as const;
export const CONTACT_EMAIL = "sriraajj@gmail.com";
export const industries = [
  {
    id: "all",
    name: "All industries",
    description:
      "Find the right automation for the work your team does every day.",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description:
      "Connect the administrative patient journey around your existing HMS, EMR, and approved scheduling systems.",
  },
  {
    id: "dental",
    name: "Dental clinics",
    description:
      "Give your front desk a simpler way to handle enquiries, appointments, and patient follow-up.",
  },
  {
    id: "professional",
    name: "Professional services",
    description:
      "Turn enquiries into organized opportunities and keep client operations moving.",
  },
  {
    id: "realestate",
    name: "Real estate",
    description:
      "Route property enquiries, qualify interest, and coordinate viewings with your team.",
  },
  {
    id: "retail",
    name: "Retail & e-commerce",
    description:
      "Bring consistency to customer questions, follow-up, and routine service work.",
  },
  {
    id: "jewellery",
    name: "Jewellery & gold showrooms",
    description:
      "Prepare approved rate updates, customer service drafts, scheme reminders, and showroom visit requests from your own data.",
  },
  {
    id: "accounting",
    name: "CA & accounting firms",
    description:
      "Keep client requests, document checklists, deadlines, invoice status, and partner escalations organized around your own approved records.",
  },
  {
    id: "cross-industry",
    name: "Any business",
    description:
      "One replier engine, any office: build it once around a business profile of approved facts, then reuse it across industries.",
  },
];
export const categories = [
  "All automations",
  "Front office",
  "Sales & leads",
  "Patient lifecycle",
  "Customer support",
  "Operations",
];
export const automations: Automation[] = [
  {
    id: "front-office",
    name: "AI Front Office",
    tagline: "A better first response. Every time.",
    description:
      "Capture incoming enquiries, organize the details, route them to the right person, and draft a helpful first response with a human handoff when needed.",
    category: "Front office",
    industry: "professional",
    icon: "headset",
    color: "violet",
    price: 149,
    popular: true,
    badge: "Start here",
    bundle: "front-office",
    outcomes: [
      "Keep enquiries in one structured intake queue",
      "Make missing details and staff handoffs visible",
      "Use approved answers instead of invented facts",
    ],
    includes: [
      "Importable n8n intake workflow",
      "Administrative AI prompt and output schema",
      "Structured demo payloads and exception paths",
      "Setup guide, integration contract, and test checklist",
    ],
    requirements: [
      "An n8n instance with a supported Code node",
      "Your approved AI provider and credential setup",
      "Documented CRM and messaging adapters for production",
      "Approved response content and a named escalation owner",
    ],
    steps: [
      "Receive enquiry",
      "Validate & classify",
      "Draft approved response",
      "Route to staff",
      "Log the handoff",
    ],
  },
  {
    id: "dental-desk",
    name: "Dental Front Desk",
    tagline: "Less chasing. More patient care.",
    description:
      "Connect appointment enquiries, confirmed availability, reminders, and no-show follow-up without replacing your practice management system. Administrative use only.",
    category: "Patient lifecycle",
    industry: "dental",
    icon: "tooth",
    color: "mint",
    price: 249,
    popular: true,
    badge: "Dental",
    bundle: "dental-desk",
    outcomes: [
      "Track enquiries and appointment handoffs",
      "Use only slots returned by your scheduling source",
      "Follow up missed visits without duplicate messages",
    ],
    includes: [
      "Appointment-intake, no-show, and follow-up workflow starters",
      "Consent, human-review, and idempotency guardrails",
      "Synthetic scenarios and administrative message templates",
      "Practice-system discovery and go-live checklist",
    ],
    requirements: [
      "Approved practice-management/calendar API or staff handoff",
      "Approved patient communication provider and consent policy",
      "n8n and an approved AI provider",
      "Practice security review before real patient data is processed",
    ],
    steps: [
      "Capture enquiry",
      "Review availability",
      "Confirm approved slot",
      "Prepare reminder",
      "Recover no-show",
    ],
  },
  {
    id: "lead-engine",
    name: "Lead Qualification Engine",
    tagline: "Give every good enquiry a next step.",
    description:
      "Normalize inbound leads, extract qualification details from supplied information, and assign a clear next action for your sales team. No unsolicited outreach is activated.",
    category: "Sales & leads",
    industry: "professional",
    icon: "target",
    color: "peach",
    price: 179,
    popular: true,
    badge: "Sales",
    bundle: "lead-engine",
    outcomes: [
      "Turn unstructured enquiries into a consistent pipeline",
      "Flag missing qualification information",
      "Give sales a reviewable response and next action",
    ],
    includes: [
      "Importable lead-intake and qualification workflow",
      "Structured lead schema and scoring rules",
      "Consent-aware follow-up drafts",
      "CRM integration contract and synthetic sample cases",
    ],
    requirements: [
      "An approved inbound lead source",
      "n8n and an approved AI provider",
      "Documented CRM connection",
      "Your qualification rules and outreach policies",
    ],
    steps: [
      "Capture lead",
      "Extract details",
      "Apply qualification rules",
      "Assign owner",
      "Prepare follow-up",
    ],
  },
  {
    id: "hospital-lifecycle",
    name: "Hospital Patient Lifecycle",
    tagline: "Connect the gaps around your HMS.",
    description:
      "A three-workflow administrative starter for enquiry-to-appointment, approved discharge follow-up, and pending-diagnostic escalation. Production integration is scoped with your hospital and vendors.",
    category: "Patient lifecycle",
    industry: "healthcare",
    icon: "hospital",
    color: "sky",
    price: 499,
    badge: "Healthcare",
    bundle: "hospital-lifecycle",
    outcomes: [
      "Coordinate lead-to-appointment administrative handoffs",
      "Create follow-up tasks only from approved instructions",
      "Escalate pending diagnostics to staff without interpreting results",
    ],
    includes: [
      "Three importable n8n workflow starters plus no-show recovery",
      "Administrative AI guardrail prompt and schemas",
      "Synthetic DemoCare data, test cases, and exception map",
      "Vendor/API discovery matrix and implementation checklist",
    ],
    requirements: [
      "Hospital-approved HMS/EMR/CRM APIs or documented human handoffs",
      "Approved scheduling, messaging, and AI providers",
      "Security, privacy, and clinical-stakeholder review",
      "Named workflow owners and signed production scope",
    ],
    steps: [
      "Capture administrative event",
      "Validate supplied facts",
      "Apply approval gates",
      "Prepare action",
      "Log & escalate",
    ],
  },
  {
    id: "support-assistant",
    name: "Customer Support Assistant",
    tagline: "Helpful answers. Clear handoffs.",
    description:
      "Classify incoming support questions, prepare responses from your approved knowledge base, and send uncertain requests to a person rather than invent an answer.",
    category: "Customer support",
    industry: "retail",
    icon: "message",
    color: "violet",
    price: 129,
    bundle: "support-assistant",
    outcomes: [
      "Sort routine questions into the right queue",
      "Keep answers grounded in approved policy",
      "Make uncertainty visible to the support team",
    ],
    includes: [
      "Support-intake workflow and response schema",
      "Knowledge-base grounding and human-review prompt",
      "Synthetic ticket fixtures",
      "Helpdesk adapter requirements and setup guide",
    ],
    requirements: [
      "Approved FAQ or support policy",
      "n8n and an approved AI provider",
      "Documented helpdesk API for production",
      "A staff escalation owner",
    ],
    steps: [
      "Receive question",
      "Find supplied policy",
      "Draft answer",
      "Review uncertainty",
      "Log ticket",
    ],
  },
  {
    id: "reputation-care",
    name: "Feedback & Service Recovery",
    tagline: "Close the loop after every visit.",
    description:
      "Collect consented feedback, classify the supplied sentiment, and create a staff service-recovery task when the experience needs attention. Never generates fabricated reviews.",
    category: "Customer support",
    industry: "dental",
    icon: "star",
    color: "peach",
    price: 99,
    bundle: "reputation-care",
    outcomes: [
      "Turn feedback into visible follow-up work",
      "Escalate concerns to a named staff owner",
      "Avoid review gating and fabricated public reviews",
    ],
    includes: [
      "Feedback classification and recovery workflow",
      "Approved message drafts",
      "Synthetic feedback and exception fixtures",
      "Consent and ticketing integration checklist",
    ],
    requirements: [
      "Approved feedback source and consent process",
      "n8n and an approved AI provider",
      "Documented ticketing/CRM adapter",
      "Service-recovery owner and response policy",
    ],
    steps: [
      "Receive feedback",
      "Classify supplied sentiment",
      "Create recovery draft",
      "Assign staff owner",
      "Log resolution",
    ],
  },
  {
    id: "property-enquiries",
    name: "Property Enquiry Assistant",
    tagline: "A clearer path from interest to viewing.",
    description:
      "Organize property enquiries, extract stated preferences, and prepare viewing coordination for an agent. It does not invent listings, availability, or financing advice.",
    category: "Sales & leads",
    industry: "realestate",
    icon: "building",
    color: "mint",
    price: 199,
    bundle: "property-enquiries",
    outcomes: [
      "Capture stated property preferences",
      "Route leads to the responsible agent",
      "Coordinate viewing requests against supplied availability",
    ],
    includes: [
      "Property-intake qualification workflow",
      "Preference extraction and viewing-request schema",
      "Synthetic enquiry samples",
      "Listing/CRM adapter contract and setup checklist",
    ],
    requirements: [
      "Approved listing data and documented CRM API",
      "n8n and an approved AI provider",
      "Agent-owned scheduling source",
      "Your enquiry handling and consent policies",
    ],
    steps: [
      "Capture enquiry",
      "Extract preferences",
      "Match supplied listing",
      "Assign agent",
      "Prepare viewing request",
    ],
  },
  {
    id: "daily-operations",
    name: "Daily Operations Brief",
    tagline: "The important work, in one brief.",
    description:
      "Turn supplied operational metrics into a concise management summary with exceptions, overdue tasks, and questions for the team. It never invents metrics or clinical conclusions.",
    category: "Operations",
    industry: "professional",
    icon: "chart",
    color: "sky",
    price: 79,
    bundle: "daily-operations",
    outcomes: [
      "Surface supplied overdue work and exceptions",
      "Standardize the daily administrative summary",
      "Keep every metric tied to source information",
    ],
    includes: [
      "Operations-summary workflow and output schema",
      "Management prompt and validation rules",
      "Synthetic metrics dataset",
      "Reporting integration guide and daily-run checklist",
    ],
    requirements: [
      "A documented source of operational metrics",
      "n8n and an approved AI provider",
      "Approved internal reporting destination",
      "Management owner and metric definitions",
    ],
    steps: [
      "Receive metrics",
      "Validate source fields",
      "Summarize supplied data",
      "Flag exceptions",
      "Prepare brief",
    ],
  },
  {
    id: "realestate-lead-desk",
    name: "Real Estate Lead-to-Viewing Desk",
    tagline: "From first property enquiry to broker handoff.",
    description:
      "A multi-channel real-estate workflow starter for Meta lead forms, WhatsApp enquiries, and an optional voice provider. Qualify stated location, budget, property type, and intent against client-supplied listings; prepare broker-assignment and viewing-request drafts with duplicate and opt-out checks. The supplied reference dashboard is a separate mockup, not a live connected dashboard.",
    category: "Sales & leads",
    industry: "realestate",
    icon: "building",
    color: "sky",
    price: 399,
    badge: "Multi-channel",
    bundle: "realestate-lead-desk",
    outcomes: [
      "Normalize consented WhatsApp, Meta lead, and approved voice inputs",
      "Match only client-supplied property inventory and source-confirmed viewing availability",
      "Prepare broker ownership, booking requests, and capped follow-up drafts for staff review",
    ],
    includes: [
      "Inactive, synthetic-data n8n starters for channel parsing, qualification, broker handoff, and follow-up review",
      "Inventory, booking, broker-routing, and CRM/Sheets data schemas",
      "Client API checklist for Meta/WhatsApp/voice, inventory, messaging, and notifications",
      "Setup guide with human approval, opt-out, rate-limit, and durable-dedup rules",
    ],
    requirements: [
      "Client-owned Meta lead access and/or WhatsApp Business API provider credentials stored in n8n",
      "Documented property inventory/CRM and broker roster; Google Sheets is one optional source, not included",
      "Optional voice provider (e.g. VAPI/Twilio or a supported client alternative) and approved transfer destination",
      "Client-approved consent, message templates, provider plans, staff approval, and persistent idempotency store",
    ],
    steps: [
      "Receive approved channel payload",
      "Normalize stated preferences",
      "Look up client inventory",
      "Prepare agent-owned viewing request",
      "Route drafts for human approval",
    ],
  },
  {
    id: "voice-front-desk",
    name: "Voice Front Desk Starter",
    tagline: "Route the call. Keep the human close.",
    description:
      "An inactive, provider-neutral voice-intake workflow kit for a client-owned phone number and voice-agent platform. It structures supplied synthetic call summaries, confirms only sourced administrative details, and prepares a staff handoff. No telephone number is provisioned and no calls are made by purchasing this kit.",
    category: "Front office",
    industry: "professional",
    icon: "headset",
    color: "violet",
    price: 249,
    badge: "Voice",
    bundle: "voice-front-desk",
    outcomes: [
      "Turn an approved provider callback payload into a structured administrative request",
      "Route unclear, high-impact, or unanswered caller requests to a named person",
      "Keep call, transfer, and provider charges under the client’s direct provider account",
    ],
    includes: [
      "Inactive n8n intake and staff-handoff workflow starters",
      "Voice event schema, approved-language prompt insert, and synthetic payloads",
      "Provider/KYC and separate-cost checklist for Indian number setup",
      "Privacy, consent, disclosure, transfer, and failure-path setup guide",
    ],
    requirements: [
      "A client-owned supported voice-agent/telephony provider and approved number, if using phone calls",
      "Provider-specific onboarding/KYC, account balance, telephony terms, and language availability confirmed directly by the client",
      "An approved source API or staff queue, plus named live-transfer destination",
      "Client-approved call disclosure/recording, consent, privacy, and escalation policy",
    ],
    steps: [
      "Configure the client-owned voice provider",
      "Map its secured event to the supplied payload schema",
      "Test with fictional calls and human handoff",
      "Review permissions and provider costs",
      "Activate only under the client’s approved scope",
    ],
  },
  {
    id: "local-site-leadgen",
    name: "Local Website Audit & Lead Engine",
    tagline: "Find the gap. Prepare the preview. Review before contact.",
    description:
      "A separate lead-generation pipeline starter for scoring public small-business websites, extracting verified brand details, and preparing an enhanced-site preview and personalized outreach draft. The supplied stdlib-only analyzer and data schemas are included. The site finder, website generator, scheduler, hosting, email/CRM APIs, and live outreach need client configuration; sending is never automatic.",
    category: "Sales & leads",
    industry: "professional",
    icon: "target",
    color: "peach",
    price: 329,
    badge: "New",
    bundle: "local-site-leadgen",
    outcomes: [
      "Score a client-provided public business website and capture grounded source details",
      "Use configurable location/niche, score threshold, daily capacity, and duplicate checks",
      "Prepare a clearly watermarked preview and one human-reviewed outreach draft; respect opt-outs",
    ],
    includes: [
      "Standalone Python standard-library website analyzer from the supplied export",
      "Inactive, synthetic n8n preparation/review workflow starters",
      "Prospect, LeadConfig, OutreachLog, and GeneratedSite schema templates",
      "Configuration template and revised human-review-first outreach prompts",
    ],
    requirements: [
      "Client-owned authorized prospect source; a licensed directory/search API if automatic discovery is desired",
      "Python 3 for the local standalone analyzer; no API key needed for that analyzer",
      "Optional client-selected AI/site-generation and hosting providers if preview sites should be rendered or hosted",
      "Optional CRM/email-provider APIs added inside n8n; sender name, business email, physical address, and jurisdiction-specific outreach review before any approved email",
    ],
    steps: [
      "Set location, niches, score threshold, and daily limit in the local config",
      "Run the website analyzer on an authorized public URL",
      "Review extracted facts and a clearly watermarked preview",
      "Prepare a single opt-out-aware outreach draft",
      "Obtain a person’s approval before any external contact",
    ],
  },
  {
    id: "gold-showroom",
    name: "Gold Showroom AI Desk",
    tagline: "Today’s verified rates. A showroom-owned customer journey.",
    description:
      "A configurable n8n starter for jewellers using a client-owned Google Sheet ratebook and opt-in customer list. It prepares a 10:30 Asia/Kolkata rate-broadcast draft, handles bounded rate and savings-scheme questions, checks opted-in instalment reminders two days before a due date, and drafts showroom-visit requests. It does not send broadcasts, calculate a binding quote, or activate schedules by purchase.",
    category: "Customer support",
    industry: "jewellery",
    icon: "star",
    color: "peach",
    price: 449,
    badge: "India-ready starter",
    bundle: "gold-showroom",
    outcomes: [
      "Read showroom-provided daily 22K/24K gold and silver rates from an owner-maintained sheet",
      "Draft customer answers and estimates only from current rates and owner-approved charge/tax settings",
      "Prepare opt-in-only rate broadcasts, two-day scheme reminder drafts, and staff-reviewed visit requests",
    ],
    includes: [
      "Inactive synthetic n8n starters for ratebook, enquiry/reception, scheme reminder, and showroom-visit flows",
      "Google Sheets tab/column schemas for Rates, Subscribers, Scheme, and Visits",
      "Client setup guide for Asia/Kolkata timezone, WhatsApp Cloud API, OpenAI, consent, and security",
      "Safe estimate slip and showroom console data model; dashboard HTML remains a non-live reference",
    ],
    requirements: [
      "Client-owned n8n workspace set to Asia/Kolkata and a Google Sheet with owner-verified rate/config values",
      "Optional Meta WhatsApp Cloud API Business Account, Phone Number ID, system-user token, approved templates, and documented opt-in/opt-out process",
      "Optional OpenAI API account/key if the client selects that provider; stored only in the client’s n8n credential vault",
      "Owner-approved per-gram rates, making-charge method, tax basis/rate and effective date; GST/tax treatment must be verified by the showroom/accountant",
    ],
    steps: [
      "Create and populate the four approved Google Sheet tabs",
      "Import each inactive n8n workflow and test with synthetic records",
      "Add the client’s own Google/Meta/AI credentials in n8n Credentials",
      "Review consent, rates, estimate wording, and schedule times",
      "Keep broadcasts and reminders paused until the showroom owner approves activation",
    ],
  },
  {
    id: "ca-practice",
    name: "CA Practice Operations Desk",
    tagline: "The paperwork moves. The professional stays in control.",
    description:
      "A separately priced administrative kit based on the supplied CA-firm workflow reference: client-support intake, new-lead routing, document-status/request drafts, approved compliance-deadline reminders, invoice-status follow-up, and partner escalation. It reads only firm-approved data; no tax advice, filings, payment initiation, or professional decisions are automated.",
    category: "Operations",
    industry: "accounting",
    icon: "chart",
    color: "mint",
    price: 499,
    badge: "CA firms",
    bundle: "ca-practice",
    outcomes: [
      "Organize client enquiries and new leads from approved website/email/WhatsApp inputs",
      "Prepare document checklists and deadline or invoice-status follow-up for staff review",
      "Route missing facts, overdue work, and sensitive questions to a named partner or team owner",
    ],
    includes: [
      "Inactive synthetic n8n starters for support, leads, document tracking, compliance-calendar, invoice-status and escalation paths",
      "Table/field requirements for Clients, Leads, Documents_Tracker, Compliance_Calendar, Invoices, Query_Log, and Error_Log",
      "Optional Google Sheets/Gmail, WhatsApp, Groq/OpenAI-compatible AI, and Telegram integration checklist",
      "Two-step safe demo guide, client-particulars template, human-approval contract, and no-filing boundary",
    ],
    requirements: [
      "Firm-owned source database or Google Sheets, documented APIs, minimum allowed fields, and named record owners",
      "Optional Gmail/WhatsApp and Telegram provider credentials plus approved consent/template/notification rules",
      "Optional client-approved AI provider, with the source’s Groq-compatible setup as one configurable choice",
      "Partner-reviewed actual deadlines and invoice status, client authorization, confidentiality/security controls, and durable audit/idempotency storage",
    ],
    steps: [
      "Import the inactive synthetic workflows",
      "Map firm-owned tables and client/owner identifiers",
      "Add only approved provider credentials inside n8n Credentials",
      "Test missing records, opt-outs, stale deadlines/status, and partner handoff",
      "Approve each production communication separately; no filings or payments are initiated",
    ],
  },
  {
    id: "universal-replier",
    name: "Universal WhatsApp Replier",
    tagline: "Every enquiry answered. Any business. Any hour.",
    description:
      "One auto-replier engine that fits any office: answers from a per-client business profile of approved facts, books appointments, captures leads, replies in English, Hindi, or Hinglish, and hands over to your team the moment a human is needed. Built once, onboarded per client as a new profile — not a new project.",
    category: "Front office",
    industry: "cross-industry",
    icon: "message",
    color: "violet",
    price: 299,
    popular: true,
    badge: "Any business",
    bundle: "universal-replier",
    outcomes: [
      "Answer hours, prices, services, and policies from facts you approve",
      "Book appointments or capture leads, with slots returned by your own scheduler only",
      "Hand over complaints, emergencies, and anything unclear to your team immediately",
      "Reply in the language your customer writes in — English, Hindi, or Hinglish",
    ],
    includes: [
      "Four inactive n8n starters: intake and intent routing, human handover package, booking module, and opt-in follow-up",
      "The business profile template — one file of approved facts and module switches per client",
      "The approved-facts prompt with the eleven-intent table and no-advice guardrails",
      "Test pack with Hinglish, emergency, complaint, trick-message, and opt-out cases",
    ],
    requirements: [
      "A client-owned WhatsApp Business Platform (Cloud API) account with a dedicated number",
      "An n8n instance with a supported Code node; credentials in the client's vault only",
      "A scheduling source when the booking module is on — availability is never invented",
      "Opt-in records and approved templates before any follow-up is sent",
    ],
    steps: [
      "Import the inactive synthetic starters",
      "Fill the business profile with owner-approved facts",
      "Connect the WhatsApp adapter to a test number",
      "Run the test pack, including handover and opt-out paths",
      "Go live with handover on and review the log daily for the first week",
    ],
  },
];
export const getAutomation = (id: string) =>
  automations.find(item => item.id === id);
export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: PRICING.currency,
    maximumFractionDigits: 0,
  }).format(value);
