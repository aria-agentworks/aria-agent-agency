import {
  createContext,
  useContext,
  useState,
  useEffect,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  CheckCircle2,
  Headphones,
  Stethoscope,
  Target,
  Hospital,
  MessageCircle,
  Star,
  Building2,
  BarChart3,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  Layers,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { api, trackEvent } from "@/lib/store";
import { getPageContent } from "@shared/pageContent";
import { type Automation, formatPrice, CONTACT_EMAIL } from "@shared/catalog";
import { WhatsAppFloat } from "./WhatsAppFloat";

const CartContext = createContext<{
  items: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}>({ items: [], add: () => {}, remove: () => {}, clear: () => {} });
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("aria-cart") || "[]");
      return Array.isArray(saved)
        ? saved.filter(i => typeof i === "string")
        : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("aria-cart", JSON.stringify(items));
  }, [items]);
  const add = (id: string) => {
    setItems(prev => (prev.includes(id) ? prev : [...prev, id]));
    toast.success("Automation added to your cart", {
      action: {
        label: "View cart",
        onClick: () => {
          window.location.href = "/cart";
        },
      },
    });
  };
  return (
    <CartContext.Provider
      value={{
        items,
        add,
        remove: id => setItems(prev => prev.filter(x => x !== id)),
        clear: () => setItems([]),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export const useCart = () => useContext(CartContext);
export function Mark({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-mark ${small ? "small" : ""}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Aria Agent Agency home">
      <Mark />
      <span>
        aria<span className="brand-dot">.</span>
      </span>
      <em>AGENT AGENCY</em>
    </Link>
  );
}
export function AgentIcon({
  name,
  size = 24,
}: {
  name: string;
  size?: number;
}) {
  const icons: Record<string, typeof Headphones> = {
    headset: Headphones,
    tooth: Stethoscope,
    target: Target,
    hospital: Hospital,
    message: MessageCircle,
    star: Star,
    building: Building2,
    chart: BarChart3,
  };
  const Icon = icons[name] || Layers;
  return <Icon size={size} strokeWidth={1.65} />;
}
export function Header() {
  const [open, setOpen] = useState(false);
  const [path] = useLocation();
  const { items } = useCart();
  const { user } = useAuth();
  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    const meta = getPageContent(path);
    document.title = meta.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", meta.description);
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute(
      "content",
      meta.noindex ? "noindex,nofollow" : "index,follow"
    );
    trackEvent("page_view", { path });
  }, [path]);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav
          className={open ? "navigation open" : "navigation"}
          aria-label="Main navigation"
        >
          <Link
            href="/automations"
            className={path.startsWith("/automations") ? "active" : ""}
          >
            Automations <ChevronDown size={13} />
          </Link>
          <Link href="/industries">Industries</Link>
          <Link href="/how-it-works">How it works</Link>
          {user && <Link href="/growth">Growth</Link>}
          <Link href="/demo">
            Try a demo <span className="tiny-dot" />
          </Link>
        </nav>
        <div className="header-actions">
          <Link
            href="/cart"
            className="cart-link"
            aria-label={`Cart with ${items.length} automations`}
          >
            <ShoppingBag size={19} />
            {items.length > 0 && <span>{items.length}</span>}
          </Link>
          {user ? (
            <Link
              href="/portal"
              className="account-link"
              aria-label="Your Aria portal"
            >
              <UserRound size={18} />
            </Link>
          ) : (
            <Link href="/login" className="account-link" aria-label="Sign in">
              <UserRound size={18} />
            </Link>
          )}
          <Link href="/get-started" className="button lime small">
            Get started <ArrowUpRight size={16} />
          </Link>
          <button
            className="mobile-toggle"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Brand />
          <p>
            We automate everything.
            <br />Whatever business you run — you never lose a contact.
          </p>
          <Newsletter variant="footer" source="footer" />
          <a href={`mailto:${CONTACT_EMAIL}`} className="footer-email">
            Talk to a real person <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="footer-links">
          <div>
            <h4>GET AUTOMATED</h4>
            <Link href="/get-started">Get started — 2 minutes</Link>
            <Link href="/pricing">Installation + plans</Link>
            <Link href="/portal">My portal</Link>
            <Link href="/demo">Interactive demo</Link>
          </div>
          <div>
            <h4>WORK WITH ARIA</h4>
            <Link href="/automations">All automations</Link>
            <Link href="/implementation">Implementation</Link>
            <Link href="/growth">Growth engine (internal)</Link>
            <Link href="/how-it-works">Our process</Link>
            <Link href="/orders">My purchases</Link>
            <a
              href="https://denialsdoctor.com"
              target="_blank"
              rel="noreferrer"
            >
              DenialsDoctor <ArrowUpRight size={12} />
            </a>
          </div>
          <div>
            <h4>GOOD TO KNOW</h4>
            <Link href="/faq">FAQs & support</Link>
            <Link href="/voice-setup">Indian voice setup</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Purchase information</Link>
            <a href="https://ariaagent.agency" target="_blank" rel="noreferrer">
              Aria’s healthcare roots <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Aria Agent Agency</span>
        <span>
          <i /> Built for business. Designed for people.
        </span>
      </div>
    </footer>
  );
}
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <div className="breadcrumbs">
      <Link href="/">Home</Link>
      {items.map((item, index) => (
        <span key={index}>
          <span className="crumb-separator">/</span>
          {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
        </span>
      ))}
    </div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkText = "Explore all automations",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">
          <i />
          {eyebrow}
        </span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && (
        <Link href={href} className="text-link">
          {linkText} <ArrowUpRight size={18} />
        </Link>
      )}
    </div>
  );
}
export function AutomationCard({ item }: { item: Automation }) {
  return (
    <article className="automation-card">
      <div className={`card-art ${item.color}`}>
        <span className="card-icon">
          <AgentIcon name={item.icon} size={34} />
        </span>
        <span className="art-node n1" />
        <span className="art-node n2" />
        <span className="art-ring" />
        <span className="art-line" />
        {item.badge && <span className="card-badge">{item.badge}</span>}
        <span className="art-label">
          ARIA / {item.id.toUpperCase().replaceAll("-", " ")}
        </span>
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span>{item.category}</span>
          <span>n8n workflow kit</span>
        </div>
        <Link href={`/automations/${item.id}`} className="card-title">
          <h3>{item.name}</h3>
          <ArrowUpRight size={20} />
        </Link>
        <p>
          {item.tagline} {item.description.split(". ")[0]}.
        </p>
        <div className="card-bottom">
          <div>
            <strong>{formatPrice(item.price)}</strong>
            <small>one-time · draft test price</small>
          </div>
          <Link
            href={`/automations/${item.id}`}
            className="card-explore"
            aria-label={`Explore ${item.name}`}
          >
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function InquiryCTA() {
  return (
    <section className="inquiry-cta">
      <div>
        <span className="eyebrow">NOT SURE WHERE TO START?</span>
        <h2>
          Your business is unique.
          <br />
          <em>Your automation can be, too.</em>
        </h2>
        <p>
          Tell us what slows your team down. We’ll help you choose the right
          workflow—or scope one around your existing tools.
        </p>
      </div>
      <div>
        <Link href="/implementation" className="button lime">
          Let’s build your workflow <ArrowUpRight size={19} />
        </Link>
        <span>No pressure. No one-size-fits-all pitch.</span>
      </div>
      <div className="cta-orbit" aria-hidden="true" />
    </section>
  );
}
export function LoginPrompt({
  text = "Sign in to view your purchases and download your automation kits.",
}: {
  text?: string;
}) {
  return (
    <div className="empty-state">
      <span className="large-icon">
        <UserRound size={30} />
      </span>
      <h2>Your Aria workspace</h2>
      <p>{text}</p>
      <Link href="/login" className="button dark">
        Sign in or create an account <ArrowRight size={17} />
      </Link>
      <small>Secure sign-in. Your purchases stay linked to your account.</small>
    </div>
  );
}

/** Email capture for the automation playbook + monthly automation tips. */
export function Newsletter({
  source = "website",
  variant = "section",
}: {
  source?: string;
  variant?: "section" | "footer";
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/marketing/subscribe", { email, source });
      setDone(true);
      toast.success("You are on the list. Grab the playbook below.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (variant === "footer") {
    return done ? (
      <a
        href="/api/marketing/leadmagnet?ref=footer"
        className="footer-email"
        onClick={() => trackEvent("leadmagnet_download", { path: "footer" })}
      >
        Download the playbook <ArrowUpRight size={15} />
      </a>
    ) : (
      <form className="newsletter-inline" onSubmit={submit}>
        <input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          aria-label="Email for the automation newsletter"
          maxLength={320}
        />
        <button className="button lime small" disabled={busy}>
          {busy ? "..." : "Get the playbook"}
        </button>
      </form>
    );
  }
  return (
    <section className="newsletter-cta" aria-label="Newsletter signup">
      <div>
        <span className="eyebrow">FREE · 50 AUTOMATION BLUEPRINTS</span>
        <h2>
          Steal our playbook.
          <br />
          <em>50 AI systems inside.</em>
        </h2>
        <p>
          Get the same blueprint library we use to scope client automations
          (triggers, guardrails, KPIs), plus a short monthly note on what is
          working in real offices. Unsubscribe any time.
        </p>
      </div>
      <div>
        {done ? (
          <div className="newsletter-done">
            <CheckCircle2 size={26} />
            <p>
              You are on the list. Your playbook is ready — no strings
              attached.
            </p>
            <a href="/api/marketing/leadmagnet?ref=newsletter" className="button lime">
              Download the playbook <ArrowUpRight size={17} />
            </a>
          </div>
        ) : (
          <form className="newsletter-form" onSubmit={submit}>
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              aria-label="Work email"
              maxLength={320}
            />
            <button className="button lime" disabled={busy}>
              {busy ? (
                "Sending..."
              ) : (
                <>
                  Send me the playbook <ArrowRight size={17} />
                </>
              )}
            </button>
            <span className="newsletter-fineprint">
              One email per month. No spam, ever.
            </span>
          </form>
        )}
      </div>
    </section>
  );
}
export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="check-list">
      {items.map(item => (
        <li key={item}>
          <Check size={16} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
