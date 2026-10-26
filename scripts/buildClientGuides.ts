import fs from "node:fs";
import path from "node:path";
import { automations, formatPrice } from "../shared/catalog";
import {
  getIntegrationPlan,
  clientSetupTemplate,
} from "../shared/integrationPlans";
import { getWorkflowContract } from "../shared/workflowContracts";
import { supportOptions } from "../shared/supportOptions";
const root = path.resolve(process.cwd(), "automation-kits");
const table = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
let guide =
  "# Aria — Owner Installation & Client Onboarding Playbook\n\nPrepared 21 October 2026. This playbook covers the separately priced automation options built in the Aria storefront. Prices are draft USD test prices, not approved live commercial offers. Kits are inactive, configurable starter packages—not already-connected deployments. No live schedules, calls, WhatsApp broadcasts, outreach, filings, or payments were activated.\n\n## The shortest safe install path\n\n**Step 1 — Import and test.** Sign into the client-owned n8n workspace. Download that product’s verified-purchase kit, import a JSON from its `workflows` folder, and execute only its synthetic Manual Trigger example. Keep the workflow inactive. For the local website leadgen product, Python 3 runs its stdlib analyzer locally; no analyzer API key is required.\n\n**Step 2 — Add approved connections.** Enter client-owned provider credentials directly in n8n Credentials, never in an email, public form, prompt, or config file. Map only documented source APIs or use the named staff handoff. Check schema, missing/unknown facts, consent/opt-out, duplicate prevention, error ownership and review gates before the owner approves live activation. Imported synthetic Code nodes do not make AI/provider calls. Connecting arbitrary CRM/HMS/voice vendors is not magically completed by adding a key.\n\nThe client’s public setup page `/automations/<id>/setup` lists the exact information to prepare, generates a local secret-free client config, and can copy those particulars into a contact-request draft. The draft is not sent until the client reviews it, consents and submits.\n\n## Product and API matrix\n\n| Separate product | Draft kit price | Client-owned inputs / APIs | Guide and download folder |\n|---|---:|---|---|\n";
