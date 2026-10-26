/**
 * Aria Growth Engine — the machine that sells Aria itself.
 *
 * Four agents work a niche lead list:
 *   1. LEAD GENERATION AGENT — gathers businesses per niche, researches their
 *      website, scores the opportunity, and picks the pitch angle.
 *   2. VOICE AGENT — personalised call scripts with objection handling.
 *   3. MESSAGE AGENT — WhatsApp / SMS openers and follow-ups.
 *   4. EMAIL AGENT — a 3-touch personalised email sequence.
 *
 * The commercial offer is always the same shape:
 *   one-time installation + small monthly, and we build the client's
 *   website FREE when they subscribe to the automation.
 */

/* ------------------------------- Niches --------------------------------- */

export type NicheObjection = {
  objection: string;
  response: string;
};

export type Niche = {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  /** The result-first headline for this niche (what the client buys). */
  resultHeadline: string;
  /** Where leads come from — used by the lead-gen playbook and research notes. */
  sources: string[];
  /** Researched pain points, stated with numbers where possible. */
  painPoints: string[];
  /** The pitch the agents lead with, per niche. */
  pitch: string;
  /** Extra angle when the prospect has NO website at all. */
  noWebsiteAngle: string;
  /** Extra angle when the prospect has a website WITHOUT automation. */
  staticWebsiteAngle: string;
  /** Extra angle when the prospect already runs some chat/automation. */
  automatedWebsiteAngle: string;
  /** The ROI math used to justify the monthly fee. */
  roiMath: string;
  /** Typical objections + the comeback lines. */
  objections: NicheObjection[];
  /** Keyword hits on a prospect website that signal EXISTING automation. */
  automationSignals: string[];
  /** Keyword hits that identify the niche on a website. */
  nicheKeywords: string[];
  /** Category id in shared/solutions this niche maps to. */
  categoryId: string;
};

