import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Link } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider, PageShell } from "./components/Storefront";
import Home from "./pages/Home";
import Catalog, { Industries } from "./pages/Catalog";
import AutomationDetail from "./pages/AutomationDetail";
import Implementation from "./pages/Implementation";
import Demo from "./pages/Demo";
import VoiceSetup from "./pages/VoiceSetup";
import QuickSetup from "./pages/QuickSetup";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Onboarding from "./pages/Onboarding";
import Portal from "./pages/Portal";
import Growth from "./pages/Growth";
import { Cart, Orders, Admin } from "./pages/Commerce";
import { FAQ, HowItWorks, Privacy, Terms } from "./pages/Information";
import LocalLanding from "./pages/LocalLanding";
function NotFound() {
  return (
    <PageShell>
      <div className="container empty-state">
        <span className="eyebrow">404 / LET’S GET YOU BACK ON TRACK</span>
        <h1>
          This page took
          <br />
          <em>a different route.</em>
        </h1>
        <p>The automation you’re looking for may be elsewhere.</p>
        <Link href="/automations" className="button dark">
          Explore the library
        </Link>
      </div>
    </PageShell>
  );
}
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/get-started" component={Onboarding} />
      <Route path="/portal" component={Portal} />
      <Route path="/growth" component={Growth} />
      <Route path="/automations">{() => <Catalog industry="all" />}</Route>
      <Route path="/automations/:id/setup" component={QuickSetup} />
      <Route path="/automations/:id" component={AutomationDetail} />
      <Route path="/industries" component={Industries} />
      <Route path="/industries/:id">{() => <Catalog />}</Route>
      <Route path="/implementation" component={Implementation} />
      <Route path="/demo" component={Demo} />
      <Route path="/voice-setup" component={VoiceSetup} />
      <Route path="/login" component={Auth} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/cart" component={Cart} />
      <Route path="/orders" component={Orders} />
      <Route path="/admin" component={Admin} />
      <Route path="/local/:city/:industry" component={LocalLanding} />
      <Route path="/local/:city" component={LocalLanding} />
      <Route path="/locations" component={LocalLanding} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/faq" component={FAQ} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route component={NotFound} />
    </Switch>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <CartProvider>
            <Toaster />
            <Router />
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
