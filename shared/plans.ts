/**
 * Subscription plans for the Aria "we install it, it runs" model.
 *
 * Every plan has two prices:
 *  - a ONE-TIME installation fee (we build, connect, embed, and test), and
 *  - a monthly subscription (everything keeps running, improving, and
 *    never loses a contact).
 *
 * Plans are billed through Dodo Payments.
 */
export type Plan = {
  id: string;
  name: string;
  tagline: string;
  /** One-time installation fee in whole USD. */
  installFee: number;
  /** Monthly price in whole USD (test/draft pricing until the owner enables live mode). */
  monthlyPrice: number;
  features: string[];
  badge?: string;
  popular?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "One core automation, installed and running for you.",
    installFee: 149,
    monthlyPrice: 29,
    features: [
      "1 active automation installed end to end",
      "Website widget or Aria portal — your choice",
      "Enquiry capture with replies and follow-ups",
      "Email support within 1 business day",
      "Workflow run log and monthly summary",
      "Swap your active workflow once per quarter",
    ],
  },
  {
    id: "business",
    name: "Growing Business",
    tagline:
      "Replies, follow-ups, and bookings — automated for your category.",
    installFee: 249,
    monthlyPrice: 79,
    badge: "Most popular",
    popular: true,
    features: [
      "3 active automations installed end to end",
      "Website widget AND your Aria portal",
      "Never lose a contact: capture + qualification + follow-up",
      "Monthly optimization review with the agency",
      "Priority support within 4 business hours",
      "Additional workflow included every quarter",
    ],
  },
  {
    id: "office-max",
    name: "Office Max",
    tagline: "Every workflow, every channel, fully managed.",
    installFee: 499,
    monthlyPrice: 199,
    features: [
      "Unlimited active automations installed",
      "Everything in Growing Business, across every channel",
      "Dedicated onboarding and quarterly business reviews",
      "Same-day support during business hours",
      "Custom workflow built for your office each quarter",
      "Access to every new kit published by Aria",
    ],
  },
];

export const getPlan = (id: string): Plan | undefined =>
  PLANS.find(plan => plan.id === id);
