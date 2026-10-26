import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  Copy,
  Globe,
  LayoutDashboard,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getPlan } from "@shared/plans";
import { getAutomation } from "@shared/catalog";
import { getCategory, getDeliveryOption } from "@shared/solutions";
import { api } from "@/lib/store";
import { PageShell, Breadcrumbs, LoginPrompt } from "@/components/Storefront";

type OrderSummary = {
  id: string;
  createdAt: string;
  status: string;
  items: string[];
  amount: number;
  currency: string;
};

type SubscriptionSummary = {
  id: string;
  planId: string;
  status: string;
  createdAt: string;
  nextBillingDate: string | null;
};

type OnboardingSummary = {
  id: string;
  businessName: string | null;
  website: string | null;
  categoryId: string;
  delivery: string | null;
  planId: string | null;
  status: string;
  createdAt: string;
};

  const STATUS_LABELS: Record<string, { label: string; step: number }> = {
  new: { label: "Received", step: 1 },
  paid: { label: "Payment verified", step: 2 },
  contacted: { label: "Discovery call scheduled", step: 3 },
  installing: { label: "Being installed", step: 4 },
  blocked: { label: "Waiting for client input", step: 3 },
  live: { label: "Live & automated", step: 5 },
};

export default function Portal() {
  const { user, loading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const onboarding = useQuery({
    queryKey: ["onboarding-mine"],
    queryFn: () => api<{ requests: OnboardingSummary[] }>("/api/onboarding/mine"),
    enabled: Boolean(user),
  });
  const orders = useQuery({
    queryKey: ["portal-orders"],
    queryFn: () => api<{ orders: OrderSummary[] }>("/api/store/orders"),
    enabled: Boolean(user),
  });
  const subscriptions = useQuery({
    queryKey: ["portal-subscriptions"],
    queryFn: () =>
      api<{ subscriptions: SubscriptionSummary[] }>("/api/store/subscriptions"),
    enabled: Boolean(user),
  });

  if (loading) {
    return (
      <PageShell>
        <div className="container empty-state">
          <Loader2 size={26} className="spin" />
          <p>Loading your portal...</p>
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <div className="container">
          <LoginPrompt text="Sign in to open your Aria portal — your automations, installation status, and follow-up history all live here." />
        </div>
      </PageShell>
    );
  }

  const latest = onboarding.data?.requests?.[0];
  const category = latest ? getCategory(latest.categoryId) : undefined;
  const delivery = latest?.delivery
    ? getDeliveryOption(latest.delivery)
    : undefined;
  const activeSubscription = subscriptions.data?.subscriptions?.find(
    subscription => ["active", "past_due", "on_hold"].includes(subscription.status)
  );
  const plan = activeSubscription ? getPlan(activeSubscription.planId) : undefined;
  const statusInfo = latest ? STATUS_LABELS[latest.status] ?? STATUS_LABELS.new : null;

  const kitItems = (orders.data?.orders ?? [])
    .flatMap(order => order.items)
    .map(item => (item.startsWith("plan:") || item.startsWith("install:") ? null : getAutomation(item)))
    .filter(Boolean);
  const embedEligible = latest?.delivery === "embed" || latest?.delivery === "both";
  const embedSnippet = `<!-- Aria widget: never lose a contact -->\n<script src="${window.location.origin}/embed/aria.js" data-aria-business="${user.id}" defer></script>`;

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(embedSnippet);
      setCopied(true);
      toast.success("Embed snippet copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed — select the snippet manually.");
    }
  }

  async function cancelSubscription() {
    if (!activeSubscription || !window.confirm("Cancel this subscription? Existing installed work remains under the agreed terms.")) return;
    setCancelling(true);
    try {
      await api(`/api/store/subscriptions/${activeSubscription.id}/cancel`, {});
      await subscriptions.refetch();
      toast.success("Cancellation requested.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel subscription.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs items={[{ label: "Portal" }]} />
        <div className="page-heading compact">
          <span className="eyebrow">
            <i /> YOUR ARIA PORTAL
          </span>
          <h1>
            Everything automated.
            <br />
            <em>Nothing slips.</em>
          </h1>
          <p>
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}. This
            is where your installation status, automations, and plan live.
          </p>
        </div>

        <div className="portal-grid">
          {/* Installation status */}
          <article className="portal-card wide">
            <div className="portal-card-head">
              <Sparkles size={19} />
              <h2>Installation status</h2>
            </div>
            {latest && statusInfo ? (
              <>
                <p className="portal-business">
                  {latest.businessName || "Your business"}
                  {latest.website ? (
                    <span> · {latest.website}</span>
                  ) : null}
                </p>
                <ol className="portal-timeline">
                  {Object.entries(STATUS_LABELS).map(([, info], index) => (
                    <li
                      key={info.label}
                      className={statusInfo.step >= index + 1 ? "done" : ""}
                    >
                      <Check size={14} />
                      {info.label}
                    </li>
                  ))}
                </ol>
                <div className="portal-meta">
                  {category && (
                    <span>
                      <strong>Category:</strong> {category.name}
                    </span>
                  )}
                  {delivery && (
                    <span>
                      <strong>Delivery:</strong> {delivery.name}
                    </span>
                  )}
                </div>
                <p className="portal-note">
                  Status: <strong>{statusInfo.label}</strong>. Questions in the
                  meantime? <a href={`mailto:sriraajj@gmail.com`}>Email the agency</a>.
                </p>
              </>
            ) : (
              <p className="portal-note">
                No installation yet. Run the{" "}
                <Link href="/get-started">2-minute get-started wizard</Link> and
                we&rsquo;ll automate your business — whatever you run.
              </p>
            )}
          </article>

          {/* Plan */}
          <article className="portal-card">
            <div className="portal-card-head">
              <Zap size={19} />
              <h2>Your plan</h2>
            </div>
            {activeSubscription && plan ? (
              <>
                <p className="portal-plan-name">{plan.name}</p>
                <p className="portal-note">
                  Status: <strong>{activeSubscription.status}</strong>
                  {activeSubscription.nextBillingDate
                    ? ` · next billing ${new Date(
                        activeSubscription.nextBillingDate
                      ).toLocaleDateString()}`
                    : ""}
                </p>
                <p className="portal-note">
                  {formatMonthly(plan.monthlyPrice)} every month · installation
                  already covered.
                </p>
                <button className="button outline small" onClick={cancelSubscription} disabled={cancelling}>
                  {cancelling ? "Cancelling..." : "Cancel subscription"}
                </button>
              </>
            ) : (
              <p className="portal-note">
                No subscription yet.{" "}
                <Link href="/get-started">Start your installation</Link> —
                one-time setup + a monthly plan.
              </p>
            )}
          </article>

          {/* Automations */}
          <article className="portal-card">
            <div className="portal-card-head">
              <BadgeCheck size={19} />
              <h2>Your automations</h2>
            </div>
            {kitItems.length > 0 ? (
              <ul className="portal-kits">
                {kitItems.map(kit => (
                  <li key={kit!.id}>
                    <Check size={14} />
                    <Link href={`/automations/${kit!.id}`}>{kit!.name}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="portal-note">
                Your installed workflows appear here once installation starts.
              </p>
            )}
            <Link href="/automations" className="text-link">
              Browse the library <ArrowUpRight size={14} />
            </Link>
          </article>

          {/* Website embed */}
          <article className="portal-card wide">
            <div className="portal-card-head">
              <Globe size={19} />
              <h2>Website widget</h2>
            </div>
            {embedEligible ? (
              <>
                <p className="portal-note">
                  Paste this snippet before <code>&lt;/body&gt;</code> on your
                  website. We normally install it for you during setup — this is
                  here in case your developer needs it.
                </p>
                <pre className="embed-snippet">{embedSnippet}</pre>
                <button className="button dark small" onClick={copySnippet}>
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "Copied" : "Copy snippet"}
                </button>
              </>
            ) : (
              <p className="portal-note">
                {delivery
                  ? `Your setup is "${delivery.name}" — no website embed needed.`
                  : "Choose a delivery option in the get-started wizard to receive your widget."}
              </p>
            )}
          </article>
        </div>

        <div className="portal-promise">
          <ShieldCheck size={22} />
          <p>
            <strong>The Aria promise:</strong> whatever business you run, you
            never lose a contact. Every enquiry answered, every follow-up sent,
            everything visible here.
          </p>
          <Link href="/get-started" className="button dark small">
            <LayoutDashboard size={15} /> Add more automation
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

function formatMonthly(price: number) {
  return `$${price}`;
}
