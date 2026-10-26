import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Loader2,
  ShieldCheck,
  Wrench,
  TrendingUp,
  Contact,
  Package,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { PLANS, type Plan } from "@shared/plans";
import { formatPrice } from "@shared/catalog";
import { INSTALL_INCLUDES } from "@shared/solutions";
import { WEBSITE_OFFER } from "@shared/growth";
import { api } from "@/lib/store";
import { PageShell, Breadcrumbs } from "@/components/Storefront";

type StatusResponse = {
  checkoutReady: boolean;
  gateway: "stripe" | "dodo";
  subscriptionsReady: boolean;
};

export default function Pricing() {
  const { user } = useAuth();
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const status = useQuery({
    queryKey: ["store-status"],
    queryFn: () => api<StatusResponse>("/api/store/status"),
    retry: false,
  });

  async function subscribe(plan: Plan) {
    if (!user) {
      toast.error("Please sign in first — your plan links to your account.");
      return;
    }
    const tab = window.open("about:blank", "_blank");
    if (!tab) {
      toast.error("Please allow a new tab for secure checkout.");
      return;
    }
    setBusyPlan(plan.id);
    try {
      const data = await api<{ url: string }>("/api/store/subscribe", {
        planId: plan.id,
        origin: window.location.origin,
        install: true,
      });
      tab.location.href = data.url;
      toast.info(
        "Secure checkout opened — installation + first month in one payment."
      );
    } catch (e) {
      tab.close();
      toast.error((e as Error).message);
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs items={[{ label: "Plans" }]} />
        <div className="page-heading compact">
          <span className="eyebrow">
            <i /> WE INSTALL IT · IT RUNS
          </span>
          <h1>
            One-time installation.
            <br />
            <em>One monthly plan.</em>
          </h1>
          <p>
            We build, connect, and install your automations — then keep
            everything running so you never lose a contact. Whatever business
            you run.
          </p>
        </div>
        <div className="plans-grid">
          {PLANS.map(plan => (
            <article
              key={plan.id}
              className={`plan-card ${plan.popular ? "popular" : ""}`}
            >
              {plan.badge && <span className="card-badge">{plan.badge}</span>}
              <h2>{plan.name}</h2>
              <p className="plan-tagline">{plan.tagline}</p>
              <div className="plan-price">
                <strong>{formatPrice(plan.installFee)}</strong>
                <span>one-time installation</span>
              </div>
              <div className="plan-price monthly">
                <strong>{formatPrice(plan.monthlyPrice)}</strong>
                <span>/ month, everything running</span>
              </div>
              <ul className="check-list">
                {plan.features.map(feature => (
                  <li key={feature}>
                    <Check size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`button ${plan.popular ? "lime" : "dark"} full`}
                disabled={busyPlan === plan.id || !status.data?.subscriptionsReady}
                onClick={() => subscribe(plan)}
              >
                {busyPlan === plan.id ? (
                  <>
                    <Loader2 size={17} className="spin" /> Opening checkout...
                  </>
                ) : (
                  <>
                    Install {plan.name} — {formatPrice(plan.installFee)} +{" "}
                    {formatPrice(plan.monthlyPrice)}/mo <ArrowUpRight size={17} />
                  </>
                )}
              </button>
            </article>
          ))}
        </div>
        {!status.data?.subscriptionsReady && !status.isLoading && (
          <div className="info-note">
            <ShieldCheck size={21} />
            <p>
              Online subscriptions are being connected right now. In the
              meantime, <Link href="/implementation">send an implementation
              request</Link> and the agency will set up your plan manually.
            </p>
          </div>
        )}

        {/* ---------------- What installation covers ---------------- */}
        <div className="install-covers">
          <div className="install-covers-head">
            <Wrench size={20} />
            <h2>What the one-time installation covers</h2>
          </div>
          <ul className="check-list cols">
            {INSTALL_INCLUDES.map(item => (
              <li key={item}>
                <Check size={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="install-note">
            After installation, your monthly plan keeps every automation
            running — hosting the workflows, monitoring failures, improving
            replies, and adding new capabilities as your plan grows.
          </p>
        </div>

        {/* ---------------- Free website offer ---------------- */}
        <div className="free-website-offer">
          <div className="free-website-head">
            <span className="free-website-icon">
              <Globe size={22} />
            </span>
            <div>
              <h2>{WEBSITE_OFFER.headline}</h2>
              <p>{WEBSITE_OFFER.body}</p>
            </div>
          </div>
          <ul className="check-list cols">
            {WEBSITE_OFFER.bullets.map(item => (
              <li key={item}>
                <Check size={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ---------------- Pricing justification ---------------- */}
        <div className="value-justification">
          <div className="page-heading compact center">
            <span className="eyebrow">
              <i /> WHY THE MATH WORKS
            </span>
            <h2>
              How the pricing
              <br />
              <em>pays for itself.</em>
            </h2>
          </div>
          <div className="value-grid">
            <article className="value-card">
              <span className="value-icon">
                <Contact size={22} />
              </span>
              <h3>One saved contact covers a month</h3>
              <p>
                What is a missed enquiry worth to you? One booking, one client,
                or one order that would have slipped past a busy afternoon pays
                for the entire Growing Business month — at $79. Aria answers in
                seconds, every time, including nights and weekends.
              </p>
            </article>
            <article className="value-card">
              <span className="value-icon">
                <TrendingUp size={22} />
              </span>
              <h3>A fraction of hiring</h3>
              <p>
                A part-time front-desk assistant or virtual assistant typically
                costs $600–1,500 per month — and still works one chat at a
                time, one shift at a time. Aria runs every channel at once, 24/7,
                for less than 10% of that, with your team staying in control.
              </p>
            </article>
            <article className="value-card">
              <span className="value-icon">
                <Package size={22} />
              </span>
              <h3>Cheaper than buying separately</h3>
              <p>
                Individual workflows cost $99–499 each as one-time kits. The
                Growing Business plan installs three active workflows, adds
                another every quarter, and includes hosting, monitoring, and
                tuning — value that compounds every month.
              </p>
            </article>
          </div>
          <p className="install-note center">
            Most offices recover the one-time installation fee within the first
            month of recovered contacts and saved admin hours. Comparison
            figures are illustrative; your exact numbers depend on your volume.
          </p>
        </div>

        <div className="guardrail-note">
          <ShieldCheck size={22} />
          <p>
            The installation fee and monthly plan are billed through Dodo
            Payments, a merchant of record that handles taxes, invoices, and
            payment methods. Cancel any time — everything already installed
            keeps you in control of your data.
          </p>
        </div>
        <div className="empty-state compact">
          <h2>Not sure which plan fits?</h2>
          <p>
            Run the 2-minute wizard — tell us your business and we&rsquo;ll
            recommend the right setup.
          </p>
          <Link href="/get-started" className="button dark">
            Get started <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
