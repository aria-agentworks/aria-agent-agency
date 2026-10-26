# Aria — Owner Installation & Client Onboarding Playbook

Prepared 21 October 2026. This playbook covers the separately priced automation options built in the Aria storefront. Prices are draft USD test prices, not approved live commercial offers. Kits are inactive, configurable starter packages—not already-connected deployments. No live schedules, calls, WhatsApp broadcasts, outreach, filings, or payments were activated.

## The shortest safe install path

**Step 1 — Import and test.** Sign into the client-owned n8n workspace. Download that product’s verified-purchase kit, import a JSON from its `workflows` folder, and execute only its synthetic Manual Trigger example. Keep the workflow inactive. For the local website leadgen product, Python 3 runs its stdlib analyzer locally; no analyzer API key is required.

**Step 2 — Add approved connections.** Enter client-owned provider credentials directly in n8n Credentials, never in an email, public form, prompt, or config file. Map only documented source APIs or use the named staff handoff. Check schema, missing/unknown facts, consent/opt-out, duplicate prevention, error ownership and review gates before the owner approves live activation. Imported synthetic Code nodes do not make AI/provider calls. Connecting arbitrary CRM/HMS/voice vendors is not magically completed by adding a key.

The client’s public setup page `/automations/<id>/setup` lists the exact information to prepare, generates a local secret-free client config, and can copy those particulars into a contact-request draft. The draft is not sent until the client reviews it, consents and submits.

## Product and API matrix

| Separate product | Draft kit price | Client-owned inputs / APIs | Guide and download folder |
|---|---:|---|---|
| AI Front Office | $149 | n8n workspace; AI provider (optional); CRM / intake source (production) (optional) | `automation-kits/front-office/quick-start.md` · `/automations/front-office/setup` |
| Dental Front Desk | $249 | Practice system / scheduler; Messaging provider (optional) | `automation-kits/dental-desk/quick-start.md` · `/automations/dental-desk/setup` |
| Lead Qualification Engine | $179 | Inbound lead source / CRM; AI provider (optional) | `automation-kits/lead-engine/quick-start.md` · `/automations/lead-engine/setup` |
| Hospital Patient Lifecycle | $499 | HMS/EMR/CRM and scheduling; Messaging/AI provider (optional) | `automation-kits/hospital-lifecycle/quick-start.md` · `/automations/hospital-lifecycle/setup` |
| Customer Support Assistant | $129 | Knowledge base and helpdesk; AI provider (optional) | `automation-kits/support-assistant/quick-start.md` · `/automations/support-assistant/setup` |
| Feedback & Service Recovery | $99 | Feedback/CRM/helpdesk source | `automation-kits/reputation-care/quick-start.md` · `/automations/reputation-care/setup` |
| Property Enquiry Assistant | $199 | Property listing/CRM source | `automation-kits/property-enquiries/quick-start.md` · `/automations/property-enquiries/setup` |
| Daily Operations Brief | $79 | Metrics/reporting source | `automation-kits/daily-operations/quick-start.md` · `/automations/daily-operations/setup` |
| Real Estate Lead-to-Viewing Desk | $399 | Meta Lead Ads (optional source); WhatsApp Business (optional channel); Property inventory + broker roster; Voice/notifications (optional) | `automation-kits/realestate-lead-desk/quick-start.md` · `/automations/realestate-lead-desk/setup` |
| Voice Front Desk Starter | $249 | Indian voice/telephony provider; Business API / human queue | `automation-kits/voice-front-desk/quick-start.md` · `/automations/voice-front-desk/setup` |
| Local Website Audit & Lead Engine | $329 | Prospect source (optional automation); Website analyzer; Optional AI/site generation + hosting; Optional CRM/email | `automation-kits/local-site-leadgen/quick-start.md` · `/automations/local-site-leadgen/setup` |
| Gold Showroom AI Desk | $449 | Google Sheet ratebook and client tables; Meta WhatsApp Cloud API (optional); OpenAI / approved AI provider (optional) | `automation-kits/gold-showroom/quick-start.md` · `/automations/gold-showroom/setup` |
| CA Practice Operations Desk | $499 | Firm records / Google Sheets; Gmail / WhatsApp / Telegram (optional); Groq or approved OpenAI-compatible AI (optional) | `automation-kits/ca-practice/quick-start.md` · `/automations/ca-practice/setup` |
| Universal WhatsApp Replier | $299 | n8n workspace; WhatsApp Business Platform / Cloud API; Scheduling / calendar source (optional); AI provider (optional); Lead sheet / CRM (optional) | `automation-kits/universal-replier/quick-start.md` · `/automations/universal-replier/setup` |

## Optional implementation/support choices

| Request choice | Draft planning estimate / quote basis | What is separate |
|---|---|---|
| Discuss a scope | Quote after discovery | Tell us the problem and tools. No installation or API fees are charged by submitting this request. |
| Install my purchased kit | Draft planning estimate: from $199 one-time | Import/configuration, one agreed source connection, synthetic testing and handover. Final scope and price are confirmed before work; vendor usage is excluded. |
| Installation + API wiring | Draft estimate: installation from $199 + API wiring from $99 | We help connect documented provider APIs and test approval/error paths. Per-connector complexity, vendor account fees and metered usage are quoted separately. |
| Installation + covered API costs | Custom setup + monthly usage-budget quote | Ask Aria to coordinate approved provider costs and maintenance. Any capped usage allowance, ownership, recurring charges, overages and cancellation terms must be agreed before connection. |

A service request is not a purchase or provider connection. The client first receives a contact/reference confirmation in the website. Aria reviews the private agency inbox and confirms feasible APIs, least-privilege permissions, account/credential ownership, scope and costs before work. Covered API costs require an explicitly agreed capped allowance and overage policy, not an unlimited-usage promise.

## Owner handover sequence

When contacted, identify the purchased kit and requested service level. Review the optional location/country/timezone/language/provider docs and assigned staff owner. Ask for public API documentation and access-scopes information first. Have the client enter secrets directly in their own credential vault, or use a separately agreed secure managed-provider route; never request them through the storefront form. Use synthetic/sandbox tests, then agree a named owner and limited go-live scope. Do not promise that any vendor supports a connector until its documented API and permission scope are verified.

## Before live commerce

Approve final prices/currency, installation fees, usage-cost ownership, licensing rights, refunds, support terms and organization-specific privacy/security policies. Claim/configure the live merchant payment account and complete an approved test purchase/webhook/download path. Deploy this replacement storefront only after the owner approves the domain route; the existing ariaagent.agency website is unchanged.
