/**
 * Seeds the Growth Engine with REAL researched leads for the two starter
 * niches (Dental Clinics, Gyms & Fitness Studios), gathered from public web
 * research (Google search results, Practo/Justdial/LBB/ClassPass listings,
 * and Instagram profiles). Businesses WITHOUT a website are flagged by
 * absence of any domain in their public listings.
 *
 * For every lead with a website, the script performs the same live research
 * the in-app Lead Generation Agent does: fetch the site, extract signals,
 * score the opportunity, pick the pitch angle — and stores the assessment.
 *
 * Idempotent: re-running skips leads that already exist.
 *
 * Run: pnpm exec tsx scripts/seed-growth-leads.ts
 */
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { assessProspectSite, type SiteAssessment } from "../shared/growth";

const DB_FILE = path.resolve(process.cwd(), "data", "aria.sqlite3");

type SeedLead = {
  key: string;
  nicheId: "dental" | "gym";
  businessName: string;
  ownerName?: string;
  website?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  instagram?: string;
  city?: string;
  sourceName: string;
  sourceUrl?: string;
  notes?: string;
};

const DENTAL_LEADS: SeedLead[] = [
  {
    key: "dazzle",
    nicheId: "dental",
    businessName: "Dazzle Dental Clinic",
    website: "https://www.dazzle.dental",
    phone: "+91 22 4149 8949",
    email: "contact@dazzle.dental",
    city: "Mumbai",
    sourceName: "Google search",
    sourceUrl: "https://www.dazzle.dental",
    notes:
      "Premium Bandra/Kemps Corner practice. Site invites 'Call, WhatsApp or book online' — expect partial automation. Angle: consolidate into one installed system + free site refresh.",
  },
  {
    key: "royal",
    nicheId: "dental",
    businessName: "Royal Dental Clinics",
    website: "https://royaldentalclinics.com",
    city: "Mumbai",
    sourceName: "Google search",
    sourceUrl: "https://royaldentalclinics.com",
    notes: "Premium chain, single-day treatments positioning. Verify booking/chat depth on site.",
  },
  {
    key: "fort",
    nicheId: "dental",
    businessName: "Fort Dental Clinic",
    website: "https://www.fortdentalclinic.com",
    city: "Mumbai",
    sourceName: "Google search",
    sourceUrl: "https://www.fortdentalclinic.com",
    notes: "Orthodontics/Invisalign focused. Small-site profile — likely static brochure.",
  },
  {
    key: "dentzz",
    nicheId: "dental",
    businessName: "Dentzz Dental Care",
    website: "https://www.dentzzmumbai.com",
    phone: "+91 98199 16333",
    city: "Mumbai",
    sourceName: "Google search",
    sourceUrl: "https://www.dentzzmumbai.com",
    notes: "High-end multi-city chain with international patients. Many phone lines, no visible chat — after-hours enquiries likely missed.",
  },
  {
    key: "acharya",
    nicheId: "dental",
    businessName: "Acharya Dental",
    website: "https://acharyadental.com",
    city: "Chennai",
    sourceName: "Google search",
    sourceUrl: "https://acharyadental.com",
    notes: "Multispecialty practice est. 1974, Nungambakkam. Classic brochure site candidate.",
  },
  {
    key: "senthil",
    nicheId: "dental",
    businessName: "Senthil Dental Clinic",
    phone: "+91 96000 91767",
    email: "sendhildental@gmail.com",
    website: "https://www.sendhildental.com",
    city: "Chennai",
    sourceName: "Google search",
    sourceUrl: "https://www.sendhildental.com/contact-us",
    notes: "Contact page is phone numbers + Gmail only — no automation. Strong 'activate the website' lead.",
  },
  {
    key: "toothandsmile",
    nicheId: "dental",
    businessName: "Tooth and Smile Dental Clinic",
    ownerName: "Dr. Murali Karthik",
    website: "https://www.drmuralikarthik.com",
    phone: "+91 95511 20208",
    city: "Chennai",
    sourceName: "Facebook page",
    sourceUrl: "https://www.facebook.com/ToothandSmileDentalClinic",
    notes: "Appointments by phone call only per their Facebook page.",
  },
  {
    key: "ace",
    nicheId: "dental",
    businessName: "Ace Dental Care",
    city: "Chennai (Besant Nagar)",
    sourceName: "Practo listing",
    sourceUrl: "https://www.practo.com/chennai/dentist",
    notes:
      "On Practo (₹500 consult, 9 patient stories) but no own website found — hottest profile: free website + automation bundle. Confirm and collect contact via the Practo profile.",
  },
  {
    key: "toothncare",
    nicheId: "dental",
    businessName: "Tooth N Care Dental Clinic",
    ownerName: "Dr. M. Srikanth",
    city: "Chennai (Chromepet)",
    sourceName: "Practo listing",
    sourceUrl: "https://www.practo.com/chennai/dentist",
    notes:
      "Busy clinic — 468 patient stories on Practo, ₹200 fee. No own website surfaced in listings. Free-website bundle candidate.",
  },
  {
    key: "barun",
    nicheId: "dental",
    businessName: "Dr. Barun's Multispeciality Dental Centre",
    ownerName: "Dr. B J Barun",
    city: "Chennai (Velachery)",
    sourceName: "Practo listing",
    sourceUrl: "https://www.practo.com/chennai/dentist",
    notes: "22 yrs experience, 1758 patient stories, two locations — no own website found. Strong bundle candidate.",
  },
  {
    key: "parasu",
    nicheId: "dental",
    businessName: "Parasu Dental Hospital",
    ownerName: "Dr. V B Krishna Kumar Raja",
    city: "Chennai (Medavakkam)",
    sourceName: "Practo listing",
    sourceUrl: "https://www.practo.com/chennai/dentist",
    notes: "40 yrs experience hospital, 8+ locations listed on Practo — no own website surfaced. Verify then bundle-pitch.",
  },
  {
    key: "brij",
    nicheId: "dental",
    businessName: "Brij Dental Clinic",
    website: "https://brijdentalclinic.com",
    phone: "+91 98982 12228",
    city: "Ahmedabad",
    sourceName: "Google search",
    sourceUrl: "https://brijdentalclinic.com",
    notes: "Implant-focused clinic, phone contact.",
  },
  {
    key: "32pearls",
    nicheId: "dental",
    businessName: "32 Pearls Dental Clinic",
    website: "https://www.32pearlsdental.com",
    city: "Ahmedabad",
    sourceName: "Google search",
    sourceUrl: "https://www.32pearlsdental.com",
    notes: "Dental clinic and implant centre.",
  },
  {
    key: "usdental",
    nicheId: "dental",
    businessName: "US Dental Clinic",
    website: "https://www.usdental.in",
    city: "Ahmedabad",
    sourceName: "Google search",
    sourceUrl: "https://www.usdental.in",
    notes: "Advanced painless surgical procedures positioning.",
  },
  {
    key: "teethcare",
    nicheId: "dental",
    businessName: "Teeth Care Centre",
    website: "https://teethcarecentre.com",
    city: "Ahmedabad",
    sourceName: "Google search",
    sourceUrl: "https://teethcarecentre.com",
    notes: "Implant hospital positioning, single-patient operatories.",
  },
  {
    key: "kosmic",
    nicheId: "dental",
    businessName: "Kosmic Dental Clinic",
    ownerName: "Dr. Vikram Ahuja",
    website: "https://www.kosmicdentalclinic.com",
    city: "Lucknow",
    sourceName: "Google search",
    sourceUrl: "https://www.kosmicdentalclinic.com",
    notes: "Limca-records implantologist, medical-tourism cases — high-value enquiries worth never missing.",
  },
  {
    key: "realtooth",
    nicheId: "dental",
    businessName: "Realtooth",
    ownerName: "Dr. Amit Anand",
    website: "https://realtooth.in",
    phone: "+91 80811 51128",
    city: "Lucknow",
    sourceName: "Google search",
    sourceUrl: "https://realtooth.in",
    notes:
      "5 branches. 'Book Now' is a captcha web form, not real automation — enquiries land in nobody's pocket. Angle: instant replies + calendar-confirmed bookings.",
  },
  {
    key: "chetna",
    nicheId: "dental",
    businessName: "Chetna Dental Centre",
    ownerName: "Dr. Sanjeev Awasthi",
    website: "https://www.chetnadental.com",
    phone: "+91 98391 48333",
    whatsapp: "+91 98391 48333",
    city: "Lucknow (Ashiyana)",
    sourceName: "Google search",
    sourceUrl: "https://www.chetnadental.com",
    notes: "7 operatories, in-house lab, WhatsApp button + Book Appointment — partial automation; consolidation angle.",
  },
  {
    key: "agarwal",
    nicheId: "dental",
    businessName: "Dr. Agarwal's Dental Clinic",
    website: "https://dragarwaldentalclinic.com",
    phone: "+91 93352 06034",
    city: "Lucknow",
    sourceName: "Google search",
    sourceUrl: "https://dragarwaldentalclinic.com",
    notes: "Open 7 days, phone-only contact — static site.",
  },
];

