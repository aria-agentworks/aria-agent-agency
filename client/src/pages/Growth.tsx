import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Bot,
  Loader2,
  Mail,
  MessageCircle,
  PhoneCall,
  Plus,
  Radar,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { NICHES, getNiche, LEAD_STATUS_LABELS, LEAD_STATUSES, WEBSITE_OFFER } from "@shared/growth";
import { PageShell, Breadcrumbs, LoginPrompt } from "@/components/Storefront";
import {
  LeadDrawer,
  type ActivityView,
  type LeadView,
} from "@/components/GrowthAgentPanel";

const PRIORITY_DOT: Record<string, string> = {
  hot: "bg-rose-500",
  warm: "bg-amber-400",
  cold: "bg-neutral-300",
};

const STATUS_STYLES: Record<string, string> = {
  new: "bg-neutral-100 text-neutral-600",
  researched: "bg-sky-100 text-sky-800",
  contacted: "bg-violet-100 text-violet-800",
  replied: "bg-teal-100 text-teal-800",
  booked: "bg-lime-200 text-lime-900",
  won: "bg-lime-400 text-neutral-900",
  lost: "bg-neutral-200 text-neutral-500",
};

function AddLeadDialog({
  nicheId,
  onClose,
  onAdded,
}: {
  nicheId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    nicheId,
    businessName: "",
    website: "",
    city: "",
    ownerName: "",
    phone: "",
    whatsapp: "",
    email: "",
    instagram: "",
    notes: "",
  });
  const set = (field: string, value: string) =>
    setForm(previous => ({ ...previous, [field]: value }));

  async function submit() {
    if (!form.businessName.trim()) {
      toast.error("Business name is required.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/growth/leads", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save lead.");
      toast.success("Lead added — run research next.");
      onAdded();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save lead.");
    } finally {
      setBusy(false);
    }
  }

  const fields: { key: string; label: string; placeholder: string; required?: boolean }[] = [
    { key: "businessName", label: "Business name", placeholder: "Smile Dental Studio", required: true },
    { key: "website", label: "Website (leave blank if none)", placeholder: "smiledental.in" },
    { key: "city", label: "City", placeholder: "Mumbai" },
    { key: "ownerName", label: "Owner / doctor name", placeholder: "Dr. Priya" },
    { key: "phone", label: "Phone", placeholder: "+91 98xx xxx xxx" },
    { key: "whatsapp", label: "WhatsApp", placeholder: "+91 98xx xxx xxx" },
    { key: "email", label: "Email", placeholder: "owner@business.in" },
    { key: "instagram", label: "Instagram", placeholder: "@smiledental" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold">Add a lead</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Found a business on Maps, a directory or Instagram? Drop it in — the agents
          take it from here.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-neutral-600 sm:col-span-2">
            Niche
            <select
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-normal"
              value={form.nicheId}
              onChange={event => set("nicheId", event.target.value)}
            >
              {NICHES.map(niche => (
                <option key={niche.id} value={niche.id}>
                  {niche.name}
                </option>
              ))}
            </select>
          </label>
          {fields.map(field => (
            <label key={field.key} className={`text-xs font-semibold text-neutral-600 ${field.required ? "sm:col-span-2" : ""}`}>
              {field.label}
              <input
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-normal"
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={event => set(field.key, event.target.value)}
              />
            </label>
          ))}
          <label className="text-xs font-semibold text-neutral-600 sm:col-span-2">
            Notes
            <textarea
              className="mt-1 min-h-16 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-normal"
              placeholder="Anything worth remembering — e.g. 'DMs open, replies take a day'"
              value={form.notes}
              onChange={event => set("notes", event.target.value)}
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="button small" onClick={onClose}>
            Cancel
          </button>
          <button className="button dark small" onClick={submit} disabled={busy}>
            {busy ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
            Add lead
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Growth() {
  const { user, loading } = useAuth();
  const [nicheFilter, setNicheFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const leads = useQuery({
    queryKey: ["growth-leads", nicheFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (nicheFilter !== "all") params.set("niche", nicheFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const response = await fetch(`/api/growth/leads?${params.toString()}`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load leads");
      return data as { leads: LeadView[] };
    },
    enabled: Boolean(user),
  });

  const stats = useQuery({
    queryKey: ["growth-stats"],
    queryFn: async () => {
      const response = await fetch("/api/growth/stats", { credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load stats");
      return data as {
        totals: { leads: number; hot: number; contacted: number; booked: number; won: number; activities: number };
        byNiche: { nicheId: string; total: number; hot: number; noWebsite: number; staticSite: number; automated: number; contacted: number; booked: number; won: number }[];
      };
    },
    enabled: Boolean(user),
  });

  const activities = useQuery({
    queryKey: ["growth-activities", "feed"],
    queryFn: async () => {
      const response = await fetch("/api/growth/activities?limit=25", { credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load activity");
      return data as { activities: ActivityView[] };
    },
    enabled: Boolean(user),
  });

  function refreshAll() {
    leads.refetch();
    stats.refetch();
    activities.refetch();
  }

  const selectedNiche = getNiche(nicheFilter);
  const openLead = useMemo(
    () => leads.data?.leads.find(lead => lead.id === openLeadId) ?? null,
    [leads.data, openLeadId]
  );

  if (loading) {
    return (
      <PageShell>
        <div className="container empty-state">
          <Loader2 size={26} className="spin" />
          <p>Loading growth engine...</p>
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <div className="container">
          <LoginPrompt text="Sign in to open the Growth Engine — the lead lists, research and outreach agents that sell Aria for you." />
        </div>
      </PageShell>
    );
  }

  if (user.role !== "admin") {
    return (
      <PageShell>
        <div className="container empty-state">
          <h2>Agency access only</h2>
          <p>The Growth Engine is available to Aria agency administrators.</p>
          <Link href="/portal" className="button dark">Open my portal</Link>
        </div>
      </PageShell>
    );
  }

  const totals = stats.data?.totals;
  const agentCards = [
    {
      icon: Radar,
      name: "Lead Generation Agent",
      detail: "Gathers businesses per niche, researches their website, scores the opportunity, picks the pitch.",
      stat: totals ? `${totals.leads} leads` : "—",
    },
    {
      icon: PhoneCall,
      name: "Voice Agent",
      detail: "Writes the cold-call script — opener, hook, objections, close — personalised per lead.",
      stat: "call scripts",
    },
    {
      icon: MessageCircle,
      name: "Message Agent",
      detail: "WhatsApp and SMS openers + follow-ups, ready to paste and send.",
      stat: "WhatsApp + SMS",
    },
    {
      icon: Mail,
      name: "Email Agent",
      detail: "3-touch personalised sequences: problem, proof, polite break-up.",
      stat: "day 0 / 3 / 7",
    },
  ];

  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs items={[{ label: "Growth" }]} />
        <div className="page-heading compact">
          <span className="eyebrow">
            <i /> ARIA GROWTH ENGINE
          </span>
          <h1>
            Sell the result.
            <br />
            <em>Four agents do the legwork.</em>
          </h1>
          <p>
            We automate everything, whatever business they run — and they never lose a
            contact. Here is where we find them, research them, and win them: start
            with two niches, expand from proof.
          </p>
        </div>

        {/* Agent strip */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {agentCards.map(agent => (
            <div key={agent.name} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <agent.icon size={20} className="text-neutral-800" />
              <h3 className="mt-2 text-sm font-bold">{agent.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">{agent.detail}</p>
              <p className="mt-2 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
                {agent.stat}
              </p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Leads", value: totals?.leads ?? 0 },
            { label: "Hot fits", value: totals?.hot ?? 0 },
            { label: "Contacted", value: totals?.contacted ?? 0 },
            { label: "Demos booked", value: totals?.booked ?? 0 },
            { label: "Outreach actions", value: totals?.activities ?? 0 },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl border border-neutral-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 rounded-full border border-neutral-300 bg-white p-1">
            {[{ id: "all", name: "All niches" }, ...NICHES].map(option => (
              <button
                key={option.id}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                  nicheFilter === option.id ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
                }`}
                onClick={() => setNicheFilter(option.id)}
              >
                {option.name}
              </button>
            ))}
          </div>
          <select
            className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs"
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {LEAD_STATUSES.map(status => (
              <option key={status} value={status}>
                {LEAD_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <button className="button lime small ml-auto" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add lead
          </button>
        </div>

        {/* Niche playbook */}
        {selectedNiche && (
          <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold">
                {selectedNiche.name} playbook — {selectedNiche.resultHeadline}
              </h2>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">
                {(() => {
                  const entry = stats.data?.byNiche.find(n => n.nicheId === selectedNiche.id);
                  if (!entry) return "0 leads";
                  return `${entry.total} leads · ${entry.hot} hot · ${entry.noWebsite} no-site · ${entry.staticSite} static · ${entry.automated} automated`;
                })()}
              </span>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold tracking-widest text-neutral-500 uppercase">
                  Where to gather leads
                </p>
                <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                  {selectedNiche.sources.map(source => (
                    <li key={source}>· {source}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-widest text-neutral-500 uppercase">
                  The pain we sell against
                </p>
                <ul className="mt-2 space-y-2 text-sm text-neutral-700">
                  {selectedNiche.painPoints.map(pain => (
                    <li key={pain}>{pain}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-widest text-neutral-500 uppercase">
                  The pitch + the math
                </p>
                <p className="mt-2 text-sm text-neutral-700">{selectedNiche.pitch}</p>
                <p className="mt-2 rounded-lg bg-lime-100 px-3 py-2 text-xs font-semibold">
                  {selectedNiche.roiMath}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Free website offer card */}
        <div className="mt-4 rounded-2xl border border-lime-400 bg-lime-50 p-5">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Sparkles size={17} /> {WEBSITE_OFFER.headline}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-neutral-700">{WEBSITE_OFFER.body}</p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs font-semibold text-neutral-700">
            {WEBSITE_OFFER.bullets.map(bullet => (
              <li key={bullet}>✓ {bullet}</li>
            ))}
          </ul>
        </div>

        {/* Leads table */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Leads {selectedNiche ? `— ${selectedNiche.shortName}` : ""}</h2>
            {leads.isFetching && <Loader2 size={16} className="spin text-neutral-400" />}
          </div>
          {leads.isError && (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {(leads.error as Error).message}
            </p>
          )}
          {leads.data && leads.data.leads.length === 0 && (
            <div className="mt-3 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
              <p className="text-sm text-neutral-500">
                No leads in this view yet. Add the first one — Maps, directories and
                Instagram are all fair game.
              </p>
              <button className="button dark small mt-4" onClick={() => setShowAdd(true)}>
                <Plus size={14} /> Add the first lead
              </button>
            </div>
          )}
          <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {leads.data && leads.data.leads.length > 0 && (
              <div className="divide-y divide-neutral-100">
                {leads.data.leads.map(lead => (
                  <button
                    key={lead.id}
                    className="grid w-full grid-cols-[1fr_auto] items-center gap-3 p-4 text-left hover:bg-neutral-50 sm:grid-cols-[2fr_1fr_1fr_auto]"
                    onClick={() => setOpenLeadId(lead.id)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{lead.businessName}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {[lead.city, lead.sourceName].filter(Boolean).join(" · ") || getNiche(lead.nicheId)?.name}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[lead.status]}`}>
                        {LEAD_STATUS_LABELS[lead.status]}
                      </span>
                    </div>
                    <div className="hidden items-center gap-2 sm:flex">
                      <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[lead.priority]}`} />
                      <span className="text-xs font-semibold">{lead.opportunityScore}/100</span>
                      {lead.assessment && (
                        <span className="text-[11px] text-neutral-400">
                          {lead.assessment.fetchBlocked
                            ? "verify site"
                            : !lead.assessment.hasWebsite
                              ? "no site"
                              : lead.assessment.automationLevel === "none"
                                ? "static site"
                                : `automation: ${lead.assessment.automationLevel}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.activityCount > 0 && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
                          {lead.activityCount}× outreach
                        </span>
                      )}
                      <span className="text-xs font-semibold text-neutral-400">Open →</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div className="mt-8">
          <h2 className="text-base font-bold">Agent activity</h2>
          {activities.data && activities.data.activities.length === 0 && (
            <p className="mt-2 text-sm text-neutral-500">
              No outreach yet. Open a lead and let an agent make the first move.
            </p>
          )}
          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            {activities.data?.activities.map(activity => (
              <div key={activity.id} className="rounded-xl border border-neutral-200 bg-white p-3">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Bot size={13} />
                  <span className="font-semibold text-neutral-700 capitalize">{activity.agent}</span>
                  <span>· {activity.channel}</span>
                  {activity.outcome && <span>· {activity.outcome.replace(/_/g, " ")}</span>}
                  <span className="ml-auto">
                    {new Date(activity.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm font-semibold">
                  {activity.businessName ?? "Lead"}
                </p>
                <p className="line-clamp-1 text-xs text-neutral-500">{activity.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-sell footer */}
        <div className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600">
          Selling to {NICHES.map(niche => niche.shortName).join(" and ")} first — every
          win here becomes the case study for the next niche.{" "}
          <Link href="/pricing" className="font-semibold underline">
            The offer they'll hear: install + monthly, website free
          </Link>
          .
        </div>
      </div>

      {openLead && (
        <LeadDrawer lead={openLead} onClose={() => setOpenLeadId(null)} onUpdated={refreshAll} />
      )}
      {showAdd && (
        <AddLeadDialog
          nicheId={nicheFilter !== "all" ? nicheFilter : NICHES[0].id}
          onClose={() => setShowAdd(false)}
          onAdded={refreshAll}
        />
      )}
    </PageShell>
  );
}
