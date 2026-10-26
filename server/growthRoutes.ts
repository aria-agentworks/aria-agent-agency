import type { Express, Request, Response } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { sdk, type AuthenticatedUser } from "./_core/sdk";
import { getDb } from "./db";
import { fetchPublicHtml } from "./publicFetch";
import {
  growthActivities,
  growthLeads,
  type GrowthLead,
} from "../drizzle/schema";
import {
  assessProspectSite,
  buildEmailSequence,
  buildVoiceScript,
  getNiche,
  LEAD_STATUSES,
  renderTemplate,
  SMS_TEMPLATE,
  WHATSAPP_TEMPLATES,
  type EmailTemplate,
  type LeadStatus,
  type SiteAssessment,
  type TemplateVars,
  type VoiceScript,
} from "../shared/growth";

const SITE_FETCH_TIMEOUT_MS = 7000;
const SITE_MAX_BYTES = 400_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; AriaGrowthResearch/1.0; +https://ariaagent.agency)";

function jsonError(res: Response, status: number, error: string) {
  res.status(status).json({ error });
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

async function requireGrowthAdmin(
  req: Request,
  res: Response
): Promise<AuthenticatedUser | null> {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (user.role !== "admin") {
    jsonError(res, 403, "Agency admin access required.");
    return null;
  }
  return user;
}

/* ------------------------- LLM availability cache ------------------------ */

let llmCheck: Promise<boolean> | undefined;

function llmAvailable(): Promise<boolean> {
  if (!llmCheck) {
    llmCheck = listLLMModels()
      .then(() => true)
      .catch(() => false);
  }
  return llmCheck;
}

/* --------------------------- Site fetch helpers -------------------------- */

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

async function fetchSite(url: string): Promise<string | null> {
  try {
    return await fetchPublicHtml(url, {
      timeoutMs: SITE_FETCH_TIMEOUT_MS,
      maxBytes: SITE_MAX_BYTES,
      userAgent: USER_AGENT,
    });
  } catch {
    return null;
  }
}

/* ----------------------------- Serialization ----------------------------- */

function parseAssessment(raw: string | null): SiteAssessment | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SiteAssessment;
  } catch {
    return null;
  }
}

function serializeLead(
  lead: GrowthLead,
  lastActivityAt?: Date | null,
  activityCount = 0
) {
  return {
    id: lead.id,
    nicheId: lead.nicheId,
    businessName: lead.businessName,
    ownerName: lead.ownerName,
    website: lead.website,
    phone: lead.phone,
    email: lead.email,
    whatsapp: lead.whatsapp,
    instagram: lead.instagram,
    city: lead.city,
    country: lead.country,
    sourceName: lead.sourceName,
    sourceUrl: lead.sourceUrl,
    assessment: parseAssessment(lead.assessment),
    opportunityScore: lead.opportunityScore,
    priority: lead.priority,
    pitchAngle: lead.pitchAngle,
    status: lead.status,
    doNotContact: Boolean(lead.doNotContact),
    doNotContactReason: lead.doNotContactReason,
    lastContactedAt: lead.lastContactedAt,
    nextContactAt: lead.nextContactAt,
    notes: lead.notes,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    lastActivityAt: lastActivityAt ?? null,
    activityCount,
  };
}

function leadVars(lead: GrowthLead, nicheId: string): TemplateVars {
  // Address a clinic as "Doctor" by default; everywhere else, stay neutral.
  const ownerFallback = nicheId === "dental" ? "Doctor" : "there";
  return {
    business: lead.businessName,
    ownerName: lead.ownerName || ownerFallback,
    agentName: "Aria",
    city: lead.city || "your city",
  };
}

/** On first outreach the lead status moves to contacted (unless further). */
const STATUS_RANK = LEAD_STATUSES.reduce<Record<string, number>>(
  (acc, status, index) => {
    acc[status] = index;
    return acc;
  },
  {}
);

async function markContacted(leadId: string, minStatus?: LeadStatus) {
  const db = await getDb();
  if (!db) return;
  const rows = await db
    .select()
    .from(growthLeads)
    .where(eq(growthLeads.id, leadId))
    .limit(1);
  const lead = rows[0];
  if (!lead) return;
  const next: LeadStatus = (minStatus ?? "contacted") as LeadStatus;
  if ((STATUS_RANK[lead.status] ?? 0) < (STATUS_RANK[next] ?? 0)) {
    await db
      .update(growthLeads)
      .set({ status: next, lastContactedAt: new Date(), updatedAt: new Date() })
      .where(eq(growthLeads.id, leadId));
  }
}