const GYM_LEADS: SeedLead[] = [
  {
    key: "chakra",
    nicheId: "gym",
    businessName: "Chakra Athletica",
    website: "https://www.chakraathletica.com",
    instagram: "@chakraathletica",
    city: "Bangalore (+ Raipur)",
    sourceName: "LBB / Google search",
    sourceUrl: "https://www.chakraathletica.com",
    notes:
      "Rhythm-based spin studios, 5 locations. Webflow site with real BOOK NOW class packs — well automated; lowest priority, consolidation pitch only.",
  },
  {
    key: "kaizen",
    nicheId: "gym",
    businessName: "Kaizen MMA",
    website: "https://www.kaizenmma.in",
    city: "Bangalore",
    sourceName: "Google search",
    sourceUrl: "https://www.kaizenmma.in",
    notes: "Free-trial funnel on site. Verify depth: is trial booking instant or a form someone answers later?",
  },
  {
    key: "crosstrain",
    nicheId: "gym",
    businessName: "Crosstrain Fight Club",
    website: "https://crosstrainfightclub.com",
    city: "Delhi",
    sourceName: "Google search",
    sourceUrl: "https://crosstrainfightclub.com",
    notes: "India's oldest reputed MMA club. Trial-session booking present — partial automation.",
  },
  {
    key: "knockout",
    nicheId: "gym",
    businessName: "Knockout Fight Club",
    website: "https://knockoutfightclub.com",
    city: "Delhi",
    sourceName: "Google search",
    sourceUrl: "https://knockoutfightclub.com",
    notes: "MMA/boxing/kickboxing, free trial class funnel across branches.",
  },
  {
    key: "strengthgym",
    nicheId: "gym",
    businessName: "Strength Gym",
    website: "https://strengthgym.in",
    city: "India",
    sourceName: "Google search",
    sourceUrl: "https://strengthgym.in",
    notes: "Multifunctional strength gym; generic brochure site — activate pitch.",
  },
  {
    key: "vikrams",
    nicheId: "gym",
    businessName: "Vikram's Fitness Studio",
    instagram: "@vikramsfitnessstudio",
    city: "Pune",
    sourceName: "Instagram",
    sourceUrl: "https://www.instagram.com/vikramsfitnessstudio/",
    notes:
      "'DM us or call to book your trial session' — Instagram-only operation, no website found. Hottest profile: free website + trial automation bundle.",
  },
  {
    key: "biorhythm",
    nicheId: "gym",
    businessName: "Biorhythm Fitness Studio",
    instagram: "@biorhythmindia",
    city: "Pune (Baner)",
    sourceName: "Instagram",
    sourceUrl: "https://www.instagram.com/biorhythmindia/",
    notes:
      "'DM BBT to book your session' — every enquiry sits in DMs until someone replies. No website found. Bundle candidate.",
  },
  {
    key: "forza",
    nicheId: "gym",
    businessName: "Forza Fitness Studio",
    instagram: "@forzafitnessstudiopune",
    city: "Pune (Sinhagad Road)",
    sourceName: "Instagram",
    sourceUrl: "https://www.instagram.com/forzafitnessstudiopune/",
    notes:
      "CrossFit & functional performance studio, hours in bio, DM bookings. No website found — bundle candidate.",
  },
  {
    key: "yogavijnana",
    nicheId: "gym",
    businessName: "Yoga Vijnana",
    website: "https://www.yogavijnana.in",
    phone: "+91 98801 66177",
    city: "Bangalore",
    sourceName: "Google search",
    sourceUrl: "https://www.yogavijnana.in/live-online-yoga-classes",
    notes: "Live online yoga, batches from ₹1,700/month, WhatsApp/call to book trial — partial.",
  },
  {
    key: "trimuk",
    nicheId: "gym",
    businessName: "Trimuk Yoga",
    website: "https://www.trimukyoga.com",
    phone: "+91 80732 15168",
    city: "Bangalore",
    sourceName: "Google search",
    sourceUrl: "https://www.trimukyoga.com",
    notes: "Call to book a free demo class — static site.",
  },
  {
    key: "pradipika",
    nicheId: "gym",
    businessName: "Pradipika Institute of Yoga & Therapy",
    website: "https://pradipikayoga.in",
    city: "Bangalore",
    sourceName: "Google search",
    sourceUrl: "https://pradipikayoga.in",
    notes: "Studio + online classes; verify booking depth.",
  },
  {
    key: "breathe",
    nicheId: "gym",
    businessName: "Breathe Studio",
    city: "Mumbai",
    sourceName: "ClassPass listing",
    sourceUrl: "https://classpass.com/search/mumbai/strength-training",
    notes:
      "Strength studio with strong ClassPass reviews; no own website surfaced in listings — verify, then bundle-pitch.",
  },
  {
    key: "academyofstrength",
    nicheId: "gym",
    businessName: "Academy of Strength",
    city: "Bangalore",
    sourceName: "LBB listing",
    sourceUrl: "https://lbb.in/bangalore/best-gyms-fitness-centres-bangalore",
    notes: "Listed among Bangalore's best strength studios; no own website surfaced in the LBB listing — verify, then bundle-pitch.",
  },
  {
    key: "pilatesstudio",
    nicheId: "gym",
    businessName: "The Pilates Studio",
    city: "Bangalore",
    sourceName: "LBB listing",
    sourceUrl: "https://lbb.in/bangalore/best-gyms-fitness-centres-bangalore",
    notes: "Boutique pilates studio from the LBB curated list; verify web presence and booking.",
  },
  {
    key: "praveenyoga",
    nicheId: "gym",
    businessName: "Praveen Yoga Academy",
    website: "https://praveenyogaacademy.com",
    city: "Bangalore",
    sourceName: "Google search",
    sourceUrl: "https://praveenyogaacademy.com",
    notes: "Yoga academy with blog-style site — static brochure profile.",
  },
];

