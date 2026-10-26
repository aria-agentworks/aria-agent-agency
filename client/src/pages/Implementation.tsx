import { useState, useMemo, type FormEvent } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Check,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { automations, industries, CONTACT_EMAIL } from "@shared/catalog";
import { PageShell, Breadcrumbs } from "@/components/Storefront";
import { api } from "@/lib/store";
import { supportOptions } from "@shared/supportOptions";
export default function Implementation() {
  const draft = useMemo<Record<string, string>>(() => {
    try {
      const stored = JSON.parse(
        sessionStorage.getItem("aria-implementation-draft") || "{}"
      );
      return Object.fromEntries(
        Object.entries(stored).filter(
          ([key, value]) =>
            [
              "automation",
              "business",
              "industry",
              "tools",
              "website",
              "location",
              "country",
              "timezone",
              "languages",
              "ownerRole",
              "apiProviders",
              "goals",
              "supportOption",
            ].includes(key) &&
            typeof value === "string" &&
            value.length <= 6000
        )
      ) as Record<string, string>;
    } catch {
      return {};
    }
  }, []);
  const search = new URLSearchParams(window.location.search);
  const preselected = search.get("automation") || draft.automation || "";
  const selectedProduct = automations.find(x => x.id === preselected);
  const requestedSupport =
    search.get("support") === "api-setup"
      ? "installation-api"
      : search.get("support") || draft.supportOption || "scope-only";
  const initialSupport = supportOptions.some(x => x.id === requestedSupport)
    ? requestedSupport
    : "scope-only";
  const [form, setForm] = useState({
    name: "",
    email: "",
    business: String(draft.business || ""),
    industry: String(draft.industry || selectedProduct?.industry || ""),
    automation: String(preselected),
    tools: String(draft.tools || ""),
    goals: String(
      draft.goals ||
        (initialSupport !== "scope-only"
          ? `Please quote ${selectedProduct?.name || "this workflow"} installation and any selected API support before connection.`
          : "")
    ),
    phone: "",
    website: String(draft.website || ""),
    consent: false,
    supportOption: String(initialSupport),
    location: String(draft.location || ""),
    country: String(draft.country || ""),
    timezone: String(draft.timezone || ""),
    languages: String(draft.languages || ""),
    ownerRole: String(draft.ownerRole || ""),
    apiProviders: String(draft.apiProviders || ""),
  });
  const activeSupport =
    supportOptions.find(x => x.id === form.supportOption) || supportOptions[0];
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    reference: string;
    id: string;
  } | null>(null);
  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm(x => ({ ...x, [key]: value }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError("");
    setPending(true);
    try {
      const data = await api<{ id: string; reference: string }>(
        "/api/store/inquiries",
        form
      );
      setResult(data);
      sessionStorage.removeItem("aria-implementation-draft");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs items={[{ label: "Implementation" }]} />
        <div className="implementation-layout">
          <div className="implementation-intro">
            <span className="eyebrow">
              <i /> YOUR PROCESS, MADE SIMPLER
            </span>
            <h1>
              Tell us where
              <br />
              <em>the busywork lives.</em>
            </h1>
            <p>
              We’ll help you scope a practical automation around your business
              and the tools you already use. Start with one workflow. Build from
              there.
            </p>
            <div className="implementation-process">
              {[
                [
                  "01",
                  "Understand your workflow",
                  "The problem, the people, and the systems behind it.",
                ],
                [
                  "02",
                  "Agree on a clear scope",
                  "Integrations, responsibilities, exclusions, and pricing.",
                ],
                [
                  "03",
                  "Build, test & hand over",
                  "Synthetic-data testing, approved go-live, and team training.",
                ],
              ].map(([n, t, p]) => (
                <div key={n}>
                  <span>{n}</span>
                  <div>
                    <h3>{t}</h3>
                    <p>{p}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="implementation-note">
              <ShieldCheck size={22} />
              <p>
                Please share business workflow information only. Do not submit
                patient information, passwords, API keys, or other sensitive
                records.
              </p>
            </div>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-link">
              <Mail size={17} /> Prefer email? Talk to Aria{" "}
              <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="form-panel">
            {result ? (
              <div className="form-success">
                <CheckCircle2 size={45} />
                <span className="eyebrow">REQUEST RECEIVED</span>
                <h2>
                  Let’s make room
                  <br />
                  for better work.
                </h2>
                <p>
                  Your implementation request has been saved for Aria’s review.
                  No payment has been taken and no external systems have been
                  connected.
                </p>
                <div className="reference-box">
                  <small>YOUR REQUEST REFERENCE</small>
                  <strong>{result.reference || result.id}</strong>
                </div>
                <p>
                  We’ll use the contact details you provided to discuss the next
                  step. For urgent questions, email{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                </p>
                <Link href="/automations" className="button dark">
                  Explore the library <ArrowRight size={18} />
                </Link>
              </div>
            ) : (
              <>
                <div className="form-heading">
                  <span className="panel-label">LET’S BUILD IT TOGETHER</span>
                  <h2>Your implementation brief</h2>
                  <p>A few details to start a useful conversation.</p>
                </div>
                <form onSubmit={submit}>
                  <div className="form-row">
                    <label>
                      Your name <span>*</span>
                      <input
                        required
                        maxLength={120}
                        autoComplete="name"
                        value={form.name}
                        onChange={e => update("name", e.target.value)}
                        placeholder="Full name"
                      />
                    </label>
                    <label>
                      Work email <span>*</span>
                      <input
                        required
                        type="email"
                        maxLength={320}
                        autoComplete="email"
                        value={form.email}
                        onChange={e => update("email", e.target.value)}
                        placeholder="you@business.com"
                      />
                    </label>
                  </div>
                  <label>
                    Business name <span>*</span>
                    <input
                      required
                      maxLength={180}
                      autoComplete="organization"
                      value={form.business}
                      onChange={e => update("business", e.target.value)}
                      placeholder="Your business or practice"
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Industry <span>*</span>
                      <select
                        required
                        value={form.industry}
                        onChange={e => update("industry", e.target.value)}
                      >
                        <option value="">Select your industry</option>
                        {industries
                          .filter(x => x.id !== "all")
                          .map(x => (
                            <option key={x.id} value={x.id}>
                              {x.name}
                            </option>
                          ))}
                        <option value="other">Another industry</option>
                      </select>
                    </label>
                    <label>
                      Phone <small>(optional)</small>
                      <input
                        type="tel"
                        maxLength={40}
                        autoComplete="tel"
                        value={form.phone}
                        onChange={e => update("phone", e.target.value)}
                        placeholder="With country code"
                      />
                    </label>
                  </div>
                  <label>
                    Which automation interests you? <span>*</span>
                    <select
                      required
                      value={form.automation}
                      onChange={e => update("automation", e.target.value)}
                    >
                      <option value="">Choose a workflow</option>
                      {automations.map(x => (
                        <option value={x.id} key={x.id}>
                          {x.name}
                        </option>
                      ))}
                      <option value="custom">A custom workflow</option>
                      <option value="not-sure">Help me choose</option>
                    </select>
                  </label>
                  {draft.automation === form.automation &&
                    Boolean(draft.business) && (
                      <p className="request-config-note">
                        Your client setup details were copied locally into this
                        draft. Review them below. Nothing is sent until you
                        press “Send implementation request” and agree to
                        contact.
                      </p>
                    )}
                  <label>
                    What help should Aria quote? <span>*</span>
                    <select
                      required
                      value={form.supportOption}
                      onChange={e => update("supportOption", e.target.value)}
                    >
                      {supportOptions.map(x => (
                        <option key={x.id} value={x.id}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="support-option-note">
                    <strong>{activeSupport.price}</strong>
                    {activeSupport.description} No service charge is taken by
                    this form.
                  </div>
                  <label>
                    What tools do you use today? <span>*</span>
                    <input
                      required
                      maxLength={1000}
                      value={form.tools}
                      onChange={e => update("tools", e.target.value)}
                      placeholder="CRM, calendar, phone provider, practice software..."
                    />
                  </label>
                  <label>
                    What would you like to make easier? <span>*</span>
                    <textarea
                      required
                      minLength={10}
                      maxLength={3000}
                      rows={4}
                      value={form.goals}
                      onChange={e => update("goals", e.target.value)}
                      placeholder="Describe the repetitive task, current process, and the outcome you want."
                    />
                  </label>
                  <label>
                    Website <small>(optional)</small>
                    <input
                      type="url"
                      maxLength={500}
                      value={form.website}
                      onChange={e => update("website", e.target.value)}
                      placeholder="https://yourbusiness.com"
                    />
                  </label>
                  <h3 className="form-group-title">
                    Optional installation particulars
                  </h3>
                  <div className="form-row">
                    <label>
                      City / service area
                      <input
                        maxLength={180}
                        value={form.location}
                        onChange={e => update("location", e.target.value)}
                        placeholder="Operating area"
                      />
                    </label>
                    <label>
                      Country
                      <input
                        maxLength={120}
                        value={form.country}
                        onChange={e => update("country", e.target.value)}
                        placeholder="Country"
                      />
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      Timezone
                      <input
                        maxLength={100}
                        value={form.timezone}
                        onChange={e => update("timezone", e.target.value)}
                        placeholder="e.g. Asia/Kolkata"
                      />
                    </label>
                    <label>
                      Languages
                      <input
                        maxLength={250}
                        value={form.languages}
                        onChange={e => update("languages", e.target.value)}
                        placeholder="Comma-separated"
                      />
                    </label>
                  </div>
                  <label>
                    Human handoff owner / role
                    <input
                      maxLength={160}
                      value={form.ownerRole}
                      onChange={e => update("ownerRole", e.target.value)}
                      placeholder="Who reviews exceptions or takes the transfer?"
                    />
                  </label>
                  <label>
                    Provider names + public API docs <small>(optional)</small>
                    <textarea
                      rows={3}
                      maxLength={2000}
                      value={form.apiProviders}
                      onChange={e => update("apiProviders", e.target.value)}
                      placeholder="CRM, email, WhatsApp/voice provider names and links to public vendor docs. No API keys, bearer tokens, signed URLs or credentials."
                    />
                    <small className="provider-field-tip">
                      Required API connections depend on the selected kit and
                      your systems. Supply public documentation only. Credential
                      values must be entered directly into your
                      client-controlled vault after scope approval.
                    </small>
                  </label>
                  <label className="consent-label">
                    <input
                      type="checkbox"
                      required
                      checked={form.consent}
                      onChange={e => update("consent", e.target.checked)}
                    />
                    <span>
                      I agree that Aria may store these business details and
                      contact me about this request. I have not included patient
                      records or credentials.{" "}
                      <Link href="/privacy">Privacy information</Link>.
                    </span>
                  </label>
                  {error && (
                    <div className="form-error" role="alert">
                      {error} Your details are still here—please try again.
                    </div>
                  )}
                  <button
                    className="button dark full"
                    disabled={pending}
                    type="submit"
                  >
                    {pending ? (
                      <>
                        <Loader2 className="spin" size={17} /> Saving your
                        request...
                      </>
                    ) : (
                      <>
                        Send implementation request <ArrowUpRight size={18} />
                      </>
                    )}
                  </button>
                  <small className="form-footnote">
                    <Check size={13} /> No charge to submit. Implementation is
                    separately scoped and quoted.
                  </small>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
