import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { SEED_LEADS } from "./growthLeadsSeed";
import {
  dodoEvents,
  dodoProductMap,
  growthActivities,
  growthLeads,
  marketingEvents,
  newsletterSubscribers,
  onboardingRequests,
  promoCodes,
  storeInquiries,
  storeOrders,
  storePurchases,
  storeSubscriptions,
  stripeEvents,
  users,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

export type AriaDatabase = ReturnType<typeof drizzle>;

let _db: AriaDatabase | null = null;

function resolveDatabaseFile(): string {
  const explicit = process.env.SQLITE_DB_PATH;
  if (explicit && explicit.trim()) return path.resolve(explicit.trim());
  return path.resolve(process.cwd(), "data", "aria.sqlite3");
}

function bootstrapSchema(sqlite: Database.Database) {
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openId TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT,
      passwordHash TEXT,
      loginMethod TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      lastSignedIn INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS store_orders (
      id TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      items TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'pending',
      gateway TEXT NOT NULL DEFAULT 'stripe',
      customerName TEXT,
      customerEmail TEXT,
      promoCode TEXT,
      stripeSessionId TEXT UNIQUE,
      stripeCustomerId TEXT,
      stripePaymentIntentId TEXT,
      dodoCheckoutId TEXT UNIQUE,
      dodoPaymentId TEXT,
      dodoCustomerId TEXT,
      dodoSubscriptionId TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS store_purchases (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL UNIQUE,
      userId INTEGER NOT NULL,
      items TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS store_inquiries (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      business TEXT NOT NULL,
      industry TEXT NOT NULL,
      automation TEXT NOT NULL,
      supportOption TEXT,
      location TEXT,
      country TEXT,
      timezone TEXT,
      languages TEXT,
      ownerRole TEXT,
      apiProviders TEXT,
      tools TEXT NOT NULL,
      goals TEXT NOT NULL,
      phone TEXT,
      website TEXT,
      consent INTEGER NOT NULL DEFAULT 1,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stripe_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      processedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dodo_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      processedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS store_subscriptions (
      id TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      planId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      gateway TEXT NOT NULL DEFAULT 'dodo',
      customerEmail TEXT,
      dodoSubscriptionId TEXT UNIQUE,
      dodoCustomerId TEXT,
      dodoProductId TEXT,
      nextBillingDate INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS store_subscriptions_user_plan
      ON store_subscriptions (userId, planId);

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL DEFAULT 'website',
      name TEXT,
      verified INTEGER NOT NULL DEFAULT 0,
      unsubscribedAt INTEGER,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS marketing_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      path TEXT,
      referrer TEXT,
      sessionId TEXT,
      meta TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS promo_codes (
      code TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      value INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      usageLimit INTEGER,
      usedCount INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dodo_product_map (
      automationId TEXT PRIMARY KEY,
      dodoProductId TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS onboarding_requests (
      id TEXT PRIMARY KEY,
      userId INTEGER,
      businessName TEXT,
      website TEXT,
      email TEXT,
      categoryId TEXT NOT NULL,
      answers TEXT,
      delivery TEXT,
      planId TEXT,
       status TEXT NOT NULL DEFAULT 'new',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS onboarding_requests_user_idx ON onboarding_requests (userId);
    CREATE INDEX IF NOT EXISTS store_orders_user_idx ON store_orders (userId);
    CREATE INDEX IF NOT EXISTS store_orders_status_idx ON store_orders (status);
    CREATE INDEX IF NOT EXISTS marketing_events_type_idx ON marketing_events (type);

    CREATE TABLE IF NOT EXISTS growth_leads (
      id TEXT PRIMARY KEY,
      nicheId TEXT NOT NULL,
      businessName TEXT NOT NULL,
      ownerName TEXT,
      website TEXT,
      phone TEXT,
      email TEXT,
      whatsapp TEXT,
      instagram TEXT,
      city TEXT,
      country TEXT DEFAULT 'India',
      sourceName TEXT,
      sourceUrl TEXT,
      assessment TEXT,
      opportunityScore INTEGER NOT NULL DEFAULT 0,
      priority TEXT NOT NULL DEFAULT 'warm',
       pitchAngle TEXT,
       status TEXT NOT NULL DEFAULT 'new',
       doNotContact INTEGER NOT NULL DEFAULT 0,
       doNotContactReason TEXT,
       lastContactedAt INTEGER,
       nextContactAt INTEGER,
       notes TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS growth_leads_niche_idx ON growth_leads (nicheId);
    CREATE INDEX IF NOT EXISTS growth_leads_status_idx ON growth_leads (status);

    CREATE TABLE IF NOT EXISTS growth_activities (
      id TEXT PRIMARY KEY,
      leadId TEXT NOT NULL,
      agent TEXT NOT NULL,
      channel TEXT NOT NULL,
      subject TEXT,
      content TEXT NOT NULL,
      outcome TEXT,
      meta TEXT,
      createdAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS growth_activities_lead_idx ON growth_activities (leadId);
  `);

  // Keep the zero-config bootstrap compatible with databases created before
  // the Growth Engine suppression fields were added.
  const growthColumns = sqlite
    .prepare("PRAGMA table_info(growth_leads)")
    .all() as Array<{ name: string }>;
  const existing = new Set(growthColumns.map(column => column.name));
  const additions: Array<[string, string]> = [
    ["doNotContact", "INTEGER NOT NULL DEFAULT 0"],
    ["doNotContactReason", "TEXT"],
    ["lastContactedAt", "INTEGER"],
    ["nextContactAt", "INTEGER"],
  ];
  for (const [name, definition] of additions) {
    if (!existing.has(name)) {
      sqlite.exec(`ALTER TABLE growth_leads ADD COLUMN ${name} ${definition}`);
    }
  }
}

function autoSeedGrowthLeads(sqlite: Database.Database) {
  try {
    const row = sqlite.prepare("SELECT COUNT(*) AS count FROM growth_leads").get() as { count: number } | undefined;
    if (row && row.count > 0) return;

    const insert = sqlite.prepare(`
      INSERT OR IGNORE INTO growth_leads (
        id, nicheId, businessName, ownerName, website, phone, email, whatsapp,
        instagram, city, country, sourceName, sourceUrl, assessment,
        opportunityScore, priority, pitchAngle, status, doNotContact,
        doNotContactReason, lastContactedAt, nextContactAt, notes, createdAt, updatedAt
      ) VALUES (
        @id, @nicheId, @businessName, @ownerName, @website, @phone, @email, @whatsapp,
        @instagram, @city, @country, @sourceName, @sourceUrl, @assessment,
        @opportunityScore, @priority, @pitchAngle, @status, @doNotContact,
        @doNotContactReason, @lastContactedAt, @nextContactAt, @notes, @createdAt, @updatedAt
      )
    `);

    const insertMany = sqlite.transaction((items: readonly any[]) => {
      for (const item of items) {
        insert.run({
          id: item.id,
          nicheId: item.nicheId,
          businessName: item.businessName,
          ownerName: item.ownerName ?? null,
          website: item.website ?? null,
          phone: item.phone ?? null,
          email: item.email ?? null,
          whatsapp: item.whatsapp ?? null,
          instagram: item.instagram ?? null,
          city: item.city ?? null,
          country: item.country ?? 'India',
          sourceName: item.sourceName ?? 'Public directory',
          sourceUrl: item.sourceUrl ?? null,
          assessment: typeof item.assessment === 'string' ? item.assessment : JSON.stringify(item.assessment ?? null),
          opportunityScore: item.opportunityScore ?? 0,
          priority: item.priority ?? 'warm',
          pitchAngle: item.pitchAngle ?? null,
          status: item.status ?? 'researched',
          doNotContact: item.doNotContact ?? 0,
          doNotContactReason: item.doNotContactReason ?? null,
          lastContactedAt: item.lastContactedAt ?? null,
          nextContactAt: item.nextContactAt ?? null,
          notes: item.notes ?? null,
          createdAt: item.createdAt || Date.now(),
          updatedAt: item.updatedAt || Date.now(),
        });
      }
    });

    insertMany(SEED_LEADS);
    console.log(`[Growth] Auto-seeded ${SEED_LEADS.length} researched prospect leads on initial boot.`);
  } catch (error) {
    console.warn("[Growth] Auto-seed skipped:", error instanceof Error ? error.message : error);
  }
}

function autoSeedAdmin(sqlite: Database.Database) {
  try {
    const userCount = sqlite.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number } | undefined;
    if (userCount && userCount.count > 0) return;

    const email = process.env.INITIAL_ADMIN_EMAIL?.trim() || "sriraajj@gmail.com";
    const passwordHash = process.env.INITIAL_ADMIN_PASSWORD_HASH?.trim() || "scrypt:8931707ce5977b39284b2bbddf651e05:70f5af308477d7df244cae6c9022ce904fa9a64f74ff2ccc42df9c19c0c1131198f2d79651ee5a761773cd155bb2c503c93a419185cf3108f41053a62569382d";
    const now = Date.now();

    sqlite.prepare(`
      INSERT INTO users (openId, name, email, passwordHash, loginMethod, role, createdAt, updatedAt, lastSignedIn)
      VALUES (?, ?, ?, ?, 'email', 'admin', ?, ?, ?)
    `).run(`local_admin_${now}`, "Rajesh / Agency Owner", email, passwordHash, now, now, now);

    console.log(`[Auth] Auto-seeded default admin account (${email}) on initial database boot.`);
  } catch (error) {
    console.warn("[Auth] Admin auto-seed skipped:", error instanceof Error ? error.message : error);
  }
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb(): Promise<AriaDatabase | null> {
  if (!_db && process.env.DATABASE_URL !== "disabled") {
    try {
      const file = resolveDatabaseFile();
      mkdirSync(path.dirname(file), { recursive: true });
      const sqlite = new Database(file);
      bootstrapSchema(sqlite);
      autoSeedGrowthLeads(sqlite);
      autoSeedAdmin(sqlite);
      _db = drizzle({ client: sqlite, schema: {

        users,
        storeOrders,
        storePurchases,
        storeInquiries,
        stripeEvents,
        dodoEvents,
        storeSubscriptions,
        newsletterSubscribers,
        marketingEvents,
        promoCodes,
        dodoProductMap,
        onboardingRequests,
        growthLeads,
        growthActivities,
      } });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database is not available");
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    // Built-in email accounts only: stored on insert, never updated silently.
    if (user.passwordHash !== undefined && user.passwordHash !== null) {
      values.passwordHash = user.passwordHash;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet[fieldSafe("lastSignedIn")] = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet[fieldSafe("role")] = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet[fieldSafe("role")] = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet[fieldSafe("lastSignedIn")] = new Date();
    }

    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

// Small helper keeps the updateSet keys type-safe without repeating casts.
function fieldSafe<K extends keyof InsertUser>(key: K): K {
  return key;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
