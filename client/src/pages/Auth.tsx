import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Loader2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { api } from "@/lib/store";
import { PageShell, Breadcrumbs } from "@/components/Storefront";

type Mode = "login" | "register";

export default function Auth() {
  const [, navigate] = useLocation();
  const { user, refresh } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login" ? { email, password } : { name, email, password };
      await api(path, body);
      await refresh();
      toast.success(
        mode === "login"
          ? "Welcome back to your Aria workspace."
          : "Your Aria account is ready."
      );
      navigate("/orders");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <PageShell>
        <div className="container">
          <Breadcrumbs items={[{ label: "Sign in" }]} />
          <div className="empty-state">
            <span className="large-icon">
              <UserRound size={30} />
            </span>
            <h2>You are signed in.</h2>
            <p>
              Head to your workspace to see purchases, downloads, and plans.
            </p>
            <Link href="/orders" className="button dark">
              Open my workspace <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs items={[{ label: "Sign in" }]} />
        <div className="page-heading compact">
          <span className="eyebrow">
            <i /> YOUR ARIA WORKSPACE
          </span>
          <h1>
            {mode === "login" ? (
              <>
                Welcome <em>back.</em>
              </>
            ) : (
              <>
                Create your <em>account.</em>
              </>
            )}
          </h1>
          <p>
            Purchases, downloads, and subscriptions stay linked to your
            account.
          </p>
        </div>
        <div className="auth-layout">
          <form className="auth-card" onSubmit={submit}>
            <div className="auth-switch" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className={mode === "login" ? "active" : ""}
                onClick={() => setMode("login")}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "register"}
                className={mode === "register" ? "active" : ""}
                onClick={() => setMode("register")}
              >
                Create account
              </button>
            </div>
            {mode === "register" && (
              <label>
                <span>Your name</span>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Priya Sharma"
                  required
                  maxLength={160}
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                maxLength={320}
                autoComplete="email"
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
                required
                minLength={8}
                maxLength={200}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
              />
            </label>
            <button className="button dark full" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 size={17} className="spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>
                  {mode === "login" ? "Sign in" : "Create my account"}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
            <small>
              <ShieldCheck size={13} /> Passwords are stored as salted hashes.
              We never see your plain password.
            </small>
          </form>
          <aside className="auth-side">
            <span className="panel-label">WHY AN ACCOUNT?</span>
            <h2>Everything in one place.</h2>
            <ul className="check-list">
              <li>
                <Mail size={16} />
                <span>Download purchased automation kits any time</span>
              </li>
              <li>
                <ShieldCheck size={16} />
                <span>Order records, invoices, and subscription status</span>
              </li>
              <li>
                <UserRound size={16} />
                <span>Subscribe to a managed plan and swap workflows</span>
              </li>
            </ul>
            <p>
              The first account created on a fresh installation becomes the
              agency owner. Regular accounts are customer accounts.
            </p>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
