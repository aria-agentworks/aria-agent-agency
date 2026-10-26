import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Check,
  ClipboardList,
  Globe,
  GraduationCap,
  HeartPulse,
  Layers,
  LayoutDashboard,
  Loader2,
  Mail,
  Scissors,
  ShoppingBag,
  Smile,
  Sparkles,
  Stethoscope,
  Target,
  Utensils,
  Wand2,
  Zap,
  Gem,
} from "lucide-react";
import { toast } from "sonner";
import { PLANS } from "@shared/plans";
import { formatPrice, getAutomation } from "@shared/catalog";
import {
  BUSINESS_CATEGORIES,
  DELIVERY_OPTIONS,
  getCategory,
  getDeliveryOption,
  ONBOARDING_QUESTIONS,
  type BusinessCategory,
} from "@shared/solutions";
import { api } from "@/lib/store";
import { PageShell, Breadcrumbs } from "@/components/Storefront";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  clinics: HeartPulse,
  dental: Smile,
  professional: BriefcaseIcon,
  realestate: Building2,
  retail: ShoppingBag,
  jewellery: Gem,
  "local-services": Scissors,
  food: Utensils,
  education: GraduationCap,
  any: Sparkles,
};

function BriefcaseIcon({ size = 28 }: { size?: number }) {
  return <Target size={size} />;
}

const DELIVERY_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  embed: Globe,
  portal: LayoutDashboard,
  both: Layers,
};

type AnalyzeResponse = {
  url: string;
  businessName: string | null;
  description: string | null;
  detected: { categoryId: string; score: number; matched: string[] } | null;
  confidence: "high" | "medium" | "low" | "none";
  note?: string;
};

