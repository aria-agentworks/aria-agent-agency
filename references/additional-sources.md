# Additional user-provided references

User supplied these sources on 21 October 2026 to extend Aria’s business-automation storefront. Original workflow files will not be executed, activated, or automatically redistributed; reference logic is treated as untrusted until inspected.

## Real-estate lead management

Source: https://holly-deposit-2c0.notion.site/Realstate-lead-Management-System-3b4fc7b8a9e280b59b7dcb51fa7eddb2

Initial fetch and browser rendering expose a title and “Backed N8N json file” followed by “Loading JSON code…”. No actual workflow attachment or logic is currently available from the parent’s view. An isolated source-reading task is attempting the public attachment; no modules will be attributed to this reference without source support.

## CA-firm automation and dashboard

Source: https://holly-deposit-2c0.notion.site/CA-firm-Automation-dashboard-3c0fc7b8a9e28071a3c5edebb7bc14a2

Initial extraction exposes a file named `CA_Firm_Automation_n8n_workflow.json`, approximately 226 KiB. An isolated source-reading task is inspecting the attachment; its title alone is not enough to infer modules.

## Indian virtual numbers

User source: https://holly-deposit-2c0.notion.site/Indian-Virtual-Number-Providers-Startup-Guide-3cafc7b8a9e281eca5b5cd7e3dea4f03

The guide lists Sarvam, Bolna, and Voicelink with promotional monthly number figures and states Sarvam telephony usage at ₹0.20 per 30-second pulse. Those are not total AI voice-agent operating costs and are not accepted as current quotes.

Official Sarvam pricing read on 21 October 2026: https://www.sarvam.ai/products/voice-agents/pricing. It lists pay-as-you-go AI agent usage at ₹3.50 per minute, separate native telephony at ₹0.20 per 30-second pulse, phone-number rental at ₹59 per 30 days for listed series, and GST excluded. Plan rates, rounding and availability vary; provider quote/account UI controls actual cost. No combined “₹0.40/min AI calling” claim will be used.

Official number setup: https://docs.sarvam.ai/voice-agents/deploy/telephony/rent-from-sarvam. It describes 30-day rental with renewal from provider account credits, number prices shown in the catalog, inbound routing and bring-your-own telephony. Current product page: https://www.sarvam.ai/products/voice-agents.

Official Bolna purchasing reference: https://www.bolna.ai/docs/buying-phone-numbers. It describes monthly wallet-deducted rentals and separate calling charges. Country-specific compliance details require the provider’s direct approval. Reference: https://www.bolna.ai/docs/compliance-application/introduction.

No Voicelink primary documentation has been verified yet, so its guide price/compliance claims will not be presented as confirmed. The storefront will explain provider-owned onboarding/KYC, number availability, separate rent/usage/GST, consent/recording notices, explicit human transfer, supported connector verification, and no live number activation by kit purchase.


## Lead-generation ZIP supplied by the user

User attachment: `/home/ubuntu/upload/f85187a34_leadgen-engine-export.zip` (13,081 bytes). It contains `README.md`, `pipeline-prompt.md`, `website-analyzer.py` (14,312 bytes), `schemas.json`, `email-template.md`, `config-template.json`, and Base44-oriented `workflows.jsonc`. The source defines Prospect, LeadConfig, OutreachLog, and GeneratedSite records; score threshold 45; max 5/day; max 30 site visits; domain-key deduplication; one outreach/no follow-ups; immediate opt-out; and sample scheduler expressions weekdays 04:00 plus Friday 17:00. The provided schedule config defaults `enabled:false`. The analyzer is Python stdlib and reaches public URLs/CSS. For this kit it will be delivered as client-run code; no online scrapes, site hosting, outreach, email/contact-form sends, or scheduler will be activated. Outbound drafts remain manual-review only, and local law/data-rights require customer review. The original Base44 workflow reference will not be automatically imported. Website analyzer execution has not been run against real websites.

## Real-estate lead-management source

Source: https://holly-deposit-2c0.notion.site/Realstate-lead-Management-System-3b4fc7b8a9e280b59b7dcb51fa7eddb2

