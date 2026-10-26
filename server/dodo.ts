import DodoPayments from "dodopayments";
import type { Express, Request, Response } from "express";
import express from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { and, desc, eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { automations, getAutomation } from "../shared/catalog";
import { PLANS, getPlan } from "../shared/plans";
import { getDb } from "./db";
import {
  dodoEvents,
  dodoProductMap,
  storeOrders,
  storePurchases,
  storeSubscriptions,
  onboardingRequests,
  type PaymentGateway,
} from "../drizzle/schema";

/**
 * Dodo Payments gateway (merchant of record).
 *
 * Configuration:
 *   DODO_PAYMENTS_API_KEY  – secret API key from the Dodo dashboard
 *   DODO_PAYMENTS_MODE     – "test_mode" (default) or "live_mode"
 *   DODO_WEBHOOK_KEY       – webhook signing key (whsec_...) for verification
 *   DODO_RETURN_ORIGIN     – optional explicit origin for return URLs
 *
 * When an API key is present, checkout switches from Stripe test mode to Dodo.
 * Catalog products are provisioned into Dodo automatically the first time
 * they are needed, and the mapping is stored in dodo_product_map.
 */

export function dodoConfigured(): boolean {
  const key = process.env.DODO_PAYMENTS_API_KEY;
  return Boolean(key && key.trim().length > 10);
}

export function dodoMode(): "test_mode" | "live_mode" {
  const mode = (process.env.DODO_PAYMENTS_MODE ?? "").trim().toLowerCase();
  if (mode === "live_mode" || mode === "live") return "live_mode";
  return "test_mode";
}

export function dodoWebhookConfigured(): boolean {
  const key = process.env.DODO_WEBHOOK_KEY;
  return Boolean(key && key.trim().length > 10);
}

export const DODO_RECOVERY_CATALOG_ID = "recovery";

export function dodoRecoveryMinimumCents(): number {
  const configured = Number.parseInt(
    process.env.DODO_RECOVERY_MINIMUM_CENTS ?? "100",
    10
  );
  return Number.isInteger(configured) && configured >= 1 ? configured : 100;
}

export function dodoRecoverySuggestedPriceCents(): number {
  const configured = Number.parseInt(
    process.env.DODO_RECOVERY_SUGGESTED_PRICE_CENTS ?? "100",
    10
  );
  return Number.isInteger(configured) &&
    configured >= dodoRecoveryMinimumCents()
    ? configured
    : dodoRecoveryMinimumCents();
}

let dodoClient: DodoPayments | null = null;

function client(): DodoPayments {
  if (!dodoConfigured()) throw new Error("DODO_PAYMENTS_API_KEY is not set");
  if (!dodoClient) {
    dodoClient = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY!.trim(),
      environment: dodoMode(),
    });
  }
  return dodoClient;
}

type ProvisionedProduct = { id: string; kind: "one_time" | "recurring" };

function mappingKey(catalogId: string): string {
  return `${dodoMode()}:${catalogId}`;
}

async function findMapping(automationId: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(dodoProductMap)
    .where(eq(dodoProductMap.automationId, mappingKey(automationId)))
    .limit(1);
  return rows[0]?.dodoProductId ?? null;
}

async function saveMapping(automationId: string, dodoProductId: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(dodoProductMap)
    .values({ automationId: mappingKey(automationId), dodoProductId })
    .onConflictDoUpdate({
      target: dodoProductMap.automationId,
      set: { dodoProductId },
    });
}

/**
 * Creates the matching product in Dodo when no mapping exists yet. Returns
 * the Dodo product id for either a catalog automation or a subscription plan.
 */