export const NICHES: Niche[] = [
  {
    id: "dental",
    name: "Dental Clinics",
    shortName: "Dental",
    icon: "stethoscope",
    color: "teal",
    resultHeadline: "You never lose a patient enquiry.",
    sources: [
      "Google Maps — 'dentist in <city>'",
      "Practo / Justdial listings without websites",
      "Instagram clinic pages (bio link checks)",
      "Dental council / association directories",
    ],
    painPoints: [
      "Front desk misses calls while the chair is busy — industry studies put missed-call rates at 25-35% for small clinics.",
      "Enquiries arriving on WhatsApp after 8 PM are answered (at best) the next morning — patients book whoever replies first.",
      "No-shows quietly burn 10-20% of the appointment book; reminders are a manual chore.",
      "Post-treatment follow-ups and review requests simply don't happen, so happy patients never become public reviews.",
    ],
    pitch:
      "Aria is a front-desk automation for dental clinics. Every enquiry on WhatsApp, your website, or the phone gets an instant, helpful reply — treatments, timings, fee ranges — from YOUR approved information. Appointments are confirmed against your calendar, no-shows get automatic rescue, and every visit ends with a follow-up and a review request. We install everything for you; you watch it from one portal.",
    noWebsiteAngle:
      "You don't even have a website yet — perfect. We build you a clean, modern clinic website FREE when you subscribe, and the automation runs inside it from day one. You get the shop window and the front desk in one move.",
    staticWebsiteAngle:
      "Your website works as a brochure, but it doesn't answer anybody. We keep your site, embed the Aria assistant in it, and connect WhatsApp — the site starts booking patients instead of just showing your address.",
    automatedWebsiteAngle:
      "You already have some automation — good instinct. Aria replaces the patchwork with one installed system: instant replies, calendar-confirmed bookings, no-show rescue, follow-ups, reviews — and one portal to see it all. We also rebuild or refresh your website free as part of the subscription.",
    roiMath:
      "One implant or aligner case pays for 6-12 months of the plan. One saved enquiry a week covers the monthly fee many times over.",
    objections: [
      {
        objection: "I already have a receptionist.",
        response:
          "Keep them — Aria handles what a receptionist can't: 2 AM WhatsApp messages, the phone while the chair is busy, follow-ups that always slip. They work together.",
      },
      {
        objection: "I'm not technical.",
        response:
          "You don't have to be. We install everything, you approve what it says, and from then on it's just WhatsApp — everything else runs itself.",
      },
      {
        objection: "How much is this?",
        response:
          "One-time installation from $149, then $29 a month on the starter plan. One saved patient a month pays for it several times over — an implant case pays for a year.",
      },
      {
        objection: "Send me some information.",
        response:
          "Happy to — I'll send a one-page summary and a 2-minute demo video now. Can I check back Thursday at 11, or would Friday suit you better?",
      },
    ],
    automationSignals: [
      "booking",
      "appointment",
      "chatbot",
      "whatsapp",
      "calendly",
      "zocdoc",
      "practo",
      "dentalist",
      "automated",
    ],
    nicheKeywords: [
      "dental",
      "dentist",
      "orthodont",
      "implant",
      "braces",
      "root canal",
      "teeth",
      "smile",
      "endodont",
      "periodont",
    ],
    categoryId: "dental",
  },
  {
    id: "gym",
    name: "Gyms & Fitness Studios",
    shortName: "Gyms",
    icon: "dumbbell",
    color: "lime",
    resultHeadline: "You never miss a membership enquiry.",
    sources: [
      "Google Maps — 'gym in <city>'",
      "Instagram fitness studio pages (DM open rates)",
      "ClassPass / FitPass / GymFluencer listings",
      "Local fitness Facebook groups",
    ],
    painPoints: [
      "Membership enquiries arrive in Instagram DMs and WhatsApp at 10 PM — most gyms reply next day, and the prospect has already joined another gym.",
      "Trial sessions are booked manually and half of them never get confirmed or followed up.",
      "Class no-shows and unrenewed memberships are chased by hand — or not at all.",
      "Front-desk staff juggle walk-ins, calls and DMs, so all three get done badly.",
    ],
    pitch:
      "Aria is a membership-desk automation for gyms and studios. Every DM, WhatsApp and website enquiry gets an instant reply — plans, pricing, timings — from your approved info. Trials book into your calendar, reminders cut class no-shows, and renewals and win-back offers go out on autopilot. We install everything; you run the floor.",
    noWebsiteAngle:
      "Most gyms run on Instagram alone — you're losing everyone who doesn't use Instagram. We build you a proper website FREE with your subscription, with trial booking and instant enquiry replies built in from day one.",
    staticWebsiteAngle:
      "Your website shows plans but doesn't sell. We embed the Aria assistant so it answers plan and pricing questions instantly, books trials, and chases every enquiry — your site becomes a 24/7 membership desk.",
    automatedWebsiteAngle:
      "You've already automated pieces — good. Aria unifies it: instant replies across DMs, WhatsApp and web, trial booking, no-show rescue, renewal sequences, win-backs — one portal, one number to watch.",
    roiMath:
      "One membership saved per month covers the plan 4-8 times over. A single win-back campaign usually returns the whole year's fee.",
    objections: [
      {
        objection: "Instagram DMs work fine for us.",
        response:
          "Until 10 PM when nobody's on the desk — that's exactly when enquiries go cold. Aria answers in seconds, any hour, and books the trial while they're motivated.",
      },
      {
        objection: "We're a small team, we manage.",
        response:
          "That's exactly who this is for. One-time install, small monthly, and the enquiries, reminders and renewals stop eating your day.",
      },
      {
        objection: "How much is this?",
        response:
          "Installation starts at $149 one-time, plans from $29/month. One saved membership a month covers it 4-8 times over.",
      },
      {
        objection: "We tried a chatbot before, it was useless.",
        response:
          "Generic bots are — Aria is installed for you on YOUR plans, timings and offers, with human handoff when it's out of depth. And we tune it with you for 30 days after go-live.",
      },
    ],
    automationSignals: [
      "booking",
      "class schedule",
      "membership",
      "trial",
      "chatbot",
      "whatsapp",
      "calendly",
      "mindbody",
      "fitpass",
    ],
    nicheKeywords: [
      "gym",
      "fitness",
      "crossfit",
      "strength",
      "personal training",
      "trainer",
      "zumba",
      "yoga",
      "membership",
      "martial arts",
      "mma",
      "kickboxing",
      "pilates",
    ],
    categoryId: "local-services",
  },
];

