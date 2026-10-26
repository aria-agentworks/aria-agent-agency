import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Core user table backing auth flow (SQLite for zero-dependency installs).
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Auth identifier. `local_<id>` for built-in email accounts; platform openId otherwise. */
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  /** Built-in email/password accounts only. Never exposed through the API. */
  passwordHash: text("passwordHash"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] })
    .notNull()
    .default("user"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";
export const ORDER_STATUSES = [
  "pending",
  "paid",
  "failed",
  "cancelled",
] as const;
export type PaymentGateway = "stripe" | "dodo";
export const PAYMENT_GATEWAYS = ["stripe", "dodo"] as const;

export const storeOrders = sqliteTable("store_orders", {
  id: text("id").primaryKey(),
  userId: integer("userId").notNull(),
  items: text("items").notNull(),
  amount: integer("amount").notNull(), // USD cents; response serializers expose whole USD.
  currency: text("currency").notNull().default("USD"),
  status: text("status", { enum: ORDER_STATUSES }).notNull().default("pending"),
  gateway: text("gateway", { enum: PAYMENT_GATEWAYS }).notNull().default("stripe"),
  customerName: text("customerName"),
  customerEmail: text("customerEmail"),
  promoCode: text("promoCode"),
  stripeSessionId: text("stripeSessionId").unique(),
  stripeCustomerId: text("stripeCustomerId"),
  stripePaymentIntentId: text("stripePaymentIntentId"),
  dodoCheckoutId: text("dodoCheckoutId").unique(),
  dodoPaymentId: text("dodoPaymentId"),
  dodoCustomerId: text("dodoCustomerId"),
  dodoSubscriptionId: text("dodoSubscriptionId"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type StoreOrder = typeof storeOrders.$inferSelect;
export type InsertStoreOrder = typeof storeOrders.$inferInsert;

export const storePurchases = sqliteTable("store_purchases", {
  id: text("id").primaryKey(),
  orderId: text("orderId").notNull().unique(),
  userId: integer("userId").notNull(),
  items: text("items").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type StorePurchase = typeof storePurchases.$inferSelect;

export type SupportOption =
  | "scope-only"
  | "installation"
  | "installation-api"
  | "managed-api";
export const SUPPORT_OPTIONS = [
  "scope-only",
  "installation",
  "installation-api",
  "managed-api",
] as const;

export const storeInquiries = sqliteTable("store_inquiries", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  business: text("business").notNull(),
  industry: text("industry").notNull(),
  automation: text("automation").notNull(),
  supportOption: text("supportOption", { enum: SUPPORT_OPTIONS }),
  location: text("location"),
  country: text("country"),
  timezone: text("timezone"),
  languages: text("languages"),
  ownerRole: text("ownerRole"),
  apiProviders: text("apiProviders"),
  tools: text("tools").notNull(),
  goals: text("goals").notNull(),
  phone: text("phone"),
  website: text("website"),
  consent: integer("consent").notNull().default(1),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type StoreInquiry = typeof storeInquiries.$inferSelect;

export const stripeEvents = sqliteTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: integer("processedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Idempotent log of Dodo webhook deliveries. */
export const dodoEvents = sqliteTable("dodo_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: integer("processedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type SubscriptionStatus =
  | "pending"
  | "active"
  | "past_due"
  | "cancelled"
  | "on_hold"
  | "expired";
export const SUBSCRIPTION_STATUSES = [
  "pending",
  "active",
  "past_due",
  "cancelled",
  "on_hold",
  "expired",
] as const;
export const storeSubscriptions = sqliteTable(
  "store_subscriptions",
  {
    id: text("id").primaryKey(),
    userId: integer("userId").notNull(),
    planId: text("planId").notNull(),
    status: text("status", { enum: SUBSCRIPTION_STATUSES })
      .notNull()
      .default("pending"),
    gateway: text("gateway", { enum: PAYMENT_GATEWAYS })
      .notNull()
      .default("dodo"),
    customerEmail: text("customerEmail"),
    dodoSubscriptionId: text("dodoSubscriptionId").unique(),
    dodoCustomerId: text("dodoCustomerId"),
    dodoProductId: text("dodoProductId"),
    nextBillingDate: integer("nextBillingDate", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  table => [uniqueIndex("store_subscriptions_user_plan").on(table.userId, table.planId)]
);

export type StoreSubscription = typeof storeSubscriptions.$inferSelect;

/** Newsletter / lead-magnet email capture for sales and marketing. */
export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("website"),
  name: text("name"),
  verified: integer("verified").notNull().default(0),
  unsubscribedAt: integer("unsubscribedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

/** First-party marketing analytics events (page views, funnel steps). */
export const marketingEvents = sqliteTable("marketing_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  path: text("path"),
  referrer: text("referrer"),
  sessionId: text("sessionId"),
  meta: text("meta"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type MarketingEvent = typeof marketingEvents.$inferSelect;

/** Internally validated promo codes applied at checkout. */
export const promoCodes = sqliteTable("promo_codes", {
  code: text("code").primaryKey(),
  kind: text("kind", { enum: ["percent", "fixed"] }).notNull(),
  value: integer("value").notNull(), // percent 1-100, or fixed USD cents off
  active: integer("active").notNull().default(1),
  usageLimit: integer("usageLimit"),
  usedCount: integer("usedCount").notNull().default(0),
  note: text("note"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type PromoCode = typeof promoCodes.$inferSelect;

/** Maps catalog automation ids to Dodo product ids (auto-provisioned). */
export const dodoProductMap = sqliteTable("dodo_product_map", {
  automationId: text("automationId").primaryKey(),
  dodoProductId: text("dodoProductId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type DodoProductMapping = typeof dodoProductMap.$inferSelect;

export const ONBOARDING_STATUSES = [
  "new",
  "paid",
  "contacted",
  "installing",
  "blocked",
  "live",
] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

/**
 * One row per client who runs the "Get started" wizard. Captures the
 * business, the detected/confirmed category, the delivery preference
 * (website embed / Aria portal), and the plan they chose.
 */
export const onboardingRequests = sqliteTable("onboarding_requests", {
  id: text("id").primaryKey(),
  userId: integer("userId"),
  businessName: text("businessName"),
  website: text("website"),
  email: text("email"),
  categoryId: text("categoryId").notNull(),
  /** JSON answers from the three onboarding questions. */
  answers: text("answers"),
  /** embed | portal | both */
  delivery: text("delivery"),
  planId: text("planId"),
  status: text("status", { enum: ONBOARDING_STATUSES })
    .notNull()
    .default("new"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type OnboardingRequest = typeof onboardingRequests.$inferSelect;

/* ------------------------- Growth engine (sales) ------------------------- */

export const GROWTH_LEAD_STATUSES = [
  "new",
  "researched",
  "contacted",
  "replied",
  "booked",
  "won",
  "lost",
] as const;
export type GrowthLeadStatus = (typeof GROWTH_LEAD_STATUSES)[number];

export const GROWTH_AGENTS = ["leadgen", "voice", "message", "email"] as const;
export type GrowthAgent = (typeof GROWTH_AGENTS)[number];

export const GROWTH_CHANNELS = ["call", "whatsapp", "sms", "email"] as const;
export type GrowthChannel = (typeof GROWTH_CHANNELS)[number];

/**
 * One row per prospect business gathered by the Lead Generation Agent.
 * `assessment` holds the JSON result of the website research; personal
 * contact details stay optional so directory leads can be tracked before
 * full contact info is confirmed.
 */
export const growthLeads = sqliteTable("growth_leads", {
  id: text("id").primaryKey(),
  nicheId: text("nicheId").notNull(),
  businessName: text("businessName").notNull(),
  ownerName: text("ownerName"),
  website: text("website"),
  phone: text("phone"),
  email: text("email"),
  whatsapp: text("whatsapp"),
  instagram: text("instagram"),
  city: text("city"),
  country: text("country").default("India"),
  sourceName: text("sourceName"),
  sourceUrl: text("sourceUrl"),
  /** JSON SiteAssessment from shared/growth. */
  assessment: text("assessment"),
  opportunityScore: integer("opportunityScore").notNull().default(0),
  priority: text("priority", { enum: ["hot", "warm", "cold"] })
    .notNull()
    .default("warm"),
  pitchAngle: text("pitchAngle"),
  status: text("status", { enum: GROWTH_LEAD_STATUSES })
    .notNull()
    .default("new"),
  doNotContact: integer("doNotContact", { mode: "boolean" })
    .notNull()
    .default(false),
  doNotContactReason: text("doNotContactReason"),
  lastContactedAt: integer("lastContactedAt", { mode: "timestamp" }),
  nextContactAt: integer("nextContactAt", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type GrowthLead = typeof growthLeads.$inferSelect;
export type InsertGrowthLead = typeof growthLeads.$inferInsert;

/** Every outreach action by the voice / message / email agents. */
export const growthActivities = sqliteTable("growth_activities", {
  id: text("id").primaryKey(),
  leadId: text("leadId").notNull(),
  agent: text("agent", { enum: GROWTH_AGENTS }).notNull(),
  channel: text("channel", { enum: GROWTH_CHANNELS }).notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  outcome: text("outcome"),
  meta: text("meta"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type GrowthActivity = typeof growthActivities.$inferSelect;
export type InsertGrowthActivity = typeof growthActivities.$inferInsert;