export async function ensureDodoProductId(
  catalogId: string,
  kind: "one_time" | "recurring"
): Promise<string | null> {
  const existing = await findMapping(catalogId);
  if (existing) return existing;
  const automation = kind === "one_time" ? getAutomation(catalogId) : undefined;
  const plan = kind === "recurring" ? getPlan(catalogId) : undefined;
  if (!automation && !plan) return null;
  const db = await getDb();
  if (!db) return null;
  try {
    const product = await client().products.create({
      name: automation ? automation.name : plan!.name,
      description:
        (automation?.tagline || plan!.tagline).slice(0, 400) ||
        "Aria automation",
      tax_category: "digital_products",
      price:
        kind === "one_time"
          ? {
              type: "one_time_price",
              currency: "USD",
              price: automation!.price * 100,
              discount_bps: 0,
            }
          : {
              type: "recurring_price",
              currency: "USD",
              price: plan!.monthlyPrice * 100,
              payment_frequency_count: 1,
              payment_frequency_interval: "Month",
              discount_bps: 0,
              tax_inclusive: false,
            },
    } as Parameters<ReturnType<typeof client>["products"]["create"]>[0]);
    if (!product?.product_id) throw new Error("Dodo returned no product_id");
    await saveMapping(catalogId, product.product_id);
    console.log(
      `[Dodo] provisioned product ${product.product_id} for ${catalogId}`
    );
    return product.product_id;
  } catch (error) {
    console.error(
      `[Dodo] failed to provision product for ${catalogId}`,
      error instanceof Error ? error.message : "unknown"
    );
    return null;
  }
}

/**
 * One-time "installation" product per plan, charged together with the
 * subscription in the same checkout session. Keyed as `install:{planId}`.
 */
export async function ensureInstallProductId(
  planId: string
): Promise<string | null> {
  const catalogId = `install:${planId}`;
  const existing = await findMapping(catalogId);
  if (existing) return existing;
  const plan = getPlan(planId);
  if (!plan) return null;
  const db = await getDb();
  if (!db) return null;
  try {
    const product = await client().products.create({
      name: `Aria Installation — ${plan.name} (one-time)`,
      description:
        "One-time installation: discovery call, workflow build, channel connections, website embed / portal setup, testing, and go-live.".slice(
          0,
          400
        ),
      tax_category: "digital_products",
      price: {
        type: "one_time_price",
        currency: "USD",
        price: plan.installFee * 100,
        discount_bps: 0,
      },
    } as Parameters<ReturnType<typeof client>["products"]["create"]>[0]);
    if (!product?.product_id) throw new Error("Dodo returned no product_id");
    await saveMapping(catalogId, product.product_id);
    console.log(
      `[Dodo] provisioned installation product ${product.product_id} for ${planId}`
    );
    return product.product_id;
  } catch (error) {
    console.error(
      `[Dodo] failed to provision installation product for ${planId}`,
      error instanceof Error ? error.message : "unknown"
    );
    return null;
  }
}

/**
 * One-time pay-what-you-want product for contingency recovery fees. The
 * minimum and suggested amounts are expressed in USD cents.
 */
export async function ensureDodoRecoveryProductId(): Promise<string | null> {
  const configured = process.env.DODO_RECOVERY_PRODUCT_ID?.trim();
  if (configured) {
    await saveMapping(DODO_RECOVERY_CATALOG_ID, configured);
    return configured;
  }
  const existing = await findMapping(DODO_RECOVERY_CATALOG_ID);
  if (existing) return existing;
  const db = await getDb();
  if (!db) return null;
  try {
    const product = await client().products.create({
      name: "DenialsDoctor — Recovery",
      description:
        "Contingency recovery fee for claims recovered by DenialsDoctor.",
      tax_category: "digital_products",
      price: {
        type: "one_time_price",
        currency: "USD",
        price: dodoRecoveryMinimumCents(),
        discount_bps: 0,
        pay_what_you_want: true,
        suggested_price: dodoRecoverySuggestedPriceCents(),
        tax_inclusive: false,
      },
    } as Parameters<ReturnType<typeof client>["products"]["create"]>[0]);
    if (!product?.product_id) throw new Error("Dodo returned no product_id");
    await saveMapping(DODO_RECOVERY_CATALOG_ID, product.product_id);
    console.log(`[Dodo] provisioned recovery product ${product.product_id}`);
    return product.product_id;
  } catch (error) {
    console.error(
      "[Dodo] failed to provision recovery product",
      error instanceof Error ? error.message : "unknown"
    );
    return null;
  }
}

/**
 * Admin utility: pre-provision every catalog item and plan. Safe to re-run;
 * existing mappings are reused.
 */