export const getNiche = (id: string): Niche | undefined =>
  NICHES.find(niche => niche.id === id);

/* --------------------------- Website research ---------------------------- */

export type SiteAssessment = {
  reachable: boolean;
  hasWebsite: boolean;
  /** True when a website address exists but our fetch was blocked/failed — verify manually. */
  fetchBlocked?: boolean;
  businessName: string | null;
  title: string | null;
  description: string | null;
  /** Detected niche keywords on the site. */
  nicheMatches: string[];
  /** Automation / booking signals found on the site. */
  automationHits: string[];
  hasChatWidget: boolean;
  hasBooking: boolean;
  hasWhatsApp: boolean;
  hasSocials: boolean;
  hasContactForm: boolean;
  looksModern: boolean;
  mobileFriendlyHint: boolean;
  siteQuality: "none" | "poor" | "decent" | "good";
  automationLevel: "none" | "partial" | "full";
  opportunityScore: number; // 0-100
  priority: "hot" | "warm" | "cold";
  pitchAngle: string;
  gaps: string[];
  notes: string;
};

const MODERN_HINTS = [
  "framer",
  "next.js",
  "nextjs",
  "tailwind",
  "webflow",
  "react",
  "wix studio",
];

const CHAT_WIDGET_HINTS = [
  "tawk.to",
  "intercom",
  "crisp.chat",
  "livechat",
  "drift",
  "tidio",
  "freshchat",
  "chatbot",
  "zendesk",
  "hubspot",
  "messenger customer chat",
  "fb-customerchat",
  "wf-chat",
];

const BOOKING_HINTS = [
  "book now",
  "book online",
  "book appointment",
  "book a",
  "schedule appointment",
  "reserve",
  "calendly",
  "zocdoc",
  "practo",
  "mindbody",
  "setmore",
  "simplybook",
  "acuity",
  "appointment scheduling",
];

/**
 * Scores fetched website HTML into a lead assessment. Pure function so it is
 * unit-testable; the server feeds it extracted site text.
 */
