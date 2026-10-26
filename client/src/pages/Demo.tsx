import { useState } from "react";
import { Link } from "wouter";
import {
  Play,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  ChevronDown,
  Sparkles,
  Workflow,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { api, type DemoResult } from "@/lib/store";
import { PageShell, Breadcrumbs } from "@/components/Storefront";
const scenarios = [
  {
    id: "appointment",
    name: "Enquiry → appointment",
    description:
      "Classify a fictional administrative enquiry and confirm only a slot supplied by the demo scheduler.",
  },
  {
    id: "no-show",
    name: "No-show recovery",
    description:
      "Verify the status and duplicate-send flag before preparing a consent-aware reschedule draft.",
  },
  {
    id: "discharge",
    name: "Approved follow-up",
    description:
      "Turn a hospital-approved follow-up date into a task and a staff-owned service-recovery handoff.",
  },
  {
    id: "diagnostic",
    name: "Diagnostic escalation",
    description:
      "Escalate a pending administrative task to staff. No clinical results are interpreted.",
  },
  {
    id: "lead",
    name: "Business lead qualification",
    description:
      "Organize a fictional inbound business enquiry and prepare the next sales-team handoff.",
  },
  {
    id: "clinical-review",
    name: "Clinical safety boundary",
    description:
      "See a clinical question routed to a person instead of answered by an administrative agent.",
  },
];
export default function Demo() {
  const [scenario, setScenario] = useState("appointment");
  const [variant, setVariant] = useState("standard");
  const [result, setResult] = useState<DemoResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showJson, setShowJson] = useState(false);
  const choice = scenarios.find(x => x.id === scenario)!;
  async function run() {
    if (pending) return;
    setPending(true);
    setError("");
    setResult(null);
    try {
      const data = await api<DemoResult>("/api/demo/run", {
        scenario,
        variant,
      });
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs items={[{ label: "Interactive demo" }]} />
        <div className="page-heading">
          <span className="eyebrow">
            <i /> SEE THE WORKFLOW, NOT JUST THE PROMISE
          </span>
          <h1>
            A small demo.
            <br />
            <em>A clearer picture.</em>
          </h1>
          <p>
            Explore administrative automation using fictional DemoCare and
            business data. Actual AI classification is paired with explicit
            rules, approval gates, and human handoffs.
          </p>
        </div>
        <div className="demo-safety">
          <ShieldCheck size={21} />
          <span>
            Synthetic data only. No real patient information, external messages,
            bookings, or live CRM actions.
          </span>
        </div>
        <div className="demo-layout">
          <aside className="demo-scenarios">
            <span className="panel-label">CHOOSE A WORKFLOW</span>
            {scenarios.map((s, i) => (
              <button
                disabled={pending}
                onClick={() => {
                  setScenario(s.id);
                  setResult(null);
                  setError("");
                  setVariant("standard");
                }}
                key={s.id}
                className={scenario === s.id ? "active" : ""}
              >
                <span>0{i + 1}</span>
                <div>{s.name}</div>
                <ArrowUpRight size={15} />
              </button>
            ))}
            <div className="demo-help">
              <Workflow size={23} />
              <h3>Try the exception paths.</h3>
              <p>
                A good automation knows when not to act. Test missing
                availability and duplicate-send prevention below.
              </p>
            </div>
          </aside>
          <div className="demo-workspace">
            <div className="demo-workspace-head">
              <div>
                <span className="panel-label">
                  DEMOCare / SYNTHETIC SANDBOX
                </span>
                <h2>{choice.name}</h2>
              </div>
              <span className="demo-label">NO LIVE ACTIONS</span>
            </div>
            <p>{choice.description}</p>
            <div className="fixture-preview">
              <span className="panel-label">SUPPLIED DEMO FACTS</span>
              {scenario === "appointment" ? (
                <>
                  <p>
                    <strong>Patient:</strong> DEMO-001 · Fictional Alex Demo
                  </p>
                  <p>
                    <strong>Enquiry:</strong> “I’d like to book a general
                    medicine consultation.”
                  </p>
                  <p>
                    <strong>Availability:</strong> Provided by a synthetic
                    scheduler fixture, not inferred by AI.
                  </p>
                </>
              ) : scenario === "no-show" ? (
                <>
                  <p>
                    <strong>Appointment:</strong> DEMO-APPT-001 · Status:
                    no_show
                  </p>
                  <p>
                    <strong>Recovery:</strong> Consent approved; duplicate-send
                    check required.
                  </p>
                </>
              ) : scenario === "discharge" ? (
                <>
                  <p>
                    <strong>Patient:</strong> DEMO-002 · Hospital-approved
                    follow-up date
                  </p>
                  <p>
                    <strong>Action:</strong> Administrative reminder draft and
                    assigned follow-up task.
                  </p>
                </>
              ) : scenario === "diagnostic" ? (
                <>
                  <p>
                    <strong>Task:</strong> DEMO-DX-001 · Pending administrative
                    coordination
                  </p>
                  <p>
                    <strong>Owner:</strong> Demo department coordinator. No
                    clinical result values supplied.
                  </p>
                </>
              ) : scenario === "lead" ? (
                <>
                  <p>
                    <strong>Business:</strong> Fictional Northstar Studio
                  </p>
                  <p>
                    <strong>Enquiry:</strong> An inbound request to organize
                    appointment enquiries and CRM handoffs.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Enquiry:</strong> A fictional clinical treatment
                    question
                  </p>
                  <p>
                    <strong>Expected boundary:</strong> NEEDS_HUMAN_REVIEW; no
                    medical answer.
                  </p>
                </>
              )}
            </div>
            {["appointment", "no-show"].includes(scenario) && (
              <label className="demo-variant">
                Test case
                <select
                  value={variant}
                  disabled={pending}
                  onChange={e => setVariant(e.target.value)}
                >
                  <option value="standard">Standard synthetic case</option>
                  {scenario === "appointment" ? (
                    <option value="missing-slot">
                      No confirmed appointment slot
                    </option>
                  ) : (
                    <option value="duplicate">Recovery already sent</option>
                  )}
                </select>
              </label>
            )}
            <button className="button dark" disabled={pending} onClick={run}>
              {pending ? (
                <>
                  <Loader2 size={17} className="spin" />
                  Running bounded AI + rules...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Run this workflow
                </>
              )}
            </button>
            <span className="demo-run-note">
              Uses a project AI call where classification is needed. No customer
              integrations.
            </span>
            {error && (
              <div className="form-error" role="alert">
                {error} No live action was taken. You can try again.
              </div>
            )}
            {result && (
              <div className="demo-result">
                <div className={`demo-result-title ${result.status}`}>
                  <span>
                    {result.status === "ready" ? (
                      <CheckCircle2 size={24} />
                    ) : (
                      <AlertTriangle size={24} />
                    )}
                  </span>
                  <div>
                    <span className="panel-label">
                      {result.status === "ready"
                        ? "DRAFT READY"
                        : result.status === "skipped"
                          ? "SAFELY SKIPPED"
                          : "HUMAN REVIEW"}
                    </span>
                    <h3>{result.title}</h3>
                  </div>
                  <span className="ai-badge">
                    <Sparkles size={12} />
                    {result.aiPowered ? "AI + rules" : "Rules & safety gates"}
                  </span>
                </div>
                <div className="execution-trace">
                  {result.steps.map((step, i) => (
                    <div key={i}>
                      <span className={`trace-dot ${step.status}`}>
                        {step.status === "done" ? (
                          <CheckCircle2 size={15} />
                        ) : (
                          <AlertTriangle size={15} />
                        )}
                      </span>
                      <div>
                        <strong>{step.label}</strong>
                        <p>{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="message-preview">
                  <span className="panel-label">RETURNED DRAFT / HANDOFF</span>
                  <p>{result.message}</p>
                </div>
                <div className="trace-meta">
                  <span>{result.correlationId}</span>
                  <button
                    onClick={() => setShowJson(!showJson)}
                    className="text-link"
                  >
                    {showJson ? "Hide" : "View"} structured output{" "}
                    <ChevronDown size={14} />
                  </button>
                </div>
                {showJson && (
                  <pre className="json-output">
                    {JSON.stringify(result.output, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="demo-bottom">
          <div>
            <h3>Want this connected to your business?</h3>
            <p>
              We’ll confirm your source systems, API permissions, policies, and
              workflow owners first.
            </p>
          </div>
          <Link
            href={`/implementation?automation=${scenario === "lead" ? "lead-engine" : "hospital-lifecycle"}`}
            className="button dark"
          >
            Scope my implementation <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