/* ------------------------- live research helpers ------------------------- */

function extractSignals(html: string) {
  const title =
    html.match(/<title[^>]*>([\s\S]{0,300}?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  const description =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{0,400})["']/i
    )?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .slice(0, 20000);
  return { title, description, text };
}

async function fetchSite(url: string): Promise<string | null> {
  const target = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const parsed = new URL(target);
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AriaGrowthResearch/1.0; +https://ariaagent.agency)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return new TextDecoder().decode(buffer.slice(0, 400000));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* --------------------------------- main ---------------------------------- */

function ensureTables(db: Database.Database) {
  db.exec(`
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
}

async function researchLead(lead: SeedLead): Promise<SiteAssessment> {
  if (!lead.website) {
    return assessProspectSite({ reachable: false });
  }
  const html = await fetchSite(lead.website);
  if (!html) {
    const assessment = assessProspectSite({ reachable: false });
    // A real address exists but our fetch was blocked (bot protection /
    // downtime). Never pitch "no website" to someone who has one.
    assessment.fetchBlocked = true;
    assessment.pitchAngle = "Verify site — research blocked";
    assessment.priority = "warm";
    assessment.opportunityScore = Math.max(40, assessment.opportunityScore - 20);
    assessment.notes = `Site listed as ${lead.website} but unreachable to our research (bot protection or downtime). Verify manually before pitching.`;
    return assessment;
  }
  const signals = extractSignals(html);
  return assessProspectSite({
    reachable: true,
    title: signals.title,
    description: signals.description,
    text: signals.text,
    html,
  });
}

async function main() {
  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  ensureTables(db);

  const all = [...DENTAL_LEADS, ...GYM_LEADS];
  const insert = db.prepare(`
    INSERT OR IGNORE INTO growth_leads (
      id, nicheId, businessName, ownerName, website, phone, email, whatsapp,
      instagram, city, country, sourceName, sourceUrl, assessment,
      opportunityScore, priority, pitchAngle, status, notes, createdAt, updatedAt
    ) VALUES (
      @id, @nicheId, @businessName, @ownerName, @website, @phone, @email, @whatsapp,
      @instagram, @city, 'India', @sourceName, @sourceUrl, @assessment,
      @opportunityScore, @priority, @pitchAngle, @status, @notes, @createdAt, @updatedAt
    )
  `);
  const exists = db.prepare(`SELECT id FROM growth_leads WHERE id = ?`);

  const now = Date.now();
  let inserted = 0;
  let researched = 0;

  // Insert everything first (skip existing), research in batches of 5.
  const pending: { lead: SeedLead }[] = [];
  for (const lead of all) {
    const id = `gl_${lead.key}`;
    if (exists.get(id)) continue;
    insert.run({
      id,
      nicheId: lead.nicheId,
      businessName: lead.businessName,
      ownerName: lead.ownerName ?? null,
      website: lead.website ?? null,
      phone: lead.phone ?? null,
      email: lead.email ?? null,
      whatsapp: lead.whatsapp ?? null,
      instagram: lead.instagram ?? null,
      city: lead.city ?? null,
      sourceName: lead.sourceName,
      sourceUrl: lead.sourceUrl ?? null,
      assessment: null,
      opportunityScore: lead.website ? 60 : 85,
      priority: lead.website ? "warm" : "hot",
      pitchAngle: lead.website ? "TBD — run research" : "FREE website + automation bundle",
      status: "new",
      notes: lead.notes ?? null,
      createdAt: now,
      updatedAt: now,
    });
    inserted += 1;
    pending.push({ lead });
  }

  // Also research leads that were inserted on a previous run but never assessed.
  if (process.env.REFRESH_ALL === "1") {
    db.prepare(`UPDATE growth_leads SET assessment = NULL, status = 'new'`).run();
  }
  const unassessed = db
    .prepare(
      `SELECT id, website, businessName, nicheId FROM growth_leads WHERE assessment IS NULL`
    )
    .all() as { id: string; website: string | null; businessName: string; nicheId: string }[];
  const researchQueue: { id: string; website: string | null; businessName: string }[] = unassessed.map(
    row => ({ id: row.id, website: row.website, businessName: row.businessName })
  );

  const update = db.prepare(`
    UPDATE growth_leads
    SET assessment = @assessment, opportunityScore = @score, priority = @priority,
        pitchAngle = @pitch, status = 'researched', updatedAt = @now
    WHERE id = @id
  `);

  const CONCURRENCY = 5;
  for (let i = 0; i < researchQueue.length; i += CONCURRENCY) {
    const batch = researchQueue.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async item => {
        const seed = all.find(candidate => `gl_${candidate.key}` === item.id);
        const assessment = await researchLead(
          seed ?? ({ website: item.website ?? undefined } as SeedLead)
        );
        return { item, assessment };
      })
    );
    for (const { item, assessment } of results) {
      update.run({
        id: item.id,
        assessment: JSON.stringify(assessment),
        score: assessment.opportunityScore,
        priority: assessment.priority,
        pitch: assessment.pitchAngle,
        now: Date.now(),
      });
      researched += 1;
      console.log(
        `[research] ${item.businessName.padEnd(44)} score=${String(assessment.opportunityScore).padStart(2)} ${assessment.priority.padEnd(4)} site=${assessment.hasWebsite ? assessment.siteQuality : "none"} auto=${assessment.automationLevel}`
      );
    }
  }

  console.log(
    `\nSeed complete: ${inserted} new leads inserted, ${researched} researched live. Total leads in DB: ${
      (db.prepare(`SELECT COUNT(*) AS n FROM growth_leads`).get() as { n: number }).n
    }`
  );
  db.close();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