export function assessProspectSite(input: {
  reachable: boolean;
  title?: string | null;
  description?: string | null;
  text?: string | null;
  html?: string | null;
}): SiteAssessment {
  const html = (input.html ?? "").toLowerCase();
  const text = `${input.title ?? ""} ${input.description ?? ""} ${input.text ?? ""}`
    .toLowerCase()
    .replace(/\s+/g, " ");
  const haystack = ` ${text.replace(/[^a-z0-9]+/g, " ")} `;
  const rawHaystack = ` ${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")} `;

  const hasWebsite = input.reachable && (text.trim().length > 40 || html.length > 500);
  const nicheMatches: string[] = [];
  let nicheScore = 0;
  for (const niche of NICHES) {
    for (const keyword of niche.nicheKeywords) {
      if (haystack.includes(` ${keyword}`)) {
        if (!nicheMatches.includes(keyword)) nicheMatches.push(keyword);
        nicheScore += keyword.includes(" ") ? 2 : 1;
      }
    }
  }

  const automationHits: string[] = [];
  let automationScore = 0;
  const allAutomationHints = [
    ...CHAT_WIDGET_HINTS,
    ...BOOKING_HINTS,
    "whatsapp.com/whatsapp",
    "wa.me",
    "api.whatsapp.com",
  ];
  for (const hint of allAutomationHints) {
    if (rawHaystack.includes(hint) || haystack.includes(` ${hint}`)) {
      if (!automationHits.includes(hint)) automationHits.push(hint);
      automationScore += 1;
    }
  }

  const hasChatWidget = CHAT_WIDGET_HINTS.some(hint =>
    rawHaystack.includes(hint)
  );
  const hasBooking = BOOKING_HINTS.some(hint => rawHaystack.includes(hint));
  const hasWhatsApp =
    rawHaystack.includes("wa.me") ||
    rawHaystack.includes("api.whatsapp.com") ||
    rawHaystack.includes("whatsapp");
  const hasSocials =
    rawHaystack.includes("instagram.com") ||
    rawHaystack.includes("facebook.com");
  const hasContactForm =
    rawHaystack.includes("<form") ||
    rawHaystack.includes("typeform") ||
    rawHaystack.includes("google forms") ||
    text.includes("enquiry form") ||
    text.includes("contact form");
  const looksModern = MODERN_HINTS.some(hint => rawHaystack.includes(hint));
  const mobileFriendlyHint =
    rawHaystack.includes("viewport") && rawHaystack.includes("width=device-width");

  const siteQuality: SiteAssessment["siteQuality"] = !hasWebsite
    ? "none"
    : text.length < 600 && !looksModern
      ? "poor"
      : looksModern && text.length > 1500
        ? "good"
        : "decent";

  const automationLevel: SiteAssessment["automationLevel"] = !hasWebsite
    ? "none"
    : automationScore >= 4 && (hasChatWidget || hasBooking)
      ? "full"
      : automationScore >= 2 || hasWhatsApp
        ? "partial"
        : "none";

  // Opportunity scoring: highest for no automation, next for static sites,
  // lower (but real) for refresh/better pitches on automated sites.
  let opportunityScore = 0;
  if (!hasWebsite) {
    opportunityScore = 88; // free website + automation bundle
  } else {
    const qualityPenalty =
      siteQuality === "poor" ? 22 : siteQuality === "decent" ? 10 : 0;
    const automationPenalty =
      automationLevel === "none"
        ? 0
        : automationLevel === "partial"
          ? 18
          : 34;
    opportunityScore = Math.max(
      18,
      84 - qualityPenalty - automationPenalty + (hasBooking ? 0 : 6)
    );
  }
  if (nicheScore === 0 && hasWebsite) opportunityScore -= 10;
  opportunityScore = Math.max(5, Math.min(98, opportunityScore));

  const priority: SiteAssessment["priority"] =
    opportunityScore >= 75 ? "hot" : opportunityScore >= 55 ? "warm" : "cold";

  const gaps: string[] = [];
  if (!hasWebsite) gaps.push("No website at all — runs on social/word of mouth only");
  if (hasWebsite && !hasBooking) gaps.push("No online booking — appointments handled by phone only");
  if (hasWebsite && !hasChatWidget) gaps.push("No chat assistant — website can't answer questions");
  if (!hasWhatsApp) gaps.push("No WhatsApp channel wired in");
  if (hasWebsite && siteQuality === "poor") gaps.push("Thin, dated website content");
  if (hasWebsite && !mobileFriendlyHint) gaps.push("Website likely not mobile-optimised");
  if (!hasContactForm && hasWebsite) gaps.push("No enquiry capture form");

  let pitchAngle: string;
  if (!hasWebsite) {
    pitchAngle = "FREE website + automation bundle";
  } else if (automationLevel === "none") {
    pitchAngle = siteQuality === "good" ? "Embed assistant on good site" : "Activate static website";
  } else if (automationLevel === "partial") {
    pitchAngle = "Replace patchwork with one system";
  } else {
    pitchAngle = "Upgrade / consolidate + free site refresh";
  }

  const notes = hasWebsite
    ? `Site reachable. Quality ${siteQuality}, automation ${automationLevel}. Signals: ${
        automationHits.length ? automationHits.slice(0, 5).join(", ") : "none detected"
      }.`
    : "Website unreachable or missing — verify domain; if confirmed absent, this is the free-website bundle pitch.";

  return {
    reachable: input.reachable,
    hasWebsite,
    businessName: input.title ? input.title.slice(0, 120) : null,
    title: input.title ?? null,
    description: input.description ?? null,
    nicheMatches: nicheMatches.slice(0, 8),
    automationHits: automationHits.slice(0, 8),
    hasChatWidget,
    hasBooking,
    hasWhatsApp,
    hasSocials,
    hasContactForm,
    looksModern,
    mobileFriendlyHint,
    siteQuality,
    automationLevel,
    opportunityScore,
    priority,
    pitchAngle,
    gaps,
    notes,
  };
}

/* ------------------------------ The offer -------------------------------- */

export const WEBSITE_OFFER = {
  headline: "Free website, built by us, when you subscribe",
  body: "Subscribe to any Aria automation plan and we design, build and launch your business website at no charge — the Aria assistant is embedded in it from day one. You keep the site even if you ever cancel.",
  bullets: [
    "Up to 5 pages, mobile-first, your branding",
    "Enquiry forms + WhatsApp click-to-chat wired in",
    "The Aria assistant embedded from day one",
    "Hosting guidance and launch included",
  ],
};

