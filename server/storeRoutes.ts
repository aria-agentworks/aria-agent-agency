import type { Express, Request, Response } from "express";
import express from "express";
import Stripe from "stripe";
import { ZipArchive } from "archiver";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { and, eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  automations,
  getAutomation,
  PRICING,
  industries,
} from "../shared/catalog";
import { PLANS, getPlan } from "../shared/plans";
import {
  BUSINESS_CATEGORIES,
  detectCategoriesFromText,
  getCategory,
  type DeliveryOptionId,
} from "../shared/solutions";
import { DEVELOPMENT_PREVIEW_ORIGIN } from "../shared/runtimeOrigins";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { sdk, type AuthenticatedUser } from "./_core/sdk";
import { getDb } from "./db";
import {
  newsletterSubscribers,
  promoCodes,
  storeInquiries,
  storeOrders,
  storePurchases,
  storeSubscriptions,
  stripeEvents,
  marketingEvents,
  onboardingRequests,
} from "../drizzle/schema";
import {
  createDodoCheckout,
  createDodoRecoveryCheckout,
  cancelDodoSubscription,
  dodoConfigured,
  dodoRecoveryMinimumCents,
  dodoWebhookConfigured,
  gatewayStatus,
} from "./dodo";
import { fetchPublicHtml } from "./publicFetch";

const ALLOWED_SCENARIOS = [
  "appointment",
  "no-show",
  "discharge",
  "diagnostic",
  "lead",
  "clinical-review",
] as const;
const ALLOWED_VARIANTS = ["standard", "missing-slot", "duplicate"] as const;
const ALLOWED_SUPPORT_OPTIONS = [
  "scope-only",
  "installation",
  "installation-api",
  "managed-api",
] as const;
type DemoScenario = (typeof ALLOWED_SCENARIOS)[number];
type DemoVariant = (typeof ALLOWED_VARIANTS)[number];
type SupportOption = (typeof ALLOWED_SUPPORT_OPTIONS)[number];
type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

const inquiryLimits = {
  name: 160,
  email: 320,
  business: 200,
  industry: 120,
  automation: 160,
  tools: 4000,
  goals: 6000,
  phone: 64,
  website: 512,
  location: 180,
  country: 120,
  timezone: 100,
  languages: 250,
  ownerRole: 160,
  apiProviders: 2000,
} as const;

const OPTIONAL_INQUIRY_FIELDS = [
  "phone",
  "website",
  "location",
  "country",
  "timezone",
  "languages",
  "ownerRole",
  "apiProviders",
] as const;
const SECRET_INPUT_ERROR =
  "Enter credentials directly in your client-owned vault, not this form.";
const SECRET_INPUT_PATTERNS = [
  /\bsk-[a-z0-9_-]{6,}\b/i,
  /\bbearer\s+[a-z0-9._~+/=-]{8,}\b/i,
  /-----begin(?:\s+[a-z0-9]+)*\s+private\s+key-----/i,
  /\b(?:api[_-]?key|(?:access[_-]?|refresh[_-]?)?token|client[_-]?secret|secret|password|passwd)\s*["']?\s*[:=]\s*["']?[^\s"',;]+/i,
  /[?&](?:api[_-]?key|(?:access[_-]?|refresh[_-]?)?token|client[_-]?secret|password|signature|x-amz-credential|x-amz-signature)=/i,
  /https?:\/\/[^\s/]+@/i,
];

const demoHits = new Map<string, number[]>();
const inquiryHits = new Map<string, number[]>();
const marketingHits = new Map<string, number[]>();
const DEMO_WINDOW_MS = 60_000;
const DEMO_MAX_PER_WINDOW = 12;
let modelAvailability: Promise<boolean> | undefined;

function jsonError(res: Response, status: number, error: string) {
  res.status(status).json({ error });
}

function parseItems(value: unknown): string[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) &&
      parsed.every(item => typeof item === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function uniqueCatalogItems(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 30)
    return null;
  if (!value.every(item => typeof item === "string" && item.length <= 100))
    return null;
  const items = [...new Set(value as string[])];
  return items.every(item => Boolean(getAutomation(item))) ? items : null;
}

function amountForItems(items: string[]) {
  return items.reduce((sum, id) => sum + (getAutomation(id)?.price ?? 0), 0);
}

function normalizeOrigin(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (
      !/^https?:$/.test(url.protocol) ||
      url.username ||
      url.password ||
      (url.pathname !== "/" && url.pathname !== "")
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

function approvedOrigins() {
  return new Set(
    [
      process.env.PUBLIC_PREVIEW_ORIGIN,
      process.env.PUBLIC_APP_ORIGIN,
      process.env.APPROVED_SITE_ORIGIN,
      process.env.PUBLIC_SITE_ORIGIN,
      process.env.VITE_PUBLIC_APP_URL,
      process.env.NODE_ENV === "development"
        ? DEVELOPMENT_PREVIEW_ORIGIN
        : undefined,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ]
      .map(normalizeOrigin)
      .filter((origin): origin is string => Boolean(origin))
  );
}

/** Only configured preview/site origins may become Stripe redirects. */
export function resolveApprovedOrigin(
  req: Request,
  requested: unknown
): string | null {
  const allowed = approvedOrigins();
  const requestOrigin = normalizeOrigin(req.headers.origin);
  const requestedOrigin = normalizeOrigin(requested);
  if (
    requestOrigin &&
    allowed.has(requestOrigin) &&
    (!requestedOrigin || requestedOrigin === requestOrigin)
  )
    return requestOrigin;
  if (!requestOrigin && requestedOrigin && allowed.has(requestedOrigin))
    return requestedOrigin;
  return null;
}

async function requireUser(
  req: Request,
  res: Response
): Promise<AuthenticatedUser | null> {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    jsonError(res, 401, "Please sign in to continue.");
    return null;
  }
}

export function serializeOrder(order: typeof storeOrders.$inferSelect) {
  const items = parseItems(order.items);
  const downloadableItems = items.filter(
    item =>
      !item.startsWith("plan:") &&
      !item.startsWith("install:") &&
      !item.startsWith("recovery:")
  );
  return {
    id: order.id,
    createdAt: order.createdAt,
    status: order.status as OrderStatus,
    items,
    amount: order.amount / 100,
    currency: order.currency,
    ...(order.status === "paid"
      ? {
          downloads: downloadableItems.map(
            item =>
              `/api/store/download/${order.id}/${encodeURIComponent(item)}`
          ),
        }
      : {}),
  };
}

export function validateInquiryInput(
  body: unknown
):
  | { ok: true; value: Record<string, string | number> }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body))
    return { ok: false, error: "A JSON object is required." };
  const source = body as Record<string, unknown>;
  if (
    Object.values(source).some(
      value =>
        typeof value === "string" &&
        SECRET_INPUT_PATTERNS.some(pattern => pattern.test(value))
    )
  )
    return { ok: false, error: SECRET_INPUT_ERROR };
  const required = [
    "name",
    "email",
    "business",
    "industry",
    "automation",
    "tools",
    "goals",
  ] as const;
  const output: Record<string, string | number> = {};
  for (const key of required) {
    if (typeof source[key] !== "string" || source[key].trim().length === 0)
      return { ok: false, error: `${key} is required.` };
    const value = source[key].trim();
    if (value.length > inquiryLimits[key])
      return { ok: false, error: `${key} is too long.` };
    output[key] = value;
  }
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(output.email)) ||
    String(output.email).length > 320
  )
    return { ok: false, error: "A valid email is required." };
  for (const key of OPTIONAL_INQUIRY_FIELDS) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] !== "string" ||
        source[key].trim().length > inquiryLimits[key]
      )
        return { ok: false, error: `${key} is invalid.` };
      const value = String(source[key]).trim();
      if (key === "timezone" && value && !isValidTimezone(value))
        return { ok: false, error: "timezone is invalid." };
      output[key] = value;
    }
  }
  if (source.supportOption !== undefined) {
    if (
      typeof source.supportOption !== "string" ||
      !ALLOWED_SUPPORT_OPTIONS.includes(source.supportOption as SupportOption)
    )
      return { ok: false, error: "Choose a supported support option." };
    output.supportOption = source.supportOption;
  } else {
    output.supportOption = "scope-only";
  }
  if (
    !industries.some(i => i.id !== "all" && i.id === output.industry) &&
    output.industry !== "other"
  )
    return { ok: false, error: "Choose a supported industry." };
  if (
    !getAutomation(String(output.automation)) &&
    output.automation !== "custom" &&
    output.automation !== "not-sure"
  )
    return { ok: false, error: "Choose a supported automation." };
  if (String(output.goals).length < 10)
    return {
      ok: false,
      error: "Please describe your workflow goal in at least 10 characters.",
    };
  if (source.consent !== true)
    return {
      ok: false,
      error: "Consent is required before sending an inquiry.",
    };
  output.consent = 1;
  return { ok: true, value: output };
}