export async function provisionAllDodoProducts(): Promise<{
  created: number;
  mapped: number;
  failed: string[];
}> {
  let created = 0;
  let failed: string[] = [];
  const targets: {
    id: string;
    kind: ProvisionedProduct["kind"] | "recovery";
  }[] = [
    ...automations.map(a => ({ id: a.id, kind: "one_time" as const })),
    ...PLANS.map(p => ({ id: p.id, kind: "recurring" as const })),
    ...PLANS.map(p => ({ id: `install:${p.id}`, kind: "one_time" as const })),
    { id: DODO_RECOVERY_CATALOG_ID, kind: "recovery" as const },
  ];
  let mapped = 0;
  for (const target of targets) {
    const existing = await findMapping(target.id);
    if (existing) {
      mapped += 1;
      continue;
    }
    let productId: string | null = null;
    if (target.kind === "recovery") {
      productId = await ensureDodoRecoveryProductId();
    } else if (target.id.startsWith("install:")) {
      productId = await ensureInstallProductId(
        target.id.slice("install:".length)
      );
    } else {
      productId = await ensureDodoProductId(target.id, target.kind);
    }
    if (productId) created += 1;
    else failed.push(target.id);
  }
  return { created, mapped, failed };
}

function returnOrigin(requested: unknown): string | null {
  const candidates = [
    typeof requested === "string" ? requested : null,
    process.env.DODO_RETURN_ORIGIN,
    process.env.PUBLIC_APP_ORIGIN,
    process.env.PUBLIC_SITE_ORIGIN,
    process.env.VITE_PUBLIC_APP_URL,
  ].filter((value): value is string => Boolean(value));
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      if (!/^https?:$/.test(url.protocol)) continue;
      return url.origin;
    } catch {
      /* try next */
    }
  }
  return null;
}

export type DodoCheckoutInput = {
  orderId: string;
  userId: number;
  customerEmail: string | null;
  customerName: string | null;
  origin: string | null;
  /** Catalog ids for one-time kits, or a single plan id for subscriptions. */
  catalogIds: string[];
  kind: "one_time" | "recurring";
  /** Optional promo code; must exist as a discount in the Dodo dashboard. */
  discountCode?: string | null;
  /** For subscriptions: plan id whose one-time installation fee is added to the same cart. */
  installPlanId?: string | null;
};

/**
 * Validates that a promo code also exists as a Dodo discount so checkout does
 * not fail late with an opaque gateway error.
 */
export async function dodoDiscountExists(code: string): Promise<boolean> {
  try {
    await client().discounts.retrieveByCode(code);
    return true;
  } catch {
    return false;
  }
}

export async function cancelDodoSubscription(
  subscriptionId: string
): Promise<void> {
  if (!subscriptionId) throw new Error("Subscription id is required.");
  await client().subscriptions.update(subscriptionId, {
    status: "cancelled",
    cancel_reason: "cancelled_by_customer",
    cancellation_comment:
      "Customer requested cancellation from the Aria portal.",
  });
}

export async function createDodoCheckout(
  input: DodoCheckoutInput
): Promise<{ checkoutUrl: string; sessionId: string }> {
  if (!input.catalogIds.length)
    throw new Error("At least one payment product is required.");
  const productIds = await Promise.all(
    input.catalogIds.map(id => ensureDodoProductId(id, input.kind))
  );
  if (productIds.some(productId => !productId)) {
    throw new Error(
      "Payment products are not provisioned yet. Ask the site owner to connect Dodo Payments."
    );
  }
  const origin = returnOrigin(input.origin);
  if (!origin) throw new Error("No approved return origin is configured.");
  const metadata: Record<string, string> = {
    order_id: input.orderId,
    user_id: String(input.userId),
    catalog_id: input.catalogIds.join(","),
    kind: input.kind,
  };
  const buildCart = async () => {
    const cart: { product_id: string; quantity: number }[] = productIds.map(
      productId => ({
        product_id: productId!,
        quantity: 1,
      })
    );
    if (input.installPlanId) {
      const installId = await ensureInstallProductId(input.installPlanId);
      if (!installId)
        throw new Error("Installation product is not provisioned.");
      cart.push({ product_id: installId, quantity: 1 });
    }
    return cart;
  };
  const createSession = async (
    cart: { product_id: string; quantity: number }[]
  ) =>
    client().checkoutSessions.create({
      product_cart: cart,
      customer: {
        email: input.customerEmail ?? "",
        ...(input.customerName ? { name: input.customerName } : {}),
      } as Parameters<
        ReturnType<typeof client>["checkoutSessions"]["create"]
      >[0]["customer"],
      return_url: `${origin}/orders?checkout=processing`,
      metadata,
      allow_discount_code: true,
      ...(input.discountCode ? { discount_codes: [input.discountCode] } : {}),
    } as Parameters<
      ReturnType<typeof client>["checkoutSessions"]["create"]
    >[0]);
  const session = await createSession(await buildCart());
  if (!session.checkout_url)
    throw new Error("Dodo did not return a checkout URL");
  return { checkoutUrl: session.checkout_url, sessionId: session.session_id };
}

