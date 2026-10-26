/**
 * Result-first business categories.
 *
 * Aria does not sell "workflows" — it sells the outcome: whatever business
 * you run, nothing slips. Each category below describes the RESULT the
 * client buys, what exactly gets automated during installation, and which
 * existing automation kits power it.
 */

export type WhatGetsAutomated = {
  title: string;
  detail: string;
};

export type BusinessCategory = {
  id: string;
  name: string;
  /** Lucide icon name, mapped to a component in the client. */
  icon: string;
  color: string;
  /** The outcome, stated as a promise. */
  resultHeadline: string;
  resultBody: string;
  promises: string[];
  whatGetsAutomated: WhatGetsAutomated[];
  /** Automation kit ids from shared/catalog that power this category. */
  kits: string[];
  /** Keywords used to score a client website during onboarding. */
  websiteKeywords: string[];
};

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  {
    id: "clinics",
    name: "Healthcare & Clinics",
    icon: "hospital",
    color: "teal",
    resultHeadline: "You never lose a patient.",
    resultBody:
      "Every enquiry gets an instant, helpful reply. Every appointment gets confirmed. No patient falls through the cracks after a visit — even at 2 AM, even when your front desk is busy. Administrative work runs itself; your team provides the care.",
    promises: [
      "Every enquiry answered in under 60 seconds",
      "Reminders that quietly cut no-shows",
      "Follow-ups that bring patients back",
    ],
    whatGetsAutomated: [
      {
        title: "Instant enquiry replies",
        detail:
          "WhatsApp, website, and call intake answered instantly from your approved service, doctor, timing, and pricing information.",
      },
      {
        title: "Appointment booking & confirmation",
        detail:
          "Slots checked against your calendar, confirmations sent, and your staff notified with full context.",
      },
      {
        title: "No-show rescue",
        detail:
          "Automatic reminders and reschedule offers before an empty slot goes to waste.",
      },
      {
        title: "Visit follow-up",
        detail:
          "Post-visit check-ins and review requests sent on your schedule, reviewed by your team first.",
      },
      {
        title: "Human handoff, built in",
        detail:
          "Anything sensitive or clinical is routed to your staff with the complete conversation attached.",
      },
    ],
    kits: ["hospital-lifecycle", "universal-replier"],
    websiteKeywords: [
      "hospital",
      "clinic",
      "patient",
      "doctor",
      "physician",
      "medical",
      "healthcare",
      "diagnostic",
      "surgery",
      "multispeciality",
      "opd",
      "pharmacy",
    ],
  },
  {
    id: "dental",
    name: "Dental Clinics",
    icon: "stethoscope",
    color: "blue",
    resultHeadline: "You never lose a patient enquiry.",
    resultBody:
      "Your chair never waits for the phone to stop ringing. Enquiries are answered while you work, appointments are confirmed on their own, and every visit ends with a follow-up and a review request — without anyone on your team remembering to do it.",
    promises: [
      "Enquiries answered while your chair is busy",
      "Fewer no-shows with automatic reminders",
      "Every visit followed up, every review requested",
    ],
    whatGetsAutomated: [
      {
        title: "Patient enquiry intake",
        detail:
          "Treatments, fees range, timings, and location questions answered instantly on WhatsApp and your website.",
      },
      {
        title: "Appointment coordination",
        detail:
          "Requests confirmed against your calendar and handed to your front desk with details validated.",
      },
      {
        title: "No-show follow-up",
        detail:
          "Missed appointments get a polite reschedule sequence automatically.",
      },
      {
        title: "Service recovery & reviews",
        detail:
          "Feedback collected after treatment and unhappy patients routed to you before they become public reviews.",
      },
    ],
    kits: ["dental-desk", "reputation-care"],
    websiteKeywords: [
      "dental",
      "dentist",
      "orthodont",
      "teeth",
      "tooth",
      "implant",
      "braces",
      "root canal",
      "smile",
      "endodont",
      "periodont",
    ],
  },
  {
    id: "professional",
    name: "Professional Services",
    icon: "briefcase",
    color: "violet",
    resultHeadline: "You never lose a client enquiry.",
    resultBody:
      "Whether you run a CA firm, law practice, consultancy, or agency — every enquiry is qualified and routed in minutes, deadlines chase themselves, and clients always know where things stand. Your expertise stays on billable work.",
    promises: [
      "Every enquiry qualified and routed in minutes",
      "Deadlines and follow-ups never slip",
      "Clients always know where things stand",
    ],
    whatGetsAutomated: [
      {
        title: "Enquiry intake & qualification",
        detail:
          "New leads captured from every channel, qualified with your criteria, and routed to the right person.",
      },
      {
        title: "Follow-up sequences",
        detail:
          "Polite, persistent follow-up until the prospect says yes or no — no lead left cold.",
      },
      {
        title: "Documents & deadline reminders",
        detail:
          "Clients reminded before due dates; escalations raised to partners automatically.",
      },
      {
        title: "Status & invoice updates",
        detail:
          "Routine client questions about documents, invoices, and status answered from your systems.",
      },
      {
        title: "Daily operations brief",
        detail:
          "A single morning summary of what needs attention — exceptions first.",
      },
    ],
    kits: ["front-office", "ca-practice", "lead-engine"],
    websiteKeywords: [
      "chartered accountant",
      "ca firm",
      "advocate",
      "lawyer",
      "attorney",
      "law firm",
      "consulting",
      "consultancy",
      "audit",
      "tax",
      "gst",
      "compliance",
      "agency",
      "advisory",
    ],
  },
  {
    id: "realestate",
    name: "Real Estate",
    icon: "building",
    color: "amber",
    resultHeadline: "You never lose a property enquiry.",
    resultBody:
      "Property buyers and renters get answers in seconds — project details, pricing ranges, availability — and are qualified before a broker ever picks up the phone. Viewings land in the calendar. Follow-up continues until they buy or say no.",
    promises: [
      "Every property enquiry answered instantly",
      "Buyers qualified before your brokers call",
      "Site visits booked straight into the calendar",
    ],
    whatGetsAutomated: [
      {
        title: "Property enquiry replies",
        detail:
          "Questions about projects, pricing, and availability answered instantly with your approved details.",
      },
      {
        title: "Lead qualification",
        detail:
          "Budget, location, and timeline captured automatically so brokers only call serious buyers.",
      },
      {
        title: "Viewing scheduling",
        detail:
          "Site visits coordinated and confirmed, with broker handoff including the full enquiry history.",
      },
      {
        title: "Follow-up guard",
        detail:
          "Every enquiry followed up on a schedule until a decision is reached.",
      },
    ],
    kits: ["property-enquiries", "realestate-lead-desk"],
    websiteKeywords: [
      "real estate",
      "property",
      "properties",
      "flats",
      "apartments",
      "plots",
      "builder",
      "realtor",
      "broker",
      "villa",
      "bhk",
      "housing",
      "rental",
    ],
  },
  {
    id: "retail",
    name: "Retail & E-commerce",
    icon: "shopping-bag",
    color: "pink",
    resultHeadline: "You never lose a customer.",
    resultBody:
      "Product questions answered around the clock, order and delivery updates without a single phone call to your team, and abandoned carts gently brought back. Your store sells; the busywork handles itself.",
    promises: [
      "Product questions answered 24/7",
      "Order and return updates without phone calls",
      "Abandoned carts brought back to life",
    ],
    whatGetsAutomated: [
      {
        title: "Pre-sales questions",
        detail:
          "Sizing, availability, pricing, and delivery questions answered instantly on chat and WhatsApp.",
      },
      {
        title: "Order & support intake",
        detail:
          "Where-is-my-order, returns, and exchanges triaged with clear handoffs to your team when needed.",
      },
      {
        title: "Cart & checkout recovery",
        detail:
          "Friendly reminders bring shoppers back to complete their purchase.",
      },
      {
        title: "Post-purchase follow-up",
        detail:
          "Review requests and reorder nudges sent at the right moments.",
      },
    ],
    kits: ["support-assistant", "universal-replier"],
    websiteKeywords: [
      "shop",
      "store",
      "ecommerce",
      "e-commerce",
      "boutique",
      "fashion",
      "clothing",
      "electronics",
      "grocery",
      "supermarket",
      "retail",
      "furniture",
    ],
  },
  {
    id: "jewellery",
    name: "Jewellery & Gold Showrooms",
    icon: "gem",
    color: "yellow",
    resultHeadline: "You never miss a showroom visit.",
    resultBody:
      "Today's verified rates are published automatically, every rate enquiry gets answered with today's price, and scheme dues or showroom visits are followed up politely. Your showroom's reputation for being on top of things builds itself.",
    promises: [
      "Today's verified gold rates, published automatically",
      "Every rate enquiry answered with today's price",
      "Scheme dues and visits followed up politely",
    ],
    whatGetsAutomated: [
      {
        title: "Daily rate publishing",
        detail:
          "Verified rates published to your channels every morning without anyone lifting a finger.",
      },
      {
        title: "Rate & scheme enquiries",
        detail:
          "Customers asking today's rate or scheme details get instant, accurate answers.",
      },
      {
        title: "Estimate slips",
        detail:
          "Estimate requests captured, prepared, and handed to your showroom staff.",
      },
      {
        title: "Scheme reminders & visits",
        detail:
          "Due-date reminders and showroom visit coordination handled on autopilot.",
      },
    ],
    kits: ["gold-showroom"],
    websiteKeywords: [
      "jewellery",
      "jewelry",
      "gold",
      "silver",
      "diamond",
      "showroom",
      "ornaments",
      "necklace",
      "bullion",
      "gems",
    ],
  },
  {
    id: "local-services",
    name: "Salons, Gyms & Local Services",
    icon: "scissors",
    color: "rose",
    resultHeadline: "You never miss a booking.",
    resultBody:
      "Bookings are confirmed while you're mid-job, reminders quietly cut your no-shows, and every finished service is followed by a thank-you and a review request. Your calendar stays full without the admin.",
    promises: [
      "Bookings confirmed while you work",
      "Reminders that cut no-shows",
      "Reviews requested at exactly the right moment",
    ],
    whatGetsAutomated: [
      {
        title: "Booking intake",
        detail:
          "Services, pricing, and slot questions answered and bookings captured on WhatsApp and your website.",
      },
      {
        title: "Confirmations & reminders",
        detail:
          "Every appointment confirmed and reminded, dramatically fewer no-shows.",
      },
      {
        title: "Follow-ups & reviews",
        detail:
          "Post-service follow-up and review requests sent automatically.",
      },
      {
        title: "Opt-in offers",
        detail:
          "Slow-day offers broadcast to customers who asked to hear from you.",
      },
    ],
    kits: ["universal-replier", "reputation-care"],
    websiteKeywords: [
      "salon",
      "spa",
      "gym",
      "fitness",
      "yoga",
      "studio",
      "barber",
      "beauty",
      "parlour",
      "parlor",
      "cleaning",
      "plumber",
      "electrician",
      "repair",
      "tailor",
      "grooming",
      "pet care",
    ],
  },
  {
    id: "food",
    name: "Restaurants & Cafés",
    icon: "utensils",
    color: "orange",
    resultHeadline: "You never miss an order or a table.",
    resultBody:
      "Reservations book themselves, menu and timing questions are answered instantly, and every guest leaves with a follow-up that brings them back. Your kitchen stays busy; your phone stops interrupting service.",
    promises: [
      "Reservations handled automatically",
      "Menu questions answered instantly",
      "Guests return with timely follow-up offers",
    ],
    whatGetsAutomated: [
      {
        title: "Table reservations",
        detail:
          "Booking requests confirmed against your floor plan and peak hours.",
      },
      {
        title: "Menu & timing questions",
        detail:
          "Dishes, today's specials, hours, and location answered instantly.",
      },
      {
        title: "Takeaway order intake",
        detail:
          "Orders captured cleanly and handed to your kitchen or POS flow.",
      },
      {
        title: "Guest follow-up",
        detail:
          "Feedback collected and return-visit offers sent to opted-in guests.",
      },
    ],
    kits: ["universal-replier"],
    websiteKeywords: [
      "restaurant",
      "cafe",
      "café",
      "bakery",
      "dining",
      "pizzeria",
      "kitchen",
      "biryani",
      "tiffin",
      "catering",
      "sweets",
      "food",
    ],
  },
  {
    id: "education",
    name: "Coaching & Education",
    icon: "graduation-cap",
    color: "indigo",
    resultHeadline: "You never lose an admission enquiry.",
    resultBody:
      "Parents get instant answers about fees, batches, and syllabus at any hour. Every enquiry is followed up until the student enrolls or declines. Class reminders keep attendance high and parents informed.",
    promises: [
      "Parent enquiries answered instantly, any hour",
      "Every lead followed up until they enroll",
      "Batch reminders keep attendance high",
    ],
    whatGetsAutomated: [
      {
        title: "Admission enquiry replies",
        detail:
          "Fees, batches, syllabus, and admission steps answered instantly from your approved content.",
      },
      {
        title: "Lead follow-up sequences",
        detail:
          "Every enquiry nurtured on a schedule until a decision is made.",
      },
      {
        title: "Class & batch reminders",
        detail:
          "Schedules, tests, and fee dues communicated automatically.",
      },
      {
        title: "Parent updates",
        detail:
          "Attendance and progress notes routed to parents with staff review.",
      },
    ],
    kits: ["lead-engine", "universal-replier"],
    websiteKeywords: [
      "school",
      "academy",
      "coaching",
      "tuition",
      "classes",
      "training",
      "institute",
      "course",
      "college",
      "learning",
      "preschool",
      "daycare",
      "edtech",
    ],
  },
  {
    id: "any",
    name: "Any Other Business",
    icon: "sparkles",
    color: "lime",
    resultHeadline: "You never lose a contact.",
    resultBody:
      "Whatever you run, the pattern is the same: enquiries must be answered, follow-ups must happen, and nothing should slip through. That is exactly what we build, install, and run for you — tailored to how your business actually works.",
    promises: [
      "Every enquiry gets a reply in seconds",
      "Every contact gets followed up",
      "Everything visible in one portal",
    ],
    whatGetsAutomated: [
      {
        title: "Universal enquiry intake",
        detail:
          "Every message from every channel captured, understood, and answered in your business's voice.",
      },
      {
        title: "Lead capture & qualification",
        detail:
          "Contact details saved and qualified automatically — you never lose a contact.",
      },
      {
        title: "Follow-up sequences",
        detail:
          "Polite, persistent follow-up until every conversation reaches an outcome.",
      },
      {
        title: "Owner's daily brief",
        detail:
          "One summary of what happened and what needs you — exceptions first.",
      },
    ],
    kits: ["universal-replier", "voice-front-desk", "lead-engine"],
    websiteKeywords: [
      "business",
      "company",
      "services",
      "trading",
      "logistics",
      "manufacturing",
      "enterprise",
      "b2b",
      "solutions",
    ],
  },
];