function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith("sk_live_")) return null;
  return new Stripe(key);
}

/** Validates an internal promo code and returns the USD-cents discount. */
export async function validatePromoCode(
  rawCode: unknown,
  subtotalCents: number
): Promise<{
  code?: string;
  discountCents: number;
  error?: string;
}> {
  const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";
  if (!code) return { discountCents: 0 };
  if (code.length > 40)
    return { discountCents: 0, error: "Promo code is invalid." };
  const db = await getDb();
  if (!db) return { discountCents: 0, error: "Promo codes are unavailable." };
  const rows = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.code, code))
    .limit(1);
  const promo = rows[0];
  if (!promo || !promo.active)
    return { discountCents: 0, error: "Promo code is not valid." };
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit)
    return { discountCents: 0, error: "This promo code has been fully used." };
  const discountCents =
    promo.kind === "percent"
      ? Math.floor((subtotalCents * Math.min(100, promo.value)) / 100)
      : Math.min(promo.value, subtotalCents);
  return { code, discountCents };
}

function hasLiveStripeKey() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_"));
}

function createPurchase(tx: any, order: typeof storeOrders.$inferSelect) {
  tx.insert(storePurchases)
    .values({
      id: nanoid(18),
      orderId: order.id,
      userId: order.userId,
      items: order.items,
    })
    .onConflictDoUpdate({
      target: storePurchases.orderId,
      set: { orderId: order.id },
    })
    .run();
}

// better-sqlite3 transactions are synchronous: use .all() / .run() only.
function applyStripeEvent(tx: any, event: Stripe.Event) {
  const object = event.data.object as any;
  if (event.type === "checkout.session.completed") {
    const session = object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    const conditions = session.id
      ? [eq(storeOrders.stripeSessionId, session.id)]
      : [];
    if (orderId) conditions.push(eq(storeOrders.id, orderId));
    const rows = conditions.length
      ? (tx
          .select()
          .from(storeOrders)
          .where(or(...conditions))
          .limit(1)
          .all() as any[])
      : [];
    const order = rows[0];
    if (!order) return;
    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    const customer =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    const paid = session.payment_status === "paid";
    tx.update(storeOrders)
      .set({
        status: order.status === "paid" || paid ? "paid" : "pending",
        stripeSessionId: session.id,
        stripeCustomerId: customer ?? order.stripeCustomerId,
        stripePaymentIntentId: paymentIntent ?? order.stripePaymentIntentId,
      })
      .where(eq(storeOrders.id, order.id))
      .run();
    if (paid)
      createPurchase(tx, {
        ...order,
        status: "paid",
        stripeSessionId: session.id,
        stripeCustomerId: customer,
        stripePaymentIntentId: paymentIntent,
      });
    return;
  }
  if (
    event.type === "payment_intent.succeeded" ||
    event.type === "payment_intent.payment_failed"
  ) {
    const paymentIntentId = typeof object.id === "string" ? object.id : null;
    if (!paymentIntentId) return;
    const rows = tx
      .select()
      .from(storeOrders)
      .where(eq(storeOrders.stripePaymentIntentId, paymentIntentId))
      .limit(1)
      .all() as any[];
    const order = rows[0];
    if (!order) return;
    const paid = event.type === "payment_intent.succeeded";
    tx.update(storeOrders)
      .set({
        status: order.status === "paid" || paid ? "paid" : "failed",
        stripePaymentIntentId: paymentIntentId,
      })
      .where(eq(storeOrders.id, order.id))
      .run();
    if (paid)
      createPurchase(tx, {
        ...order,
        status: "paid",
        stripePaymentIntentId: paymentIntentId,
      });
  }
  // Subscription events and any future subscribed events are intentionally acknowledged.
}

async function processStripeEvent(
  event: Stripe.Event
): Promise<"processed" | "duplicate"> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  try {
    let duplicate = false;
    // better-sqlite3 transactions are synchronous: use .all() / .run() only.
    db.transaction((tx: any) => {
      const existing = tx
        .select({ id: stripeEvents.id })
        .from(stripeEvents)
        .where(eq(stripeEvents.id, event.id))
        .limit(1)
        .all() as any[];
      if (existing.length) {
        duplicate = true;
        return;
      }
      tx.insert(stripeEvents).values({ id: event.id, type: event.type }).run();
      applyStripeEvent(tx, event);
    });
    return duplicate ? "duplicate" : "processed";
  } catch (error: any) {
    if (
      error?.code === "ER_DUP_ENTRY" ||
      error?.errno === 1062 ||
      error?.code === "SQLITE_CONSTRAINT_PRIMARYKEY"
    )
      return "duplicate";
    throw error;
  }
}

export function registerStoreWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json", limit: "2mb" }),
    async (req, res) => {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      const stripe = stripeClient();
      if (!secret || !stripe || hasLiveStripeKey()) {
        jsonError(res, 503, "Stripe test webhook is not configured.");
        return;
      }
      const signature = req.headers["stripe-signature"];
      if (typeof signature !== "string" || !Buffer.isBuffer(req.body)) {
        jsonError(res, 400, "Invalid webhook body or signature.");
        return;
      }
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, signature, secret);
      } catch {
        jsonError(res, 400, "Invalid Stripe webhook signature.");
        return;
      }
      try {
        await processStripeEvent(event);
        res.json({ received: true });
      } catch (error) {
        console.error(
          "[Stripe] webhook processing failed",
          error instanceof Error ? error.message : "unknown"
        );
        jsonError(res, 500, "Webhook processing failed.");
      }
    }
  );
}

