import { useMemo, useState, type MouseEvent } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Download,
  KeyRound,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { formatPrice, getAutomation } from "@shared/catalog";
import {
  getIntegrationPlan,
  clientSetupTemplate,
} from "@shared/integrationPlans";
import { PageShell, Breadcrumbs } from "@/components/Storefront";

export default function QuickSetup() {
  const { id = "" } = useParams<{ id: string }>();
  const product = getAutomation(id);
  const selected = product;
  const plan = useMemo(
    () => (selected ? getIntegrationPlan(selected) : []),
    [selected]
  );
  const [business, setBusiness] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("");
  const [languages, setLanguages] = useState("");
  const [owner, setOwner] = useState("");
  const [providers, setProviders] = useState<
    Record<string, { name: string; docs: string }>
  >({});
  const [downloaded, setDownloaded] = useState(false);
  const [setupError, setSetupError] = useState("");
  if (!selected)
    return (
      <PageShell>
        <div className="container empty-state">
          <h1>Setup guide not found</h1>
          <Link className="button dark" href="/automations">
            View the automation library
          </Link>
        </div>
      </PageShell>
    );
  const chosen = selected;
  const localLead = chosen.id === "local-site-leadgen";
  const leadNiches = localLead ? providers.leadNiches?.name || "" : "";
  function validateLocalInputs() {
    const values = [
      business,
      website,
      location,
      country,
      timezone,
      languages,
      owner,
      ...Object.values(providers).flatMap(x => [x.name, x.docs]),
    ].join("\n");
    const secret =
      /(?:\bsk-[A-Za-z0-9_-]{12,}|\bBearer\s+[A-Za-z0-9._-]{12,}|BEGIN\s+(?:RSA\s+)?PRIVATE KEY|(?:api[_-]?key|access[_-]?token|client[_-]?secret|secret|password|passwd)\s*[:=]\s*[A-Za-z0-9._-]{10,}|[?&](?:token|access_token|key|api_key|client_secret|password|signature|x-amz-credential|x-amz-signature)=|https?:\/\/[^\s/]+@)/i.test(
        values
      );
    if (secret) {
      setSetupError(
        "Remove credentials or signed URLs. Enter keys directly in your client-owned vault; this page accepts provider names and public documentation only."
      );
      setDownloaded(false);
      return false;
    }
    setSetupError("");
    return true;
  }
  function exportConfig() {
    if (!validateLocalInputs()) return;
    const integrations = plan.map(x => ({
      name: x.label,
      required: x.required,
      provider: providers[x.label]?.name || "",
      api_docs_url: providers[x.label]?.docs || "",
      credential_values_excluded: true,
      credential_destination: x.secretDestination,
    }));
    const config: any = {
      ...clientSetupTemplate(chosen),
      client: {
        business_name: business.trim(),
        website: website.trim(),
        location: location.trim(),
        country: country.trim(),
        timezone: timezone.trim(),
        languages: languages
          .split(",")
          .map(x => x.trim())
          .filter(Boolean),
        workflow_owner: owner.trim(),
      },
      integrations,
      credentials: {
        collected_by_aria: false,
        api_key_values: null,
        how_to_add:
          "Enter provider secrets directly into your client-owned n8n Credentials vault. Never put secrets in this setup manifest or public inquiry.",
      },
    };
    if (localLead)
      config.leadConfig = {
        target_location:
          location.trim() + (country.trim() ? `, ${country.trim()}` : ""),
        niches: leadNiches
          .split(",")
          .map(x => x.trim())
          .filter(Boolean),
        daily_capacity: 5,
        quality_score_threshold: 45,
        enabled: false,
        sender_name: "",
        sender_email: "",
        physical_address: "",
        last_run_date: null,
        activation_requires_owner_approval: true,
      };
    const blob = new Blob([JSON.stringify(config, null, 2) + "\n"], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aria-${chosen.id}-client-setup.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    setDownloaded(true);
  }
  function requestHelp(e: MouseEvent<HTMLAnchorElement>) {
    if (!validateLocalInputs()) {
      e.preventDefault();
      return;
    }
    const apiProviders = plan
      .map(
        x =>
          `${x.label}: ${providers[x.label]?.name || "not chosen"}${providers[x.label]?.docs ? ` (${providers[x.label].docs})` : ""}`
      )
      .join("; ")
      .slice(0, 2000);
    const draft = {
      automation: chosen.id,
      business: business.trim(),
      industry: chosen.industry,
      website: website.trim(),
      location: location.trim(),
      country: country.trim(),
      timezone: timezone.trim(),
      languages: languages.trim(),
      ownerRole: owner.trim(),
      apiProviders,
      tools:
        plan
          .map(x => providers[x.label]?.name)
          .filter(Boolean)
          .join(", ") || "Help me choose approved providers",
      supportOption: "installation-api",
      goals: `Please quote ${chosen.name} installation and API wiring before any connection or charges.`,
    };
    try {
      sessionStorage.setItem(
        "aria-implementation-draft",
        JSON.stringify(draft)
      );
    } catch {
      /* The inquiry can still be filled in without local storage. */
    }
  }

  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs
          items={[
            { label: "Automation library", href: "/automations" },
            { label: selected.name, href: `/automations/${selected.id}` },
            { label: "Quick setup" },
          ]}
        />
        <div className="page-heading">
          <span className="eyebrow">
            <i />A SHORT, CLIENT-OWNED INSTALL
          </span>
          <h1>
            Set up <em>{selected.name}.</em>
          </h1>
          <p>{product.description}</p>
        </div>
        <div className="setup-price">
          <div>
            <span className="panel-label">SEPARATELY PRICED WORKFLOW KIT</span>
            <strong>{formatPrice(selected.price)}</strong>
            <small>
              Draft USD test price · paid kits download from My purchases
            </small>
          </div>
          <Link href={`/automations/${selected.id}`} className="text-link">
            <ArrowLeft size={15} /> Product details
          </Link>
        </div>
        <div className="setup-steps">
          <article>
            <span>STEP 01</span>
            <h2>Import the kit. Run the safe demo.</h2>
            <p>
              Download this product from your verified purchase library. In your
              n8n workspace choose <strong>Workflows → Import from File</strong>{" "}
              and select one JSON from the kit’s <code>workflows</code> folder.
              Run only its supplied synthetic/manual-trigger example first. Keep
              the workflow inactive.
            </p>
            <Link href="/orders" className="button outline small">
              <Download size={15} /> My purchases
            </Link>
          </article>
          <article>
            <span>STEP 02</span>
            <h2>Enter your provider credentials—in your vault.</h2>
            <p>
              Pick the source/CRM/provider you own. Create a least-privilege
              credential in your client-owned n8n <strong>Credentials</strong>{" "}
              vault, follow the matching vendor’s API docs, then connect a
              client-approved adapter. Test errors, opt-out, duplicates, and
              human handoff before any write/send or schedule is enabled.
            </p>
            <span className="secure-reminder">
              <KeyRound size={16} /> Aria never asks for, stores, or emails your
              API keys on this page.
            </span>
          </article>
        </div>
        <section className="setup-boundary">
          <ShieldCheck size={22} />
          <div>
            <strong>
              One/two-step setup does not mean “connected by purchase.”
            </strong>
            <p>
              The downloaded config contains business details and provider
              names/docs only—not tokens, secrets, patient/customer records, or
              a live API connection. For production, your team must supply
              approved sources, permissions, credentials and owner sign-off.
            </p>
          </div>
        </section>
        <div className="setup-grid">
          <div className="form-panel">
            <div className="form-heading">
              <span className="panel-label">
                OPTIONAL / LOCAL DOWNLOAD ONLY
              </span>
              <h2>Build a client setup card</h2>
              <p>
                Values below stay in this browser. Download the JSON, or
                explicitly copy the draft to our inquiry form when asking for
                implementation. Nothing is sent to Aria until you submit that
                form.
              </p>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                exportConfig();
              }}
            >
              <label>
                Business or practice name
                <input
                  maxLength={200}
                  value={business}
                  onChange={e => setBusiness(e.target.value)}
                  placeholder="Shown only in the downloaded file"
                />
              </label>
              <div className="form-row">
                <label>
                  Business website
                  <input
                    type="url"
                    maxLength={500}
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://..."
                  />
                </label>
                <label>
                  City / operating area
                  <input
                    maxLength={180}
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="City or service area"
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Country
                  <input
                    maxLength={120}
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="Country"
                  />
                </label>
                <label>
                  Timezone
                  <input
                    maxLength={100}
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    placeholder={
                      localLead ? "Asia/Kolkata" : "e.g. Asia/Kolkata"
                    }
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Languages
                  <input
                    maxLength={250}
                    value={languages}
                    onChange={e => setLanguages(e.target.value)}
                    placeholder="Comma-separated"
                  />
                </label>
                <label>
                  Human handoff owner
                  <input
                    maxLength={160}
                    value={owner}
                    onChange={e => setOwner(e.target.value)}
                    placeholder="Role/name to agree"
                  />
                </label>
              </div>
              {localLead && (
                <label>
                  Target niches for local prospect research
                  <input
                    maxLength={800}
                    value={leadNiches}
                    onChange={e =>
                      setProviders(s => ({
                        ...s,
                        leadNiches: { name: e.target.value, docs: "" },
                      }))
                    }
                    placeholder="e.g. salon, independent gym"
                  />
                  <small>
                    Local mode default: 5 prospects/day, score threshold 45,
                    disabled. Choose a licensed prospect source before scale.
                  </small>
                </label>
              )}
              {plan.map(item => (
                <div className="integration-input" key={item.label}>
                  <label>
                    {item.label}
                    {item.required ? (
                      <span> *</span>
                    ) : (
                      <small> (optional)</small>
                    )}
                    <small className="integration-purpose">
                      {item.purpose}
                    </small>
                    <input
                      maxLength={240}
                      value={providers[item.label]?.name || ""}
                      onChange={e =>
                        setProviders(s => ({
                          ...s,
                          [item.label]: {
                            name: e.target.value,
                            docs: s[item.label]?.docs || "",
                          },
                        }))
                      }
                      placeholder="Provider / system name (no API secret)"
                    />
                  </label>
                  <label className="docs-input">
                    Provider API documentation URL
                    <input
                      type="url"
                      maxLength={1000}
                      value={providers[item.label]?.docs || ""}
                      onChange={e =>
                        setProviders(s => ({
                          ...s,
                          [item.label]: {
                            name: s[item.label]?.name || "",
                            docs: e.target.value,
                          },
                        }))
                      }
                      placeholder="https://vendor.example/docs/api"
                    />
                  </label>
                </div>
              ))}
              {setupError && (
                <div className="form-error" role="alert">
                  {setupError}
                </div>
              )}
              <button type="submit" className="button dark full">
                <Download size={17} /> Download my secret-free setup.json
              </button>
              {downloaded && (
                <div className="setup-success" role="status">
                  <CheckCircle2 size={17} /> Download ready. Store it securely;
                  it contains business particulars but no keys.
                </div>
              )}
            </form>
          </div>
          <aside className="setup-api-panel">
            <span className="panel-label">CLIENT API CHECKLIST</span>
            <h2>What you need to supply</h2>
            <p>
              Client supplies API access and selects tools. Aria can quote the
              connection and install as separate work.
            </p>
            {plan.map(item => (
              <article key={item.label}>
                <div>
                  <span
                    className={item.required ? "required-dot" : "optional-dot"}
                  />
                  <h3>{item.label}</h3>
                </div>
                <p>{item.purpose}</p>
                <ul>
                  {item.clientProvides.map(x => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <small>Credential destination: {item.secretDestination}</small>
              </article>
            ))}
            <div className="contact-integrations">
              <KeyRound size={18} />
              <p>
                <strong>Installation or API wiring costs extra.</strong> Tell us
                provider names and docs—not passwords or API keys. We will
                confirm scope, third-party charges, and a separate
                implementation quote before connecting anything.
              </p>
              <Link
                onClick={requestHelp}
                href={`/implementation?automation=${selected.id}&support=api-setup`}
                className="button dark full"
              >
                Request installation & API help <ArrowUpRight size={17} />
              </Link>
            </div>
          </aside>
        </div>
        <div className="setup-footer-note">
          <ListChecks size={18} />
          <span>
            {localLead
              ? "The source export’s weekday 04:00 and Friday 17:00 schedules are reference examples only. This kit does not create or turn on schedules. The daily pipeline remains `enabled:false`; review all send, opt-out, source rights and jurisdiction rules before any separately approved action."
              : "Any schedules in the references remain inactive until your business owner explicitly approves the cadence, timezone, integrations, and external effects."}
          </span>
        </div>
      </div>
    </PageShell>
  );
}
