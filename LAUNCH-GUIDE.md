# Aria Agent Agency — Launch & Growth Playbook

You asked: *"suggestions what more to add to start doing sales and marketing —
cover all possible automation suitable for any office, subscribe and start
using with simple installation."*

Here is what was **built into the product today**, what is **ready to switch
on**, and a **90-day plan** to go from launch to repeatable sales.

---

## 1. What you already have (built today)

| Capability | Where | Why it sells |
| --- | --- | --- |
| Dodo Payments (merchant of record) | `/api/dodo/*`, `/admin` sync button | Global cards + UPI, taxes & invoices handled for you |
| Subscriptions | `/pricing`, Starter $29 · Business $79 · Office Max $199 | Recurring revenue instead of one-off sales |
| One-time kit purchases | `/automations` → cart → checkout | Low-friction entry product |
| Lead magnet | Footer + homepage: free “50 AI Automation Systems” playbook PDF | Captures emails from day one |
| Newsletter + unsubscribe | `newsletter_subscribers` table | Your owned audience — no ad platform needed |
| First-party analytics | `marketing_events` (page views, signups, checkout starts, promo usage) | See the funnel without GA4 cookie banners |
| Promo codes | `promo_codes` + cart UI + Dodo native discounts | Launch offers, partner codes, seasonal sales |
| Admin console | `/admin` — revenue, plans, subscribers, events, inquiries | Daily sales standup in one screen |
| Standalone auth | `/login` (email + password) | No platform lock-in; deploy anywhere |
| SEO | sitemap, robots, per-route OG/Twitter meta | Free organic leads accumulate over time |
| Trust content | `/how-it-works`, `/faq`, guardrails, synthetic demo | Converts cautious business buyers |

## 2. Positioning: “subscribe and start using” for ANY office

Your 13 kits already cover: front office, healthcare, dental, hospitals,
realestate, CA/accounting, jewellery/gold showroom, support, lead-gen, local
site leadgen, reputation, voice front desk, daily operations.

**Package them as the subscription promises, not as files.** The plans
already say this — reinforce it everywhere:

- Starter = “one workflow running every day” (pick any 1 kit)
- Business = “3 workflows + monthly optimization review”
- Office Max = “everything + a custom build each quarter”

Recommended site tweak (later): on `/pricing`, let subscribers *choose their
included kits* after checkout instead of treating kits and plans as separate
worlds. The `store_subscriptions` table is ready for entitlement checks.

## 3. Sales channels to add next (highest ROI first)

1. **WhatsApp Business + click-to-chat** (India-first). Put a floating
   WhatsApp button on every page. Your buyers are office owners — WhatsApp
   closes faster than email. Track `whatsapp_click` as a funnel event.
2. **Google Business Profile + local landing pages.** You have
   `local-site-leadgen` — use your own tool on your own city: one page per
   city × industry (“dental clinic automation in Chennai”). `pageContent.ts`
   makes new SEO pages a 10-line change.
3. **LinkedIn founder-led content.** Post one “we automated X for an office”
   breakdown per week using each kit’s `outcomes` list. Link to the kit page.
4. **Partner/affiliate codes.** Promo codes are already tracked — hand
   `CA10`/`AGENCY20`-style codes to CAs, dental suppliers, IT vendors who
   serve your buyers. Pay 10–20% via Dodo payouts.
5. **Cold outreach with your own kit.** The `local-site-leadgen` analyzer is
   literally a “find businesses with weak websites” tool. Run it on your city,
   send 10 personalized emails/day using the included template.

## 4. Email automation sequences to run (with any ESP)

You have subscribers + purchases in SQLite — export or sync them:

1. **Day 0** — deliver playbook + one-question reply prompt (“what eats most
   of your team’s time?”). Replies = hottest leads.
2. **Day 2 / 5 / 9** — one kit story per email (problem → workflow → KPI).
3. **Day 14** — case-study style recap + WELCOME10 promo (already live in the
   cart) with a deadline.
4. **Post-purchase (day 0/3/14)** — setup nudge, first-value checklist, then
   upsell: “kit buyers get 50% off their first month of Business plan.”
5. **Subscription lifecycle** — renewal thanks, quarterly optimization review
   invite (this IS the Business plan’s promise — it also churns less).

## 5. Conversion mechanics to layer in

- **Live “who it’s for” proof**: short Loom-style videos per kit page
  (screen-record the synthetic demo — it exists at `/demo`).
- **Exit-intent offer**: 10% code shown once when the cursor leaves the cart
  page. (Analytics hook is ready; add any lightweight exit-intent script.)
- **Abandoned-cart capture**: ask for email before payment on the cart (the
  checkout session already stores `customerEmail` on the order — add a “remind
  me” endpoint when ready).
- **Annual plans**: add `Office Max yearly` as a 10-months-for-12 Dodo product
  — same `shared/plans.ts` + provisioning, big cash-flow win.
- **Usage-based add-ons**: installation-only, installation+API, managed API
  (already scoped as `supportOption`) — quote them automatically in the
  inquiry confirmation email.

## 6. Operations: your own product is your best automation

Run your agency on the same stack (this is the story buyers love):

- New inquiry → auto-draft reply → task for you (kit #1 pattern).
- Payment webhook → WhatsApp “welcome + setup slot booking” message.
- Monthly revenue/summary report → generated and emailed to yourself
  (kit: Report Generator).
- Newsletter → monthly “what shipped” digest (Content Repurposer pattern).

## 7. Compliance guardrails (keep them — they are a sales asset)

- Keep prices `draft/test` until final terms are set (the store enforces this
  for Stripe live keys; keep the same discipline on Dodo live mode).
- Healthcare/dental content already avoids clinical claims — preserve that.
- Never automate tax rates, legal reviews, or clinical decisions — the kits
  and copy already say humans stay accountable.

## 8. Suggested 90-day sequence

- **Weeks 1–2**: Dodo live keys, real prices, 3 Loom videos, WhatsApp button.
- **Weeks 3–6**: 2 SEO pages/week, weekly LinkedIn post, email sequence live,
  5 partner codes handed out.
- **Weeks 7–10**: first 10 customers → record 3 short text testimonials →
  publish on homepage (only real ones), launch annual plan.
- **Weeks 11–13**: hire/referral loop, publish 1 new kit per month driven by
  the most common inquiry answer (the `goals` column in your inquiry inbox
  literally tells you what to build next).

**North-star metrics** (already queryable in SQLite): newsletter → checkout
conversion, checkout_started → paid rate, plan MRR, inquiry → call rate.