export type DodoRecoveryCheckoutInput = {
  orderId: string;
  userId: number;
  customerEmail: string;
  customerName: string | null;
  origin: string;
  amountCents: number;
  reference: string;
};

export async function createDodoRecoveryCheckout(
  input: DodoRecoveryCheckoutInput
): Promise<{ checkoutUrl: string; sessionId: string }> {
  if (!Number.isInteger(input.amountCents))
    throw new Error("Recovery amount must be a whole number of cents.");
  if (input.amountCents < dodoRecoveryMinimumCents()) {
    throw new Error(
      `Recovery amount must be at least $${(dodoRecoveryMinimumCents() / 100).toFixed(2)}.`
    );
  }
  const productId = await ensureDodoRecoveryProductId();
  if (!productId) throw new Error("Recovery product is not provisioned.");
  const session = await client().checkoutSessions.create({
    product_cart: [
      { product_id: productId, quantity: 1, amount: input.amountCents },
    ],
    customer: {
      email: input.customerEmail,
      ...(input.customerName ? { name: input.customerName } : {}),
    } as Parameters<
      ReturnType<typeof client>["checkoutSessions"]["create"]
    >[0]["customer"],
    return_url: `${input.origin}/admin?recovery=processing`,
    metadata: {
      order_id: input.orderId,
      user_id: String(input.userId),
      catalog_id: DODO_RECOVERY_CATALOG_ID,
      kind: "recovery",
      recovery_reference: input.reference,
    },
  } as Parameters<ReturnType<typeof client>["checkoutSessions"]["create"]>[0]);
  if (!session.checkout_url)
    throw new Error("Dodo did not return a checkout URL");
  return { checkoutUrl: session.checkout_url, sessionId: session.session_id };
}

/* ------------------------------ Webhooks ------------------------------ */

/** Standard Webhooks verification (same scheme Dodo uses). */
export function verifyDodoWebhookSignature(
  rawBody: Buffer | string,
  headers: Record<string, unknown>
): { ok: true } | { ok: false; reason: string } {
  const secret = process.env.DODO_WEBHOOK_KEY?.trim();
  if (!secret) return { ok: false, reason: "not-configured" };
  const id = String(headers["webhook-id"] ?? "");
  const timestamp = String(headers["webhook-timestamp"] ?? "");
  const signatures = String(headers["webhook-signature"] ?? "");
  if (!id || !timestamp || !signatures)
    return { ok: false, reason: "missing-headers" };
  const tsSeconds = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(tsSeconds))
    return { ok: false, reason: "bad-timestamp" };
  // 5 minute tolerance, matching Standard Webhooks defaults.
  const ageMs = Math.abs(Date.now() - tsSeconds * 1000);
  if (ageMs > 5 * 60 * 1000) return { ok: false, reason: "expired-timestamp" };
  const secretBytes = secret.startsWith("whsec_")
    ? Buffer.from(secret.slice("whsec_".length), "base64")
    : Buffer.from(secret, "utf8");
  const payload =
    typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const signedContent = `${id}.${timestamp}.${payload}`;
  const expected = createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");
  const provided = signatures
    .split(/\s+/)
    .map(part => part.replace(/^v1,/, "").trim())
    .filter(Boolean);
  if (!provided.length) return { ok: false, reason: "no-signature" };
  const expectedBuf = Buffer.from(expected, "utf8");
  const match = provided.some(candidate => {
    const candidateBuf = Buffer.from(candidate, "utf8");
    return (
      candidateBuf.length === expectedBuf.length &&
      timingSafeEqual(candidateBuf, expectedBuf)
    );
  });
  return match ? { ok: true } : { ok: false, reason: "signature-mismatch" };
}

type DodoWebhookEvent = {
  type: string;
  data: Record<string, any>;
  id?: string;
  timestamp?: string;
};