export const getCategory = (id: string): BusinessCategory | undefined =>
  BUSINESS_CATEGORIES.find(category => category.id === id);

/**
 * What the one-time installation fee covers. Shown on pricing and at
 * checkout so the install fee is transparent.
 */
export const INSTALL_INCLUDES: string[] = [
  "Discovery call and an automation blueprint for your category",
  "Workflows built, connected to your approved tools, and tested",
  "WhatsApp Business, email, and website channels wired in",
  "Widget embedded on your website and your portal provisioned",
  "Team walkthrough and go-live session",
  "30 days of tuning while everything settles in",
];

/**
 * How the automation is delivered to the client.
 */
export const DELIVERY_OPTIONS = [
  {
    id: "embed",
    name: "On my website",
    description:
      "We install the Aria widget on your site. Visitors get instant answers; every enquiry is captured and followed up automatically.",
    icon: "globe",
  },
  {
    id: "portal",
    name: "In my Aria portal",
    description:
      "Log in to a portal where every automation, conversation, and follow-up is already set up and running. Nothing to install.",
    icon: "layout-dashboard",
  },
  {
    id: "both",
    name: "Both — recommended",
    description:
      "The Aria widget on your website plus the full portal behind it. The most complete setup: capture on the front, control at the back.",
    icon: "layers",
  },
] as const;

