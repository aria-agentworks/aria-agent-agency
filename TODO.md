# Build outcomes

## 1. Brand-led agency storefront
- [x] Use Aria Agent Agency and https://ariaagent.agency as the business and brand reference; preserve its healthcare revenue roots while expanding the offer to businesses across industries.
- [x] Give visitors clear paths to browse automations, buy a ready-made automation, or ask Aria to implement a tailored solution.

## 2. Automation catalog and detail pages
- [x] Organize ready-made automations by industry and business use case, including front-office automation, dental-client workflows, lead generation, healthcare/hospital operations, and additional business automations.
- [x] Provide industry/use-case landing pages and dedicated detail pages that explain each workflow, intended customer, outcomes, included components, requirements, and pricing or quote basis.
- [x] Let customers choose between purchasing a ready-made automation themselves and requesting agency-led implementation.

## 3. Cart and secure checkout
- [x] Provide a storefront cart and secure checkout for purchasable ready-made automations; keep product and price definitions centralized.
- [x] Use sandbox checkout for the preview; do not claim live payment processing until live payment credentials and final prices are configured.
- [x] Treat the hospital Starter/Growth amounts in the supplied blueprint as draft scope-based references, not guaranteed ROI or final live prices; maintenance/optimization is quoted monthly, and complex integrations require a custom quote.

## 4. Implementation requests and lead handling
- [x] Provide an implementation request form that captures business details, desired automation, current tools, goals, and contact information.
- [x] Persist submitted requests so Aria can follow them up, and provide a clear confirmation to the requester.
- [x] Keep owner-only inquiry data private; do not expose submitted contact details publicly.

## 5. Hospital and clinic automation content
- [x] Present the hospital offer as an administrative automation layer around existing HMS/EMR/CRM systems, not as a replacement for those systems.
- [x] Demonstrate three synthetic-data workflows: lead qualification through confirmed appointment, confirmation/reminder and no-show recovery; approved discharge follow-up through feedback and service-recovery task; and pending-diagnostic staff escalation with administrative patient notification.
- [x] Describe workflow behavior as trigger, data, AI/rules, action, human fallback, log, and KPI; include error handling, exception ownership, and duplicate-prevention/idempotency where appropriate.
- [x] Limit healthcare AI to administrative classification, extraction, summarization, message drafting, routing suggestions, and operational reporting. Never diagnose, prescribe, recommend treatment, interpret clinical results, make autonomous clinical triage decisions, invent patient facts, or invent appointment availability.
- [x] Route ambiguous, clinically sensitive, missing-data, and high-impact cases to human review. Create or confirm appointments only when the connected scheduling source returns an available slot.
- [x] Use synthetic information in public demonstrations; do not collect real patient/PHI data in the demo. State that production requires the client's approved systems, credentials, policies, security review, and vendor/API support.
- [x] Do not claim guaranteed revenue recovery, clinical outcomes, compliance, or ROI beyond facts already published on the user's site and confirmed for reuse.

## 6. Trust, conversion, and discoverability
- [x] Include a process overview, FAQs, support expectations, and trustworthy proof; do not invent testimonials or case studies.
- [x] Make navigation, catalog, detail pages, forms, cart, and checkout responsive and usable on mobile.
- [x] Provide meaningful route-specific page content and metadata for public storefront pages.

## Delivered evidence

TypeScript checks, production build, 17 focused automated tests, and kit validation pass. The HTTP health and route manifest return 200. Private order/inquiry endpoints reject anonymous access, and invalid inquiries return an error rather than false success. One actual synthetic appointment AI call completed; the clinical case routed to human review. The review findings for service recovery, operational contracts/KPIs, and trailing-slash routing were corrected. Eight kits contain fourteen inactive workflow starters plus setup documentation and operational contracts. No live business integrations or messages were activated.

## Owner-controlled launch prerequisites
- [ ] Confirm final prices/currency, use/licensing rights, refunds/cancellations, support commitments, and organization-specific legal/privacy terms before enabling live commerce.
- [ ] Complete an end-to-end signed-in Stripe test purchase and webhook/download verification, then configure the owner’s live payment account only after commercial terms are confirmed.
- [ ] Approve a deployment route and connect the new storefront to the intended website/domain; the existing ariaagent.agency site has not been overwritten.
- [ ] Confirm each client’s APIs, credentials, consent, security review, source-system ownership, durable idempotency store, and go-live scope before activating production workflows.

## 7. Additional business references supplied on 21 October
- [x] Use source-supported requirements from the real-estate lead-management reference to refine the property offer, without inventing unavailable workflow details or executing the original JSON.
- [x] Inspect the supplied CA-firm workflow attachment and add an appropriate configurable CA/accounting-firm administrative offer with the same purchase and agency-implementation paths; professional judgment and financial/tax submissions remain human-approved.
- [x] Add Indian voice-number setup guidance based on verified provider sources, distinguishing number rental from metered AI/telephony costs and requiring provider-owned KYC/account/consent/approval. Kit purchase must not claim to provision a live number or activate calls.

## 8. Separately priced products and installation support requested on 21 October
- [x] Add the uploaded local-business website-audit/leadgen export as its own purchasable option, distinct from inbound lead qualification. Preserve its analyzer/config/table definitions and specify that prospect discovery, AI-site generation, hosting, outreach provider connections and scheduler require approved client setup.
- [x] Give every automation its own price, package contents, installation guide and required API/provider information, including where clients enter their credentials.
- [x] Provide one/two guided steps for safe initial setup: import/test the inactive kit, then add client-owned credentials in a vault and map approved adapters; do not imply a purchase connects live systems automatically.
- [x] Let clients locally prepare a secret-free config with business particulars and provider names/public docs. Never put API keys, passwords, signed tokens, patient records or identity documents in the public form or downloadable config.
- [x] Offer installation-only, installation-plus-API-wiring and managed/covered-API-cost options as additional separately quoted services; ask Aria to contact the client before connection or charging.
- [x] Persist the requested support level and optional location, country, timezone, languages, handoff owner and provider-doc details in the private agency inquiry inbox.
- [x] Add the newly supplied jewellery showroom use case as a separately priced kit with owner-verified ratebook, opt-in-only drafts, 10:30 and 11:00 Asia/Kolkata sample cadence, two-day instalment reminders and staff-owned visits. Tax rates and estimates require showroom/accountant approval; no investments, schemes, payments or binding quotes are automated.

## Additional delivery evidence

The expanded catalog has 13 independently priced products, 29 inactive importable n8n workflows, 13 per-product API checklists/quick-start guides/client setup templates, and a separate owner onboarding playbook. The analyzer was copied exactly from the supplied ZIP and remains client-run; no real website was scraped. Offline synthetic tests cover the correct weak-site <=45 threshold, source-confirmed staff-approved viewing, numeric estimate validation, exact two-calendar-day reminders, opt-outs and duplicates. Twenty-four automated website/backend tests and the production build pass. The additive inquiry migration preserves existing rows and adds support level and non-secret client particulars. Anonymous order/admin endpoints reject access; secret-like inquiry data is rejected without echoing it. Public setup HTML now includes full provider/checklist content. The existing ariaagent.agency site is unchanged; prices and checkout are draft/test only. Replacement decorative website images are generating asynchronously at the configured Managed Storage paths; no final-pixel completion is claimed.
