import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { supportLabel } from "@shared/supportOptions";
import {
  ArrowRight,
  ArrowUpRight,
  ShoppingBag,
  Trash2,
  ShieldCheck,
  Loader2,
  Download,
  RefreshCw,
  FolderOpen,
  Mail,
  Tag,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getAutomation, formatPrice } from "@shared/catalog";
import { getPlan } from "@shared/plans";
import { api, downloadKit, trackEvent, type Order } from "@/lib/store";
import {
  PageShell,
  Breadcrumbs,
  useCart,
  AgentIcon,
  LoginPrompt,
} from "@/components/Storefront";
export function Cart() {
  const { items, remove } = useCart();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{
    code: string;
    discountCents: number;
  } | null>(null);
  const [supportTier, setSupportTier] = useState<"self" | "assisted" | "done_for_you">("self");
  const supportFee = supportTier === "assisted" ? 49 : supportTier === "done_for_you" ? 149 : 0;
  const selected = items.map(getAutomation).filter(x => x !== undefined);
  const total = selected.reduce((a, b) => a + b.price, 0);
  const discount = promo ? promo.discountCents / 100 : 0;
  const finalTotal = Math.max(0, total + supportFee - discount);
  const status = useQuery({
    queryKey: ["store-status"],
    queryFn: () =>
      api<{
        testMode: boolean;
        checkoutReady: boolean;
        gateway: "stripe" | "dodo";
      }>("/api/store/status"),
    retry: false,
  });
  async function applyPromo() {
    if (!promoInput.trim() || !selected.length) return;
    try {
      const result = await api<{
        code?: string;
        discountCents: number;
        error?: string;
      }>("/api/store/promo/validate", {
        code: promoInput.trim(),
        items: selected.map(x => x.id),
      });
      if (result.error || !result.code) {
        setPromo(null);
        toast.error(result.error ?? "Promo code is not valid.");
        return;
      }
      setPromo({ code: result.code, discountCents: result.discountCents });
      toast.success(`Promo code ${result.code} applied.`);
      trackEvent("promo_applied", { code: result.code });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function checkout() {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const tab = window.open("about:blank", "_blank");
    if (!tab) {
      toast.error("Please allow a new tab for secure checkout.");
      return;
    }
    setBusy(true);
    try {
      const data = await api<{ url: string; gateway?: string }>(
        "/api/store/checkout",
        {
          items: selected.map(x => x.id),
          origin: window.location.origin,
          promoCode: promo?.code,
        }
      );
      tab.location.href = data.url;
      trackEvent("checkout_started", {
        gateway: data.gateway,
        items: selected.map(x => x.id),
      });
      toast.info("Secure checkout opened in a new tab.");
    } catch (e) {
      tab.close();
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const cancelled =
    new URLSearchParams(window.location.search).get("checkout") === "cancelled";
  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs items={[{ label: "Your cart" }]} />
        <div className="page-heading compact">
          <span className="eyebrow">
            <i /> A LITTLE LESS MANUAL
          </span>
          <h1>
            Your automation <em>toolkit.</em>
          </h1>
          <p>
            Choose the workflows that fit. Connect them to your approved tools
            when you’re ready.
          </p>
        </div>
        {cancelled && (
          <div className="info-note">
            Checkout was cancelled. Your cart is unchanged and no access was
            granted.
          </div>
        )}
        {!selected.length ? (
          <div className="empty-state">
            <ShoppingBag size={38} />
            <h2>Good workflows start here.</h2>
            <p>
              Your cart is empty. Find an automation for the work your team
              repeats most.
            </p>
            <Link href="/automations" className="button dark">
              Explore automations <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {selected.map(x => (
                <article key={x.id}>
                  <span className={`cart-item-icon ${x.color}`}>
                    <AgentIcon name={x.icon} size={30} />
                  </span>
                  <div>
                    <Link href={`/automations/${x.id}`}>
                      <h3>{x.name}</h3>
                    </Link>
                    <p>Configurable n8n workflow kit</p>
                    <span>One-time download · account-linked access</span>
                  </div>
                  <strong>{formatPrice(x.price)}</strong>
                  <button
                    className="icon-button"
                    onClick={() => remove(x.id)}
                    aria-label={`Remove ${x.name}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </article>
              ))}
              <Link href="/automations" className="text-link">
                Continue exploring <ArrowUpRight size={16} />
              </Link>
              <div className="guardrail-note">
                <ShieldCheck size={22} />
                <p>
                  No external systems are connected by purchase. You’ll
                  configure your credentials, source APIs, content, and consent
                  rules using the included setup guide.
                </p>
              </div>
            </div>
            <aside className="order-summary">
              <span className="panel-label">YOUR ORDER</span>
              <h2>A smarter toolkit.</h2>
              <div className="summary-row">
                <span>
                  {selected.length} workflow kit{selected.length > 1 ? "s" : ""}
                </span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <div className="summary-row total">
                <span>Subtotal</span>
                <strong>{formatPrice(total)}</strong>
              </div>

              {/* Assisted Installation Options */}
              <div className="my-4 p-3.5 rounded-xl border border-border bg-secondary/40 text-xs">
                <span className="font-semibold block mb-2 text-foreground">
                  Installation Preference:
                </span>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tier"
                      checked={supportTier === "self"}
                      onChange={() => setSupportTier("self")}
                    />
                    <span className="flex-1">Self-install (Guide included)</span>
                    <span className="text-muted-foreground">$0</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tier"
                      checked={supportTier === "assisted"}
                      onChange={() => setSupportTier("assisted")}
                    />
                    <span className="flex-1">Assisted 1-on-1 setup call</span>
                    <span className="font-semibold text-emerald-600">+$49</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tier"
                      checked={supportTier === "done_for_you"}
                      onChange={() => setSupportTier("done_for_you")}
                    />
                    <span className="flex-1">Done-for-you agency deploy</span>
                    <span className="font-semibold text-emerald-600">+$149</span>
                  </label>
                </div>
              </div>

              {supportFee > 0 && (
                <div className="summary-row">
                  <span>Installation support</span>
                  <strong>+{formatPrice(supportFee)}</strong>
                </div>
              )}

              {promo && discount > 0 && (
                <div className="summary-row promo-row">
                  <span>
                    <Tag size={13} /> {promo.code}
                    <button
                      className="text-link promo-remove"
                      onClick={() => setPromo(null)}
                      aria-label="Remove promo code"
                    >
                      remove
                    </button>
                  </span>
                  <strong>-{formatPrice(discount)}</strong>
                </div>
              )}
              <div className="summary-row total">
                <span>Today&apos;s total</span>
                <strong>{formatPrice(finalTotal)}</strong>
              </div>

              {/* Payment Methods Badges */}
              <div className="flex flex-wrap items-center gap-1.5 my-3 text-[11px] text-muted-foreground">
                <span className="px-2 py-0.5 rounded bg-secondary font-medium">💳 Cards</span>
                <span className="px-2 py-0.5 rounded bg-secondary font-medium">⚡ UPI (GPay/PhonePe)</span>
                <span className="px-2 py-0.5 rounded bg-secondary font-medium">🏦 NetBanking</span>
                <span className="px-2 py-0.5 rounded bg-secondary font-medium">🔒 Dodo & Stripe Secure</span>
              </div>
              {!promo && (
                <div className="promo-entry">
                  <input
                    type="text"
                    placeholder="Promo code"
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value.toUpperCase())}
                    maxLength={40}
                    aria-label="Promo code"
                  />
                  <button
                    className="text-link"
                    onClick={applyPromo}
                    disabled={!promoInput.trim()}
                  >
                    Apply
                  </button>
                </div>
              )}
              <p>
                USD · draft prices · test checkout only. Any tax or applicable
                adjustments are shown by{" "}
                {status.data?.gateway === "dodo" ? "Dodo Payments" : "Stripe"}.
              </p>
              <div className="test-checkout-note">
                <strong>Preview checkout, not a live charge.</strong>
                <span>
                  {status.data?.gateway === "dodo"
                    ? "Dodo test mode is enabled — test payment methods only, no real charge."
                    : "Use Stripe's 4242 4242 4242 4242 test card. Real card details are not needed."}
                </span>
              </div>
              <button
                onClick={checkout}
                disabled={
                  busy || status.isLoading || !status.data?.checkoutReady
                }
                className="button dark full"
              >
                {busy ? (
                  <>
                    <Loader2 size={17} className="spin" />
                    Opening checkout...
                  </>
                ) : (
                  <>
                    {user
                      ? "Continue to test checkout"
                      : "Sign in to check out"}
                    <ArrowUpRight size={17} />
                  </>
                )}
              </button>
              {!status.data?.checkoutReady && !status.isLoading && (
                <div className="form-error" role="alert">
                  Checkout is not available right now. Please try later or
                  request implementation.
                </div>
              )}
              <span className="secure-label">
                <ShieldCheck size={15} />{" "}
                {status.data?.gateway === "dodo"
                  ? "Hosted securely by Dodo Payments"
                  : "Hosted securely by Stripe"}
              </span>
              <small>
                Kit access is granted after the verified payment webhook, not
                simply after returning here.
              </small>
              <Link href="/terms" className="fine-link">
                Purchase information & exclusions
              </Link>
            </aside>
          </div>
        )}
      </div>
    </PageShell>
  );
}
export function Orders() {
  const { user, loading } = useAuth();
  const data = useQuery({
    queryKey: ["store-orders"],
    queryFn: () => api<{ orders: Order[] }>("/api/store/orders"),
    enabled: !!user,
    refetchInterval: query =>
      query.state.data?.orders.some(o => o.status === "pending") ? 5000 : false,
    retry: false,
  });
  const returned = new URLSearchParams(window.location.search).has("checkout");
  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs items={[{ label: "My purchases" }]} />
        <div className="page-heading compact">
          <span className="eyebrow">
            <i /> YOUR ARIA WORKSPACE
          </span>
          <h1>
            Your workflows.
            <br />
            <em>Ready to make yours.</em>
          </h1>
          <p>
            Purchase records and configuration kits stay linked to your
            signed-in account.
          </p>
        </div>
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spin" />
            Loading your workspace...
          </div>
        ) : !user ? (
          <LoginPrompt />
        ) : (
          <>
            {returned && (
              <div className="info-note">
                <ShieldCheck size={21} />
                <p>
                  We verify the payment with Stripe before granting access. If
                  you just completed checkout, a “pending” record can take a
                  moment to update. This is test checkout only.
                </p>
              </div>
            )}
            <div className="workspace-toolbar">
              <span>{user.name || user.email || "Your account"}</span>
              <button className="text-link" onClick={() => data.refetch()}>
                <RefreshCw size={15} /> Refresh purchases
              </button>
              {user.role === "admin" && (
                <Link href="/admin" className="text-link">
                  Agency inbox <ArrowRight size={15} />
                </Link>
              )}
            </div>
            {data.isLoading ? (
              <div className="loading-state">
                <Loader2 className="spin" />
                Retrieving purchases...
              </div>
            ) : data.error ? (
              <div className="form-error" role="alert">
                {(data.error as Error).message}
              </div>
            ) : !data.data?.orders.length ? (
              <div className="empty-state">
                <FolderOpen size={35} />
                <h2>Your library is waiting.</h2>
                <p>
                  No purchases yet. Explore a ready-made kit or ask us to
                  implement a custom workflow.
                </p>
                <Link href="/automations" className="button dark">
                  Find your automation <ArrowRight size={18} />
                </Link>
              </div>
            ) : (
              <div className="orders-list">
                {data.data.orders.map(order => (
                  <article className="order-card" key={order.id}>
                    <div className="order-top">
                      <div>
                        <span className="panel-label">ORDER {order.id}</span>
                        <span>
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </span>
                      </div>
                      <span className={`status-pill ${order.status}`}>
                        {order.status === "paid"
                          ? "Completed · test payment"
                          : order.status === "pending"
                            ? "Payment pending"
                            : order.status}
                      </span>
                    </div>
                    {order.items.map(id => {
                      const item = getAutomation(id);
                      const planItem = id.startsWith("plan:")
                        ? getPlan(id.slice(5))
                        : null;
                      const installationItem = id.startsWith("install:")
                        ? getPlan(id.slice(8))
                        : null;
                      const downloadable = Boolean(item);
                      return (
                        <div className="order-product" key={id}>
                          <span
                            className={`cart-item-icon ${item?.color || "violet"}`}
                          >
                            <AgentIcon name={item?.icon || "headset"} />
                          </span>
                          <div>
                            <h3>
                              {item?.name ||
                                (planItem
                                  ? `${planItem.name} subscription`
                                  : null) ||
                                (installationItem
                                  ? `${installationItem.name} installation`
                                  : id)}
                            </h3>
                            <p>
                              {downloadable
                                ? "n8n starter workflows · setup guide · synthetic fixtures"
                                : "Managed subscription billing item"}
                            </p>
                            {downloadable && (
                              <Link
                                className="text-link"
                                href={`/automations/${id}/setup`}
                              >
                                Installation & API guide{" "}
                                <ArrowRight size={13} />
                              </Link>
                            )}
                          </div>
                          {order.status === "paid" && downloadable && (
                            <button
                              className="button outline small"
                              onClick={() =>
                                downloadKit(order.id, id).catch(e =>
                                  toast.error(e.message)
                                )
                              }
                            >
                              <Download size={16} /> Download kit
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <div className="order-bottom">
                      <span>
                        Draft test pricing · no production connection included
                      </span>
                      <strong>{formatPrice(order.amount)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
export function Admin() {
  const { user, loading } = useAuth();
  const list = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: () =>
      api<{ inquiries: Record<string, string>[] }>(
        "/api/store/admin/inquiries"
      ),
    enabled: user?.role === "admin",
    retry: false,
  });
  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () =>
      api<{
        total: number;
        paid: number;
        pending: number;
        revenue: number;
        inquiries: number;
        subscribers: number;
        activeSubscriptions: number;
        eventsTracked: number;
      }>("/api/store/admin/overview"),
    enabled: user?.role === "admin",
    retry: false,
  });
  const [provisionBusy, setProvisionBusy] = useState(false);
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryName, setRecoveryName] = useState("");
  const [recoveryReference, setRecoveryReference] = useState("");
  const [recoveryAmount, setRecoveryAmount] = useState("");
  const [recoveryUrl, setRecoveryUrl] = useState<string | null>(null);
  async function provisionDodo() {
    setProvisionBusy(true);
    try {
      const result = await api<{
        created: number;
        mapped: number;
        failed: string[];
      }>("/api/store/admin/dodo/provision");
      toast.success(
        `Dodo products ready — ${result.mapped} existing, ${result.created} newly created.${result.failed.length ? ` Failed: ${result.failed.join(", ")}` : ""}`
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setProvisionBusy(false);
    }
  }
  async function createRecoveryCheckout(event: FormEvent) {
    event.preventDefault();
    setRecoveryBusy(true);
    setRecoveryUrl(null);
    try {
      const amountCents = Math.round(Number(recoveryAmount) * 100);
      if (!Number.isFinite(amountCents) || amountCents < 100) {
        throw new Error("Enter a recovery amount of at least $1.00.");
      }
      const result = await api<{
        url: string;
        orderId: string;
        amount: number;
        currency: string;
      }>("/api/store/admin/dodo/recovery-checkout", {
        customerEmail: recoveryEmail,
        customerName: recoveryName,
        reference: recoveryReference,
        amountCents,
        origin: window.location.origin,
      });
      setRecoveryUrl(result.url);
      try {
        await navigator.clipboard?.writeText(result.url);
        toast.success("Recovery checkout link created and copied.");
      } catch {
        toast.success("Recovery checkout link created.");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRecoveryBusy(false);
    }
  }
  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs items={[{ label: "Agency inbox" }]} />
        <div className="page-heading compact">
          <span className="eyebrow">
            <i /> PRIVATE AGENCY WORKSPACE
          </span>
          <h1>
            Implementation <em>inquiries.</em>
          </h1>
          <p>
            Business requests submitted through the storefront. Restricted to
            the authorized agency owner.
          </p>
        </div>
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spin" />
          </div>
        ) : !user ? (
          <LoginPrompt text="Sign in with the agency owner account to view implementation inquiries." />
        ) : user.role !== "admin" ? (
          <div className="empty-state">
            <ShieldCheck size={32} />
            <h2>Owner access only</h2>
            <p>This inbox is not available to customer accounts.</p>
            <Link href="/orders" className="button dark">
              My purchases
            </Link>
          </div>
        ) : (
          <>
            <div className="admin-overview">
              <div className="admin-stat">
                <span className="panel-label">PAID ORDERS</span>
                <strong>{overview.data?.paid ?? "–"}</strong>
                <small>
                  {overview.data?.revenue !== undefined
                    ? `$${overview.data.revenue.toFixed(0)} revenue`
                    : ""}
                </small>
              </div>
              <div className="admin-stat">
                <span className="panel-label">ACTIVE PLANS</span>
                <strong>{overview.data?.activeSubscriptions ?? "–"}</strong>
                <small>monthly subscriptions</small>
              </div>
              <div className="admin-stat">
                <span className="panel-label">NEWSLETTER</span>
                <strong>{overview.data?.subscribers ?? "–"}</strong>
                <small>email subscribers</small>
              </div>
              <div className="admin-stat">
                <span className="panel-label">FUNNEL EVENTS</span>
                <strong>{overview.data?.eventsTracked ?? "–"}</strong>
                <small>tracked interactions</small>
              </div>
              <div className="admin-stat">
                <span className="panel-label">INQUIRIES</span>
                <strong>{overview.data?.inquiries ?? "–"}</strong>
                <small>implementation briefs</small>
              </div>
            </div>
            <div className="admin-tools">
              <button
                className="button dark small"
                onClick={provisionDodo}
                disabled={provisionBusy}
              >
                {provisionBusy ? (
                  <>
                    <Loader2 size={15} className="spin" /> Provisioning...
                  </>
                ) : (
                  <>Sync catalog to Dodo Payments</>
                )}
              </button>
              <span>
                Creates matching products in your Dodo dashboard for every kit
                plan, installation fee, and the DenialsDoctor recovery product
                (requires DODO_PAYMENTS_API_KEY).
              </span>
            </div>
            <form className="admin-tools" onSubmit={createRecoveryCheckout}>
              <div>
                <span className="panel-label">
                  CONTINGENCY RECOVERY PAYMENT
                </span>
                <strong>Create a pay-what-you-want checkout link</strong>
                <small>
                  Uses the DenialsDoctor recovery product. Minimum amount is
                  $1.00; the exact amount entered here is charged once.
                </small>
              </div>
              <div className="form-row">
                <label>
                  Customer email <span>*</span>
                  <input
                    required
                    type="email"
                    value={recoveryEmail}
                    onChange={event => setRecoveryEmail(event.target.value)}
                    placeholder="customer@example.com"
                  />
                </label>
                <label>
                  Customer name
                  <input
                    value={recoveryName}
                    onChange={event => setRecoveryName(event.target.value)}
                    placeholder="Optional"
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Claim/reference <span>*</span>
                  <input
                    required
                    value={recoveryReference}
                    onChange={event => setRecoveryReference(event.target.value)}
                    placeholder="DD-CLAIM-001"
                  />
                </label>
                <label>
                  Amount (USD) <span>*</span>
                  <input
                    required
                    inputMode="decimal"
                    type="number"
                    min="1"
                    step="0.01"
                    value={recoveryAmount}
                    onChange={event => setRecoveryAmount(event.target.value)}
                    placeholder="450.00"
                  />
                </label>
              </div>
              <button
                className="button dark small"
                type="submit"
                disabled={recoveryBusy}
              >
                {recoveryBusy ? "Creating link..." : "Create recovery link"}
              </button>
              {recoveryUrl ? (
                <label>
                  Checkout URL
                  <input
                    readOnly
                    value={recoveryUrl}
                    onFocus={event => event.currentTarget.select()}
                  />
                </label>
              ) : null}
            </form>
            <button className="text-link" onClick={() => list.refetch()}>
              <RefreshCw size={16} /> Refresh inbox
            </button>
            {list.isLoading ? (
              <div className="loading-state">Loading inquiries...</div>
            ) : list.error ? (
              <div className="form-error">{(list.error as Error).message}</div>
            ) : !list.data?.inquiries.length ? (
              <div className="empty-state">
                <Mail size={33} />
                <h2>No inquiries yet.</h2>
                <p>Submitted implementation briefs will appear here.</p>
              </div>
            ) : (
              <div className="inquiry-list">
                {list.data.inquiries.map(x => (
                  <article key={x.id}>
                    <span className="panel-label">
                      {x.reference || x.id} ·{" "}
                      {new Date(x.createdAt).toLocaleDateString()}
                    </span>
                    <h2>{x.business}</h2>
                    <div className="inquiry-details">
                      <span>{x.name}</span>
                      <a href={`mailto:${x.email}`}>{x.email}</a>
                      <span>{x.phone}</span>
                    </div>
                    <p>
                      <strong>Industry:</strong> {x.industry} ·{" "}
                      <strong>Workflow:</strong>{" "}
                      {getAutomation(x.automation)?.name || x.automation}
                    </p>
                    <p>
                      <strong>Tools:</strong> {x.tools}
                    </p>
                    <p>
                      <strong>Goals:</strong> {x.goals}
                    </p>
                    <div className="admin-onboarding">
                      <strong>Requested service:</strong>{" "}
                      {supportLabel(x.supportOption)}
                      <br />
                      <strong>Location / timezone:</strong>{" "}
                      {[x.location, x.country, x.timezone]
                        .filter(Boolean)
                        .join(" · ") || "Not provided"}
                      <br />
                      <strong>Languages / handoff owner:</strong>{" "}
                      {[x.languages, x.ownerRole].filter(Boolean).join(" · ") ||
                        "To be agreed"}
                      <br />
                      <strong>Provider/API docs supplied:</strong>{" "}
                      {x.apiProviders ||
                        "No provider list yet. Request public documentation, never keys."}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
