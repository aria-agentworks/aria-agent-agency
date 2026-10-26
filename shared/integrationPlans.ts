import type { Automation } from "./catalog";
export type IntegrationPlan = {
  label: string;
  purpose: string;
  required: boolean;
  clientProvides: string[];
  secretDestination: string;
  steps: [string, string];
};
const plans: Record<string, IntegrationPlan[]> = {
  "front-office": [
    {
      label: "n8n workspace",
      purpose: "Imports and runs the inactive workflow starters.",
      required: true,
      clientProvides: ["Your client-owned n8n URL and workspace owner"],
      secretDestination:
        "No credential is required to test the synthetic starter.",
      steps: [
        "Import the supplied JSON workflow.",
        "Run the synthetic test and keep it inactive.",
      ],
    },
    {
      label: "AI provider (optional)",
      purpose:
        "Adds real extraction/classification after the deterministic demo is understood.",
      required: false,
      clientProvides: [
        "Chosen provider/model and account/API documentation",
        "Approved prompt, data-handling policy, and cost owner",
      ],
      secretDestination: "n8n Credentials vault only.",
      steps: [
        "Create the provider credential in n8n.",
        "Connect it only after test data and output schema are approved.",
      ],
    },
    {
      label: "CRM / intake source (production)",
      purpose: "Receives approved form events and stores the reviewed handoff.",
      required: false,
      clientProvides: [
        "CRM/form name, vendor API documentation, event schema, and permitted scopes",
        "Named staff queue/owner",
      ],
      secretDestination: "n8n Credentials vault only.",
      steps: [
        "Provide a documented API and least-privilege service account.",
        "Test a synthetic event, error path, and idempotency check.",
      ],
    },
  ],
  "dental-desk": [
    {
      label: "Practice system / scheduler",
      purpose:
        "Checks current appointment state and source-confirmed availability.",
      required: true,
      clientProvides: [
        "Practice system/vendor and approved scheduling API documentation",
        "Minimum allowed administrative fields and staff handoff owner",
      ],
      secretDestination:
        "n8n Credentials vault; never send patient/API secrets in the public form.",
      steps: [
        "Import the kit and run synthetic intake/no-show cases.",
        "Connect the approved API or use the documented staff handoff.",
      ],
    },
    {
      label: "Messaging provider",
      purpose:
        "Can deliver an approved reminder only after consent and duplicate checks.",
      required: false,
      clientProvides: [
        "Provider, approved message templates, sender/number, consent and opt-out rules",
      ],
      secretDestination: "Provider credential stored in n8n.",
      steps: [
        "Create a provider account/credential.",
        "Keep send nodes disabled until practice approval.",
      ],
    },
  ],
  "lead-engine": [
    {
      label: "Inbound lead source / CRM",
      purpose:
        "Supplies consented lead payloads and stores reviewed qualification.",
      required: true,
      clientProvides: [
        "Form/CRM name, vendor API docs, field names, permission scopes, queue owner",
      ],
      secretDestination: "n8n Credentials vault.",
      steps: [
        "Import the workflow and test a synthetic lead.",
        "Connect one approved source and one CRM adapter.",
      ],
    },
    {
      label: "AI provider (optional)",
      purpose:
        "Adds classification over supplied facts; the starter rules alone are not AI calls.",
      required: false,
      clientProvides: [
        "Provider/model, prompt schema, data-retention policy, and budget owner",
      ],
      secretDestination: "n8n Credentials vault.",
      steps: [
        "Add the provider credential in n8n.",
        "Validate structured outputs on synthetic fixtures.",
      ],
    },
  ],
  "hospital-lifecycle": [
    {
      label: "HMS/EMR/CRM and scheduling",
      purpose:
        "Supplies approved administrative status and available slot values.",
      required: true,
      clientProvides: [
        "Vendor APIs, sandbox docs/credentials, scope approval, source-of-truth owner",
      ],
      secretDestination: "Client-controlled n8n Credentials vault only.",
      steps: [
        "Review all synthetic safety paths.",
        "Connect an approved sandbox API or keep a staff handoff.",
      ],
    },
    {
      label: "Messaging/AI provider",
      purpose: "Optional administrative drafts and consented messages.",
      required: false,
      clientProvides: [
        "Approved provider, supported features, consent and facility security/privacy approval",
      ],
      secretDestination: "Credential vault only; not Aria’s form.",
      steps: [
        "Add provider credentials in client n8n.",
        "Keep clinical, write, and send actions under facility approval.",
      ],
    },
  ],
  "support-assistant": [
    {
      label: "Knowledge base and helpdesk",
      purpose: "Sources approved policy text and an owner-routed ticket.",
      required: true,
      clientProvides: [
        "Helpdesk/vendor docs, approved knowledge source, queue owner",
      ],
      secretDestination: "n8n Credentials vault.",
      steps: [
        "Import and run the fictional ticket fixture.",
        "Connect the approved read/review queue API.",
      ],
    },
    {
      label: "AI provider (optional)",
      purpose: "Drafts a grounded answer using only supplied policy.",
      required: false,
      clientProvides: ["Provider/model, approved retrieval scope, data policy"],
      secretDestination: "n8n Credentials vault.",
      steps: [
        "Create credential and validate no-answer fixtures.",
        "Require staff review before any reply is sent.",
      ],
    },
  ],
  "reputation-care": [
    {
      label: "Feedback/CRM/helpdesk source",
      purpose: "Captures consented feedback and opens a private service task.",
      required: true,
      clientProvides: [
        "Feedback source API docs, consent rules, response policy, assigned owner",
      ],
      secretDestination: "n8n Credentials vault.",
      steps: [
        "Import and test synthetic ratings.",
        "Connect the internal service queue; keep public replies manual.",
      ],
    },
  ],
  "property-enquiries": [
    {
      label: "Property listing/CRM source",
      purpose: "Matches only inventory supplied by the customer’s own system.",
      required: true,
      clientProvides: [
        "Listing feed/API docs, CRM, available-fields schema, inventory owner",
      ],
      secretDestination: "n8n Credentials vault.",
      steps: [
        "Import the synthetic enquiry flow.",
        "Connect a read-only listing adapter and staff viewing queue.",
      ],
    },
  ],
  "daily-operations": [
    {
      label: "Metrics/reporting source",
      purpose: "Summarizes only client-supplied reporting facts.",
      required: true,
      clientProvides: [
        "Metric definitions, source API/export, date window, report owner",
      ],
      secretDestination: "n8n Credentials vault if API-based.",
      steps: [
        "Run the sample-metrics fixture.",
        "Connect the read-only report source and verify every metric.",
      ],
    },
  ],
  "realestate-lead-desk": [
    {
      label: "Meta Lead Ads (optional source)",
      purpose: "Supplies configured lead-form webhook events.",
      required: false,
      clientProvides: [
        "Business-owned Meta app/page access, lead-form ID, webhook subscription, privacy notice, vendor docs",
      ],
      secretDestination:
        "Meta token in n8n Credentials; never paste it in this form.",
      steps: [
        "Configure one approved webhook source.",
        "Test with a synthetic or approved sandbox lead.",
      ],
    },
    {
      label: "WhatsApp Business (optional channel)",
      purpose:
        "Receives consented inbound messages and optionally routes an approved reply draft.",
      required: false,
      clientProvides: [
        "WhatsApp Business/provider account, sender/phone-number ID, approved templates, messaging opt-in",
      ],
      secretDestination:
        "Client provider/API credential stored in n8n Credentials.",
      steps: [
        "Connect the provider webhook and credential.",
        "Keep outbound reply nodes inactive pending opt-in and staff approval.",
      ],
    },
    {
      label: "Property inventory + broker roster",
      purpose:
        "Checks supplied property facts and prepares a human-owned broker/viewing request.",
      required: true,
      clientProvides: [
        "Inventory/CRM API docs or approved Sheets table IDs/columns, broker/area mapping, time slots source",
      ],
      secretDestination:
        "Use least-privilege service credential in n8n Credentials.",
      steps: [
        "Map the read-only property lookup and broker rules.",
        "Have staff approve every booking before write/send.",
      ],
    },
    {
      label: "Voice/notifications (optional)",
      purpose:
        "Accepts a configured provider call payload and alerts the assigned broker.",
      required: false,
      clientProvides: [
        "Provider (e.g. VAPI/Twilio or client choice), callback/webhook docs, notification destination and transfer owner",
      ],
      secretDestination:
        "Provider tokens in n8n Credentials; all usage billed to client account.",
      steps: [
        "Confirm provider KYC, permissions, and human-transfer target.",
        "Exercise a synthetic call and error/handoff case.",
      ],
    },
  ],
  "voice-front-desk": [
    {
      label: "Indian voice/telephony provider",
      purpose:
        "Rents and routes a number through the client’s direct provider account.",
      required: true,
      clientProvides: [
        "Provider plan, eligible number type, KYC/compliance approval, supported languages, transfer destination",
      ],
      secretDestination:
        "Provider/API credential only in the client-owned n8n Credentials vault.",
      steps: [
        "Complete KYC and rent a number with the provider.",
        "Route synthetic calls, consent/disclosures, and human transfer before go-live.",
      ],
    },
    {
      label: "Business API / human queue",
      purpose:
        "Looks up approved business facts and hands exceptions to staff.",
      required: true,
      clientProvides: [
        "CRM/scheduling/helpdesk API docs, allowed read/write scopes, working-hours and fallback owner",
      ],
      secretDestination: "n8n Credentials vault.",
      steps: [
        "Use a read-only/sandbox adapter first.",
        "Approve required actions and transfer path with the business owner.",
      ],
    },
  ],
  "local-site-leadgen": [
    {
      label: "Prospect source (optional automation)",
      purpose: "Finds eligible local businesses from a permitted data source.",
      required: false,
      clientProvides: [
        "Licensed directory or client-approved search/Maps API, local business niche, location, permitted-use terms",
      ],
      secretDestination:
        "Provider credential in client n8n Credentials; source/analyzer local demo needs no API key.",
      steps: [
        "Enter the city, niches, score threshold, and daily cap in config.json.",
        "Supply one authorized public URL or approved prospect source.",
      ],
    },
    {
      label: "Website analyzer",
      purpose:
        "Scores mobile/responsive/site basics and extracts visible public business content.",
      required: true,
      clientProvides: [
        "Python 3 and an authorized public business website URL; the standalone scorer uses the Python standard library",
      ],
      secretDestination: "No key is required by the analyzer.",
      steps: [
        "Run `python3 website-analyzer.py https://example-business.com`.",
        "Review the score and every extracted fact before preview generation.",
      ],
    },
    {
      label: "Optional AI/site generation + hosting",
      purpose:
        "Turns reviewed business facts into a watermarked preview website.",
      required: false,
      clientProvides: [
        "Approved site-generation tool/provider, hosting account or destination, owner permission to create/store the preview",
      ],
      secretDestination:
        "Provider credential in client vault; do not put it in outreach messages.",
      steps: [
        "Generate a preview using only reviewed facts and mark it “not the live site”.",
        "Publish only with owner permission and a planned removal date.",
      ],
    },
    {
      label: "Optional CRM/email",
      purpose:
        "Stores a reviewed prospect/outreach draft; no email sends are wired in this kit.",
      required: false,
      clientProvides: [
        "CRM/list owner, sender name/email/business address, recipient jurisdiction, provider documentation and approved send policy",
      ],
      secretDestination:
        "Client’s n8n/email connector secure credential store only.",
      steps: [
        "Connect a prospect log and keep send/outreach nodes paused.",
        "Have a person review recipient eligibility, jurisdiction, message, opt-out and address before sending.",
      ],
    },
  ],
  "gold-showroom": [
    {
      label: "Google Sheet ratebook and client tables",
      purpose:
        "Reads owner-verified Rates, Subscribers, Scheme, and Visits data.",
      required: true,
      clientProvides: [
        "Spreadsheet ID and approved columns/field mapping",
        "Owner-verified date/rates and making-charge/tax settings",
        "Showroom timezone Asia/Kolkata and named staff owner",
      ],
      secretDestination:
        "Google OAuth/service-account credential in client-owned n8n Credentials.",
      steps: [
        "Create the four named tabs and enter synthetic fixtures.",
        "Connect the sheet read adapter and verify current-day rate freshness.",
      ],
    },
    {
      label: "Meta WhatsApp Cloud API (optional)",
      purpose:
        "Can receive opt-in customer requests and queue approved rate/reminder drafts.",
      required: false,
      clientProvides: [
        "Business-owned WhatsApp account, Phone Number ID and approved messaging templates",
        "System-user token (enter only in vault), opt-in list and opt-out process",
      ],
      secretDestination:
        "Meta credential in client n8n Credentials; do not paste token in Aria form.",
      steps: [
        "Complete client provider onboarding and map a secure webhook.",
        "Keep broadcast/send nodes paused until showroom owner approval.",
      ],
    },
    {
      label: "OpenAI / approved AI provider (optional)",
      purpose:
        "Classifies bounded showroom enquiries; deterministic calculations use approved source values.",
      required: false,
      clientProvides: [
        "Client-selected provider/model, data/privacy review and budget owner",
      ],
      secretDestination: "Client n8n Credentials vault.",
      steps: [
        "Add the approved provider credential.",
        "Test unknown/stale rates, scheme and sensitive requests before use.",
      ],
    },
  ],
  "ca-practice": [
    {
      label: "Firm records / Google Sheets",
      purpose:
        "Sources Clients, Leads, Documents_Tracker, Compliance_Calendar, Invoices, Query_Log and Error_Log.",
      required: true,
      clientProvides: [
        "Firm-owned source/table IDs, APIs, field mapping and data owners",
        "Partner-approved deadlines, document state and invoice status",
        "Minimum approved client data and confidentiality review",
      ],
      secretDestination:
        "Client-owned n8n Credentials vault; no tax/customer records in public inquiry.",
      steps: [
        "Map the table schema using fictional firm records.",
        "Test lookup misses, stale status and partner approval before any write.",
      ],
    },
    {
      label: "Gmail / WhatsApp / Telegram (optional)",
      purpose:
        "Captures approved communications and routes human-reviewed drafts/escalations.",
      required: false,
      clientProvides: [
        "Provider documentation, business-owned email/WhatsApp identity and allowed scopes",
        "Partner/team alert destination, consent and message policies",
      ],
      secretDestination: "OAuth/API credentials in firm-owned n8n Credentials.",
      steps: [
        "Add one least-privilege messaging provider at a time.",
        "Keep outgoing nodes paused until the partner approves the communication.",
      ],
    },
    {
      label: "Groq or approved OpenAI-compatible AI (optional)",
      purpose:
        "Drafts administrative answers and classifications using only supplied firm facts.",
      required: false,
      clientProvides: [
        "Client-selected compatible endpoint/model, data policy and budget owner",
      ],
      secretDestination: "Client n8n Credentials vault only.",
      steps: [
        "Add the provider credential and approved endpoint through documented configuration.",
        "Test no-advice/no-filing cases and structured-output validation.",
      ],
    },
  ],
  "universal-replier": [
    {
      label: "n8n workspace",
      purpose: "Imports and runs the inactive workflow starters.",
      required: true,
      clientProvides: ["Your client-owned n8n URL and workspace owner"],
      secretDestination:
        "No credential is required to test the synthetic starter.",
      steps: [
        "Import the supplied JSON workflow.",
        "Run the synthetic test and keep it inactive.",
      ],
    },
    {
      label: "WhatsApp Business Platform / Cloud API",
      purpose:
        "The channel the replier listens on and replies through, with a dedicated business number.",
      required: true,
      clientProvides: [
        "Meta business verification, a WhatsApp Business Platform account, and a dedicated number",
        "Approved message templates for follow-ups and the client-owned webhook subscription",
        "Decision on whether per-message fees are included in the monthly fee or passed through at cost",
      ],
      secretDestination: "Client-owned n8n Credentials vault only.",
      steps: [
        "Connect the channel adapter to a test number first.",
        "Run the full test pack, including handover and opt-out paths, before going live.",
      ],
    },
    {
      label: "Scheduling / calendar source (optional)",
      purpose:
        "Source of truth for open slots when the booking module is on; availability is never invented.",
      required: false,
      clientProvides: [
        "Calendar or booking system name, API documentation, and service/provider mapping",
        "Permitted scopes and a named booking owner",
      ],
      secretDestination: "Client-owned n8n Credentials vault only.",
      steps: [
        "Return source-confirmed slots only.",
        "Test lookup misses, stale availability, and double-booking protection.",
      ],
    },
    {
      label: "AI provider (optional)",
      purpose:
        "Adds language understanding beyond the deterministic intent rules after the demo is understood.",
      required: false,
      clientProvides: [
        "Chosen provider/model and account/API documentation",
        "Approved prompt, data-handling policy, and cost owner",
      ],
      secretDestination: "n8n Credentials vault only.",
      steps: [
        "Create the provider credential in n8n.",
        "Connect it only after the synthetic test, output schema, and prompt review are approved.",
      ],
    },
    {
      label: "Lead sheet / CRM (optional)",
      purpose:
        "Stores collected enquiry details for quote requests and lead capture, and alerts the team.",
      required: false,
      clientProvides: [
        "Sheet or CRM name, vendor API documentation, field mapping, and permitted scopes",
        "Team alert destination and consent/message policies",
      ],
      secretDestination: "Client-owned n8n Credentials vault only.",
      steps: [
        "Test a synthetic event, error path, and duplicate protection.",
        "Verify the human alert path before activation.",
      ],
    },
  ],
};
export function getIntegrationPlan(item: Automation) {
  return plans[item.id] ?? plans[item.bundle] ?? [];
}
export function clientSetupTemplate(item: Automation) {
  return {
    automation_id: item.id,
    enabled: false,
    business: {
      name: "",
      website: "",
      location: "",
      country: "",
      timezone: "",
      industry: item.industry,
      languages: [],
      human_owner: "",
      human_transfer_destination: "",
    },
    workflow: {
      daily_capacity: 5,
      quality_score_threshold: 45,
      allowed_actions: ["draft_only"],
      require_human_approval: true,
      prevent_duplicate_events: true,
    },
    integrations: getIntegrationPlan(item).map(api => ({
      name: api.label,
      required: api.required,
      provider: "",
      api_docs_url: "",
      credential_values_excluded: true,
    })),
    notes:
      "Keep workflow inactive until API permissions, consent, privacy/security review, human ownership, error handling, and test approval are complete. Never store API keys in this configuration.",
  };
}
