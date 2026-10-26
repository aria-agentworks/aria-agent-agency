import { Link } from "wouter";
import {
  ArrowUpRight,
  ShieldCheck,
  Puzzle,
  TestTubeDiagonal,
  HeartHandshake,
} from "lucide-react";
import { CONTACT_EMAIL } from "@shared/catalog";
import { PageShell, Breadcrumbs, InquiryCTA } from "@/components/Storefront";
const faqs = [
  [
    "What am I buying?",
    "A configurable n8n automation starter kit. It includes importable workflow files, prompts, synthetic examples, and setup guidance. It is not an already-connected AI employee, and purchase does not activate your business systems.",
  ],
  [
    "Can you set it up for my business?",
    "Yes. Submit an implementation brief and Aria can scope discovery, system integration, testing, go-live, and team handover. Implementation and ongoing maintenance are quoted separately based on the agreed scope.",
  ],
  [
    "Do I need technical experience?",
    "Self-service setup requires someone who can configure n8n, securely manage provider credentials, read source-system API documentation, and test workflow exceptions. If that is not your team, choose agency-led implementation.",
  ],
  [
    "Are the prices and payments live?",
    "Not yet. This storefront uses clearly labeled draft USD prices and Stripe test checkout. No live money should be collected until Aria confirms final prices, commercial terms, licenses, and live payment configuration.",
  ],
  [
    "Are third-party tools included?",
    "No. Your n8n hosting, AI provider, CRM/calendar, messaging provider, and any third-party usage fees are separate. Each product page lists the systems and approvals you will need.",
  ],
  [
    "Does this replace our HMS, EMR, or practice software?",
    "No. Healthcare kits are an administrative layer around your approved systems. Vendor API availability, permissions, and required handoffs must be confirmed before implementation. If a supported API is not available, the workflow needs a documented staff handoff rather than a guessed connection.",
  ],
  [
    "Can healthcare agents give medical advice?",
    "No. The healthcare demos and kits are for administration. They must not diagnose, prescribe, interpret results, change treatment, or make autonomous clinical triage decisions. Clinically sensitive, ambiguous, or high-impact requests go to human review.",
  ],
  [
    "Can I use real patient data in the demo?",
    "No. The public demo accepts only predefined synthetic cases and does not send messages or create real bookings. Production processing needs your organization’s approved policies, consent, vendors, and security review.",
  ],
  [
    "How do I get my files after purchase?",
    "Sign in to My purchases. Access is linked to your account and granted only after the Stripe webhook verifies the completed test payment. If you return before the webhook arrives, the order may briefly show pending.",
  ],
  [
    "What support and maintenance are included?",
    "The kit provides setup documentation and test examples. Custom integration, monitoring, credential checks, template changes, and optimization are separate implementation or maintenance work. Aria will agree the responsibilities and scope with you; no response-time guarantee is being advertised.",
  ],
];
export function FAQ() {
  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs items={[{ label: "FAQs & support" }]} />
        <div className="page-heading">
          <span className="eyebrow">
            <i />
            USEFUL ANSWERS, UP FRONT
          </span>
          <h1>
            Good questions.
            <br />
            <em>Clear expectations.</em>
          </h1>
          <p>
            What’s inside a kit, what needs configuration, and where the people
            come in.
          </p>
        </div>
        <div className="faq-list">
          {faqs.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary>
                {q}
                <span>+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <div className="faq-contact">
          <h3>Still have a question?</h3>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-link">
            Talk to Aria <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="bottom-cta">
          <InquiryCTA />
        </div>
      </div>
    </PageShell>
  );
}
export function HowItWorks() {
  const steps = [
    [
      "01",
      "Discover the right starting point",
      "Choose one repetitive administrative process. Define the trigger, source data, intended action, responsible person, and outcome before choosing the technology.",
    ],
    [
      "02",
      "Configure your approved tools",
      "Use documented APIs, approved content, secure provider credentials, and a named human escalation owner. Workflows are inactive until configured; unavailable integrations need explicit staff handoffs.",
    ],
    [
      "03",
      "Prove the happy path—and the exceptions",
      "Use synthetic data to test correct classification, missing fields, unavailable slots, duplicate events, provider failures, and human review. Do not test with real patient information in the public demo.",
    ],
    [
      "04",
      "Approve, hand over, and improve",
      "For agency implementation, agree the scope and responsibilities, obtain the necessary client approvals, and train the team. Monitoring and optimization are separately scoped, not hidden inside the kit price.",
    ],
  ];
  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs items={[{ label: "How it works" }]} />
        <div className="page-heading">
          <span className="eyebrow">
            <i />
            PURPOSE-BUILT, NOT ONE-SIZE-FITS-ALL
          </span>
          <h1>
            The work comes first.
            <br />
            <em>The AI follows.</em>
          </h1>
          <p>
            A clear process from the task that slows your team down to an
            automation you can understand, configure, and own.
          </p>
        </div>
        <div className="long-process">
          {steps.map(([n, t, p]) => (
            <article key={n}>
              <span>{n}</span>
              <div>
                <h2>{t}</h2>
                <p>{p}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="principle-cards">
          <div>
            <ShieldCheck />
            <h3>Human decisions stay human.</h3>
            <p>
              Ambiguous and high-impact cases should escalate, not turn into
              confident guesses.
            </p>
          </div>
          <div>
            <Puzzle />
            <h3>Your tools stay yours.</h3>
            <p>
              We connect supported systems around your process. We don’t promise
              an API exists before checking it.
            </p>
          </div>
          <div>
            <TestTubeDiagonal />
            <h3>Small pilots, visible outcomes.</h3>
            <p>
              Measure workflow performance against a baseline. No guaranteed
              revenue or clinical outcome claims.
            </p>
          </div>
        </div>
        <div className="bottom-cta">
          <InquiryCTA />
        </div>
      </div>
    </PageShell>
  );
}
export function Privacy() {
  return (
    <PageShell>
      <div className="container legal-page">
        <Breadcrumbs items={[{ label: "Privacy information" }]} />
        <span className="eyebrow">STOREFRONT PRIVACY INFORMATION</span>
        <h1>
          Your information,
          <br />
          <em>handled with purpose.</em>
        </h1>
        <p className="legal-date">Pre-launch information · October 2026</p>
        <h2>Business inquiries</h2>
        <p>
          The implementation form stores the name, email, business, industry,
          selected automation, tools, goals, and optional phone/website you
          provide. These records are held in the project database and shown only
          to an authenticated account with the agency administrator role. The
          form requires your permission to store these details and contact you
          about the request.
        </p>
        <h2>Accounts and purchases</h2>
        <p>
          Account sign-in uses Manus OAuth. The application keeps the identity
          and basic profile required for account access, purchase records,
          entitlement checks, and secure downloads. Stripe hosts checkout; the
          application does not collect or store card numbers or security codes.
          This version is configured for test checkout only.
        </p>
        <h2>Demo data</h2>
        <p>
          The public demo uses predefined fictional cases and does not accept
          patient records or free-form personal information. Where an AI model
          is used, supplied synthetic information is sent to the project’s
          configured AI service for a bounded classification step. No real
          messages, appointments, or clinical actions are executed.
        </p>
        <h2>Cookies and local storage</h2>
        <p>
          The site uses an application session cookie for login and local
          browser storage for your cart. The cart contains automation
          identifiers, not payment-card details. Project-hosted analytics may
          record website usage; no business inquiry fields are intentionally
          included in analytics events.
        </p>
        <h2>Questions and requests</h2>
        <p>
          Contact <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> to ask
          about the details you submitted or to request correction or removal.
          Aria must finalize its organization-specific retention and legal
          privacy policy before live commercial launch. This page describes the
          implemented storefront behavior; it is not a claim of regulatory
          certification.
        </p>
        <div className="guardrail-note">
          <ShieldCheck />
          <p>
            Do not submit patient records, health details, passwords, API keys,
            or other sensitive data through the implementation form or public
            demo.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
export function Terms() {
  return (
    <PageShell>
      <div className="container legal-page">
        <Breadcrumbs items={[{ label: "Purchase information" }]} />
        <span className="eyebrow">PRE-LAUNCH PURCHASE INFORMATION</span>
        <h1>
          Know what’s included.
          <br />
          <em>Know what comes next.</em>
        </h1>
        <p className="legal-date">Draft storefront · test checkout only</p>
        <h2>Configurable kits, not active deployments</h2>
        <p>
          A self-service purchase delivers workflow starter files, prompts or
          output schemas, synthetic examples, and setup instructions. The files
          require configuration and approval before being connected to client
          systems. A purchase does not activate live business operations, send
          external messages, or connect your CRM, calendar, HMS, or EMR.
        </p>
        <h2>Pricing and external costs</h2>
        <p>
          Displayed USD prices are draft test prices, not a confirmed live
          commercial offer. Third-party subscriptions, hosting, AI usage,
          messaging charges, custom connectors, implementation, and recurring
          maintenance are not included. Final taxes or adjustments, where
          configured, are shown by the payment provider.
        </p>
        <h2>Implementation is separately agreed</h2>
        <p>
          Submitting a brief is free and does not establish a project contract.
          Aria will confirm the systems, integration feasibility, deliverables,
          exclusions, client responsibilities, testing, handover, and price in
          an agreed scope before production work.
        </p>
        <h2>Access and payment verification</h2>
        <p>
          Downloads are linked to the signed-in purchaser and made available
          after verified Stripe test payment. Checkout return parameters do not
          grant access. Keep your account access available if you want to
          retrieve your purchase history and files.
        </p>
        <h2>Live-launch commercial policies</h2>
        <p>
          Before collecting live payments, Aria must confirm its final prices
          and currency, product licensing/use rights, refund and cancellation
          terms, support commitments, and organization-specific terms of sale.
          No refund policy or licensing grant is being invented on Aria’s behalf
          in this draft build.
        </p>
        <h2>Healthcare boundaries</h2>
        <p>
          Healthcare workflows are administrative only. They do not diagnose,
          prescribe, interpret clinical results, or make autonomous triage
          decisions. Client-approved privacy, consent, vendors, security review,
          and human escalation are required. No guaranteed ROI, revenue
          recovery, clinical outcomes, or regulatory certification is implied.
        </p>
        <h2>Contact</h2>
        <p>
          For scope, configuration, or purchase questions, contact{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
        <Link href="/implementation" className="button dark">
          Request implementation <ArrowUpRight size={18} />
        </Link>
      </div>
    </PageShell>
  );
}