/* ---------------------------- Agent sequences ---------------------------- */

export type TemplateVars = Record<string, string>;

/** Replaces {{token}} placeholders; unknown tokens resolve to "". */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) =>
    vars[key] !== undefined ? vars[key] : ""
  );
}

/* ------------------------------ Voice agent ------------------------------ */

export type VoiceScript = {
  opener: string;
  hook: string;
  pitch: string;
  discovery: string[];
  objections: NicheObjection[];
  close: string;
};

export function buildVoiceScript(
  niche: Niche,
  vars: TemplateVars,
  pitchAngle: string
): VoiceScript {
  const freeWebsite = pitchAngle.startsWith("FREE website");
  const ownerGreeting = vars.ownerName && vars.ownerName !== "there"
    ? `Hi ${vars.ownerName},`
    : "Hi, am I speaking with the owner?";
  const openerAngle = freeWebsite
    ? `I work with ${niche.name.toLowerCase()} like {{business}} — we build them a proper website and a front desk that answers every enquiry, even at 10 PM.`
    : `I work with ${niche.name.toLowerCase()} like {{business}} — we make sure no enquiry ever goes unanswered: WhatsApp, website, after hours, all of it.`;
  return {
    opener: renderTemplate(
      `${ownerGreeting} I'm calling from Aria — I'll be very quick. I looked up {{business}} and {{openerObservation}} Did I catch you at an okay time?`,
      {
        ...vars,
        openerObservation:
          pitchAngle.startsWith("FREE website")
            ? "I noticed you're not online yet, which is exactly why I called."
            : "I had a quick look at your website first.",
      }
    ),
    hook: renderTemplate(
      `${openerAngle} ${niche.painPoints[0]}`,
      vars
    ),
    pitch: renderTemplate(niche.pitch, vars),
    discovery: [
      "How do most new enquiries reach you today — WhatsApp, calls, Instagram?",
      "Who answers them when you're busy or after hours?",
      "What happens to an enquiry that comes in at 9 PM?",
      "Roughly how many no-shows or cold enquiries would you guess you lose a week?",
    ],
    objections: niche.objections,
    close: renderTemplate(
      `Here's what I'd suggest: a 15-minute walkthrough where I show ${niche.shortName.toLowerCase()} exactly how {{business}} would run with Aria installed — the replies, the bookings, the follow-ups, on your real information. And if you subscribe, the website is on us. Does Thursday work, or is Friday easier?`,
      vars
    ),
  };
}

/* ----------------------------- Message agent ----------------------------- */

export const WHATSAPP_TEMPLATES = [
  {
    id: "intro",
    label: "First touch",
    body:
      "Hi {{ownerName}} — Aria here. I looked at {{business}} and had one quick idea: right now, enquiries that arrive while you're busy (or after 9 PM) get answered late — and those are the customers who book elsewhere. We install an assistant that answers every WhatsApp and website enquiry instantly, books the appointment, and follows up automatically. One-time install + small monthly, and we build your website free with the subscription. Worth a 15-minute look? I can show you on your own business details.",
  },
  {
    id: "followup",
    label: "Follow-up (day 3)",
    body:
      "Hi {{ownerName}}, following up on my message about {{business}}. One number: clinics and studios typically lose 25-35% of enquiries simply because nobody replied in time. Aria fixes exactly that — installed for you, running in days. Still happy to send the 2-minute demo video — just say 'send it'.",
  },
  {
    id: "breakup",
    label: "Break-up (day 9)",
    body:
      "Hi {{ownerName}} — last note from me, promise. If missed enquiries and follow-ups aren't a pain at {{business}} right now, ignore me with a good conscience. If they are: the offer stands — automation installed for you, website built free with the subscription. One message is all it takes to see it demoed on your own details.",
  },
];

export const SMS_TEMPLATE =
  "Hi {{ownerName}}, Aria here. Quick idea for {{business}}: we install automation that answers every enquiry in seconds (WhatsApp + website), books appointments, and follows up — one-time install + small monthly, website built free with subscription. 15-min demo this week? Reply YES and I'll send times.";

/* ------------------------------ Email agent ------------------------------ */