for (const item of automations) {
  const folder = path.join(root, item.bundle);
  if (!fs.existsSync(folder)) throw new Error(`Missing kit: ${item.bundle}`);
  const apis = getIntegrationPlan(item);
  if (!apis.length) throw new Error(`Missing API plan: ${item.id}`);
  const config = clientSetupTemplate(item);
  const readmePath = path.join(folder, "README.md");
  const readme = fs.readFileSync(readmePath, "utf8");
  if (!readme.includes("## Start with the two-step installation guide")) {
    const newline = readme.indexOf("\n");
    const note =
      "\n\n## Start with the two-step installation guide\n\nRead `quick-start.md` first. Fill only non-secret business/provider details in `client-setup-template.json`; enter credentials in your own vault. `api-requirements.json` lists required and optional adapters. Installation/API support is separately quoted.\n\n";
    fs.writeFileSync(
      readmePath,
      readme.slice(0, newline) + note + readme.slice(newline + 1)
    );
  }

  const quick = `# ${item.name} — Two-Step Safe Setup\n\nDraft workflow-kit price: **${formatPrice(item.price)} USD**. Purchase pays for this distinct configurable kit, not live provider accounts or an already-connected business system.\n\n## Step 1 — Import and test the synthetic kit\n\nIn your client-owned n8n workspace choose Workflows → Import from File and import one JSON from \`workflows/\`. Keep it inactive and execute only the synthetic Manual Trigger. Review output and exception/human-review paths.\n\n## Step 2 — Add approved API connections in your own vault\n\nUse the API checklist below. Create credentials in your client-owned n8n Credentials vault; never include secret values in the supplied config. Add a documented source/provider adapter or leave the staff handoff. Test schema, permissions, duplicate protection, consent, missing data, stale state, failure and owner review before production. A model/API key by itself does not configure an arbitrary business-system connector.\n\n## Client particulars\n\nUse \`client-setup-template.json\` to fill business name/website/location/country/timezone/languages, named owner/transfer destination, provider names and public docs. All \`enabled\` flags remain false. Do not place API keys, signed URLs, passwords, patient/client records or KYC documents in this file. The public setup guide \`/automations/${item.id}/setup\` can build a local JSON and copy non-secret details into an explicitly submitted inquiry.\n\n## API and provider checklist\n\n${apis.map(api => `### ${api.label} — ${api.required ? "Required for the scoped production use" : "Optional, only if your scope uses it"}\n\n${api.purpose}\n\nClient provides: ${api.clientProvides.join("; ")}.\n\nCredential destination: **${api.secretDestination}**\n\n1. ${api.steps[0]}\n2. ${api.steps[1]}\n`).join("\n")}\n## Need Aria to install or cover API costs?\n\nInstallation/API integration/provider costs are additional. Request contact at \`/implementation?automation=${item.id}\` and select installation, installation plus API wiring, or a managed/covered-API-cost quote. Agree provider account ownership, usage allowance, overages, recurring fees, maintenance and cancellation before any connection or charge. All service estimates are draft. Never send keys to Aria’s public form.\n\n## Operational boundaries\n\n${getWorkflowContract(item).action}\n\n${getWorkflowContract(item).safety}\n\n${item.id === "local-site-leadgen" ? "The user-export schedules (weekdays 04:00 and Friday 17:00) are reference examples, not installed jobs. Automatic discovery/generation/hosting/email/contact-form APIs are not connected. The revised pipeline requires human review before publishing or contacting any recipient; opt-outs and source rights require local/jurisdiction review." : item.id === "gold-showroom" ? "The source’s 10:30 rate and 11:00 two-days-before reminder cadences in Asia/Kolkata are reference metadata, not live schedules. Only opted-in subscribers are eligible. Rates, making charges, tax basis/rate/effective date and estimate wording require the showroom/accountant’s approval. No binding quotes, investment advice or payments." : item.id === "ca-practice" ? "Firm partner review remains mandatory for deadlines, client requests and all external communications. No tax advice, government filing, payment initiation or substantive professional decision is enabled." : ""}\n`;
  // Markdown backticks are built as plain characters without embedding secret examples.
  fs.writeFileSync(
    path.join(folder, "quick-start.md"),
    quick.replace(/\`/g, "`")
  );
  fs.writeFileSync(
    path.join(folder, "client-setup-template.json"),
    JSON.stringify(config, null, 2) + "\n"
  );
  fs.writeFileSync(
    path.join(folder, "api-requirements.json"),
    JSON.stringify(
      { product: item.id, no_secret_values: true, client_providers: apis },
      null,
      2
    ) + "\n"
  );
  guide += `| ${table(item.name)} | ${formatPrice(item.price)} | ${table(apis.map(x => `${x.label}${x.required || /optional/i.test(x.label) ? "" : " (optional)"}`).join("; "))} | \`automation-kits/${item.bundle}/quick-start.md\` · \`/automations/${item.id}/setup\` |\n`;
}
guide +=
  "\n## Optional implementation/support choices\n\n| Request choice | Draft planning estimate / quote basis | What is separate |\n|---|---|---|\n" +
  supportOptions
    .map(
      x => `| ${table(x.label)} | ${table(x.price)} | ${table(x.description)} |`
    )
    .join("\n") +
  "\n\nA service request is not a purchase or provider connection. The client first receives a contact/reference confirmation in the website. Aria reviews the private agency inbox and confirms feasible APIs, least-privilege permissions, account/credential ownership, scope and costs before work. Covered API costs require an explicitly agreed capped allowance and overage policy, not an unlimited-usage promise.\n\n## Owner handover sequence\n\nWhen contacted, identify the purchased kit and requested service level. Review the optional location/country/timezone/language/provider docs and assigned staff owner. Ask for public API documentation and access-scopes information first. Have the client enter secrets directly in their own credential vault, or use a separately agreed secure managed-provider route; never request them through the storefront form. Use synthetic/sandbox tests, then agree a named owner and limited go-live scope. Do not promise that any vendor supports a connector until its documented API and permission scope are verified.\n\n## Before live commerce\n\nApprove final prices/currency, installation fees, usage-cost ownership, licensing rights, refunds, support terms and organization-specific privacy/security policies. Claim/configure the live merchant payment account and complete an approved test purchase/webhook/download path. Deploy this replacement storefront only after the owner approves the domain route; the existing ariaagent.agency website is unchanged.\n";
const inventory = Object.fromEntries(
  automations.map(item => {
    const folder = path.join(root, item.bundle);
    return [
      item.bundle,
      {
        workflows: fs
          .readdirSync(path.join(folder, "workflows"))
          .filter(x => x.endsWith(".json"))
          .sort()
          .map(x => "workflows/" + x),
        files: fs
          .readdirSync(folder)
          .filter(x => fs.statSync(path.join(folder, x)).isFile())
          .sort(),
      },
    ];
  })
);
fs.writeFileSync(
  path.join(root, "KIT_INVENTORY.json"),
  JSON.stringify(inventory, null, 2) + "\n"
);
const out = path.resolve(
  process.cwd(),
  "Aria-Installation-and-Client-Onboarding-Guide.md"
);
fs.writeFileSync(out, guide.replace(/\`/g, "`"));
console.log(
  `Wrote ${automations.length} product guides/API checklists/client templates and ${out}`
);