export type DeliveryOptionId = (typeof DELIVERY_OPTIONS)[number]["id"];

export const getDeliveryOption = (id: string) =>
  DELIVERY_OPTIONS.find(option => option.id === id);

/* ------------------------------ Onboarding ------------------------------ */

export type OnboardingQuestion = {
  id: string;
  question: string;
  options: { label: string; value: string; category?: string }[];
};

/**
 * The three questions a client answers when they don't share a website.
 * Question 1 maps directly to a category; the rest personalize the build.
 */
export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: "businessType",
    question: "Which best describes your business?",
    options: [
      { label: "Clinic or hospital", value: "clinic", category: "clinics" },
      { label: "Dental practice", value: "dental", category: "dental" },
      {
        label: "CA, legal, consulting or agency",
        value: "professional",
        category: "professional",
      },
      {
        label: "Real estate or property",
        value: "realestate",
        category: "realestate",
      },
      { label: "Shop or online store", value: "retail", category: "retail" },
      {
        label: "Jewellery or gold showroom",
        value: "jewellery",
        category: "jewellery",
      },
      {
        label: "Salon, gym or local service",
        value: "local-services",
        category: "local-services",
      },
      { label: "Restaurant or café", value: "food", category: "food" },
      {
        label: "Coaching, classes or education",
        value: "education",
        category: "education",
      },
      { label: "Something else", value: "any", category: "any" },
    ],
  },
  {
    id: "enquiryChannel",
    question: "Where do most customer enquiries arrive today?",
    options: [
      { label: "WhatsApp", value: "whatsapp" },
      { label: "Phone calls", value: "phone" },
      { label: "Website form or chat", value: "website" },
      { label: "Instagram or Facebook", value: "social" },
      { label: "Walk-ins and referrals", value: "walkin" },
    ],
  },
  {
    id: "painPoint",
    question: "What should stop happening first?",
    options: [
      { label: "Late or missed replies", value: "replies" },
      { label: "Leads going cold without follow-up", value: "followup" },
      { label: "Appointment no-shows", value: "noshow" },
      { label: "Chasing feedback and reviews", value: "reviews" },
      { label: "Paperwork and status updates", value: "paperwork" },
      { label: "After-hours enquiries missed", value: "afterhours" },
    ],
  },
];

/* --------------------- Website category detection ----------------------- */

export type CategoryScore = {
  categoryId: string;
  score: number;
  matched: string[];
};

/**
 * Scores raw website text against category keywords. Used by the server
 * during onboarding website analysis and safe to reuse in tests.
 */
export function detectCategoriesFromText(text: string): CategoryScore[] {
  const haystack = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
  const scores = BUSINESS_CATEGORIES.map(category => {
    const matched: string[] = [];
    let score = 0;
    for (const keyword of category.websiteKeywords) {
      const needle = ` ${keyword} `;
      if (haystack.includes(needle)) {
        matched.push(keyword);
        // Multi-word hits are stronger signals.
        score += keyword.includes(" ") ? 3 : 1;
      }
    }
    return { categoryId: category.id, score, matched };
  });
  return scores
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score);
}