export type EmailTemplate = {
  day: number;
  subject: string;
  body: string;
};

export function buildEmailSequence(
  niche: Niche,
  vars: TemplateVars,
  pitchAngle: string
): EmailTemplate[] {
  const freeSite = pitchAngle.startsWith("FREE website");
  const email1 = freeSite
    ? `Hi {{ownerName}},

I came across {{business}} while mapping ${niche.shortName.toLowerCase()} in {{city}} — and noticed you don't have a website yet. That's usually not a choice, it's a time problem.

Here's what we do at Aria: subscribe to an automation plan and we build your website free — and it's not a brochure. The assistant we install answers every enquiry on WhatsApp and the site in seconds, books appointments, and follows up automatically. You never lose a contact.

One-time installation, small monthly. One saved customer a month covers it several times over.

Worth 15 minutes this week? I'll demo it on ${niche.shortName.toLowerCase()} — your information, not a generic demo.

— {{agentName}}, Aria`
    : `Hi {{ownerName}},

I looked at ${"{{business}}"}'s website this morning — solid. But I noticed it doesn't answer anyone: an enquiry at 9 PM waits until morning, and that's exactly when people book whoever replied first.

Aria installs a front-desk automation for ${niche.shortName.toLowerCase()}: instant replies on WhatsApp and your website, bookings confirmed against your calendar, no-show rescue, and follow-ups that actually happen. Installed for you in days.

One-time installation + small monthly. ${niche.roiMath}

Worth 15 minutes this week? I'll show you exactly how it would run on your site.

— {{agentName}}, Aria`;

  const email2 = `Hi {{ownerName}},

Three days ago I wrote about ${niche.shortName.toLowerCase()} losing enquiries to slow replies. Here is the pattern we would test for {{business}}: answer the first enquiry quickly, confirm only source-approved availability, and queue the follow-up for a person when the facts are missing.

The improvement is not guaranteed; it depends on your current volume, response time, and process. We can map the baseline and show the exact handoffs in 15 minutes.

— {{agentName}}, Aria`;

  const email3 = `Hi {{ownerName}},

Last note from me — I don't want to crowd your inbox.

The offer, in one line: we install the automation (replies in seconds, bookings, reminders, follow-ups) and build ${freeSite ? "your first website" : "your website refresh"} free with the subscription. One-time install, small monthly, cancel anytime.

If missed enquiries aren't a problem at {{business}}, that's genuinely fine. If they are — one reply is all it takes and I'll demo it on your details this week.

— {{agentName}}, Aria`;

  return [
    { day: 0, subject: renderTemplate(`Quick idea for {{business}} — the 9 PM enquiry problem`, vars), body: renderTemplate(email1, vars) },
    { day: 3, subject: renderTemplate(`What happened when the replies stopped being late`, vars), body: renderTemplate(email2, vars) },
    { day: 7, subject: renderTemplate(`One line, then I'll leave you alone`, vars), body: renderTemplate(email3, vars) },
  ];
}

/* --------------------------- Pipeline statuses --------------------------- */

export const LEAD_STATUSES = [
  "new",
  "researched",
  "contacted",
  "replied",
  "booked",
  "won",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  researched: "Researched",
  contacted: "Contacted",
  replied: "Replied",
  booked: "Demo booked",
  won: "Won",
  lost: "Lost",
};

export const AGENT_CHANNELS = ["call", "whatsapp", "sms", "email"] as const;
export type AgentChannel = (typeof AGENT_CHANNELS)[number];

export const AGENTS = [
  { id: "leadgen", name: "Lead Generation Agent", icon: "radar" },
  { id: "voice", name: "Voice Agent", icon: "phone-call" },
  { id: "message", name: "Message Agent", icon: "message-circle" },
  { id: "email", name: "Email Agent", icon: "mail" },
] as const;

export type AgentId = (typeof AGENTS)[number]["id"];

export const OUTCOME_BY_CHANNEL: Record<AgentChannel, string[]> = {
  call: ["no_answer", "busy", "callback_requested", "interested", "booked", "not_interested"],
  whatsapp: ["sent", "read", "replied", "interested", "not_interested"],
  sms: ["sent", "replied", "interested", "not_interested"],
  email: ["sent", "opened", "replied", "interested", "bounced"],
};
