import { Link } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Sparkles,
  Headphones,
  CalendarDays,
  ShieldCheck,
  Workflow,
  Puzzle,
  ShoppingBag,
  HeartHandshake,
  Gem,
  GraduationCap,
  Building2,
  Scissors,
  Smile,
  Stethoscope,
  Target,
  Utensils,
  Zap,
} from "lucide-react";
import { automations } from "@shared/catalog";
import { BUSINESS_CATEGORIES } from "@shared/solutions";
import {
  PageShell,
  SectionHeading,
  AutomationCard,
  InquiryCTA,
  Newsletter,
  Mark,
} from "@/components/Storefront";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  clinics: Stethoscope,
  dental: Smile,
  professional: Target,
  realestate: Building2,
  retail: ShoppingBag,
  jewellery: Gem,
  "local-services": Scissors,
  food: Utensils,
  education: GraduationCap,
  any: Sparkles,
};

export default function Home() {
  return (
    <PageShell>
      <section className="hero">
        <img
          className="hero-image"
          src="/manus-storage/async-images/E7iPghsHyj7UMozv9fq2Ww/image-1.webp"
          alt="Sculptural connected workflow nodes representing business automation"
        />
        <div className="hero-shade" />
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              <span /> WHATEVER BUSINESS YOU RUN · WE AUTOMATE EVERYTHING
            </span>
            <h1>
              Never lose
              <br />
              <em>a contact.</em>
            </h1>
            <p>
              Aria builds, installs, and runs your automations for you. Share
              your website or answer three questions — every enquiry answered,
              every follow-up sent, every day.
            </p>
            <div className="hero-buttons">
              <Link href="/get-started" className="button lime">
                Automate my business <ArrowUpRight size={19} />
              </Link>
              <Link href="/pricing" className="button ghost">
                See pricing <ArrowRight size={18} />
              </Link>
            </div>
            <div className="hero-assurances">
              <span>
                <Check size={13} /> One-time installation
              </span>
              <span>
                <Check size={13} /> Runs 24/7 from day one
              </span>
              <span>
                <Check size={13} /> You never lose a contact
              </span>
            </div>
          </div>
          <div className="hero-live-card">
            <div className="live-card-top">
              <span>
                <span className="live-dot" /> WHAT YOUR AUTOMATION DOES
              </span>
              <Sparkles size={16} />
            </div>
            <div className="live-card-step">
              <span className="live-icon">
                <Headphones size={18} />
              </span>
              <div>
                <strong>New enquiry at 11:43 PM</strong>
                <small>Answered in 8 seconds</small>
              </div>
              <Check size={14} />
            </div>
            <div className="live-card-line" />
            <div className="live-card-step">
              <span className="live-icon violet">
                <CalendarDays size={18} />
              </span>
              <div>
                <strong>Follow-up sent at 9:00 AM</strong>
                <small>Contact saved → next step booked</small>
              </div>
              <span className="mini-label">AUTOMATED</span>
            </div>
            <Link href="/demo">
              See a real synthetic-data demo <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="hero-bottom">
            <span>NEVER LOSE A CONTACT</span>
            <span>REPLIES IN SECONDS</span>
            <span>FOLLOW-UP ON AUTOPILOT</span>
            <span>ANY BUSINESS · ANY WORK</span>
          </div>
        </div>
      </section>
      <section className="benefit-strip">
        <div>
          <Workflow size={20} />
          <span>We build, install & run it for you</span>
        </div>
        <div>
          <Puzzle size={20} />
          <span>Works around your existing tools</span>
        </div>
        <div>
          <ShieldCheck size={20} />
          <span>Human review when it matters</span>
        </div>
        <div>
          <HeartHandshake size={20} />
          <span>One-time install + monthly plan</span>
        </div>
      </section>

      {/* --------------------- PICK YOUR BUSINESS --------------------- */}
      <section className="section container">
        <SectionHeading
          eyebrow="SELL ME THE RESULT"
          title={
            <>
              Pick your business.
              <br />
              <em>See exactly what gets automated.</em>
            </>
          }
          description="Each category below is a finished, installed result — not a toolkit. Find yours and start."
          href="/get-started"
          linkText="Start now"
        />
        <div className="result-grid">
          {BUSINESS_CATEGORIES.map(category => {
            const Icon = CATEGORY_ICONS[category.id] ?? Sparkles;
            return (
              <Link
                key={category.id}
                href={`/get-started?category=${category.id}`}
                className="result-card"
              >
                <span className="result-card-icon">
                  <Icon size={24} />
                </span>
                <span className="result-card-name">{category.name}</span>
                <strong className="result-card-headline">
                  {category.resultHeadline}
                </strong>
                <ul>
                  {category.promises.slice(0, 3).map(promise => (
                    <li key={promise}>
                      <Zap size={12} /> {promise}
                    </li>
                  ))}
                </ul>
                <span className="result-card-cta">
                  See what gets automated <ArrowUpRight size={14} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section container">
        <SectionHeading
          eyebrow="THE WORKFLOWS BEHIND EVERY RESULT"
          title={
            <>
              Ready-made agents,
              <br />
              <em>installed by us.</em>
            </>
          }
          description="Every category is powered by proven workflow kits — built, connected, and tested during your installation."
          href="/automations"
        />
        <div className="automation-grid">
          {automations
            .filter(x => x.popular)
            .map(item => (
              <AutomationCard item={item} key={item.id} />
            ))}
        </div>
        <div className="catalog-note">
          <span className="tiny-dot" /> Prefer to buy a single workflow?
          Per-kit purchases are still available. Most businesses start with the
          installation plan instead.
        </div>
      </section>
      <section className="industry-feature container">
        <div className="feature-photo">
          <img
            src="/manus-storage/async-images/E7iPghsHyj7UMozv9fq2Ww/image-2.webp"
            alt="A welcoming contemporary dental practice reception"
            loading="lazy"
          />
          <div className="photo-label">
            <Stethoscope size={18} />
            <div>
              <strong>Built around your business.</strong>
              <span>Not the other way around.</span>
            </div>
          </div>
        </div>
        <div className="feature-copy">
          <span className="eyebrow">
            <i /> A FRONT DESK THAT NEVER SLEEPS
          </span>
          <h2>
            Your customers deserve
            <br />
            <em>an instant answer.</em>
          </h2>
          <p>
            From the first enquiry to the next appointment, Aria connects the
            gaps around your existing systems. Enquiries get answered in
            seconds, follow-ups happen on schedule, and your team steps in only
            when it truly matters.
          </p>
          <div className="feature-points">
            <span>
              <Check size={16} /> Enquiries answered & contacts saved
            </span>
            <span>
              <Check size={16} /> Bookings confirmed & reminders sent
            </span>
            <span>
              <Check size={16} /> Follow-up and service recovery on autopilot
            </span>
          </div>
          <Link href="/get-started" className="button dark">
            Automate my business <ArrowUpRight size={18} />
          </Link>
          <small>
            Administrative workflows only. No clinical decisions or advice.
          </small>
        </div>
      </section>
      <section className="two-paths">
        <div className="container">
          <SectionHeading
            eyebrow="HOW YOU GET AUTOMATED"
            title={
              <>
                We do the work.
                <br />
                <em>You get the result.</em>
              </>
            }
            description="Aria is an installed outcome, not a DIY project. Two ways to start — both end with everything running."
          />
          <div className="path-cards">
            <article className="managed-path">
              <span className="path-number">01 / INSTALLED FOR YOU</span>
              <HeartHandshake size={31} />
              <h3>Share your business. We automate it.</h3>
              <p>
                Answer three questions or share your website. We build the
                automations for your category, connect WhatsApp, email, and your
                website, embed the widget or set up your portal, test it, and
                hand over a running system. One-time installation, then a
                monthly plan that keeps it all running.
              </p>
              <Link href="/get-started" className="text-link">
                Start the 2-minute wizard <ArrowUpRight size={17} />
              </Link>
            </article>
            <article>
              <span className="path-number">02 / PREFER DIY?</span>
              <ShoppingBag size={30} />
              <h3>Buy a single workflow kit.</h3>
              <p>
                Every automation is also available as a one-time purchase with
                the workflow files, prompts, and setup guidance. Best for teams
                with someone technical at the wheel.
              </p>
              <Link href="/automations" className="text-link">
                Browse ready-made kits <ArrowUpRight size={17} />
              </Link>
            </article>
          </div>
        </div>
      </section>
      <section className="section container process-section">
        <SectionHeading
          eyebrow="FROM QUESTIONS TO AUTOMATED"
          title={
            <>
              Three steps.
              <br />
              <em>Zero things slipping.</em>
            </>
          }
          href="/how-it-works"
          linkText="How we work"
        />
        <div className="process-steps">
          {[
            [
              "01",
              "Tell us your business",
              "Share your website or answer three quick questions. We identify your category and show you exactly what gets automated.",
            ],
            [
              "02",
              "We build & install",
              "One-time installation: workflows built, channels connected, widget embedded on your site or your portal provisioned, everything tested with you.",
            ],
            [
              "03",
              "It runs. Forever.",
              "Your monthly plan keeps every automation running and improving. Track everything in your portal — and never lose a contact again.",
            ],
          ].map(([n, t, p]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="founder-band container">
        <div className="founder-badge">
          <Mark />
          <span>
            DOMAIN DEPTH.
            <br />
            HUMAN ACCOUNTABILITY.
          </span>
        </div>
        <div>
          <h3>Healthcare roots. Business-wide possibilities.</h3>
          <p>
            Aria&rsquo;s existing work is rooted in healthcare revenue operations. We
            bring that domain-focused approach to practical automations that
            support your team—not replace your judgment.
          </p>
        </div>
        <a
          className="text-link"
          href="https://ariaagent.agency"
          target="_blank"
          rel="noreferrer"
        >
          Meet Aria <ArrowUpRight size={18} />
        </a>
      </section>
      <div className="container bottom-cta">
        <Newsletter source="home-bottom" />
      </div>
      <div className="container bottom-cta">
        <InquiryCTA />
      </div>
    </PageShell>
  );
}