export function registerStoreRoutes(app: Express) {
  app.get("/embed/aria.js", (_req, res) => {
    const script = `(function () {
  var current = document.currentScript;
  if (!current || document.getElementById("aria-widget-root")) return;
  var businessId = current.getAttribute("data-aria-business") || "unknown";
  var endpoint = new URL("/api/widget/inquiry", current.src).toString();
  var root = document.createElement("div");
  root.id = "aria-widget-root";
  root.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:2147483647;font-family:system-ui,sans-serif";
  var button = document.createElement("button");
  button.type = "button";
  button.textContent = "Talk to us";
  button.style.cssText = "border:0;border-radius:999px;background:#171717;color:#fff;padding:13px 18px;box-shadow:0 8px 30px rgba(0,0,0,.2);cursor:pointer;font-weight:700";
  var panel = document.createElement("form");
  panel.style.cssText = "display:none;width:280px;margin-bottom:10px;padding:16px;border:1px solid #ddd;border-radius:16px;background:#fff;box-shadow:0 12px 40px rgba(0,0,0,.18)";
  panel.innerHTML = '<strong>How can we help?</strong><input name="name" required placeholder="Your name" style="display:block;width:100%;box-sizing:border-box;margin-top:10px;padding:9px;border:1px solid #ccc;border-radius:8px"><input name="email" required type="email" placeholder="Email" style="display:block;width:100%;box-sizing:border-box;margin-top:8px;padding:9px;border:1px solid #ccc;border-radius:8px"><textarea name="message" required placeholder="What do you need?" style="display:block;width:100%;box-sizing:border-box;margin-top:8px;padding:9px;border:1px solid #ccc;border-radius:8px;min-height:70px"></textarea><label style="display:block;margin-top:8px;font-size:11px"><input name="consent" type="checkbox" required> I agree to be contacted.</label><button type="submit" style="margin-top:10px;width:100%;padding:9px;border:0;border-radius:8px;background:#171717;color:#fff;font-weight:700">Send</button><p data-status style="font-size:12px;color:#555"></p>';
  button.addEventListener("click", function () { panel.style.display = panel.style.display === "none" ? "block" : "none"; });
  panel.addEventListener("submit", function (event) {
    event.preventDefault();
    var form = new FormData(panel);
    var status = panel.querySelector("[data-status]");
    fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: businessId, name: form.get("name"), email: form.get("email"), message: form.get("message"), consent: form.get("consent") === "on" }) })
      .then(function (response) { return response.json().then(function (data) { if (!response.ok) throw new Error(data.error || "Unable to send"); return data; }); })
      .then(function () { status.textContent = "Thanks — we will be in touch."; panel.reset(); })
      .catch(function (error) { status.textContent = error.message; });
  });
  root.appendChild(panel); root.appendChild(button); document.body.appendChild(root);
})();\n`;
    res
      .type("application/javascript")
      .set("Cache-Control", "public, max-age=300")
      .send(script);
  });

  app.post("/api/widget/inquiry", async (req, res) => {
    const name = String(req.body?.name ?? "")
      .trim()
      .slice(0, 160);
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase()
      .slice(0, 320);
    const message = String(req.body?.message ?? "")
      .trim()
      .slice(0, 3000);
    const businessId = String(req.body?.businessId ?? "unknown").slice(0, 80);
    if (
      !name ||
      !message ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      req.body?.consent !== true
    ) {
      jsonError(
        res,
        400,
        "Name, valid email, message, and consent are required."
      );
      return;
    }
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Widget inquiries are unavailable right now.");
      return;
    }
    await db.insert(storeInquiries).values({
      id: nanoid(18),
      reference: `WIDGET-${nanoid(8).toUpperCase()}`,
      name,
      email,
      business: `Website widget ${businessId}`,
      industry: "widget",
      automation: "website-widget",
      supportOption: "scope-only",
      tools: "Aria website widget",
      goals: message,
      consent: 1,
    } as any);
    res.status(201).json({ ok: true });
  });

  app.use("/api/store", (_req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    next();
  });
  app.get("/api/store/status", (_req, res) => {
    const gateway = gatewayStatus();
    res.json({
      testMode: gateway.gateway === "stripe" || gateway.mode === "test_mode",
      checkoutReady: Boolean(
        (process.env.STRIPE_SECRET_KEY && !hasLiveStripeKey()) ||
          (dodoConfigured() && gateway.webhookReady)
      ),
      pricingStatus: PRICING.status,
      ...gateway,
    });
  });

  app.get("/api/store/orders", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Store database is not available.");
      return;
    }
    try {
      const rows = await db
        .select()
        .from(storeOrders)
        .where(eq(storeOrders.userId, user.id))
        .orderBy(storeOrders.createdAt);
      const inquiries = await db
        .select()
        .from(storeInquiries)
        .where(eq(storeInquiries.email, user.email ?? ""))
        .orderBy(storeInquiries.createdAt);
      res.json({
        orders: rows.map(serializeOrder),
        inquiries: inquiries.map(item => ({
          id: item.id,
          reference: item.reference,
          createdAt: item.createdAt,
          status: "received",
        })),
      });
    } catch {
      jsonError(res, 503, "Unable to load store records.");
    }
  });

  app.get("/api/store/library", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Store database is not available.");
      return;
    }
    try {
      const rows = await db
        .select()
        .from(storePurchases)
        .where(eq(storePurchases.userId, user.id))
        .orderBy(storePurchases.createdAt);
      res.json({
        purchases: rows.map(row => ({
          id: row.id,
          items: parseItems(row.items),
          createdAt: row.createdAt,
        })),
      });
    } catch {
      jsonError(res, 503, "Unable to load library.");
    }
  });

  app.post("/api/store/checkout", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    if (PRICING.status === "draft" && hasLiveStripeKey()) {
      jsonError(res, 503, "Live checkout is disabled while pricing is draft.");
      return;
    }
    const items = uniqueCatalogItems(req.body?.items);
    if (!items) {
      jsonError(res, 400, "Choose one or more valid automations.");
      return;
    }
    const origin = resolveApprovedOrigin(req, req.body?.origin);
    if (!origin) {
      jsonError(res, 400, "Checkout origin is not approved.");
      return;
    }
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Store database is not available.");
      return;
    }
    const promo = await validatePromoCode(
      req.body?.promoCode,
      amountForItems(items) * 100
    );
    if (promo.error) {
      jsonError(res, 400, promo.error);
      return;
    }
    const listTotal = amountForItems(items);
    const amount = promo.discountCents
      ? Math.max(0, listTotal - Math.ceil(promo.discountCents / 100))
      : listTotal;
    const orderId = nanoid(18);

    // Preferred gateway: Dodo Payments (merchant of record) when configured.
    if (dodoConfigured()) {
      if (!dodoWebhookConfigured()) {
        jsonError(res, 503, "Dodo webhook verification is not configured yet.");
        return;
      }
      try {
        // Promo codes must also exist as discounts inside the Dodo dashboard.
        if (promo.code && promo.discountCents > 0) {
          const { dodoDiscountExists } = await import("./dodo");
          if (!(await dodoDiscountExists(promo.code))) {
            jsonError(
              res,
              400,
              `Promo code ${promo.code} is valid here, but the matching discount is not configured in Dodo Payments yet. Please contact the agency.`
            );
            return;
          }
        }
        await db.insert(storeOrders).values({
          id: orderId,
          userId: user.id,
          items: JSON.stringify(items),
          amount: amount * 100,
          currency: "USD",
          gateway: "dodo",
          promoCode: promo.code,
          customerName: user.name ?? null,
          customerEmail: user.email ?? null,
        });
        const checkout = await createDodoCheckout({
          orderId,
          userId: user.id,
          customerEmail: user.email ?? null,
          customerName: user.name ?? null,
          origin,
          catalogIds: items,
          kind: "one_time",
          discountCode: promo.code,
        });
        await db
          .update(storeOrders)
          .set({ dodoCheckoutId: checkout.sessionId })
          .where(eq(storeOrders.id, orderId));
        res.json({ url: checkout.checkoutUrl, gateway: "dodo" });
      } catch (error) {
        try {
          await db
            .update(storeOrders)
            .set({ status: "failed" })
            .where(eq(storeOrders.id, orderId));
        } catch {
          /* preserve original failure */
        }
        console.error(
          "[Store] dodo checkout failed",
          error instanceof Error ? error.message : "unknown"
        );
        jsonError(
          res,
          502,
          error instanceof Error
            ? error.message
            : "Unable to start Dodo checkout."
        );
      }
      return;
    }

    const stripe = stripeClient();
    if (!stripe) {
      jsonError(res, 503, "Test checkout is not configured yet.");
      return;
    }
    try {
      await db.insert(storeOrders).values({
        id: orderId,
        userId: user.id,
        items: JSON.stringify(items),
        amount: amount * 100,
        currency: "USD",
        promoCode: promo.code,
        customerName: user.name ?? null,
        customerEmail: user.email ?? null,
      });
      const lineItems = items.map(id => {
        const item = getAutomation(id)!;
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
              description: "Configurable Aria automation template kit",
            },
            unit_amount: item.price * 100,
          },
          quantity: 1,
        };
      });
      if (promo.discountCents) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `Promo code ${promo.code}`,
              description: "Agency discount",
            },
            unit_amount: -promo.discountCents,
          },
          quantity: 1,
        } as any);
      }
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        allow_promotion_codes: true,
        line_items: lineItems as any,
        customer_email: user.email ?? undefined,
        client_reference_id: String(user.id),
        success_url: `${origin}/orders?checkout=processing`,
        cancel_url: `${origin}/cart?checkout=cancelled`,
        metadata: {
          order_id: orderId,
          user_id: String(user.id),
          customer_email: user.email ?? "",
          customer_name: user.name ?? "",
        },
      });
      if (!session.url) throw new Error("Stripe did not return a Checkout URL");
      await db
        .update(storeOrders)
        .set({ stripeSessionId: session.id })
        .where(eq(storeOrders.id, orderId));
      res.json({ url: session.url, gateway: "stripe" });
    } catch (error) {
      try {
        await db
          .update(storeOrders)
          .set({ status: "failed" })
          .where(eq(storeOrders.id, orderId));
      } catch {
        /* preserve original failure */
      }
      console.error(
        "[Store] checkout creation failed",
        error instanceof Error ? error.message : "unknown"
      );
      jsonError(res, 502, "Unable to start test checkout.");
    }
  });

  app.get("/api/store/download/:orderId/:automationId", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const item = getAutomation(req.params.automationId);
    if (!item) {
      jsonError(res, 404, "Automation not found.");
      return;
    }
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Store database is not available.");
      return;
    }
    let order: typeof storeOrders.$inferSelect | undefined;
    try {
      const rows = await db
        .select()
        .from(storeOrders)
        .where(
          and(
            eq(storeOrders.id, req.params.orderId),
            eq(storeOrders.userId, user.id)
          )
        )
        .limit(1);
      order = rows[0];
    } catch {
      jsonError(res, 503, "Unable to verify purchase.");
      return;
    }
    if (
      !order ||
      order.status !== "paid" ||
      !parseItems(order.items).includes(item.id)
    ) {
      jsonError(
        res,
        403,
        "This paid purchase does not include that automation."
      );
      return;
    }
    const root = path.resolve(process.cwd(), "automation-kits");
    const bundleDir = path.resolve(root, item.bundle);
    if (!bundleDir.startsWith(`${root}${path.sep}`)) {
      jsonError(res, 404, "Kit not found.");
      return;
    }
    try {
      if (!(await fs.stat(bundleDir)).isDirectory())
        throw new Error("not a directory");
    } catch {
      jsonError(res, 404, "Kit is not available yet.");
      return;
    }
    res
      .status(200)
      .type("zip")
      .setHeader(
        "Content-Disposition",
        `attachment; filename="aria-${item.id}.zip"`
      );
    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.on("error", () => {
      if (!res.headersSent) res.status(500);
      res.end();
    });
    archive.pipe(res);
    archive.directory(bundleDir, false);
    void archive.finalize();
  });

  app.post("/api/store/inquiries", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const recent = (inquiryHits.get(ip) ?? []).filter(
      time => now - time < 3600000
    );
    if (recent.length >= 10) {
      jsonError(res, 429, "Please wait before submitting another request.");
      return;
    }
    recent.push(now);
    inquiryHits.set(ip, recent);
    const result = validateInquiryInput(req.body);
    if (!result.ok) {
      jsonError(res, 400, result.error);
      return;
    }
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Unable to save inquiry right now.");
      return;
    }
    const id = nanoid(18),
      reference = `ARIA-${nanoid(8).toUpperCase()}`;
    try {
      await db
        .insert(storeInquiries)
        .values({ id, reference, ...result.value } as any);
      res.status(201).json({ id, reference });
    } catch (error) {
      console.error(
        "[Store] inquiry save failed",
        error instanceof Error ? error.message : "unknown"
      );
      jsonError(res, 503, "Unable to save inquiry right now.");
    }
  });

  app.get("/api/store/admin/inquiries", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    if (user.role !== "admin") {
      jsonError(res, 403, "Admin access required.");
      return;
    }
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Store database is not available.");
      return;
    }
    try {
      const rows = await db
        .select()
        .from(storeInquiries)
        .orderBy(storeInquiries.createdAt);
      res.json({
        inquiries: rows.map(row => ({
          ...row,
          supportOption: row.supportOption ?? "scope-only",
        })),
      });
    } catch {
      jsonError(res, 503, "Unable to load inquiries.");
    }
  });

  app.get("/api/store/admin/overview", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    if (user.role !== "admin") {
      jsonError(res, 403, "Admin access required.");
      return;
    }
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Store database is not available.");
      return;
    }
    try {
      const orders = await db
        .select({ status: storeOrders.status, amount: storeOrders.amount })
        .from(storeOrders);
      const inquiries = await db
        .select({ id: storeInquiries.id })
        .from(storeInquiries);
      const subscribers = await db
        .select({ id: newsletterSubscribers.id })
        .from(newsletterSubscribers);
      const events = await db
        .select({ type: marketingEvents.type })
        .from(marketingEvents);
      const subscriptions = await db
        .select({ status: storeSubscriptions.status })
        .from(storeSubscriptions);
      res.json({
        total: orders.length,
        paid: orders.filter(o => o.status === "paid").length,
        pending: orders.filter(o => o.status === "pending").length,
        revenue:
          orders
            .filter(o => o.status === "paid")
            .reduce((sum, o) => sum + o.amount, 0) / 100,
        inquiries: inquiries.length,
        subscribers: subscribers.length,
        activeSubscriptions: subscriptions.filter(s => s.status === "active")
          .length,
        eventsTracked: events.length,
      });
    } catch {
      jsonError(res, 503, "Unable to load overview.");
    }
  });

  app.patch("/api/store/admin/onboarding/:id", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    if (user.role !== "admin") {
      jsonError(res, 403, "Admin access required.");
      return;
    }
    const status = String(req.body?.status ?? "");
    if (
      !["new", "paid", "contacted", "installing", "blocked", "live"].includes(
        status
      )
    ) {
      jsonError(res, 400, "Choose a supported onboarding status.");
      return;
    }
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Store database is not available.");
      return;
    }
    await db
      .update(onboardingRequests)
      .set({
        status: status as
          | "new"
          | "paid"
          | "contacted"
          | "installing"
          | "blocked"
          | "live",
        updatedAt: new Date(),
      })
      .where(eq(onboardingRequests.id, req.params.id));
    res.json({ ok: true });
  });

  /* ----------------------------- Onboarding ----------------------------- */

  const SITE_FETCH_TIMEOUT_MS = 7000;
  const SITE_MAX_BYTES = 400_000;

  function extractSiteSignals(html: string): {
    title: string;
    description: string;
    text: string;
  } {
    const title =
      html.match(/<title[^>]*>([\s\S]{0,300}?)<\/title>/i)?.[1] ?? "";
    const description =
      html.match(
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{0,400})["']/i
      )?.[1] ??
      html.match(
        /<meta[^>]+content=["']([^"']{0,400})["'][^>]+name=["']description["']/i
      )?.[1] ??
      "";
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z#0-9]+;/gi, " ")
      .replace(/\s+/g, " ")
      .slice(0, 20_000);
    return {
      title: title.replace(/\s+/g, " ").trim(),
      description: description.replace(/\s+/g, " ").trim(),
      text,
    };
  }

  app.post("/api/onboarding/analyze", async (req, res) => {
    const raw = String(req.body?.url ?? "").trim();
    if (!raw) {
      jsonError(res, 400, "Paste your website address first.");
      return;
    }
    let url: URL;
    try {
      url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      if (!/^https?:$/.test(url.protocol)) throw new Error("protocol");
      if (!url.hostname.includes(".")) throw new Error("hostname");
    } catch {
      jsonError(res, 400, "That doesn't look like a website address.");
      return;
    }
    try {
      const html = (
        await fetchPublicHtml(url.toString(), {
          timeoutMs: SITE_FETCH_TIMEOUT_MS,
          maxBytes: SITE_MAX_BYTES,
          userAgent:
            "Mozilla/5.0 (compatible; AriaOnboarding/1.0; +https://ariaagent.agency)",
        })
      ).toLowerCase();
      const signals = extractSiteSignals(html);
      const scored = detectCategoriesFromText(
        `${signals.title} ${signals.description} ${signals.text}`
      );
      const top = scored[0] ?? null;
      const runnerUp = scored[1] ?? null;
      const confidence =
        top && top.score >= 3
          ? runnerUp && top.score - runnerUp.score <= 1
            ? "medium"
            : "high"
          : top
            ? "low"
            : "none";
      res.json({
        url: url.toString(),
        businessName: signals.title.slice(0, 120) || null,
        description: signals.description.slice(0, 240) || null,
        detected: top
          ? {
              categoryId: top.categoryId,
              score: top.score,
              matched: top.matched.slice(0, 6),
            }
          : null,
        alternates: scored.slice(1, 3).map(item => item.categoryId),
        confidence,
      });
    } catch (error) {
      console.error(
        "[Onboarding] website analyze failed:",
        error instanceof Error ? error.message : "unknown"
      );
      res.json({
        url: url.toString(),
        businessName: null,
        description: null,
        detected: null,
        alternates: [],
        confidence: "none",
        note: "We couldn't read the site automatically — pick your category below and we'll take it from there.",
      });
    }
  });

  app.post("/api/onboarding/submit", async (req, res) => {
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Onboarding database is not available.");
      return;
    }
    // The request may arrive before sign-in; attach the user when present.
    let user: AuthenticatedUser | null = null;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      user = null;
    }
    const categoryId = String(req.body?.categoryId ?? "");
    if (!getCategory(categoryId)) {
      jsonError(res, 400, "Choose a supported business category.");
      return;
    }
    const businessName = String(req.body?.businessName ?? "")
      .trim()
      .slice(0, 160);
    const website = String(req.body?.website ?? "")
      .trim()
      .slice(0, 300);
    const email = String(req.body?.email ?? user?.email ?? "")
      .trim()
      .slice(0, 320);
    const deliveryInput = String(req.body?.delivery ?? "").trim();
    const delivery: DeliveryOptionId | null = [
      "embed",
      "portal",
      "both",
    ].includes(deliveryInput)
      ? (deliveryInput as DeliveryOptionId)
      : null;
    const planId = getPlan(String(req.body?.planId ?? ""))?.id ?? null;
    const answers = req.body?.answers;
    const id = nanoid(18);
    try {
      await db.insert(onboardingRequests).values({
        id,
        userId: user?.id ?? null,
        businessName: businessName || null,
        website: website || null,
        email: email || null,
        categoryId,
        answers:
          answers && typeof answers === "object"
            ? JSON.stringify(answers)
            : null,
        delivery,
        planId,
      });
      res.json({ id, ok: true });
    } catch {
      jsonError(res, 503, "Unable to save your onboarding request.");
    }
  });

  app.get("/api/onboarding/mine", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Store database is not available.");
      return;
    }
    try {
      const rows = await db
        .select()
        .from(onboardingRequests)
        .where(eq(onboardingRequests.userId, user.id))
        .orderBy(onboardingRequests.createdAt);
      res.json({
        requests: rows
          .slice(-5)
          .reverse()
          .map(row => ({
            id: row.id,
            businessName: row.businessName,
            website: row.website,
            categoryId: row.categoryId,
            delivery: row.delivery,
            planId: row.planId,
            status: row.status,
            createdAt: row.createdAt,
          })),
      });
    } catch {
      jsonError(res, 503, "Unable to load onboarding requests.");
    }
  });

  /* ------------------------- Subscriptions (plans) ------------------------ */

  app.post("/api/store/subscribe", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    if (!dodoConfigured() || !dodoWebhookConfigured()) {
      jsonError(
        res,
        503,
        "Subscriptions require Dodo Payments. Ask the site owner to connect it."
      );
      return;
    }
    const plan = getPlan(String(req.body?.planId ?? ""));
    if (!plan) {
      jsonError(res, 400, "Choose a supported subscription plan.");
      return;
    }
    const origin = resolveApprovedOrigin(req, req.body?.origin);
    if (!origin) {
      jsonError(res, 400, "Checkout origin is not approved.");
      return;
    }
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Store database is not available.");
      return;
    }
    // The one-time installation fee is charged with the first checkout by
    // default; clients can opt out with install: false.
    const includeInstall = req.body?.install !== false;
    const onboardingId = String(req.body?.onboardingId ?? "").trim();
    const deliveryInput = String(req.body?.delivery ?? "").trim();
    const delivery: DeliveryOptionId | null = [
      "embed",
      "portal",
      "both",
    ].includes(deliveryInput)
      ? (deliveryInput as DeliveryOptionId)
      : null;
    let effectiveOnboardingId = onboardingId;
    const subscriptionId = nanoid(18);
    const orderId = nanoid(18);
    try {
      if (!effectiveOnboardingId) {
        effectiveOnboardingId = nanoid(18);
        await db.insert(onboardingRequests).values({
          id: effectiveOnboardingId,
          userId: user.id,
          businessName: user.name ?? null,
          website: null,
          email: user.email ?? null,
          categoryId: "any",
          answers: null,
          delivery,
          planId: plan.id,
          status: "new",
        });
      }
      await db.insert(storeSubscriptions).values({
        id: subscriptionId,
        userId: user.id,
        planId: plan.id,
        status: "pending",
        gateway: "dodo",
        customerEmail: user.email ?? null,
      });
      await db.insert(storeOrders).values({
        id: orderId,
        userId: user.id,
        items: JSON.stringify([
          `plan:${plan.id}`,
          ...(includeInstall ? [`install:${plan.id}`] : []),
        ]),
        amount:
          (plan.monthlyPrice + (includeInstall ? plan.installFee : 0)) * 100,
        currency: "USD",
        status: "pending",
        gateway: "dodo",
        customerName: user.name ?? null,
        customerEmail: user.email ?? null,
      });
      if (effectiveOnboardingId) {
        await db
          .update(onboardingRequests)
          .set({
            planId: plan.id,
            ...(delivery ? { delivery } : {}),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(onboardingRequests.id, effectiveOnboardingId),
              eq(onboardingRequests.userId, user.id)
            )
          );
      }
      const checkout = await createDodoCheckout({
        orderId,
        userId: user.id,
        customerEmail: user.email ?? null,
        customerName: user.name ?? null,
        origin,
        catalogIds: [plan.id],
        kind: "recurring",
        ...(includeInstall ? { installPlanId: plan.id } : {}),
      });
      await db
        .update(storeOrders)
        .set({
          dodoCheckoutId: checkout.sessionId,
          dodoSubscriptionId: subscriptionId,
        })
        .where(eq(storeOrders.id, orderId));
      res.json({ url: checkout.checkoutUrl, gateway: "dodo" });
    } catch (error) {
      try {
        await db
          .update(storeSubscriptions)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(storeSubscriptions.id, subscriptionId));
        await db
          .update(storeOrders)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(storeOrders.id, orderId));
      } catch {
        /* preserve the original checkout error */
      }
      console.error(
        "[Store] subscribe failed",
        error instanceof Error ? error.message : "unknown"
      );
      jsonError(
        res,
        502,
        error instanceof Error
          ? error.message
          : "Unable to start subscription checkout."
      );
    }
  });

  app.get("/api/store/subscriptions", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Store database is not available.");
      return;
    }
    try {
      const rows = await db
        .select()
        .from(storeSubscriptions)
        .where(eq(storeSubscriptions.userId, user.id))
        .orderBy(storeSubscriptions.createdAt);
      res.json({
        subscriptions: rows.map(row => ({
          id: row.id,
          planId: row.planId,
          status: row.status,
          createdAt: row.createdAt,
          nextBillingDate: row.nextBillingDate,
        })),
      });
    } catch {
      jsonError(res, 503, "Unable to load subscriptions.");
    }
  });

  app.post("/api/store/subscriptions/:id/cancel", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Store database is not available.");
      return;
    }
    const rows = await db
      .select()
      .from(storeSubscriptions)
      .where(
        and(
          eq(storeSubscriptions.id, req.params.id),
          eq(storeSubscriptions.userId, user.id)
        )
      )
      .limit(1);
    const subscription = rows[0];
    if (!subscription) {
      jsonError(res, 404, "Subscription not found.");
      return;
    }
    if (!subscription.dodoSubscriptionId) {
      jsonError(
        res,
        409,
        "This subscription is not ready for self-service cancellation."
      );
      return;
    }
    try {
      await cancelDodoSubscription(subscription.dodoSubscriptionId);
      await db
        .update(storeSubscriptions)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(storeSubscriptions.id, subscription.id));
      res.json({ ok: true });
    } catch (error) {
      console.error(
        "[Store] subscription cancellation failed",
        error instanceof Error ? error.message : "unknown"
      );
      jsonError(res, 502, "Unable to cancel the subscription right now.");
    }
  });

  /* ----------------------------- Promo codes ----------------------------- */

  app.post("/api/store/promo/validate", async (req, res) => {
    const items = uniqueCatalogItems(req.body?.items);
    if (!items) {
      jsonError(res, 400, "Choose one or more valid automations first.");
      return;
    }
    const result = await validatePromoCode(
      req.body?.code,
      amountForItems(items) * 100
    );
    res.json(result);
  });

  /* ------------------------ Marketing & newsletter ----------------------- */

  app.post("/api/marketing/subscribe", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const recent = (marketingHits.get(ip) ?? []).filter(t => now - t < 3600000);
    if (recent.length >= 8) {
      jsonError(res, 429, "Please wait before subscribing again.");
      return;
    }
    recent.push(now);
    marketingHits.set(ip, recent);
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    const name = String(req.body?.name ?? "").trim();
    const source = String(req.body?.source ?? "website").slice(0, 60);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      jsonError(res, 400, "A valid email is required.");
      return;
    }
    if (name.length > 160) {
      jsonError(res, 400, "Name is too long.");
      return;
    }
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Unable to save the subscription right now.");
      return;
    }
    try {
      await db
        .insert(newsletterSubscribers)
        .values({
          id: nanoid(18),
          email,
          name: name || null,
          source,
        })
        .onConflictDoUpdate({
          target: newsletterSubscribers.email,
          set: { name: name || null, source, unsubscribedAt: null },
        });
      await db.insert(marketingEvents).values({
        type: "newsletter_signup",
        meta: JSON.stringify({ source }),
      });
      res.status(201).json({
        ok: true,
        message:
          "You are on the list. The automation playbook download is ready below.",
      });
    } catch {
      jsonError(res, 503, "Unable to save the subscription right now.");
    }
  });

  app.get("/api/marketing/unsubscribe", async (req, res) => {
    const email = String(req.query.email ?? "")
      .trim()
      .toLowerCase();
    if (!email) {
      res.status(400).type("html").send("<p>Missing email.</p>");
      return;
    }
    const db = await getDb();
    if (db) {
      try {
        await db
          .update(newsletterSubscribers)
          .set({ unsubscribedAt: new Date() })
          .where(eq(newsletterSubscribers.email, email));
      } catch {
        /* best effort */
      }
    }
    res
      .status(200)
      .type("html")
      .send(
        "<html><body style='font-family:sans-serif;text-align:center;padding:48px'><h2>You are unsubscribed.</h2><p>We removed this email from the Aria automation newsletter.</p></body></html>"
      );
  });

  app.get("/api/marketing/leadmagnet", async (req, res) => {
    const db = await getDb();
    if (db) {
      try {
        await db.insert(marketingEvents).values({
          type: "leadmagnet_download",
          path: String(req.query.ref ?? "direct").slice(0, 200),
        });
      } catch {
        /* best effort */
      }
    }
    const asset = path.resolve(
      process.cwd(),
      "assets",
      "50-ai-automation-playbook.pdf"
    );
    try {
      await fs.access(asset);
    } catch {
      jsonError(res, 404, "The playbook is not available right now.");
      return;
    }
    res
      .status(200)
      .type("application/pdf")
      .setHeader(
        "Content-Disposition",
        'attachment; filename="50-AI-Automation-Systems-Playbook.pdf"'
      );
    res.sendFile(asset);
  });

  app.post("/api/marketing/event", async (req, res) => {
    const type = String(req.body?.type ?? "").slice(0, 60);
    if (!type) {
      jsonError(res, 400, "Event type is required.");
      return;
    }
    const db = await getDb();
    if (!db) {
      res.json({ ok: true });
      return;
    }
    try {
      await db.insert(marketingEvents).values({
        type,
        path: String(req.body?.path ?? "").slice(0, 300) || null,
        referrer: String(req.body?.referrer ?? "").slice(0, 300) || null,
        sessionId: String(req.body?.sessionId ?? "").slice(0, 64) || null,
        meta:
          req.body?.meta && typeof req.body.meta === "object"
            ? JSON.stringify(req.body.meta).slice(0, 500)
            : null,
      });
    } catch {
      /* analytics must never break the page */
    }
    res.json({ ok: true });
  });

  /* --------------------------- Dodo admin tools -------------------------- */

  app.post("/api/store/admin/dodo/provision", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    if (user.role !== "admin") {
      jsonError(res, 403, "Admin access required.");
      return;
    }
    if (!dodoConfigured()) {
      jsonError(res, 503, "Set DODO_PAYMENTS_API_KEY first.");
      return;
    }
    try {
      const { provisionAllDodoProducts } = await import("./dodo");
      const result = await provisionAllDodoProducts();
      res.json({ ok: true, ...result });
    } catch (error) {
      jsonError(
        res,
        502,
        error instanceof Error ? error.message : "Provisioning failed."
      );
    }
  });

  app.post("/api/store/admin/dodo/recovery-checkout", async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    if (user.role !== "admin") {
      jsonError(res, 403, "Admin access required.");
      return;
    }
    if (!dodoConfigured() || !dodoWebhookConfigured()) {
      jsonError(
        res,
        503,
        "Live recovery checkout requires both Dodo API and webhook keys."
      );
      return;
    }
    const customerEmail = String(req.body?.customerEmail ?? "")
      .trim()
      .toLowerCase();
    const customerName = String(req.body?.customerName ?? "")
      .trim()
      .slice(0, 160);
    const reference = String(req.body?.reference ?? "")
      .trim()
      .slice(0, 120);
    const amountCents = Number(req.body?.amountCents);
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ||
      customerEmail.length > 320
    ) {
      jsonError(res, 400, "A valid customer email is required.");
      return;
    }
    if (!reference) {
      jsonError(res, 400, "A recovery reference is required.");
      return;
    }
    if (
      !Number.isInteger(amountCents) ||
      amountCents < dodoRecoveryMinimumCents()
    ) {
      jsonError(
        res,
        400,
        `Amount must be at least $${(dodoRecoveryMinimumCents() / 100).toFixed(2)}.`
      );
      return;
    }
    const origin = resolveApprovedOrigin(req, req.body?.origin);
    if (!origin) {
      jsonError(res, 400, "Checkout origin is not approved.");
      return;
    }
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Store database is not available.");
      return;
    }
    const orderId = nanoid(18);
    try {
      await db.insert(storeOrders).values({
        id: orderId,
        userId: user.id,
        items: JSON.stringify([`recovery:${reference}`]),
        amount: amountCents,
        currency: "USD",
        status: "pending",
        gateway: "dodo",
        customerName: customerName || null,
        customerEmail,
      });
      const checkout = await createDodoRecoveryCheckout({
        orderId,
        userId: user.id,
        customerEmail,
        customerName: customerName || null,
        origin,
        amountCents,
        reference,
      });
      await db
        .update(storeOrders)
        .set({ dodoCheckoutId: checkout.sessionId })
        .where(eq(storeOrders.id, orderId));
      res.json({
        url: checkout.checkoutUrl,
        orderId,
        amount: amountCents / 100,
        currency: "USD",
      });
    } catch (error) {
      try {
        await db
          .update(storeOrders)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(storeOrders.id, orderId));
      } catch {
        /* preserve the original checkout error */
      }
      console.error(
        "[Store] recovery checkout failed",
        error instanceof Error ? error.message : "unknown"
      );
      jsonError(
        res,
        502,
        error instanceof Error
          ? error.message
          : "Unable to start recovery checkout."
      );
    }
  });

  app.post("/api/demo/run", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const recent = (demoHits.get(ip) ?? []).filter(
      time => now - time < DEMO_WINDOW_MS
    );
    if (recent.length >= DEMO_MAX_PER_WINDOW) {
      jsonError(res, 429, "Demo rate limit reached. Please try again shortly.");
      return;
    }
    recent.push(now);
    demoHits.set(ip, recent);
    const scenario = req.body?.scenario as DemoScenario;
    const variant = (req.body?.variant ?? "standard") as DemoVariant;
    if (
      !ALLOWED_SCENARIOS.includes(scenario) ||
      !ALLOWED_VARIANTS.includes(variant)
    ) {
      jsonError(res, 400, "Choose a supported synthetic demo scenario.");
      return;
    }
    try {
      const result = await runSyntheticDemo(scenario, variant);
      res.json(result);
    } catch (error) {
      console.error(
        "[Demo] unavailable",
        error instanceof Error ? error.message : "unknown"
      );
      jsonError(
        res,
        503,
        "The AI demo is temporarily unavailable. No action was taken."
      );
    }
  });
}

