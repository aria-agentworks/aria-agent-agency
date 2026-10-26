import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bot,
  Check,
  Copy,
  Globe,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  PhoneCall,
  Play,
  RefreshCw,
  Search,
  Square,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { sessionHeaders } from "@/lib/store";
import {
  getNiche,
  LEAD_STATUS_LABELS,
  LEAD_STATUSES,
  type EmailTemplate,
  type LeadStatus,
  type SiteAssessment,
  type VoiceScript,
} from "@shared/growth";

export type LeadView = {
  id: string;
  nicheId: string;
  businessName: string;
  ownerName: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  instagram: string | null;
  city: string | null;
  country: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  assessment: SiteAssessment | null;
  opportunityScore: number;
  priority: "hot" | "warm" | "cold";
  pitchAngle: string | null;
  status: LeadStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string | null;
  activityCount: number;
};

export type ActivityView = {
  id: string;
  leadId: string;
  agent: string;
  channel: string;
  subject: string | null;
  content: string;
  outcome: string | null;
  createdAt: string;
  businessName?: string;
};

async function growthApi<T>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "include",
    headers: {
      ...sessionHeaders(),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}

const PRIORITY_STYLES: Record<string, string> = {
  hot: "bg-rose-100 text-rose-800 border-rose-200",
  warm: "bg-amber-100 text-amber-800 border-amber-200",
  cold: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

const AGENT_ICONS: Record<string, typeof Phone> = {
  voice: PhoneCall,
  message: MessageCircle,
  email: Mail,
  leadgen: Search,
};

/* ------------------------------ Voice tab ------------------------------- */

function VoiceTab({ lead, onLogged }: { lead: LeadView; onLogged: () => void }) {
  const [script, setScript] = useState<VoiceScript | null>(null);
  const [source, setSource] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [logging, setLogging] = useState<string>("");

  useEffect(() => {
    setScript(null);
    setSource("");
  }, [lead.id]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  async function generate() {
    setBusy(true);
    try {
      const data = await growthApi<{ script: VoiceScript; source: string }>(
        `/api/growth/leads/${lead.id}/voice`,
        "POST"
      );
      setScript(data.script);
      setSource(data.source);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  function play() {
    if (!script || typeof window === "undefined" || !window.speechSynthesis) return;
    const spoken = `${script.opener} ${script.hook} ${script.pitch} ${script.close}`;
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.rate = 1.02;
    utterance.pitch = 1;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  }

  function stop() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
  }

  async function logCall(outcome: string) {
    setLogging(outcome);
    try {
      await growthApi(`/api/growth/leads/${lead.id}/voice/log`, "POST", {
        outcome,
        script,
      });
      toast.success(`Call logged: ${outcome.replace(/_/g, " ")}`);
      onLogged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logging failed");
    } finally {
      setLogging("");
    }
  }

  const outcomes: { id: string; label: string }[] = [
    { id: "no_answer", label: "No answer" },
    { id: "busy", label: "Busy — retry" },
    { id: "callback_requested", label: "Call back later" },
    { id: "interested", label: "Interested" },
    { id: "booked", label: "Demo booked" },
    { id: "not_interested", label: "Not interested" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className="button dark small" onClick={generate} disabled={busy}>
          {busy ? <Loader2 size={15} className="spin" /> : <Bot size={15} />}
          {script ? "Regenerate script" : "Generate call script"}
        </button>
        {script && (
          <>
            <button className="button small" onClick={play} disabled={playing}>
              <Play size={15} /> Hear the pitch
            </button>
            {playing && (
              <button className="button small" onClick={stop}>
                <Square size={13} /> Stop
              </button>
            )}
            <span className="text-xs text-neutral-500">
              {source === "ai" ? "AI-personalised" : "Template (AI off)"}
            </span>
          </>
        )}
      </div>
      {!script && (
        <p className="text-sm text-neutral-500">
          Generates a full cold-call script for {lead.businessName} — opener, hook,
          pitch, discovery questions, objection comebacks and close, personalised to
          the research findings.
        </p>
      )}
      {script && (
        <div className="space-y-3">
          {[
            { label: "Opener", text: script.opener },
            { label: "Hook", text: script.hook },
            { label: "Pitch", text: script.pitch },
          ].map(section => (
            <div key={section.label} className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="mb-1 text-[11px] font-semibold tracking-widest text-neutral-500 uppercase">
                {section.label}
              </p>
              <p className="text-sm leading-relaxed">{section.text}</p>
            </div>
          ))}
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="mb-2 text-[11px] font-semibold tracking-widest text-neutral-500 uppercase">
              Discovery questions
            </p>
            <ol className="ml-4 list-decimal space-y-1 text-sm">
              {script.discovery.map((question, index) => (
                <li key={index}>{question}</li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="mb-2 text-[11px] font-semibold tracking-widest text-neutral-500 uppercase">
              Objection comebacks
            </p>
            <div className="space-y-3">
              {script.objections.map((entry, index) => (
                <div key={index}>
                  <p className="text-sm font-semibold">“{entry.objection}”</p>
                  <p className="text-sm text-neutral-600">{entry.response}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-lime-300 bg-lime-50 p-4">
            <p className="mb-1 text-[11px] font-semibold tracking-widest text-neutral-600 uppercase">
              Close — book the walkthrough
            </p>
            <p className="text-sm leading-relaxed">{script.close}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="mb-2 text-[11px] font-semibold tracking-widest text-neutral-500 uppercase">
              Log the call outcome
            </p>
            <div className="flex flex-wrap gap-2">
              {outcomes.map(outcome => (
                <button
                  key={outcome.id}
                  className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium hover:border-neutral-500"
                  onClick={() => logCall(outcome.id)}
                  disabled={logging !== ""}
                >
                  {logging === outcome.id ? <Loader2 size={12} className="spin inline" /> : null}
                  {outcome.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Message tab ------------------------------ */

function MessageTab({ lead, onLogged }: { lead: LeadView; onLogged: () => void }) {
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [templateId, setTemplateId] = useState("intro");
  const [body, setBody] = useState("");
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setBody("");
    setSource("");
  }, [lead.id]);

  async function generate() {
    setBusy(true);
    try {
      const data = await growthApi<{ body: string; source: string }>(
        `/api/growth/leads/${lead.id}/message`,
        "POST",
        { channel, templateId }
      );
      setBody(data.body);
      setSource(data.source);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function log(outcome: string) {
    setSending(true);
    try {
      await growthApi(`/api/growth/leads/${lead.id}/message/log`, "POST", {
        channel,
        content: body,
        outcome,
      });
      toast.success(`Message logged (${outcome})`);
      onLogged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logging failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-full border border-neutral-300">
          {(["whatsapp", "sms"] as const).map(option => (
            <button
              key={option}
              className={`px-3 py-1.5 text-xs font-semibold capitalize ${
                channel === option ? "bg-neutral-900 text-white" : "bg-white text-neutral-600"
              }`}
              onClick={() => {
                setChannel(option);
                setBody("");
              }}
            >
              {option === "whatsapp" ? "WhatsApp" : "SMS"}
            </button>
          ))}
        </div>
        {channel === "whatsapp" && (
          <select
            className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs"
            value={templateId}
            onChange={event => setTemplateId(event.target.value)}
          >
            <option value="intro">First touch</option>
            <option value="followup">Follow-up (day 3)</option>
            <option value="breakup">Break-up (day 9)</option>
          </select>
        )}
        <button className="button dark small" onClick={generate} disabled={busy}>
          {busy ? <Loader2 size={15} className="spin" /> : <Bot size={15} />}
          Generate
        </button>
        {body && source && (
          <span className="text-xs text-neutral-500">
            {source === "ai" ? "AI-personalised" : "Template (AI off)"}
          </span>
        )}
      </div>
      <textarea
        className="min-h-44 w-full rounded-xl border border-neutral-300 bg-white p-4 text-sm"
        value={body}
        onChange={event => setBody(event.target.value)}
        placeholder="Generate a message, then edit anything before sending."
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="button small"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(body);
              toast.success("Copied — paste it into WhatsApp / your SMS tool.");
            } catch {
              toast.error("Copy failed.");
            }
          }}
          disabled={!body}
        >
          <Copy size={14} /> Copy
        </button>
        <span className="mx-1 h-5 w-px bg-neutral-200" />
        <span className="text-xs text-neutral-500">Log as:</span>
        {[
          { id: "sent", label: "Sent" },
          { id: "replied", label: "Got reply" },
          { id: "interested", label: "Interested" },
          { id: "not_interested", label: "No interest" },
        ].map(outcome => (
          <button
            key={outcome.id}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium hover:border-neutral-500"
            onClick={() => log(outcome.id)}
            disabled={!body || sending}
          >
            {outcome.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-neutral-500">
        {channel === "whatsapp"
          ? "Send from your WhatsApp Business number after pasting. The log keeps the pipeline honest."
          : "SMS stays under 320 characters — paste into any SMS sender."}
      </p>
    </div>
  );
}

/* ------------------------------ Email tab ------------------------------- */

function EmailTab({ lead, onLogged }: { lead: LeadView; onLogged: () => void }) {
  const [emails, setEmails] = useState<EmailTemplate[] | null>(null);
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [logging, setLogging] = useState<number | null>(null);

  useEffect(() => {
    setEmails(null);
    setSource("");
  }, [lead.id]);

  async function generate() {
    setBusy(true);
    try {
      const data = await growthApi<{ emails: EmailTemplate[]; source: string }>(
        `/api/growth/leads/${lead.id}/email`,
        "POST"
      );
      setEmails(data.emails);
      setSource(data.source);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function log(index: number, outcome: string) {
    if (!emails) return;
    setLogging(index);
    try {
      await growthApi(`/api/growth/leads/${lead.id}/email/log`, "POST", {
        subject: emails[index].subject,
        body: emails[index].body,
        day: emails[index].day,
        outcome,
      });
      toast.success(`Email ${index + 1} logged (${outcome})`);
      onLogged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logging failed");
    } finally {
      setLogging(null);
    }
  }

  function update(index: number, patch: Partial<EmailTemplate>) {
    if (!emails) return;
    setEmails(emails.map((email, i) => (i === index ? { ...email, ...patch } : email)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className="button dark small" onClick={generate} disabled={busy}>
          {busy ? <Loader2 size={15} className="spin" /> : <Bot size={15} />}
          {emails ? "Regenerate sequence" : "Generate 3-touch sequence"}
        </button>
        {emails && source && (
          <span className="text-xs text-neutral-500">
            {source === "ai" ? "AI-personalised" : "Template (AI off)"} · send day 0 / 3 / 7
          </span>
        )}
      </div>
      {!emails && (
        <p className="text-sm text-neutral-500">
          Writes a personalised 3-email sequence for {lead.businessName}: the problem,
          the proof, the polite break-up — with the free-website offer woven in.
        </p>
      )}
      {emails?.map((email, index) => (
        <div key={index} className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-widest text-neutral-500 uppercase">
              Email {index + 1} · day {email.day}
            </span>
            <button
              className="text-xs text-neutral-500 hover:text-neutral-900"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
                  toast.success(`Email ${index + 1} copied.`);
                } catch {
                  toast.error("Copy failed.");
                }
              }}
            >
              <Copy size={13} className="mr-1 inline" /> Copy
            </button>
          </div>
          <input
            className="mb-2 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold"
            value={email.subject}
            onChange={event => update(index, { subject: event.target.value })}
          />
          <textarea
            className="min-h-40 w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm whitespace-pre-wrap"
            value={email.body}
            onChange={event => update(index, { body: event.target.value })}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-500">Log as:</span>
            {["sent", "replied", "bounced"].map(outcome => (
              <button
                key={outcome}
                className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium hover:border-neutral-500"
                onClick={() => log(index, outcome)}
                disabled={logging !== null}
              >
                {logging === index ? <Loader2 size={11} className="spin inline" /> : null}
                {outcome}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------- Research panel ---------------------------- */

function researchRows(assessment: SiteAssessment) {
  return [
    { label: "Website", value: assessment.hasWebsite ? "Live" : "Not found" },
    { label: "Site quality", value: assessment.siteQuality },
    { label: "Automation level", value: assessment.automationLevel },
    { label: "Online booking", value: assessment.hasBooking ? "Yes" : "No" },
    { label: "Chat assistant", value: assessment.hasChatWidget ? "Yes" : "No" },
    { label: "WhatsApp linked", value: assessment.hasWhatsApp ? "Yes" : "No" },
    { label: "Contact form", value: assessment.hasContactForm ? "Yes" : "No" },
    { label: "Social links", value: assessment.hasSocials ? "Yes" : "No" },
    { label: "Mobile-friendly", value: assessment.mobileFriendlyHint ? "Likely" : "Unclear" },
  ];
}

function ResearchTab({ lead, onResearched }: { lead: LeadView; onResearched: () => void }) {
  const [busy, setBusy] = useState(false);
  const assessment = lead.assessment;

  async function runResearch() {
    setBusy(true);
    try {
      await growthApi(`/api/growth/leads/${lead.id}/research`, "POST");
      toast.success("Research complete — assessment updated.");
      onResearched();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Research failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className="button dark small" onClick={runResearch} disabled={busy}>
          {busy ? <Loader2 size={15} className="spin" /> : <RefreshCw size={14} />}
          {assessment ? "Re-run research" : "Run website research"}
        </button>
        {lead.website && (
          <a
            className="text-xs text-neutral-500 underline hover:text-neutral-900"
            href={lead.website?.startsWith("http") ? lead.website : `https://${lead.website}`}
            target="_blank"
            rel="noreferrer"
          >
            <Globe size={12} className="mr-1 inline" />
            Open site
          </a>
        )}
      </div>

      {!assessment && (
        <p className="text-sm text-neutral-500">
          The Lead Generation Agent opens their website, checks what's already
          automated (booking, chat, WhatsApp), rates the site, and picks the pitch
          angle — including the free-website bundle when there's no site at all.
        </p>
      )}

      {assessment && (
        <div className="space-y-4">
          <div
            className={`rounded-xl border p-4 ${
              assessment.fetchBlocked
                ? "border-amber-300 bg-amber-50"
                : !assessment.hasWebsite
                  ? "border-rose-200 bg-rose-50"
                  : assessment.automationLevel === "none"
                    ? "border-amber-200 bg-amber-50"
                    : "border-teal-200 bg-teal-50"
            }`}
          >
            <p className="text-[11px] font-semibold tracking-widest text-neutral-600 uppercase">
              Verdict
            </p>
            <p className="mt-1 text-sm font-semibold">
              {assessment.fetchBlocked
                ? "Website exists but blocked our research (bot protection or downtime) — open the site manually, then pitch: activate or refresh it."
                : !assessment.hasWebsite
                  ? "No working website — hottest lead: free website + automation bundle."
                  : assessment.automationLevel === "none"
                    ? "Static website — brochure only, nothing answers or books. Pitch: activate the site."
                    : assessment.automationLevel === "partial"
                      ? "Partially automated — patchwork of tools. Pitch: replace with one installed system."
                      : "Well automated already — pitch: consolidate + free site refresh. Lower priority."}
            </p>
            <p className="mt-1 text-xs text-neutral-600">{assessment.notes}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {researchRows(assessment).map(row => (
              <div key={row.label} className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
                <p className="text-[10px] tracking-wider text-neutral-500 uppercase">{row.label}</p>
                <p className="text-sm font-semibold capitalize">{row.value}</p>
              </div>
            ))}
          </div>

          {assessment.gaps.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="mb-2 text-[11px] font-semibold tracking-widest text-neutral-500 uppercase">
                Gaps to sell against
              </p>
              <ul className="space-y-1 text-sm">
                {assessment.gaps.map((gap, index) => (
                  <li key={index} className="flex gap-2">
                    <AlertTriangle size={14} className="mt-1 shrink-0 text-amber-500" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assessment.automationHits.length > 0 && (
            <p className="text-xs text-neutral-500">
              Automation signals found: {assessment.automationHits.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Activity panel ---------------------------- */

function ActivityTab({ lead }: { lead: LeadView }) {
  const activities = useQuery({
    queryKey: ["growth-activities", lead.id],
    queryFn: () =>
      growthApi<{ activities: ActivityView[] }>(
        `/api/growth/activities?leadId=${lead.id}&limit=50`,
        "GET"
      ),
  });
  if (activities.isLoading) {
    return <Loader2 size={18} className="spin text-neutral-400" />;
  }
  const rows = activities.data?.activities ?? [];
  if (rows.length === 0) {
    return <p className="text-sm text-neutral-500">No outreach yet. Pick an agent tab above and make the first move.</p>;
  }
  return (
    <div className="space-y-2">
      {rows.map(activity => {
        const Icon = AGENT_ICONS[activity.agent] ?? Bot;
        return (
          <div key={activity.id} className="rounded-lg border border-neutral-200 bg-white p-3">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Icon size={13} />
              <span className="font-semibold text-neutral-700 capitalize">{activity.agent}</span>
              <span>· {activity.channel}</span>
              {activity.outcome && <span>· {activity.outcome.replace(/_/g, " ")}</span>}
              <span className="ml-auto">
                {new Date(activity.createdAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {activity.subject && activity.agent === "email" && (
              <p className="mt-1 text-sm font-semibold">{activity.subject}</p>
            )}
            <p className="mt-1 line-clamp-2 text-xs text-neutral-600">{activity.content}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- The drawer ------------------------------ */

const TABS = [
  { id: "research", label: "Research", icon: Search },
  { id: "voice", label: "Voice", icon: PhoneCall },
  { id: "message", label: "Message", icon: MessageCircle },
  { id: "email", label: "Email", icon: Mail },
  { id: "activity", label: "Activity", icon: RefreshCw },
] as const;

export function LeadDrawer({
  lead,
  onClose,
  onUpdated,
}: {
  lead: LeadView;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("research");
  const niche = getNiche(lead.nicheId);

  useEffect(() => {
    setTab("research");
  }, [lead.id]);

  async function setStatus(status: LeadStatus) {
    try {
      await growthApi(`/api/growth/leads/${lead.id}`, "PATCH", { status });
      toast.success(`Moved to ${LEAD_STATUS_LABELS[status]}`);
      onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function remove() {
    if (!window.confirm(`Remove ${lead.businessName} and its outreach history?`)) return;
    try {
      await growthApi(`/api/growth/leads/${lead.id}`, "DELETE");
      toast.success("Lead removed.");
      onUpdated();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  const recommended = useMemo(() => {
    if (!lead.assessment) return "Run research first — the verdict decides which agent goes first.";
    if (!lead.assessment.hasWebsite)
      return "No website — lead with the FREE website bundle on a call, then WhatsApp follow-up.";
    if (lead.assessment.automationLevel === "none")
      return "Static site — start with the Voice Agent, reinforce with the email sequence.";
    if (lead.assessment.automationLevel === "partial")
      return "Partial automation — WhatsApp first touch, email proof, then call.";
    return "Already automated — low priority; only call if they fit the consolidation pitch.";
  }, [lead.assessment]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <section
        className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-[#faf9f6] shadow-2xl"
        onClick={event => event.stopPropagation()}
        aria-label={`Lead console for ${lead.businessName}`}
      >
        <header className="sticky top-0 z-10 shrink-0 border-b border-neutral-200 bg-[#faf9f6] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{lead.businessName}</h2>
              <p className="text-sm text-neutral-500">
                {[lead.city, niche?.name].filter(Boolean).join(" · ")}
                {lead.sourceName ? ` · via ${lead.sourceName}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-200"
                onClick={remove}
                aria-label="Delete lead"
              >
                <Trash2 size={16} />
              </button>
              <button
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-200"
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${PRIORITY_STYLES[lead.priority]}`}>
              {lead.priority}
            </span>
            <span className="rounded-full border border-neutral-300 bg-white px-2.5 py-0.5 text-xs font-semibold">
              {lead.opportunityScore}/100 fit
            </span>
            <select
              className="rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold"
              value={lead.status}
              onChange={event => setStatus(event.target.value as LeadStatus)}
              aria-label="Lead status"
            >
              {LEAD_STATUSES.map(status => (
                <option key={status} value={status}>
                  {LEAD_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            {lead.pitchAngle && (
              <span className="rounded-full border border-lime-400 bg-lime-100 px-2.5 py-0.5 text-xs font-semibold">
                {lead.pitchAngle}
              </span>
            )}
          </div>
          <div className="mt-3 grid gap-1 text-xs text-neutral-600 sm:grid-cols-2">
            {lead.phone && (
              <span>
                <Phone size={12} className="mr-1 inline" />
                {lead.phone}
              </span>
            )}
            {lead.whatsapp && (
              <span>
                <MessageCircle size={12} className="mr-1 inline" />
                {lead.whatsapp}
              </span>
            )}
            {lead.email && (
              <span>
                <Mail size={12} className="mr-1 inline" />
                {lead.email}
              </span>
            )}
            {lead.instagram && (
              <span>
                <Globe size={12} className="mr-1 inline" />
                {lead.instagram}
              </span>
            )}
            {lead.website && (
              <span>
                <Globe size={12} className="mr-1 inline" />
                {lead.website}
              </span>
            )}
          </div>
          <div className="mt-3 rounded-lg border border-lime-300 bg-lime-50 px-3 py-2 text-xs font-medium text-neutral-800">
            <Check size={12} className="mr-1 inline" />
            {recommended}
          </div>
        </header>

        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-neutral-200 bg-[#faf9f6] px-4">
          {TABS.map(item => (
            <button
              key={item.id}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap ${
                tab === item.id
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
              onClick={() => setTab(item.id)}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 p-5">
          {tab === "research" && <ResearchTab lead={lead} onResearched={onUpdated} />}
          {tab === "voice" && <VoiceTab lead={lead} onLogged={onUpdated} />}
          {tab === "message" && <MessageTab lead={lead} onLogged={onUpdated} />}
          {tab === "email" && <EmailTab lead={lead} onLogged={onUpdated} />}
          {tab === "activity" && <ActivityTab lead={lead} />}
        </div>
      </section>
    </div>
  );
}