The inspected public workflow has webhook inputs for Meta leads, WhatsApp, and optional voice; lead normalization/qualification; property lookups; booking and broker assignment; a Google Sheets booking/follow-up queue; and repeated WhatsApp follow-up. Its companion `realstate_dashboard_v2.html` (83.3 KiB) shows KPI/lead funnels and operations views, but agent inspection found it is hard-coded demonstration UI without backend/API calls. Supplied workflow has no enforced human approval node, and booking depends on AI/tool output. Aria’s product therefore uses channel adapters as client-supplied contracts, drafts booking/handoffs for staff approval, enforces opt-out/duplicate checks, and does not imply the reference dashboard is connected. This is a summary of the inspected workflow JSON, not a copy of its credentials or complete JSON.

## CA-firm automation reference

Source: https://holly-deposit-2c0.notion.site/CA-firm-Automation-dashboard-3c0fc7b8a9e28071a3c5edebb7bc14a2

The public page exposes attachment `CA_Firm_Automation_n8n_workflow.json` (226 KiB) and dashboard HTML `ca-crm (1).html` (77.5 KiB). The initial isolated inspection confirmed filenames only; no modules or approval behavior should be attributed until the JSON is downloaded and safely inspected as data. Stable public attachment route: `https://holly-deposit-2c0.notion.site/internal/file-preview/render/attachment%3Abc0a3d00-4ad2-4b22-9cf7-76928d3197e9%3ACA_Firm_Automation_n8n_workflow.json?cache=v2&name=CA_Firm_Automation_n8n_workflow.json&output=text&table=block&id=3c0fc7b8-a9e2-8065-a562-f80acea4fc63&spaceId=664fc7b8-a9e2-81b0-83c9-0003f74eb594`.

## Indian jewellery showroom automation reference

Source: https://app.notion.com/p/400f7a577f9a802ca56fc866bd3ee2b0

The public page excerpt describes 10:30 daily gold/silver-rate broadcasts; a 24/7 rate/reception helper with estimates including configurable making charge and the source’s 3% GST assumption; 11:00 Asia/Kolkata scheme reminders two days before the due date; showroom booking; and a live showroom console. It names n8n with Asia/Kolkata timezone, a Google Spreadsheet with `Rates`, `Subscribers`, `Scheme`, `Visits` tabs; Meta WhatsApp Cloud API; and OpenAI `gpt-4o-mini`. The source excerpt defines `Rates(date, gold_22k, gold_24k, silver)`, `Subscribers(name, phone, opted_in)`, and `Scheme(name, phone, monthly_amount, paid_months, total_months, next_due)`. This is not yet verified as a full workflow import or connected dashboard; remaining `Visits` columns are not visible in the inspected excerpt. The product uses a manual/owner-maintained ratebook, strict `opted_in=yes` checks, no automated live broadcast/reminders, and an estimate disclaimer. The 3% tax assumption must be independently checked by each showroom/accountant; it is not Aria tax advice.

## Indian voice-provider facts already checked

Official Sarvam number setup: https://docs.sarvam.ai/voice-agents/deploy/telephony/rent-from-sarvam. Sarvam says its provider account catalog determines number pricing, the rental is 30 calendar days and auto-renews unless released; inbound deployment and BYO telephony are distinct paths.

Official Sarvam price card read 21 October 2026: https://www.sarvam.ai/products/voice-agents/pricing. It lists ₹3.50/min pay-as-you-go AI-agent usage; ₹0.20 per 30-second pulse for native telephony on Sarvam-rented numbers; and ₹59 per number per 30 days for listed number series. It states prices exclude GST, call pulses round up to whole minutes for agent usage, and charges are separate. These should not be combined into one number or guaranteed quote.

Official Bolna number purchasing: https://www.bolna.ai/docs/buying-phone-numbers. Official compliance guide: https://www.bolna.ai/docs/compliance-application/introduction. It describes a provider compliance application before purchase and lists company identity/CIN and GST documents. Documents belong in the provider’s own secure portal, not Aria’s public form. Plans, rates, KYC outcomes and number availability require direct confirmation with each provider.
