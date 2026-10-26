import { getIntegrationPlan } from "./integrationPlans";
import {
  getWorkflowContract,
  contractLabels,
  type WorkflowContract,
} from "./workflowContracts";
import {
  automations,
  categories,
  getAutomation,
  industries,
  formatPrice,
} from "./catalog";
export type PublicContent = {
  title: string;
  description: string;
  heading: string;
  body: string;
  noindex?: boolean;
  missing?: boolean;
};
export const escapeHtml = (s: unknown) =>
  String(s).replace(
    /[&<>"']/g,
    c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!
  );
const link = (path: string, label: string) =>
  `<a href="${escapeHtml(path)}">${escapeHtml(label)}</a>`;
const products = (ids: string[]) =>
  `<section class="automation-grid">${ids
    .map(id => {
      const a = getAutomation(id)!;
      return `<article class="automation-card"><div class="card-body"><h2>${link("/automations/" + a.id, a.name)}</h2><p>${escapeHtml(a.description)}</p><p>${escapeHtml(formatPrice(a.price))} · Draft USD test price · Configuration required</p></div></article>`;
    })
    .join("")}</section>`;
export function getPageContent(path: string): PublicContent {
  if (path === "/")
    return {
      title: "Aria Agent Agency | AI Automations for Your Business",
      description:
        "Explore ready-made AI automation kits for front-office, dental, healthcare, sales and support. Configure a workflow yourself or request Aria implementation.",
      heading: "Less busywork. More business.",
      body: `<p>Ready-made AI automations for the work that never stops. Choose a configurable n8n workflow kit or request implementation around your existing approved tools.</p><p>${link("/automations", "Find your AI agent")} · ${link("/implementation", "Implement it for me")} · ${link("/demo", "Try a synthetic-data demo")}</p><h2>Meet your behind-the-scenes team</h2>${products(automations.filter(x => x.popular).map(x => x.id))}<h2>Different industries. One less thing to do.</h2><p>${industries
        .filter(i => i.id !== "all")
        .map(i => link("/industries/" + i.id, i.name))
        .join(
          " · "
        )}</p><h2>Self-service or agency-led</h2><p>Download workflow starters, prompts, synthetic examples, and setup guidance. Production connections require your approved source systems, credentials, policies, and owners. Agency implementation is scoped separately.</p><h2>Human review when it matters</h2><p>Healthcare automations are administrative only. No diagnosis, clinical interpretation, treatment recommendations, or autonomous triage. Public examples are synthetic; checkout uses draft test prices.</p>`,
    };
  if (path === "/automations")
    return {
      title: "AI Automation Library | Ready-Made Kits by Aria",
      description:
        "Find configurable n8n automation kits for front-office, lead qualification, dental practices, hospital administration, customer support and daily operations.",
      heading: "Find your next AI teammate.",
      body: `<p>Browse by task: ${categories.slice(1).map(escapeHtml).join(", ")}. Every kit requires configuration and uses draft USD test pricing.</p>${products(automations.map(x => x.id))}`,
    };
  if (/^\/automations\/[^/]+\/setup$/.test(path)) {
    const item = getAutomation(path.split("/")[2]);
    if (!item)
      return {
        title: "Guide not found | Aria",
        description: "This setup guide is unavailable.",
        heading: "Setup guide not found",
        body: "<p>Browse the available workflow kits.</p>",
        noindex: true,
        missing: true,
      };
    return {
      title: `${item.name} Setup & API Requirements | Aria`,
      description: `Client-owned quick setup for ${item.name}: import the inactive kit, add approved provider credentials in your own vault, and test before activation.`,
      heading: `Set up ${item.name}`,
      body: `<p>Import the inactive workflow kit and run its supplied synthetic example. Enter API credentials directly in your client-owned n8n Credentials vault, never in Aria's form.</p><h2>What your client supplies</h2><ul>${item.requirements.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul><h2>Product-specific provider and API checklist</h2>${getIntegrationPlan(
        item
      )
        .map(
          api =>
            `<section><h3>${escapeHtml(api.label)} — ${api.required ? "Required for the scoped production use" : "Optional"}</h3><p>${escapeHtml(api.purpose)}</p><ul>${api.clientProvides.map(value => `<li>${escapeHtml(value)}</li>`).join("")}</ul><p>Credential destination: ${escapeHtml(api.secretDestination)}</p><ol>${api.steps.map(value => `<li>${escapeHtml(value)}</li>`).join("")}</ol></section>`
        )
        .join(
          ""
        )}<h2>Installation and API connection are separately quoted</h2><p>Ask Aria to contact you for installation, provider API wiring or a managed usage-cost quote. Purchasing a kit does not activate integrations, calls, broadcasts or schedules.</p>`,
    };
  }
  if (/^\/automations\/[^/]+$/.test(path)) {
    const a = getAutomation(path.split("/")[2]);
    if (a)
      return {
        title: `${a.name} | AI Automation Kit by Aria`,
        description: a.description.slice(0, 158),
        heading: a.name,
        body: `<p>${escapeHtml(a.tagline)}</p><p>${escapeHtml(a.description)}</p><h2>Workflow</h2><ol>${a.steps.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ol><h2>Operational contract</h2><dl>${Object.entries(
          getWorkflowContract(a)
        )
          .map(
            ([key, value]) =>
              `<dt>${escapeHtml(contractLabels[key as keyof WorkflowContract])}</dt><dd>${escapeHtml(value)}</dd>`
          )
          .join(
            ""
          )}</dl><h2>Inside your kit</h2><ul>${a.includes.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul><h2>Before you connect it</h2><ul>${a.requirements.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul><p>${escapeHtml(formatPrice(a.price))} · One-time configurable workflow kit · Draft test price. Third-party subscriptions, usage, and implementation are separate.</p><p>${link("/automations/" + a.id + "/setup", "Two-step guide and API checklist")} · ${link("/cart", "Cart and secure test checkout")} · ${link("/implementation?automation=" + a.id, "Request implementation")}</p>`,
      };
  }
  if (path === "/industries")
    return {
      title: "Business AI Automations by Industry | Aria Agency",
      description:
        "Explore Aria automation kits for healthcare, dental clinics, professional services, real estate and retail. Start with one useful business workflow.",
      heading: "Different businesses. Shared busywork.",
      body: industries
        .filter(i => i.id !== "all")
        .map(
          i =>
            `<h2>${link("/industries/" + i.id, i.name)}</h2><p>${escapeHtml(i.description)}</p>`
        )
        .join(""),
    };
  if (/^\/industries\/[^/]+$/.test(path)) {
    const i = industries.find(
      i => i.id === path.split("/")[2] && i.id !== "all"
    );
    if (i)
      return {
        title: `${i.name} AI Automation Kits | Aria Agent Agency`,
        description: i.description,
        heading: `${i.name}. A little less manual.`,
        body: `<p>${escapeHtml(i.description)}</p>${products(automations.filter(a => a.industry === i.id || (i.id === "healthcare" && a.industry === "dental")).map(a => a.id))}<p>${link("/implementation", "Scope an agency implementation")}</p>`,
      };
  }
  if (path === "/locations") {

    return {
      title: "Local AI Business Automations | Indian Cities & Practice Hubs | Aria",
      description:
        "Front-desk AI, WhatsApp lead automation, and appointment agents for clinics, CAs, hospitals, and real estate across Chennai, Bangalore, Mumbai, Hyderabad, Delhi NCR, and Pune.",
      heading: "Local Business Automation by City & Industry",
      body: `<p>Aria provides front-desk AI assistants, 24/7 WhatsApp customer enquiry agents, and automatic appointment booking designed for Indian metro business hubs.</p>
        <section class="locations-directory">
          <h2>Active Service Cities</h2>
          <ul>
            <li>${link("/local/chennai/dental", "Chennai — Dental & Clinic AI Automation")}</li>
            <li>${link("/local/bangalore/accounting", "Bangalore — CA & Tax Practice Automations")}</li>
            <li>${link("/local/mumbai/jewellery", "Mumbai — Jewellery & Retail Showroom AI")}</li>
            <li>${link("/local/hyderabad/hospital", "Hyderabad — Hospital Administration & Patient Booking")}</li>
            <li>${link("/local/delhi-ncr/realestate", "Delhi NCR — Real Estate & Property Enquiry Agent")}</li>
            <li>${link("/local/pune/dental", "Pune — Clinic & Diagnostic Centre Front-Desk")}</li>
          </ul>
        </section>`,
    };
  }
  if (/^\/local\/[^/]+(\/[^/]+)?$/.test(path)) {
    const parts = path.split("/").filter(Boolean);
    const cityKey = parts[1];
    const indKey = parts[2];
    const cityName = cityKey.charAt(0).toUpperCase() + cityKey.slice(1).replace("-", " ");
    const indName = indKey ? indKey.charAt(0).toUpperCase() + indKey.slice(1) : "Business";
    return {
      title: `${cityName} ${indName} AI Automation & WhatsApp Booking | Aria`,
      description: `Custom AI receptionists, WhatsApp lead capture, and automated follow-ups for ${indName} practices in ${cityName}. Local compliance, UPI payments, and fast deployment.`,
      heading: `${cityName} ${indName} Front-Desk AI Automation`,
      body: `<p>Transform your ${indName.toLowerCase()} practice in ${cityName} with 24/7 AI-powered patient booking, instant WhatsApp enquiry handling, and CRM synchronization.</p>
        <h2>Why ${cityName} Businesses Choose Aria</h2>
        <ul>
          <li><strong>Zero Missed Calls & Inquiries:</strong> Immediate AI answers on WhatsApp and phone.</li>
          <li><strong>India & Global Payment Ready:</strong> Support for instant UPI, Cards, and NetBanking via Dodo Payments.</li>
          <li><strong>Fast 48-Hour Installation:</strong> Done-for-you local setup or self-service configuration kits.</li>
        </ul>
        <p>${link("/cart", "Configure Your Automation")} · ${link("/get-started", "Get Started in 2 Minutes")} · ${link("/locations", "View All Service Locations")}</p>`,
    };
  }

  const staticPages: Record<string, PublicContent> = {
    "/voice-setup": {
      title: "Indian Virtual Numbers & Voice Agent Setup | Aria",
      description:
        "Plan Indian voice-agent onboarding, provider KYC, separate number/AI/telephony costs and staff handoff before configuring an Aria voice front desk.",
      heading: "An Indian number. A properly scoped setup.",
      body: "<p>A workflow-kit purchase does not rent an Indian number or activate calls. Your client-owned provider account controls eligibility, KYC, number rental and metered AI/telephony charges.</p><h2>Provider options</h2><p>Sarvam and Bolna offer number/voice-platform onboarding; verify the provider’s current secure setup, compliance requirements, available number types and rate card directly.</p><h2>Know the separate cost layers</h2><p>Budget for number rent, AI-agent minutes, telephony pulses, transfer fees and GST. Promotional number rent is not an all-inclusive AI calling rate.</p><h2>Human approval before live calls</h2><p>Scope language, disclosure, consent/recording policy, supported tools and a reachable human transfer. Healthcare calls remain administrative only.</p>",
    },
    "/implementation": {
      title: "AI Workflow Implementation | Aria Agent Agency",
      description:
        "Tell Aria about your business workflow, current tools and goals. Request a scoped AI automation implementation, integration, testing and team handover.",
      heading: "Tell us where the busywork lives.",
      body: "<p>Request agency-led implementation around your approved business systems. Provide your name, work email, business, industry, selected workflow, existing tools and goals in the implementation form. No charge to submit; delivery and maintenance are quoted separately.</p><h2>Discovery, clear scope, and tested handover</h2><p>We confirm your process, integration feasibility, responsibilities, exclusions, and pricing before production work. Do not provide patient records, passwords, or API keys.</p>",
    },
    "/demo": {
      title: "Synthetic AI Workflow Demo | Aria Agent Agency",
      description:
        "See administrative AI classification and explicit approval gates using fictional data. Explore appointment, no-show, follow-up and diagnostic escalation demos.",
      heading: "A small demo. A clearer picture.",
      body: "<p>Predefined synthetic cases show AI classification paired with explicit rules and human handoffs. No real patient records, external messages, bookings, or live CRM actions.</p><h2>Choose a workflow</h2><p>Enquiry to appointment, no-show recovery, approved discharge follow-up, pending diagnostic staff escalation, inbound lead qualification, and clinical safety boundary. Missing availability and duplicate-event checks stop unsafe actions.</p>",
    },
    "/how-it-works": {
      title: "How AI Automation Implementation Works | Aria",
      description:
        "Start with one practical business workflow. Configure approved tools, test synthetic data and exceptions, then hand over with clear human responsibilities.",
      heading: "The work comes first. The AI follows.",
      body: "<h2>Discover the right starting point</h2><p>Define the trigger, source data, intended action, owner and measurable outcome.</p><h2>Configure your approved tools</h2><p>Use documented APIs, secure credentials, approved content, and human escalation.</p><h2>Test both success and failure paths</h2><p>Use synthetic data to check missing facts, unavailable slots, duplicate events, and provider failures.</p><h2>Approve, hand over and improve</h2><p>Agree scope, client approvals, training, and separately scoped maintenance. No guaranteed ROI or clinical outcomes.</p>",
    },
    "/faq": {
      title: "Automation Kit FAQs and Support | Aria Agency",
      description:
        "Understand Aria automation kit contents, setup requirements, test checkout, third-party costs, healthcare boundaries and agency implementation support.",
      heading: "Good questions. Clear expectations.",
      body: "<h2>What am I buying?</h2><p>A configurable n8n starter kit, not an active business deployment.</p><h2>Can Aria implement it?</h2><p>Implementation is separately scoped around your tools and goals.</p><h2>Are payments live?</h2><p>No. Prices are draft USD test prices. Live pricing and commercial policies must be finalized first.</p><h2>Are tool subscriptions included?</h2><p>Hosting, AI, CRM, calendar and messaging subscriptions/usage are separate.</p><h2>Can healthcare AI give medical advice?</h2><p>No. It is limited to administration and escalates clinical questions to people.</p>",
    },
    "/privacy": {
      title: "Storefront Privacy Information | Aria Agency",
      description:
        "Learn how Aria’s draft storefront handles business inquiry details, account-linked purchases, synthetic demos, session cookies and cart storage.",
      heading: "Your information, handled with purpose.",
      body: "<p>Business implementation requests are stored in the project database and restricted to the authorized administrator. Account-linked purchase records are used for verified kit access. Stripe hosts test checkout; card details are not stored by this application.</p><h2>Synthetic demos</h2><p>No patient records or free-text personal information are accepted by the public demo.</p><h2>Contact</h2><p>Contact Aria at sriraajj@gmail.com about your submitted business details. Organization-specific retention and legal policies must be finalized before live launch.</p>",
    },
    "/terms": {
      title: "Automation Kit Purchase Information | Aria Agency",
      description:
        "Review the draft Aria storefront’s kit scope, test pricing, external costs, verified downloads and commercial policies required before live sales.",
      heading: "Know what’s included. Know what comes next.",
      body: "<p>Kits are inactive configurable starters with workflows, prompts, synthetic examples and setup guidance. Purchase does not connect client systems or activate communications.</p><h2>Draft pricing and exclusions</h2><p>USD prices and Stripe checkout are test-only. Third-party costs and implementation are separate.</p><h2>Before live launch</h2><p>Aria must confirm final pricing, licensing, refunds, support commitments and organization-specific terms. No policies are invented in this draft build.</p>",
    },
    "/cart": {
      title: "Your Automation Cart | Aria Agent Agency",
      description:
        "Review selected automation workflow kits and continue to secure Stripe test checkout. Prices are draft and production integrations require configuration.",
      heading: "Your automation toolkit.",
      body: "<p>Review your selected workflow kits. Secure test checkout requires a signed-in customer account. No active business deployment is included.</p>",
      noindex: true,
    },
    "/login": {
      title: "Sign In or Create Your Account | Aria Agent Agency",
      description:
        "Sign in to your Aria workspace to access purchased automation kits, order records, and subscription plans.",
      heading: "Welcome back.",
      body: "<p>Sign in to access purchased kits, downloads, and your subscription. New here? Creating an account takes a minute.</p>",
      noindex: true,
    },
    "/pricing": {
      title: "Automation Installation & Plans | Aria Agent Agency",
      description:
        "One-time installation plus a monthly plan. Aria builds, installs, and runs your automations so you never lose a contact — whatever business you run.",
      heading: "One-time installation. One monthly plan.",
      body: `<p>We build, connect, and install your automations, then keep everything running for a flat monthly price. ${link("/get-started", "Get started in 2 minutes")} or ${link("/automations", "browse one-time kits")}.</p>`,
    },
    "/get-started": {
      title: "Automate My Business | Aria Agent Agency",
      description:
        "Share your website or answer three quick questions. Aria builds, installs, and runs your automations — you never lose a contact.",
      heading: "Tell us your business. We'll automate the rest.",
      body: `<p>Pick your business type and see exactly what gets automated: enquiries answered in seconds, follow-ups on autopilot, contacts never lost. One-time installation, then a monthly plan.</p><p>${link("/pricing", "See installation pricing")} · ${link("/demo", "Try the interactive demo")}</p>`,
    },
    "/portal": {
      title: "Your Aria Portal | Aria Agent Agency",
      description:
        "Sign in to your Aria portal — installation status, running automations, plan, and website widget all in one place.",
      heading: "Everything automated. Nothing slips.",
      body: "<p>Sign in to open your portal: installation status, running automations, your plan, and your website widget.</p>",
      noindex: true,
    },
    "/growth": {
      title: "Aria Growth Engine | Aria Agent Agency",
      description:
        "Internal sales cockpit: niche lead lists, website research, and the voice, message, and email outreach agents.",
      heading: "Sell the result. Four agents do the legwork.",
      body: "<p>Sign in to open the Growth Engine: lead lists, research, and outreach agents.</p>",
      noindex: true,
    },
    "/orders": {
      title: "My Automation Purchases | Aria Agent Agency",
      description:
        "Sign in to access your private purchase history and verified automation kit downloads.",
      heading: "Your workflows. Ready to make yours.",
      body: "<p>Sign in to your customer account to retrieve your private purchase records and files.</p>",
      noindex: true,
    },
    "/admin": {
      title: "Private Agency Inbox | Aria Agent Agency",
      description:
        "Private administrative implementation-inquiry workspace for the authorized agency owner.",
      heading: "Private agency workspace.",
      body: "<p>Authenticated administrator access is required. Business inquiry records are never included in public page HTML.</p>",
      noindex: true,
    },
  };
  return (
    staticPages[path] || {
      title: "Page Not Found | Aria Agent Agency",
      description:
        "This page is not available. Explore the Aria automation library.",
      heading: "This page took a different route.",
      body: `<p>${link("/automations", "Explore the library")}</p>`,
      noindex: true,
      missing: true,
    }
  );
}
export const publicPaths = [
  "/",
  "/automations",
  ...automations.map(a => "/automations/" + a.id),
  ...automations.map(a => "/automations/" + a.id + "/setup"),
  "/industries",
  ...industries.filter(i => i.id !== "all").map(i => "/industries/" + i.id),
  "/implementation",
  "/demo",
  "/voice-setup",
  "/how-it-works",
  "/faq",
  "/privacy",
  "/terms",
  "/pricing",
  "/get-started",
  "/locations",
  "/local/chennai/dental",
  "/local/bangalore/accounting",
  "/local/mumbai/jewellery",
  "/local/hyderabad/hospital",
  "/local/delhi-ncr/realestate",
  "/local/pune/dental",
];
