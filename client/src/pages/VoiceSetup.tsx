import { Link } from "wouter";
import {
  ArrowUpRight,
  Phone,
  ShieldCheck,
  Receipt,
  UserRoundCheck,
} from "lucide-react";
import { PageShell, Breadcrumbs } from "@/components/Storefront";
const sarvam =
  "https://docs.sarvam.ai/voice-agents/deploy/telephony/rent-from-sarvam";
const bolna = "https://www.bolna.ai/docs/compliance-application/introduction";
export default function VoiceSetup() {
  return (
    <PageShell>
      <div className="container">
        <Breadcrumbs items={[{ label: "Indian voice-number setup" }]} />
        <div className="page-heading">
          <span className="eyebrow">
            <i />
            BEFORE YOUR AGENT TAKES A CALL
          </span>
          <h1>
            An Indian number.
            <br />
            <em>A properly scoped setup.</em>
          </h1>
          <p>
            Bring a supported provider, complete their onboarding, and connect
            an approved call flow. A workflow-kit purchase does not rent a
            number, approve KYC, or activate calling.
          </p>
        </div>
        <div className="demo-safety">
          <ShieldCheck size={22} />
          <span>
            Plan inbound handling first. Outbound campaigns, recording, consent,
            human transfer, and WhatsApp are separate approval and integration
            decisions.
          </span>
        </div>
        <div className="voice-provider-grid">
          <article>
            <span className="panel-label">PROVIDER OPTION / SARVAM</span>
            <h2>Managed number + voice platform</h2>
            <p>
              Sarvam offers provider-managed number rental with KYC, native
              telephony, or supported bring-your-own telephony. Your provider
              account—not this storefront—owns number eligibility, activation,
              and billing.
            </p>
            <a
              href={sarvam}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Official setup documentation <ArrowUpRight size={17} />
            </a>
          </article>
          <article>
            <span className="panel-label">PROVIDER OPTION / BOLNA</span>
            <h2>Voice platform + telephony options</h2>
            <p>
              Bolna requires a provider compliance application before number
              purchase. Current documentation lists business verification and
              company records; the provider confirms what applies to your entity
              and region.
            </p>
            <a
              href={bolna}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Official compliance requirements <ArrowUpRight size={17} />
            </a>
          </article>
        </div>
        <section className="voice-cost-section">
          <div>
            <span className="eyebrow">
              <i />
              SEPARATE THE COST LAYERS
            </span>
            <h2>
              Number rent is not
              <br />
              <em>your total calling cost.</em>
            </h2>
            <p>
              The supplied startup guide’s cheap-number figures should not be
              read as an all-inclusive AI calling rate. Budget for number rent,
              AI-agent minutes, telephony pulses, transfers, GST, and any
              implementation or maintenance work.
            </p>
          </div>
          <div className="voice-cost-card">
            <Receipt size={25} />
            <h3>A current provider example</h3>
            <p>
              At the 21 October 2026 source check, Sarvam’s published rate card
              lists ₹59 per number per 30 days for listed number series,
              pay-as-you-go AI-agent usage at ₹3.50 per minute, and native
              telephony at ₹0.20 per 30-second pulse. GST is excluded and
              provider billing units apply.
            </p>
            <p>
              These are separate provider charges, not Aria’s price or a
              guarantee of number availability. Reconfirm the current rate card
              and your provider account before purchase.
            </p>
            <a
              className="text-link"
              href="https://www.sarvam.ai/products/voice-agents/pricing"
              target="_blank"
              rel="noreferrer"
            >
              Verify the provider rate card <ArrowUpRight size={16} />
            </a>
          </div>
        </section>
        <div className="long-process voice-process">
          {[
            [
              "01",
              "Choose the use case and region",
              "Define inbound enquiries, preferred languages, operating hours, allowed tasks, and the person who receives the handoff.",
            ],
            [
              "02",
              "Complete the provider’s secure onboarding",
              "Open the client-owned provider account and follow its KYC/compliance process. Submit identity/company documents only through the provider’s own secure portal—not the Aria inquiry form.",
            ],
            [
              "03",
              "Verify the number and business-system adapters",
              "Confirm the number type, permitted use, inbound routing, tool/API permissions, callback security, transfer destination, and optional WhatsApp scope. Do not assume a rented number is already a WhatsApp agent.",
            ],
            [
              "04",
              "Approve and test the call flow",
              "Test disclosure/recording policies, consent, language behavior, unavailable slots, sensitive requests, duplicates, failures, and staff transfer. Activate only after the business approves the production scope.",
            ],
          ].map(([n, t, p]) => (
            <article key={n}>
              <span>{n}</span>
              <div>
                <h2>{t}</h2>
                <p>{p}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="guardrail-note">
          <UserRoundCheck size={24} />
          <div>
            <h3>A real person remains reachable.</h3>
            <p>
              Voice agents should hand off unclear or sensitive cases instead of
              guessing. Healthcare calls stay administrative: no diagnosis,
              prescribing, result interpretation, or autonomous clinical triage.
              Platform availability and security/consent policies must be
              verified for each client.
            </p>
          </div>
        </div>
        <div className="demo-bottom">
          <div>
            <h3>Want a voice front desk connected for you?</h3>
            <p>
              Tell us your use case, current systems, languages, and preferred
              provider. Do not upload KYC documents or credentials.
            </p>
          </div>
          <Link
            className="button dark"
            href="/implementation?automation=front-office"
          >
            Scope my voice implementation <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