async function aiClassifyAppointment(): Promise<{
  intent: "appointment" | "other";
  confidence: number;
  needs_human_review: boolean;
}> {
  modelAvailability ??= listLLMModels().then(result =>
    result.data.some(model => model.id === "gpt-5-mini")
  );
  if (!(await modelAvailability))
    throw new Error("gpt-5-mini is not available to this project");
  const response = await invokeLLM({
    model: "gpt-5-mini",
    reasoning: { effort: "low" },
    messages: [
      {
        role: "system",
        content:
          "Classify this fictional DemoCare administrative enquiry. Never infer medical facts. Return only the requested JSON.",
      },
      {
        role: "user",
        content:
          "Fictional DemoCare enquiry from DEMO-001, Alex Demo: I would like to book a general medicine consultation. No clinical symptoms or real patient data are supplied. Classify the administrative intent only.",
      },
    ],
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "demo_classification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            intent: { type: "string", enum: ["appointment", "other"] },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            needs_human_review: { type: "boolean" },
          },
          required: ["intent", "confidence", "needs_human_review"],
          additionalProperties: false,
        },
      },
    },
  });
  const raw = response.choices?.[0]?.message?.content;
  if (typeof raw !== "string" || !raw.trim())
    throw new Error("AI returned no classification");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid classification JSON");
  }
  const data = parsed as Record<string, unknown>;
  if (
    (data.intent !== "appointment" && data.intent !== "other") ||
    typeof data.confidence !== "number" ||
    !Number.isFinite(data.confidence) ||
    data.confidence < 0 ||
    data.confidence > 1 ||
    typeof data.needs_human_review !== "boolean"
  )
    throw new Error("AI classification failed validation");
  return data as {
    intent: "appointment" | "other";
    confidence: number;
    needs_human_review: boolean;
  };
}

