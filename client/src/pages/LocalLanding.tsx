import { useMemo } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  Clock,
  TrendingUp,
  MessageCircle,
} from "lucide-react";
import { PageShell, Breadcrumbs, AgentIcon } from "@/components/Storefront";
import { automations, getAutomation, formatPrice } from "@shared/catalog";
import { trackEvent } from "@/lib/store";

interface CityInfo {
  slug: string;
  name: string;
  state: string;
  country: string;
  hub: string;
}

const CITIES: Record<string, CityInfo> = {
  chennai: {
    slug: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    hub: "Healthcare, Manufacturing & Tech Corridor",
  },
  bangalore: {
    slug: "bangalore",
    name: "Bengaluru",
    state: "Karnataka",
    country: "India",
    hub: "Startups, Tech Parks & Multi-specialty Clinics",
  },
  mumbai: {
    slug: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    country: "India",
    hub: "Financial Capital, CA Firms & Luxury Retail",
  },
  hyderabad: {
    slug: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    country: "India",
    hub: "HITEC City, Hospitals & Real Estate Hubs",
  },
  delhi: {
    slug: "delhi",
    name: "Delhi NCR",
    state: "Delhi",
    country: "India",
    hub: "Enterprise HQ, Jewellers & Professional Practices",
  },
  pune: {
    slug: "pune",
    name: "Pune",
    state: "Maharashtra",
    country: "India",
    hub: "Automotive, Dental Chains & IT Services",
  },
};

const INDUSTRY_MAPPING: Record<string, {
  name: string;
  kitId: string;
  headline: string;
  tagline: string;
  stats: string;
}> = {
  dental: {
    name: "Dental Clinics",
    kitId: "dental-frontdesk",
    headline: "Automate patient appointments, recall visits & WhatsApp reminders",
    tagline: "Never lose a dental inquiry after clinic hours.",
    stats: "38% fewer no-shows and instant patient confirmations",
  },
  ca: {
    name: "CA & Accounting Firms",
    kitId: "ca-firm-admin",
    headline: "Automate client document requests, GST reminders & ledger follow-ups",
    tagline: "Cut tax season chasing and manual phone calls in half.",
    stats: "Up to 15 hours saved per accountant every month",
  },
  jewellery: {
    name: "Jewellery & Gold Showrooms",
    kitId: "jewellery-showroom-retention",
    headline: "Automate instalment plan reminders & showroom appointment visits",
    tagline: "Timely WhatsApp rate updates and polite chit-scheme notifications.",
    stats: "24% higher on-time monthly instalment payments",
  },
  hospital: {
    name: "Hospitals & Medical Centres",
    kitId: "hospital-scheduling-recovery",
    headline: "Administrative triage, synthetic test routing & discharge follow-up",
    tagline: "Safe administrative automation wrapped around your existing HMS.",
    stats: "Zero clinical risk with 100% human-in-the-loop review",
  },
  realestate: {
    name: "Real Estate Agencies",
    kitId: "realestate-lead-orchestration",
    headline: "Instant property lead qualification & site visit calendar booking",
    tagline: "Respond to incoming 99acres and portal leads within 45 seconds.",
    stats: "4.2x faster lead qualification to site-visit conversion",
  },
};

export default function LocalLanding() {
  const params = useParams<{ city?: string; industry?: string }>();
  const citySlug = (params.city || "chennai").toLowerCase();
  const industrySlug = (params.industry || "dental").toLowerCase();

  const city = CITIES[citySlug] || CITIES.chennai;
  const industry = INDUSTRY_MAPPING[industrySlug] || INDUSTRY_MAPPING.dental;
  const kit = getAutomation(industry.kitId) || automations[0];

  const handleWhatsApp = () => {
    trackEvent("whatsapp_click", {
      page: `/local/${city.slug}/${industrySlug}`,
      city: city.name,
      industry: industry.name,
    });
    const text = encodeURIComponent(
      `Hi Aria Team, I manage a ${industry.name} practice in ${city.name} and want to automate our workflows.`
    );
    window.open(`https://wa.me/919876543210?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <PageShell>
      <div className="container py-12">
        <Breadcrumbs
          items={[
            { label: "Locations", href: "/locations" },
            { label: city.name, href: `/local/${city.slug}/dental` },
            { label: industry.name },
          ]}
        />

        {/* Localized Hero Banner */}
        <div className="mt-8 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-card to-secondary/60 border border-border relative overflow-hidden shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <MapPin size={13} /> {city.name}, {city.state}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              <Building2 size={13} /> {city.hub}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight text-foreground max-w-3xl leading-tight mb-4">
            {industry.name} Automation in <span className="underline decoration-emerald-500/60">{city.name}</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-6">
            {industry.headline}. Built specifically for business owners and practices in {city.name} wanting fast, self-contained AI systems with local installation support.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm shadow-md transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle size={18} /> Chat with {city.name} Specialist
            </button>
            <Link
              href={`/automations/${kit.id}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition"
            >
              Inspect {kit.name} <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Local Advantage Grid */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-card">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 mb-4">
              <TrendingUp size={20} />
            </div>
            <h2 className="text-base font-semibold mb-2">Proven Local Outcomes</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              {industry.stats} for practices and firms adopting Aria workflows in {city.name}.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-violet-700 dark:text-violet-300 mb-4">
              <Clock size={20} />
            </div>
            <h2 className="text-base font-semibold mb-2">Indian Number & WhatsApp Ready</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              Pre-configured for Asia/Kolkata timezone, Indian business hours, and WhatsApp Business API endpoints.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-300 mb-4">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-base font-semibold mb-2">Assisted Installation in {city.name}</h2>
            <p className="text-sm text-muted-foreground leading-normal">
              Choose self-service download or have our team handle complete n8n and API integration for your office.
            </p>
          </div>
        </div>

        {/* Featured Local Automation Kit */}
        <div className="mt-12 p-8 rounded-2xl border border-border bg-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Recommended Solution
              </span>
              <h2 className="text-2xl font-serif font-bold text-foreground mt-1">
                {kit.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                {kit.description}
              </p>
            </div>
            <div className="text-left md:text-right shrink-0">
              <div className="text-2xl font-bold font-serif text-foreground">
                {formatPrice(kit.price)}
              </div>
              <span className="text-xs text-muted-foreground">
                One-time kit · Unlimited runs
              </span>
            </div>
          </div>

          <div className="py-6 grid sm:grid-cols-2 gap-4 text-sm">
            {kit.outcomes.map((outcome, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-foreground">{outcome}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
            <Link
              href={`/automations/${kit.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 transition"
            >
              View Full Kit Details <ArrowUpRight size={14} />
            </Link>
            <Link
              href={`/automations/${kit.id}/setup`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 font-medium text-xs transition"
            >
              Step-by-Step Setup Guide
            </Link>
          </div>
        </div>

        {/* City & Industry Switcher Directory */}
        <div className="mt-12 p-8 rounded-2xl border border-border bg-secondary/40">
          <h2 className="text-lg font-serif font-bold mb-4">
            Browse Other Practice Hubs & Cities
          </h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.values(CITIES).map((c) => (
              <Link
                key={c.slug}
                href={`/local/${c.slug}/${industrySlug}`}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition ${
                  c.slug === city.slug
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Industries in {city.name}
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(INDUSTRY_MAPPING).map(([key, ind]) => (
              <Link
                key={key}
                href={`/local/${city.slug}/${key}`}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition ${
                  key === industrySlug
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {ind.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