async function loadLeadForOutreach(leadId: string) {
  const db = await getDb();
  if (!db) return { db: null, lead: null };
  const rows = await db
    .select()
    .from(growthLeads)
    .where(eq(growthLeads.id, leadId))
    .limit(1);
  return { db, lead: rows[0] ?? null };
}

function outreachBlocked(lead: GrowthLead): boolean {
  return Boolean(lead.doNotContact) || lead.status === "lost";
}

/* ------------------------------ LLM helpers ------------------------------ */

type LLMJsonResult<T> = { ok: true; value: T } | { ok: false; error: string };

async function generateJson<T>(
  system: string,
  user: string,
  schemaName: string,
  schema: Record<string, unknown>
): Promise<LLMJsonResult<T>> {
  if (!(await llmAvailable())) {
    return { ok: false, error: "LLM not configured" };
  }
  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: { name: schemaName, schema, strict: false },
      },
      maxTokens: 1400,
    });
    const content = result.choices?.[0]?.message?.content;
    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content
              .map(part => (part.type === "text" ? part.text : ""))
              .join("\n")
          : "";
    const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
    return { ok: true, value: JSON.parse(cleaned) as T };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "LLM failed",
    };
  }
}

const VOICE_SCHEMA = {
  type: "object",
  properties: {
    opener: { type: "string" },
    hook: { type: "string" },
    pitch: { type: "string" },
    discovery: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 4 },
    objections: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          objection: { type: "string" },
          response: { type: "string" },
        },
        required: ["objection", "response"],
      },
    },
    close: { type: "string" },
  },
  required: ["opener", "hook", "pitch", "discovery", "objections", "close"],
} as const;

const EMAIL_SCHEMA = {
  type: "object",
  properties: {
    emails: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          day: { type: "number" },
          subject: { type: "string" },
          body: { type: "string" },
        },
        required: ["day", "subject", "body"],
      },
    },
  },
  required: ["emails"],
} as const;

const MESSAGE_SCHEMA = {
  type: "object",
  properties: {
    body: { type: "string" },
  },
  required: ["body"],
} as const;

/* ------------------------------ Route setup ------------------------------ */