export async function runSyntheticDemo(
  scenario: DemoScenario,
  variant: DemoVariant
) {
  const correlationId = `demo_${randomUUID()}`;
  const step = (
    label: string,
    status: "done" | "review" | "skipped",
    detail: string
  ) => ({ label, status, detail });
  if (scenario === "appointment") {
    const classification = await aiClassifyAppointment();
    if (
      classification.intent !== "appointment" ||
      classification.needs_human_review ||
      classification.confidence < 0.8 ||
      variant === "missing-slot" ||
      variant === "duplicate"
    )
      return {
        scenario,
        status: "human-review" as const,
        title: "A staff member should review this enquiry",
        message:
          variant === "missing-slot"
            ? "No approved availability was returned, so no slot was confirmed."
            : variant === "duplicate"
              ? "A duplicate fixture was detected; no second confirmation was prepared."
              : "The classifier did not produce an approval-ready administrative classification.",
        steps: [
          step(
            "Classify fictional enquiry",
            "done",
            "Administrative intent classified."
          ),
          step(
            "Check approved availability",
            "review",
            "No outbound scheduling action was taken."
          ),
          step("Prepare confirmation", "skipped", "Waiting for staff review."),
        ],
        output: {
          classification: classification.intent,
          availability: "review",
          duplicateDetected: variant === "duplicate",
        },
        correlationId,
        aiPowered: true,
      };
    return {
      scenario,
      status: "ready" as const,
      title: "Appointment enquiry is ready for staff approval",
      message:
        "A fictional enquiry matched an approved fixture; no appointment was booked.",
      steps: [
        step(
          "Classify fictional enquiry",
          "done",
          "Administrative intent classified."
        ),
        step(
          "Check approved availability",
          "done",
          "DemoCare fixture returned 2026-11-04 at 10:00."
        ),
        step(
          "Prepare confirmation",
          "done",
          "Draft prepared for staff approval only."
        ),
      ],
      output: {
        classification: classification.intent,
        availability: "confirmed",
        slot: "2026-11-04T10:00:00Z",
      },
      correlationId,
      aiPowered: true,
    };
  }
  const common = { scenario, correlationId, aiPowered: false };
  if (scenario === "no-show") {
    const review = variant === "duplicate";
    return {
      ...common,
      status: review ? ("human-review" as const) : ("ready" as const),
      title: review
        ? "Duplicate no-show fixture needs review"
        : "No-show recovery is ready for staff review",
      message: review
        ? "Idempotency guard stopped a duplicate follow-up."
        : "The fixture status is no-show; a draft task is ready and no message was sent.",
      steps: [
        step(
          "Check appointment status",
          "done",
          "Synthetic fixture status is no-show."
        ),
        step(
          "Check duplicate guard",
          review ? "review" : "done",
          review
            ? "Duplicate detected; no second task."
            : "No duplicate fixture found."
        ),
        step(
          "Prepare follow-up task",
          review ? "skipped" : "done",
          "Administrative draft only."
        ),
      ],
      output: { appointmentStatus: "no-show", duplicateDetected: review },
    };
  }
  if (scenario === "discharge") {
    const approved = variant === "standard";
    const approvedDate = "2026-11-07";
    const feedback =
      "The appointment coordination took longer than expected. Please have the front desk contact me.";
    const task = approved
      ? {
          patientId: "DEMO-002",
          title: "Approved administrative follow-up",
          dueDate: approvedDate,
          owner: "DemoCare coordinator",
          status: "draft",
        }
      : null;
    const serviceRecoveryTask = approved
      ? {
          title: "Review appointment-coordination feedback",
          owner: "DemoCare service-recovery coordinator",
          reason:
            "A supplied synthetic feedback fixture explicitly requests a staff callback.",
          status: "draft",
        }
      : null;
    return {
      ...common,
      status: approved ? ("ready" as const) : ("skipped" as const),
      title: approved
        ? "Follow-up and service-recovery drafts are ready"
        : "Follow-up was safely skipped",
      message: approved
        ? "The hospital-approved date produced an administrative follow-up draft. Supplied feedback requesting a callback produced an owned service-recovery task. Nothing was sent and no clinical advice was generated."
        : "No approved follow-up instruction was supplied; task and message preparation stopped.",
      steps: [
        step(
          "Check approved follow-up instruction",
          approved ? "done" : "review",
          approved
            ? `The fixture explicitly supplies ${approvedDate}; no medical schedule is inferred.`
            : "No approved instruction."
        ),
        step(
          "Prepare approved administrative task",
          approved ? "done" : "skipped",
          approved
            ? "Assigned to DemoCare coordinator using the supplied approved date."
            : "Task not created."
        ),
        step(
          "Check consent and duplicate flags",
          approved ? "done" : "skipped",
          "Synthetic fixture includes approval and no prior-send flag; production needs durable deduplication."
        ),
        step(
          "Review supplied service feedback",
          approved ? "done" : "skipped",
          approved
            ? "Explicit callback request identified by a deterministic demo rule; no AI or clinical interpretation is claimed."
            : "Feedback stage skipped."
        ),
        step(
          "Prepare service-recovery handoff",
          approved ? "done" : "skipped",
          approved
            ? "An internal draft is assigned to the DemoCare service-recovery coordinator."
            : "No downstream action."
        ),
        step(
          "Return audit trace",
          "done",
          `Workflow DEMO | Approved Follow-Up; correlation ${correlationId}. No external writes or sends.`
        ),
      ],
      output: {
        approvedFollowup: approved,
        task,
        feedback: approved ? feedback : null,
        serviceRecoveryTask,
        outboundAction: false,
        clinicalInterpretation: false,
      },
    };
  }
  if (scenario === "diagnostic") {
    const review = variant === "duplicate";
    const patientMessageDraft = review
      ? null
      : "The DemoCare administrative coordinator has been asked to review your pending coordination task. Please contact the front desk if you have an administrative question.";
    return {
      ...common,
      status: review ? ("human-review" as const) : ("ready" as const),
      title: "Pending diagnostic coordination routed to staff",
      message: review
        ? "A duplicate escalation fixture was detected. No second handoff or notification was prepared."
        : "A staff escalation and an approved administrative notification draft were prepared. No clinical result was read or interpreted, and nothing was sent.",
      steps: [
        step(
          "Check source task status",
          "done",
          "Synthetic DEMO-DX-001 is pending administrative coordination."
        ),
        step(
          "Prepare staff escalation",
          review ? "review" : "done",
          review
            ? "Duplicate fixture stopped a second escalation."
            : "Draft assigned to DemoCare department coordinator."
        ),
        step(
          "Check notification approval and consent",
          review ? "skipped" : "done",
          "The synthetic fixture explicitly authorizes a generic administrative notification; it contains no result values."
        ),
        step(
          "Prepare administrative notification",
          review ? "skipped" : "done",
          "Draft only. No report-readiness claim or result interpretation."
        ),
        step(
          "Interpret clinical result",
          "skipped",
          "Clinical interpretation is outside the administrative automation boundary."
        ),
        step(
          "Return audit trace",
          "done",
          `Correlation ${correlationId}; no live message, task, or result access.`
        ),
      ],
      output: {
        diagnosticStatus: "pending",
        staffOwner: "DemoCare department coordinator",
        patientMessageDraft,
        clinicalInterpretation: false,
        duplicateDetected: review,
        outboundAction: false,
      },
    };
  }
  if (scenario === "lead")
    return {
      ...common,
      status: "ready" as const,
      title: "Lead is ready for a human next step",
      message: "Synthetic lead details were organized without outreach.",
      steps: [
        step(
          "Validate supplied fields",
          "done",
          "Synthetic fields are complete."
        ),
        step("Assign next step", "done", "Review queue selected."),
        step("Send outreach", "skipped", "No outbound action is enabled."),
      ],
      output: { nextStep: "human-review", outboundAction: false },
    };
  return {
    ...common,
    status: "human-review" as const,
    title: "Clinical case requires a qualified human",
    message:
      "The demo intentionally stops before any clinical interpretation or action.",
    steps: [
      step("Receive synthetic case", "done", "No patient data accepted."),
      step("Apply guardrail", "review", "Qualified staff review is required."),
      step(
        "Clinical action",
        "skipped",
        "No clinical result or recommendation produced."
      ),
    ],
    output: { clinicalInterpretation: false, humanReviewRequired: true },
  };
}