async function markOrderPaidByDodo(
  paymentId: string,
  metadata: Record<string, any>
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const orderId = String(metadata?.order_id ?? "");
  const conditions = [
    eq(storeOrders.dodoPaymentId, paymentId),
    ...(orderId ? [eq(storeOrders.id, orderId)] : []),
  ];
  const rows = await db
    .select()
    .from(storeOrders)
    .where(or(...conditions))
    .limit(1);
  const order = rows[0];
  if (!order) {
    console.warn(`[Dodo] payment ${paymentId} did not match any order`);
    return;
  }
  if (order.status !== "paid") {
    await db
      .update(storeOrders)
      .set({
        status: "paid",
        dodoPaymentId: paymentId,
        ...(metadata?.checkout_id
          ? { dodoCheckoutId: String(metadata.checkout_id) }
          : {}),
        ...(metadata?.customer_id
          ? { dodoCustomerId: String(metadata.customer_id) }
          : {}),
      })
      .where(eq(storeOrders.id, order.id));
  }
  if (metadata?.kind === "recovery") return;
  const already = await db
    .select({ id: storePurchases.id })
    .from(storePurchases)
    .where(eq(storePurchases.orderId, order.id))
    .limit(1);
  if (!already.length) {
    await db.insert(storePurchases).values({
      id: nanoid(18),
      orderId: order.id,
      userId: order.userId,
      items: order.items,
    });
  }
  const latestOnboarding = await db
    .select({ id: onboardingRequests.id, status: onboardingRequests.status })
    .from(onboardingRequests)
    .where(eq(onboardingRequests.userId, order.userId))
    .orderBy(desc(onboardingRequests.createdAt))
    .limit(1);
  if (latestOnboarding[0] && latestOnboarding[0].status === "new") {
    await db
      .update(onboardingRequests)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(onboardingRequests.id, latestOnboarding[0].id));
  }
}

async function upsertSubscriptionFromDodo(
  dodoSubscriptionId: string,
  data: Record<string, any>
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const metadata = (data?.metadata ?? {}) as Record<string, any>;
  const planId = String(
    metadata?.plan_id ?? data?.product_id ?? metadata?.catalog_id ?? ""
  ).replace(/^plan:/, "");
  const userId = Number(metadata?.user_id ?? 0);
  const status = String(data?.status ?? "pending");
  const normalized = (
    [
      "active",
      "past_due",
      "cancelled",
      "on_hold",
      "expired",
      "pending",
    ].includes(status)
      ? status
      : "pending"
  ) as (typeof storeSubscriptions.$inferInsert)["status"];
  const rows = await db
    .select()
    .from(storeSubscriptions)
    .where(eq(storeSubscriptions.dodoSubscriptionId, dodoSubscriptionId))
    .limit(1);
  const nextBilling = data?.next_billing_date
    ? new Date(data.next_billing_date)
    : null;
  if (rows[0]) {
    await db
      .update(storeSubscriptions)
      .set({
        status: normalized,
        nextBillingDate: nextBilling ?? rows[0].nextBillingDate,
        dodoCustomerId: data?.customer_id
          ? String(data.customer_id)
          : rows[0].dodoCustomerId,
        updatedAt: new Date(),
      })
      .where(eq(storeSubscriptions.id, rows[0].id));
    return;
  }
  // Re-subscription: if the user already has a row for this plan (e.g. after
  // cancelling and re-subscribing), update it instead of inserting a second
  // row — the (userId, planId) unique index allows one active record per plan.
  if (userId && planId) {
    const existingPlanRows = await db
      .select()
      .from(storeSubscriptions)
      .where(
        and(
          eq(storeSubscriptions.userId, userId),
          eq(storeSubscriptions.planId, planId)
        )
      )
      .limit(1);
    if (existingPlanRows[0]) {
      await db
        .update(storeSubscriptions)
        .set({
          status: normalized,
          dodoSubscriptionId,
          dodoCustomerId: data?.customer_id
            ? String(data.customer_id)
            : existingPlanRows[0].dodoCustomerId,
          dodoProductId: data?.product_id
            ? String(data.product_id)
            : existingPlanRows[0].dodoProductId,
          nextBillingDate: nextBilling ?? existingPlanRows[0].nextBillingDate,
          customerEmail:
            data?.customer?.email ?? existingPlanRows[0].customerEmail,
          updatedAt: new Date(),
        })
        .where(eq(storeSubscriptions.id, existingPlanRows[0].id));
      return;
    }
  }
  if (!userId || !planId) {
    console.warn(
      `[Dodo] subscription ${dodoSubscriptionId} has no local user/plan metadata`
    );
    return;
  }
  await db
    .insert(storeSubscriptions)
    .values({
      id: nanoid(18),
      userId,
      planId,
      status: normalized,
      gateway: "dodo" as (typeof storeSubscriptions.$inferInsert)["gateway"],
      customerEmail: data?.customer?.email ?? null,
      dodoSubscriptionId,
      dodoCustomerId: data?.customer_id ? String(data.customer_id) : null,
      dodoProductId: data?.product_id ? String(data.product_id) : null,
      nextBillingDate: nextBilling,
    })
    .onConflictDoUpdate({
      target: storeSubscriptions.dodoSubscriptionId,
      set: { status: normalized, updatedAt: new Date() },
    });
}