export function registerGrowthRoutes(app: Express) {
  app.use("/api/growth", (_req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    next();
  });

  /* ---- Lead list + create ---- */

  app.get("/api/growth/leads", async (req, res) => {
    const user = await requireGrowthAdmin(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Growth database is not available.");
      return;
    }
    const nicheId = typeof req.query.niche === "string" ? req.query.niche : "";
    const statusInput = typeof req.query.status === "string" ? req.query.status : "";
    const status = (LEAD_STATUSES as readonly string[]).includes(statusInput)
      ? (statusInput as LeadStatus)
      : "";
    const filters = [];
    if (nicheId) filters.push(eq(growthLeads.nicheId, nicheId));
    if (status) filters.push(eq(growthLeads.status, status));
    const rows = await db
      .select()
      .from(growthLeads)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(growthLeads.opportunityScore), desc(growthLeads.updatedAt));
    const ids = rows.map(row => row.id);
    const activities = ids.length
      ? await db
          .select()
          .from(growthActivities)
          .where(inArray(growthActivities.leadId, ids))
          .orderBy(desc(growthActivities.createdAt))
      : [];
    const byLead = new Map<string, { count: number; last: Date | null }>();
    for (const activity of activities) {
      const entry = byLead.get(activity.leadId) ?? { count: 0, last: null };
      entry.count += 1;
      if (!entry.last) entry.last = activity.createdAt;
      byLead.set(activity.leadId, entry);
    }
    res.json({
      leads: rows.map(row => {
        const meta = byLead.get(row.id);
        return serializeLead(row, meta?.last ?? null, meta?.count ?? 0);
      }),
    });
  });

  app.post("/api/growth/leads", async (req, res) => {
    const user = await requireGrowthAdmin(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Growth database is not available.");
      return;
    }
    const niche = getNiche(String(req.body?.nicheId ?? ""));
    if (!niche) {
      jsonError(res, 400, "Unknown niche.");
      return;
    }
    const businessName = String(req.body?.businessName ?? "").trim().slice(0, 200);
    if (!businessName) {
      jsonError(res, 400, "Business name is required.");
      return;
    }
    const id = nanoid(16);
    await db.insert(growthLeads).values({
      id,
      nicheId: niche.id,
      businessName,
      ownerName: String(req.body?.ownerName ?? "").trim().slice(0, 120) || null,
      website: String(req.body?.website ?? "").trim().slice(0, 300) || null,
      phone: String(req.body?.phone ?? "").trim().slice(0, 40) || null,
      email: String(req.body?.email ?? "").trim().slice(0, 320) || null,
      whatsapp: String(req.body?.whatsapp ?? "").trim().slice(0, 40) || null,
      instagram: String(req.body?.instagram ?? "").trim().slice(0, 200) || null,
      city: String(req.body?.city ?? "").trim().slice(0, 120) || null,
      sourceName: String(req.body?.sourceName ?? "").trim().slice(0, 120) || "Manual add",
      sourceUrl: String(req.body?.sourceUrl ?? "").trim().slice(0, 500) || null,
      notes: String(req.body?.notes ?? "").trim().slice(0, 2000) || null,
      opportunityScore: 60,
      pitchAngle: "TBD — run research",
    });
    const rows = await db
      .select()
      .from(growthLeads)
      .where(eq(growthLeads.id, id))
      .limit(1);
    res.json({ lead: serializeLead(rows[0]) });
  });

  /* ---- Lead update / delete ---- */

  app.patch("/api/growth/leads/:id", async (req, res) => {
    const user = await requireGrowthAdmin(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Growth database is not available.");
      return;
    }
    const rows = await db
      .select()
      .from(growthLeads)
      .where(eq(growthLeads.id, req.params.id))
      .limit(1);
    const lead = rows[0];
    if (!lead) {
      jsonError(res, 404, "Lead not found.");
      return;
    }
    const body = req.body ?? {};
    const updates: Partial<GrowthLead> = { updatedAt: new Date() };
    const textFields = [
      "ownerName",
      "website",
      "phone",
      "email",
      "whatsapp",
      "instagram",
      "city",
      "notes",
      "pitchAngle",
    ] as const;
    for (const field of textFields) {
      if (typeof body[field] === "string") {
        updates[field] = (body[field] as string).trim().slice(0, 2000) || null;
      }
    }
    if (typeof body.businessName === "string" && body.businessName.trim()) {
      updates.businessName = body.businessName.trim().slice(0, 200);
    }
    if (typeof body.status === "string" && (LEAD_STATUSES as readonly string[]).includes(body.status)) {
      updates.status = body.status as LeadStatus;
    }
    if (["hot", "warm", "cold"].includes(body.priority)) {
      updates.priority = body.priority;
    }
    if (typeof body.doNotContact === "boolean") {
      updates.doNotContact = body.doNotContact;
      updates.doNotContactReason = body.doNotContact
        ? String(body.doNotContactReason ?? "Manual suppression").trim().slice(0, 200)
        : null;
    }
    await db.update(growthLeads).set(updates).where(eq(growthLeads.id, lead.id));
    const refreshed = await db
      .select()
      .from(growthLeads)
      .where(eq(growthLeads.id, lead.id))
      .limit(1);
    res.json({ lead: serializeLead(refreshed[0]) });
  });

  app.delete("/api/growth/leads/:id", async (req, res) => {
    const user = await requireGrowthAdmin(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Growth database is not available.");
      return;
    }
    await db.delete(growthActivities).where(eq(growthActivities.leadId, req.params.id));
    await db.delete(growthLeads).where(eq(growthLeads.id, req.params.id));
    res.json({ ok: true });
  });

  /* ---- LEAD GENERATION AGENT: research one lead's website ---- */

  app.post("/api/growth/leads/:id/research", async (req, res) => {
    const user = await requireGrowthAdmin(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Growth database is not available.");
      return;
    }
    const rows = await db
      .select()
      .from(growthLeads)
      .where(eq(growthLeads.id, req.params.id))
      .limit(1);
    const lead = rows[0];
    if (!lead) {
      jsonError(res, 404, "Lead not found.");
      return;
    }
    if (outreachBlocked(lead)) {
      jsonError(res, 409, "Outreach is blocked for this lead.");
      return;
    }
    const niche = getNiche(lead.nicheId);
    let html: string | null = null;
    let reachable = false;
    if (lead.website) {
      html = await fetchSite(lead.website);
      reachable = html !== null;
    }
    const signals = html ? extractSiteSignals(html) : { title: null, description: null, text: null };
    const assessment = assessProspectSite({
      reachable,
      title: signals.title,
      description: signals.description,
      text: signals.text,
      html: html ?? "",
    });
    // A website address exists but our fetch failed — likely bot protection
    // or downtime. Never pitch "no website" to someone who has one.
    if (lead.website && !assessment.hasWebsite) {
      assessment.fetchBlocked = true;
      assessment.pitchAngle = "Verify site — research blocked";
      assessment.priority = "warm";
      assessment.opportunityScore = Math.max(40, assessment.opportunityScore - 20);
      assessment.notes = `Site listed as ${lead.website} but unreachable to our research (bot protection or downtime). Verify manually before pitching.`;
    }
    await db
      .update(growthLeads)
      .set({
        assessment: JSON.stringify(assessment),
        opportunityScore: assessment.opportunityScore,
        priority: assessment.priority,
        pitchAngle: assessment.pitchAngle,
        businessName:
          lead.businessName === lead.website && assessment.businessName
            ? assessment.businessName.replace(/\s*[|\-–].*$/, "").slice(0, 200)
            : lead.businessName,
        status: (STATUS_RANK[lead.status] ?? 0) < (STATUS_RANK.researched ?? 0)
          ? "researched"
          : lead.status,
        updatedAt: new Date(),
      })
      .where(eq(growthLeads.id, lead.id));
    const refreshed = await db
      .select()
      .from(growthLeads)
      .where(eq(growthLeads.id, lead.id))
      .limit(1);
    res.json({ lead: serializeLead(refreshed[0]) });
  });

  /* ---- VOICE AGENT: generate call script ---- */

  app.post("/api/growth/leads/:id/voice", async (req, res) => {
    const user = await requireGrowthAdmin(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Growth database is not available.");
      return;
    }
    const rows = await db
      .select()
      .from(growthLeads)
      .where(eq(growthLeads.id, req.params.id))
      .limit(1);
    const lead = rows[0];
    if (!lead) {
      jsonError(res, 404, "Lead not found.");
      return;
    }
    if (outreachBlocked(lead)) {
      jsonError(res, 409, "Outreach is blocked for this lead.");
      return;
    }
    const niche = getNiche(lead.nicheId);
    if (!niche) {
      jsonError(res, 400, "Lead has an unknown niche.");
      return;
    }
    const assessment = parseAssessment(lead.assessment);
    const pitchAngle = lead.pitchAngle ?? assessment?.pitchAngle ?? "Activate static website";
    const vars = leadVars(lead, niche.id);
    const fallback = buildVoiceScript(niche, vars, pitchAngle);

    const context = [
      `Business: ${lead.businessName}${lead.city ? ` (${lead.city})` : ""}`,
      lead.ownerName ? `Owner: ${lead.ownerName}` : "Owner name unknown",
      lead.website ? `Website: ${lead.website}` : "No website found",
      assessment
        ? `Website assessment: quality=${assessment.siteQuality}, automation=${assessment.automationLevel}, gaps=${assessment.gaps.join("; ") || "unknown"}`
        : "Not researched yet",
      `Pitch angle: ${pitchAngle}`,
      `Niche pitch: ${niche.pitch}`,
      `Free-website offer: ${pitchAngle.startsWith("FREE website") ? "ACTIVE — mention the free website prominently" : "not the main angle; mention website build/refresh is free with subscription"}`,
    ].join("\n");

    const llm = await generateJson<Partial<VoiceScript>>(
      "You are Aria's voice-sales coach. Write a warm, confident cold-call script for a small-business owner. Plain text, no markdown, no emojis. Conversational Indian English. Opener max 45 words, hook max 40 words, pitch max 90 words, close max 45 words. Each objection response max 45 words. Discovery questions must be short and open.",
      context,
      "voice_script",
      VOICE_SCHEMA as unknown as Record<string, unknown>
    );

    const script: VoiceScript = llm.ok
      ? {
          opener: llm.value.opener || fallback.opener,
          hook: llm.value.hook || fallback.hook,
          pitch: llm.value.pitch || fallback.pitch,
          discovery:
            llm.value.discovery && llm.value.discovery.length >= 3
              ? llm.value.discovery
              : fallback.discovery,
          objections:
            llm.value.objections && llm.value.objections.length >= 3
              ? llm.value.objections.slice(0, 5)
              : fallback.objections,
          close: llm.value.close || fallback.close,
        }
      : fallback;

    res.json({ script, source: llm.ok ? "ai" : "template" });
  });

  app.post("/api/growth/leads/:id/voice/log", async (req, res) => {
    const user = await requireGrowthAdmin(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Growth database is not available.");
      return;
    }
    const leadId = req.params.id;
    const rows = await db
      .select({ id: growthLeads.id, doNotContact: growthLeads.doNotContact })
      .from(growthLeads)
      .where(eq(growthLeads.id, leadId))
      .limit(1);
    if (!rows[0]) {
      jsonError(res, 404, "Lead not found.");
      return;
    }
    if (rows[0].doNotContact) {
      jsonError(res, 409, "Outreach is blocked for this lead.");
      return;
    }
    const outcome = String(req.body?.outcome ?? "no_answer").slice(0, 60);
    if (outcome === "not_interested") {
      await db.update(growthLeads).set({
        doNotContact: true,
        doNotContactReason: "Marked not interested",
        lastContactedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(growthLeads.id, leadId));
    }
    const script = req.body?.script;
    await db.insert(growthActivities).values({
      id: nanoid(16),
      leadId,
      agent: "voice",
      channel: "call",
      subject: `Call — ${outcome.replace(/_/g, " ")}`,
      content:
        script && typeof script === "object"
          ? JSON.stringify(script).slice(0, 8000)
          : String(req.body?.content ?? "Call placed from Voice Agent console.").slice(0, 8000),
      outcome,
      meta: req.body?.notes ? JSON.stringify({ notes: String(req.body.notes).slice(0, 1000) }) : null,
    });
    if (outcome === "booked") {
      await markContacted(leadId, "booked");
    } else if (outcome === "interested") {
      await markContacted(leadId, "contacted");
    } else {
      await markContacted(leadId);
    }
    res.json({ ok: true });
  });

  /* ---- MESSAGE AGENT: WhatsApp / SMS ---- */

  app.post("/api/growth/leads/:id/message", async (req, res) => {
    const user = await requireGrowthAdmin(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Growth database is not available.");
      return;
    }
    const rows = await db
      .select()
      .from(growthLeads)
      .where(eq(growthLeads.id, req.params.id))
      .limit(1);
    const lead = rows[0];
    if (!lead) {
      jsonError(res, 404, "Lead not found.");
      return;
    }
    if (outreachBlocked(lead)) {
      jsonError(res, 409, "Outreach is blocked for this lead.");
      return;
    }
    const niche = getNiche(lead.nicheId);
    if (!niche) {
      jsonError(res, 400, "Lead has an unknown niche.");
      return;
    }
    const channel = req.body?.channel === "sms" ? "sms" : "whatsapp";
    const templateId = String(req.body?.templateId ?? "intro");
    const assessment = parseAssessment(lead.assessment);
    const pitchAngle = lead.pitchAngle ?? assessment?.pitchAngle ?? "Activate static website";
    const vars = leadVars(lead, niche.id);

    let body: string;
    if (channel === "sms") {
      body = renderTemplate(SMS_TEMPLATE, vars);
    } else {
      const template = WHATSAPP_TEMPLATES.find(t => t.id === templateId) ?? WHATSAPP_TEMPLATES[0];
      body = renderTemplate(template.body, vars);
    }

    const context = [
      `Business: ${lead.businessName}${lead.city ? ` (${lead.city})` : ""}`,
      lead.ownerName ? `Owner: ${lead.ownerName}` : "Owner name unknown",
      lead.website ? `Website: ${lead.website}` : "No website found",
      assessment
        ? `Assessment: quality=${assessment.siteQuality}, automation=${assessment.automationLevel}`
        : "Not researched",
      `Pitch angle: ${pitchAngle}`,
      `Niche: ${niche.name}. Core pitch: ${niche.pitch}`,
      channel === "sms" ? "Channel: SMS — max 320 characters, no emojis." : "Channel: WhatsApp — max 120 words, warm, one clear ask, no emojis.",
    ].join("\n");

    const llm = await generateJson<{ body: string }>(
      "You are Aria's outreach writer. Write one outbound message that sounds like a sharp, polite human salesperson. Plain text only, no markdown, no emojis, no placeholder brackets. Use the business and owner details provided.",
      context,
      "outbound_message",
      MESSAGE_SCHEMA as unknown as Record<string, unknown>
    );

    const finalBody = llm.ok && llm.value.body ? llm.value.body : body;
    res.json({ body: finalBody, source: llm.ok ? "ai" : "template" });
  });

  app.post("/api/growth/leads/:id/message/log", async (req, res) => {
    const user = await requireGrowthAdmin(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Growth database is not available.");
      return;
    }
    const leadId = req.params.id;
    const rows = await db
      .select({ id: growthLeads.id, doNotContact: growthLeads.doNotContact })
      .from(growthLeads)
      .where(eq(growthLeads.id, leadId))
      .limit(1);
    if (!rows[0]) {
      jsonError(res, 404, "Lead not found.");
      return;
    }
    if (rows[0].doNotContact) {
      jsonError(res, 409, "Outreach is blocked for this lead.");
      return;
    }
    const channel = req.body?.channel === "sms" ? "sms" : "whatsapp";
    const outcome = String(req.body?.outcome ?? "sent").slice(0, 60);
    if (outcome === "not_interested") {
      await db.update(growthLeads).set({
        doNotContact: true,
        doNotContactReason: "Marked not interested",
        lastContactedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(growthLeads.id, leadId));
    }
    await db.insert(growthActivities).values({
      id: nanoid(16),
      leadId,
      agent: "message",
      channel,
      subject: `${channel === "sms" ? "SMS" : "WhatsApp"} — ${outcome}`,
      content: String(req.body?.content ?? "").slice(0, 8000) || "(empty)",
      outcome,
    });
    if (outcome === "replied" || outcome === "interested") {
      await markContacted(leadId, "replied");
    } else {
      await markContacted(leadId);
    }
    res.json({ ok: true });
  });

  /* ---- EMAIL AGENT: 3-touch sequence ---- */

  app.post("/api/growth/leads/:id/email", async (req, res) => {
    const user = await requireGrowthAdmin(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Growth database is not available.");
      return;
    }
    const rows = await db
      .select()
      .from(growthLeads)
      .where(eq(growthLeads.id, req.params.id))
      .limit(1);
    const lead = rows[0];
    if (!lead) {
      jsonError(res, 404, "Lead not found.");
      return;
    }
    if (outreachBlocked(lead)) {
      jsonError(res, 409, "Outreach is blocked for this lead.");
      return;
    }
    const niche = getNiche(lead.nicheId);
    if (!niche) {
      jsonError(res, 400, "Lead has an unknown niche.");
      return;
    }
    const assessment = parseAssessment(lead.assessment);
    const pitchAngle = lead.pitchAngle ?? assessment?.pitchAngle ?? "Activate static website";
    const vars = leadVars(lead, niche.id);
    const fallback = buildEmailSequence(niche, vars, pitchAngle);

    const context = [
      `Business: ${lead.businessName}${lead.city ? ` (${lead.city})` : ""}`,
      lead.ownerName ? `Owner: ${lead.ownerName}` : "Owner name unknown",
      lead.website ? `Website: ${lead.website}` : "No website found",
      assessment
        ? `Assessment: quality=${assessment.siteQuality}, automation=${assessment.automationLevel}, gaps=${assessment.gaps.join("; ") || "unknown"}`
        : "Not researched",
      `Pitch angle: ${pitchAngle}`,
      `Niche pitch: ${niche.pitch}`,
      `Offer: one-time installation + monthly plan; website built FREE with subscription.`,
    ].join("\n");

    const llm = await generateJson<{ emails: EmailTemplate[] }>(
      "You are Aria's email sales writer. Write a 3-email cold sequence (day 0, day 3, day 7) for a small-business owner. Plain text, no markdown, no emojis, no placeholder brackets. Email 1 max 160 words with the free-website offer woven in; email 2 max 140 words with a concrete before/after story; email 3 max 110 words, polite break-up with one-line offer. Subjects under 60 characters.",
      context,
      "email_sequence",
      EMAIL_SCHEMA as unknown as Record<string, unknown>
    );

    const sequence: EmailTemplate[] =
      llm.ok &&
      Array.isArray(llm.value.emails) &&
      llm.value.emails.length === 3 &&
      llm.value.emails.every(email => email.subject && email.body)
        ? llm.value.emails.map((email, index) => ({
            day: email.day ?? fallback[index].day,
            subject: email.subject.slice(0, 160),
            body: email.body.slice(0, 4000),
          }))
        : fallback;

    res.json({ emails: sequence, source: llm.ok ? "ai" : "template" });
  });

  app.post("/api/growth/leads/:id/email/log", async (req, res) => {
    const user = await requireGrowthAdmin(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Growth database is not available.");
      return;
    }
    const leadId = req.params.id;
    const rows = await db
      .select({ id: growthLeads.id, doNotContact: growthLeads.doNotContact })
      .from(growthLeads)
      .where(eq(growthLeads.id, leadId))
      .limit(1);
    if (!rows[0]) {
      jsonError(res, 404, "Lead not found.");
      return;
    }
    if (rows[0].doNotContact) {
      jsonError(res, 409, "Outreach is blocked for this lead.");
      return;
    }
    const outcome = String(req.body?.outcome ?? "sent").slice(0, 60);
    if (outcome === "not_interested") {
      await db.update(growthLeads).set({
        doNotContact: true,
        doNotContactReason: "Marked not interested",
        lastContactedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(growthLeads.id, leadId));
    }
    await db.insert(growthActivities).values({
      id: nanoid(16),
      leadId,
      agent: "email",
      channel: "email",
      subject: String(req.body?.subject ?? "Email").slice(0, 200),
      content: String(req.body?.body ?? "").slice(0, 8000) || "(empty)",
      outcome,
      meta: typeof req.body?.day === "number" ? JSON.stringify({ day: req.body.day }) : null,
    });
    if (outcome === "replied" || outcome === "interested") {
      await markContacted(leadId, "replied");
    } else {
      await markContacted(leadId);
    }
    res.json({ ok: true });
  });

  /* ---- Activity feed + stats ---- */

  app.get("/api/growth/activities", async (req, res) => {
    const user = await requireGrowthAdmin(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Growth database is not available.");
      return;
    }
    const leadId = typeof req.query.leadId === "string" ? req.query.leadId : "";
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const rows = await db
      .select()
      .from(growthActivities)
      .where(leadId ? eq(growthActivities.leadId, leadId) : undefined)
      .orderBy(desc(growthActivities.createdAt))
      .limit(limit);
    const leadRows = await db.select().from(growthLeads);
    const nameById = new Map(leadRows.map(lead => [lead.id, lead.businessName]));
    res.json({
      activities: rows.map(row => ({
        ...row,
        businessName: nameById.get(row.leadId) ?? "Unknown",
      })),
    });
  });

  app.get("/api/growth/stats", async (req, res) => {
    const user = await requireGrowthAdmin(req, res);
    if (!user) return;
    const db = await getDb();
    if (!db) {
      jsonError(res, 503, "Growth database is not available.");
      return;
    }
    const leads = await db.select().from(growthLeads);
    const activities = await db.select().from(growthActivities);
    const byNiche = new Map<
      string,
      {
        nicheId: string;
        total: number;
        hot: number;
        noWebsite: number;
        staticSite: number;
        automated: number;
        contacted: number;
        booked: number;
        won: number;
      }
    >();
    for (const lead of leads) {
      const entry =
        byNiche.get(lead.nicheId) ??
        {
          nicheId: lead.nicheId,
          total: 0,
          hot: 0,
          noWebsite: 0,
          staticSite: 0,
          automated: 0,
          contacted: 0,
          booked: 0,
          won: 0,
        };
      entry.total += 1;
      if (lead.priority === "hot") entry.hot += 1;
      const assessment = parseAssessment(lead.assessment);
      if (assessment) {
        if (assessment.fetchBlocked) {
          // Uncertain — count neither way until verified.
        } else if (!assessment.hasWebsite) entry.noWebsite += 1;
        else if (assessment.automationLevel === "none") entry.staticSite += 1;
        else entry.automated += 1;
      }
      if (["contacted", "replied", "booked", "won"].includes(lead.status)) entry.contacted += 1;
      if (["booked", "won"].includes(lead.status)) entry.booked += 1;
      if (lead.status === "won") entry.won += 1;
      byNiche.set(lead.nicheId, entry);
    }
    res.json({
      totals: {
        leads: leads.length,
        hot: leads.filter(lead => lead.priority === "hot").length,
        contacted: leads.filter(lead =>
          ["contacted", "replied", "booked", "won"].includes(lead.status)
        ).length,
        booked: leads.filter(lead => ["booked", "won"].includes(lead.status)).length,
        won: leads.filter(lead => lead.status === "won").length,
        activities: activities.length,
      },
      byNiche: Array.from(byNiche.values()),
    });
  });
}
