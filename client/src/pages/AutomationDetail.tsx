import { Link, useParams } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  ShieldCheck,
  ShoppingBag,
  Check,
  ChevronRight,
  Puzzle,
} from "lucide-react";
import { automations, getAutomation, formatPrice } from "@shared/catalog";
import { supportOptions } from "@shared/supportOptions";
import {
  getWorkflowContract,
  contractLabels,
  type WorkflowContract,
} from "@shared/workflowContracts";
import {
  PageShell,
  Breadcrumbs,
  AgentIcon,
  CheckList,
  AutomationCard,
  useCart,
} from "@/components/Storefront";
export default function AutomationDetail() {
  const { id } = useParams<{ id: string }>();
  const item = getAutomation(id);
  const { items, add } = useCart();
  if (!item)
    return (
      <PageShell>
        <div className="container empty-state">
          <h1>Automation not found</h1>
          <Link href="/automations" className="button dark">
            Back to the library
          </Link>
        </div>
      </PageShell>
    );
  const healthcare = ["dental", "healthcare"].includes(item.industry);
  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs
          items={[
            { label: "Automations", href: "/automations" },
            { label: item.name },
          ]}
        />
        <div className="detail-layout">
          <div className="detail-main">
            <div className={`detail-visual ${item.color}`}>
              <AgentIcon name={item.icon} size={64} />
              <span className="detail-visual-text">ARIA / WORKFLOW KIT</span>
              <div className="detail-nodes">
                <span>INTAKE</span>
                <ChevronRight size={17} />
                <span>AI + RULES</span>
                <ChevronRight size={17} />
                <span>HANDOFF</span>
              </div>
            </div>
            <span className="eyebrow">
              {item.category.toUpperCase()} · CONFIGURABLE N8N KIT
            </span>
            <h1>{item.name}</h1>
            <p className="detail-tagline">{item.tagline}</p>
            <p className="detail-description">{item.description}</p>
            <section className="detail-section">
              <h2>What this workflow does</h2>
              <div className="workflow-chain">
                {item.steps.map((step, i) => (
                  <div key={step}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <strong>{step}</strong>
                    {i < item.steps.length - 1 && <ArrowRight size={15} />}
                  </div>
                ))}
              </div>
              <CheckList items={item.outcomes} />
            </section>
            <section className="detail-section">
              <h2>How this workflow operates</h2>
              <p className="muted">
                An explicit contract from the incoming event to the staff
                handoff. These are workflow measurement definitions, not
                promised results.
              </p>
              <dl className="workflow-contract">
                {Object.entries(getWorkflowContract(item)).map(
                  ([key, value]) => (
                    <div key={key}>
                      <dt>{contractLabels[key as keyof WorkflowContract]}</dt>
                      <dd>{value}</dd>
                    </div>
                  )
                )}
              </dl>
            </section>
            <section className="detail-section">
              <h2>Inside your automation kit</h2>
              <CheckList items={item.includes} />
              <div className="info-note">
                <Download size={20} />
                <p>
                  Your package is a configurable workflow starter, not an
                  already-connected service. Files are available in your
                  purchase library after verified test payment.
                </p>
              </div>
            </section>
            <section className="detail-section">
              <h2>Before you connect it</h2>
              <CheckList items={item.requirements} />
              <p className="muted">
                A technical team member will need to configure credentials,
                adapt documented source APIs, and test failure paths. Want help?
                Choose agency implementation.
              </p>
            </section>
            <section className="detail-section">
              <h2>Install this option in two guided steps</h2>
              <p className="muted">
                Import and run the inactive synthetic kit, then add your
                client-owned provider credentials in n8n’s vault and connect an
                approved adapter. Your setup guide lists the exact provider/API
                information and client particulars to prepare.
              </p>
              <Link
                href={`/automations/${item.id}/setup`}
                className="button dark small"
              >
                Open this kit’s installation guide <ArrowRight size={17} />
              </Link>
              <h2 style={{ marginTop: 35 }}>Need installation or API help?</h2>
              <p className="muted">
                Optional service work is additional to the workflow price. These
                are draft planning estimates—not charges in your cart. Confirm
                scope, provider-cost ownership and final fees with Aria before
                work.
              </p>
              <div className="support-cards">
                {supportOptions
                  .filter(x => x.id !== "scope-only")
                  .map(x => (
                    <Link
                      key={x.id}
                      href={`/implementation?automation=${item.id}&support=${x.id}`}
                    >
                      <h3>{x.label}</h3>
                      <strong>{x.price}</strong>
                      <p>{x.description}</p>
                      <span>
                        Ask Aria to contact me <ArrowUpRight size={15} />
                      </span>
                    </Link>
                  ))}
              </div>
            </section>
            <section className="guardrail-note">
              <ShieldCheck size={24} />
              <div>
                <h3>Human judgment stays in the loop.</h3>
                <p>
                  {healthcare
                    ? "Administrative use only. This kit does not diagnose, prescribe, interpret clinical results, make autonomous triage decisions, or replace your HMS/EMR. Production use needs the facility’s approved systems, policies, consent, vendor support, and security review."
                    : "Use approved source information, consented inbound data, and a named staff escalation owner. Missing facts and uncertain requests should go to human review, not be guessed."}
                </p>
                <p>
                  All public examples use synthetic data. External actions are
                  inactive until configured and approved.
                </p>
              </div>
            </section>
          </div>
          <aside className="purchase-panel">
            <span className="panel-label">YOUR WORKFLOW. YOUR WAY.</span>
            <h2>
              Make it part of
              <br />
              your business.
            </h2>
            <div className="panel-price">
              <strong>{formatPrice(item.price)}</strong>
              <span>one-time workflow kit</span>
            </div>
            <span className="test-price-pill">
              Draft price · test checkout only
            </span>
            <CheckList
              items={[
                "Importable workflow starters",
                "Prompts, test data & setup guide",
                "Download linked to your account",
              ]}
            />
            {items.includes(item.id) ? (
              <Link href="/cart" className="button dark full">
                View in cart <ArrowRight size={17} />
              </Link>
            ) : (
              <button className="button dark full" onClick={() => add(item.id)}>
                Add automation to cart <ShoppingBag size={17} />
              </button>
            )}
            <small>
              Third-party tools, AI usage, and messaging costs are not included.
            </small>
            <div className="purchase-divider">
              <span>OR, LET US HANDLE IT</span>
            </div>
            <Link
              href={`/implementation?automation=${item.id}`}
              className="button outline full"
            >
              Implement it for me <ArrowUpRight size={17} />
            </Link>
            <p>
              Discovery, integration, testing, and team handover. Quoted to your
              scope.
            </p>
            <Link href="/demo" className="panel-demo">
              Try the synthetic demo <ArrowRight size={16} />
            </Link>
            <Link
              href={`/automations/${item.id}/setup`}
              className="setup-panel-link"
            >
              <Download size={15} /> Installation guide & API inputs
            </Link>
            <span className="panel-note">
              <Puzzle size={16} /> Configured for your tools. Approved by your
              team.
            </span>
          </aside>
        </div>
        <section className="section related-section">
          <h2>A few other helpful teammates.</h2>
          <div className="automation-grid">
            {automations
              .filter(x => x.id !== item.id)
              .slice(0, 3)
              .map(x => (
                <AutomationCard item={x} key={x.id} />
              ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