async function processDodoEvent(
  event: DodoWebhookEvent
): Promise<"processed" | "duplicate" | "ignored"> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const eventId =
    (typeof event.id === "string" && event.id) ||
    `${event.type}:${event.data?.payment_id ?? event.data?.subscription_id ?? ""}:${event.timestamp ?? ""}`;
  try {
    await db.insert(dodoEvents).values({ id: eventId, type: event.type });
  } catch (error: any) {
    if (error?.code === "SQLITE_CONSTRAINT_PRIMARYKEY" || error?.errno === 19)
      return "duplicate";
    throw error;
  }
  const data = event.data ?? {};
  switch (event.type) {
    case "payment.succeeded":
      if (typeof data.payment_id === "string" && data.payment_id) {
        await markOrderPaidByDodo(
          data.payment_id,
          (data.metadata ?? {}) as Record<string, any>
        );
        return "processed";
      }
      return "ignored";
    case "payment.processing":
      return "processed";
    case "payment.failed":
    case "payment.cancelled": {
      const paymentId =
        typeof data.payment_id === "string" ? data.payment_id : "";
      const orderId = String(data.metadata?.order_id ?? "");
      const conditions = [
        ...(paymentId ? [eq(storeOrders.dodoPaymentId, paymentId)] : []),
        ...(orderId ? [eq(storeOrders.id, orderId)] : []),
      ];
      if (conditions.length) {
        await db
          .update(storeOrders)
          .set({
            status: "failed",
            ...(paymentId ? { dodoPaymentId: paymentId } : {}),
            updatedAt: new Date(),
          })
          .where(or(...conditions));
      }
      return "processed";
    }
    case "subscription.active":
    case "subscription.renewed":
    case "subscription.updated":
    case "subscription.past_due":
    case "subscription.on_hold":
    case "subscription.paused":
    case "subscription.cancelled":
    case "subscription.expired":
    case "subscription.unpaused": {
      const subscriptionId =
        typeof data.subscription_id === "string" ? data.subscription_id : null;
      if (!subscriptionId) return "ignored";
      await upsertSubscriptionFromDodo(subscriptionId, data);
      return "processed";
    }
    default:
      return "ignored";
  }
}

export function registerDodoWebhook(app: Express) {
  app.post(
    "/api/dodo/webhook",
    express.raw({ type: "application/json", limit: "2mb" }),
    async (req: Request, res: Response) => {
      if (!dodoConfigured()) {
        res.status(503).json({ error: "Dodo Payments is not configured." });
        return;
      }
      if (!dodoWebhookConfigured()) {
        res.status(503).json({ error: "Dodo webhook key is not configured." });
        return;
      }
      const verdict = verifyDodoWebhookSignature(req.body, req.headers);
      if (!verdict.ok) {
        console.warn(`[Dodo] webhook rejected: ${verdict.reason}`);
        res.status(401).json({ error: "Invalid webhook signature." });
        return;
      }
      let event: DodoWebhookEvent;
      try {
        event = JSON.parse(req.body.toString("utf8"));
      } catch {
        res.status(400).json({ error: "Invalid webhook payload." });
        return;
      }
      try {
        const result = await processDodoEvent(event);
        res.json({ received: true, result });
      } catch (error) {
        console.error(
          "[Dodo] webhook processing failed",
          error instanceof Error ? error.message : "unknown"
        );
        res.status(500).json({ error: "Webhook processing failed." });
      }
    }
  );
}

export function gatewayStatus() {
  const dodo = dodoConfigured();
  const webhook = dodoWebhookConfigured();
  return {
    gateway: (dodo ? "dodo" : "stripe") as PaymentGateway,
    mode: dodo ? dodoMode() : "test_mode",
    subscriptionsReady: dodo && webhook,
    webhookReady: webhook,
  };
}