export default function Onboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Prefill the category when landing from /?category=... links.
  const preselected = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return getCategory(params.get("category") ?? "")?.id ?? null;
  }, []);

  const [step, setStep] = useState<"start" | "category" | "result" | "done">(
    preselected ? "result" : "start"
  );
  const [mode, setMode] = useState<"website" | "questions">("website");
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [detectedId, setDetectedId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(preselected);
  const [delivery, setDelivery] = useState<string>("both");
  const [planId, setPlanId] = useState<string>("business");
  const [analyzing, setAnalyzing] = useState(false);
  const [starting, setStarting] = useState(false);

  const category = categoryId ? getCategory(categoryId) : undefined;
  const plan = PLANS.find(p => p.id === planId) ?? PLANS[1];

  async function analyzeSite() {
    if (!website.trim()) {
      toast.error("Paste your website address first.");
      return;
    }
    setAnalyzing(true);
    try {
      const data = await api<AnalyzeResponse>("/api/onboarding/analyze", {
        url: website.trim(),
      });
      setAnalysis(data);
      if (data.businessName && !businessName.trim())
        setBusinessName(data.businessName);
      setDetectedId(data.detected?.categoryId ?? null);
      setStep("category");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  }

  function answerQuestion(questionId: string, optionValue: string, categoryHint?: string) {
    const next = { ...answers, [questionId]: optionValue };
    setAnswers(next);
    if (questionId === "businessType" && categoryHint) {
      setCategoryId(categoryHint);
    }
    const answeredAll = ONBOARDING_QUESTIONS.every(q => next[q.id]);
    if (answeredAll && categoryId) setStep("result");
  }

  async function startInstallation() {
    if (!user) {
      toast.error("Please sign in first — your installation links to your account.");
      navigate("/login");
      return;
    }
    if (!category) return;
    setStarting(true);
    const tab = window.open("about:blank", "_blank");
    try {
      const submitted = await api<{ id: string }>("/api/onboarding/submit", {
        businessName,
        website: mode === "website" ? website : "",
        email: email || user.email || "",
        categoryId: category.id,
        answers,
        delivery,
      });
      const data = await api<{ url: string; gateway: string }>(
        "/api/store/subscribe",
        {
          planId,
          origin: window.location.origin,
          install: true,
          onboardingId: submitted.id,
          delivery,
        }
      );
      if (tab) tab.location.href = data.url;
      else window.location.href = data.url;
      toast.info("Secure checkout opened — installation starts as soon as payment completes.");
      setStep("done");
    } catch (e) {
      tab?.close();
      toast.error((e as Error).message);
    } finally {
      setStarting(false);
    }
  }

  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs items={[{ label: "Get started" }]} />
        <div className="page-heading compact">
          <span className="eyebrow">
            <i /> AUTOMATE EVERYTHING · WHATEVER BUSINESS YOU RUN
          </span>
          <h1>
            Tell us your business.
            <br />
            <em>We&rsquo;ll automate the rest.</em>
          </h1>
          <p>
            Share your website or answer three quick questions. Aria builds the
            automations, installs them, and runs them — so you never lose a
            contact.
          </p>
        </div>

        <ol className="wizard-steps" aria-label="Progress">
          {[
            ["1", "Your business"],
            ["2", "What gets automated"],
            ["3", "Installation & plan"],
          ].map(([n, label]) => {
            const active =
              (step === "start" && n === "1") ||
              (step === "category" && n === "1") ||
              (step === "result" && (n === "2" || n === "3")) ||
              (step === "done" && n === "3");
            return (
              <li key={n} className={active ? "active" : ""}>
                <span>{n}</span> {label}
              </li>
            );
          })}
        </ol>

        {/* ------------------------- STEP 1: START ------------------------- */}
        {step === "start" && (
          <div className="wizard-panel">
            <div className="wizard-modes">
              <button
                className={`wizard-mode ${mode === "website" ? "active" : ""}`}
                onClick={() => setMode("website")}
                type="button"
              >
                <Globe size={22} />
                <div>
                  <strong>Share my website</strong>
                  <span>Fastest — we scan it and propose your category.</span>
                </div>
              </button>
              <button
                className={`wizard-mode ${mode === "questions" ? "active" : ""}`}
                onClick={() => setMode("questions")}
                type="button"
              >
                <ClipboardList size={22} />
                <div>
                  <strong>Answer 3 questions</strong>
                  <span>No website needed — takes under a minute.</span>
                </div>
              </button>
            </div>

            {mode === "website" ? (
              <div className="wizard-body">
                <label className="field-label" htmlFor="wizard-website">
                  Your website
                </label>
                <input
                  id="wizard-website"
                  className="wizard-input"
                  placeholder="yourbusiness.com"
                  value={website}
                  onChange={event => setWebsite(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Enter") analyzeSite();
                  }}
                />
                <p className="wizard-hint">
                  We read your public homepage once to suggest the right
                  category. Nothing is installed yet.
                </p>
                <button
                  className="button dark"
                  onClick={analyzeSite}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <Loader2 size={17} className="spin" /> Reading your site...
                    </>
                  ) : (
                    <>
                      Analyze my website <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="wizard-body">
                {ONBOARDING_QUESTIONS.map(question => (
                  <div className="wizard-question" key={question.id}>
                    <h3>{question.question}</h3>
                    <div className="wizard-options">
                      {question.options.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          className={`wizard-option ${
                            answers[question.id] === option.value ? "selected" : ""
                          }`}
                          onClick={() =>
                            answerQuestion(
                              question.id,
                              option.value,
                              option.category
                            )
                          }
                        >
                          {answers[question.id] === option.value && (
                            <Check size={14} />
                          )}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="wizard-contact">
              <div>
                <label className="field-label" htmlFor="wizard-business">
                  Business name <small>(optional)</small>
                </label>
                <input
                  id="wizard-business"
                  className="wizard-input"
                  placeholder="e.g. Sunrise Dental Care"
                  value={businessName}
                  onChange={event => setBusinessName(event.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="wizard-email">
                  Email for your setup plan <small>(optional)</small>
                </label>
                <input
                  id="wizard-email"
                  className="wizard-input"
                  type="email"
                  placeholder={user?.email ?? "you@business.com"}
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ------------------------ STEP 1.5: CATEGORY ---------------------- */}
        {step === "category" && (
          <div className="wizard-panel">
            <div className="wizard-detected">
              {analysis?.detected ? (
                <>
                  <BadgeCheck size={20} />
                  <p>
                    We read <strong>{analysis.url}</strong>
                    {analysis.businessName ? (
                      <> — {analysis.businessName}</>
                    ) : null}{" "}
                    and it looks like{" "}
                    <strong>
                      {getCategory(analysis.detected.categoryId)?.name}
                    </strong>
                    . Confirm below, or pick a better fit.
                  </p>
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  <p>
                    We couldn&rsquo;t read that site automatically — no problem.
                    Pick your category below and we&rsquo;ll take it from there.
                  </p>
                </>
              )}
            </div>
            <div className="category-grid">
              {BUSINESS_CATEGORIES.map(item => {
                const Icon = CATEGORY_ICONS[item.id] ?? Sparkles;
                const isDetected = item.id === detectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`category-card ${
                      categoryId === item.id ? "selected" : ""
                    }`}
                    onClick={() => setCategoryId(item.id)}
                  >
                    {isDetected && (
                      <span className="detected-tag">Detected</span>
                    )}
                    <Icon size={26} />
                    <strong>{item.name}</strong>
                    <span>{item.resultHeadline}</span>
                  </button>
                );
              })}
            </div>
            <div className="wizard-actions">
              <button
                className="button ghost"
                onClick={() => setStep("start")}
                type="button"
              >
                Back
              </button>
              <button
                className="button dark"
                disabled={!categoryId}
                onClick={() => setStep("result")}
              >
                Show me what gets automated <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* -------------------- STEP 2/3: RESULT + PLAN -------------------- */}
        {step === "result" && category && (
          <CategoryResult
            category={category}
            businessName={businessName}
            delivery={delivery}
            onDeliveryChange={setDelivery}
            plan={plan}
            onPlanChange={setPlanId}
            starting={starting}
            signedIn={Boolean(user)}
            onStart={startInstallation}
            onBack={() => setStep(analysis || mode === "website" ? "category" : "start")}
          />
        )}

        {/* --------------------------- DONE -------------------------------- */}
        {step === "done" && (
          <div className="wizard-panel done-panel">
            <BadgeCheck size={44} />
            <h2>Checkout is open — your build is next.</h2>
            <p>
              As soon as payment completes, we start your installation: the
              {category ? ` ${category.name.toLowerCase()} ` : " "}
              automations are built, connected to your channels, and embedded on
              your website or set up in your portal. You&rsquo;ll track every
              step live.
            </p>
            <div className="wizard-actions center">
              <Link href="/orders" className="button dark">
                Track in My orders <ArrowUpRight size={17} />
              </Link>
              <Link href="/portal" className="button ghost">
                Open my portal <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function CategoryResult({
  category,
  businessName,
  delivery,
  onDeliveryChange,
  plan,
  onPlanChange,
  starting,
  signedIn,
  onStart,
  onBack,
}: {
  category: BusinessCategory;
  businessName: string;
  delivery: string;
  onDeliveryChange: (value: string) => void;
  plan: (typeof PLANS)[number];
  onPlanChange: (id: string) => void;
  starting: boolean;
  signedIn: boolean;
  onStart: () => void;
  onBack: () => void;
}) {
  const Icon = CATEGORY_ICONS[category.id] ?? Sparkles;
  return (
    <>
      <div className="wizard-panel result-panel">
        <div className="result-head">
          <span className="result-icon">
            <Icon size={26} />
          </span>
          <div>
            <span className="eyebrow">
              <i /> ARIA FOR{" "}
              {(businessName || category.name).toUpperCase().slice(0, 60)}
            </span>
            <h2>{category.resultHeadline}</h2>
          </div>
        </div>
        <p className="result-body">{category.resultBody}</p>
        <div className="promise-strip">
          {category.promises.map(promise => (
            <span key={promise}>
              <Zap size={14} /> {promise}
            </span>
          ))}
        </div>
        <h3 className="result-subtitle">What gets automated for you</h3>
        <div className="automated-grid">
          {category.whatGetsAutomated.map(item => (
            <article key={item.title}>
              <Check size={16} />
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
        {category.kits.length > 0 && (
          <div className="result-kits">
            <span>Powered by:</span>
            {category.kits.map(kitId => {
              const kit = getAutomation(kitId);
              return kit ? (
                <Link key={kitId} href={`/automations/${kit.id}`}>
                  {kit.name} <ArrowUpRight size={12} />
                </Link>
              ) : null;
            })}
          </div>
        )}
      </div>

      <div className="wizard-panel">
        <h3 className="result-subtitle">Where should it run?</h3>
        <div className="delivery-grid">
          {DELIVERY_OPTIONS.map(option => {
            const DeliveryIcon =
              DELIVERY_ICONS[option.icon] ?? LayoutDashboard;
            return (
              <button
                key={option.id}
                type="button"
                className={`delivery-card ${
                  delivery === option.id ? "selected" : ""
                }`}
                onClick={() => onDeliveryChange(option.id)}
              >
                <DeliveryIcon size={24} />
                <strong>{option.name}</strong>
                <span>{option.description}</span>
              </button>
            );
          })}
        </div>

        <h3 className="result-subtitle">
          One-time installation + a monthly plan
        </h3>
        <div className="plans-grid">
          {PLANS.map(item => (
            <button
              key={item.id}
              type="button"
              className={`plan-card selectable ${item.popular ? "popular" : ""} ${
                plan.id === item.id ? "selected" : ""
              }`}
              onClick={() => onPlanChange(item.id)}
            >
              {item.badge && <span className="card-badge">{item.badge}</span>}
              <h4>{item.name}</h4>
              <p className="plan-tagline">{item.tagline}</p>
              <div className="plan-price">
                <strong>{formatPrice(item.installFee)}</strong>
                <span>one-time installation</span>
              </div>
              <div className="plan-price monthly">
                <strong>{formatPrice(item.monthlyPrice)}</strong>
                <span>/ month, everything running</span>
              </div>
              <ul className="check-list">
                {item.features.slice(0, 4).map(feature => (
                  <li key={feature}>
                    <Check size={15} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="wizard-actions">
          <button className="button ghost" onClick={onBack} type="button">
            Back
          </button>
          {!signedIn ? (
            <Link href="/login" className="button dark">
              <Mail size={17} /> Sign in to start installation
            </Link>
          ) : (
            <button
              className="button lime"
              onClick={onStart}
              disabled={starting}
            >
              {starting ? (
                <>
                  <Loader2 size={17} className="spin" /> Opening checkout...
                </>
              ) : (
                <>
                  Start installation — {formatPrice(plan.installFee)} +{" "}
                  {formatPrice(plan.monthlyPrice)}/mo <ArrowUpRight size={17} />
                </>
              )}
            </button>
          )}
        </div>
        <p className="wizard-hint center">
          Installation: {getDeliveryOption(delivery)?.name.toLowerCase() ?? ""}{" "}
          · Billed securely through Dodo Payments. Cancel any time.
        </p>
      </div>
    </>
  );
}
