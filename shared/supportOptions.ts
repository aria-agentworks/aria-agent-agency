export const supportOptions = [
  {
    id: "scope-only",
    label: "Discuss a scope",
    price: "Quote after discovery",
    description:
      "Tell us the problem and tools. No installation or API fees are charged by submitting this request.",
  },
  {
    id: "installation",
    label: "Install my purchased kit",
    price: "Draft planning estimate: from $199 one-time",
    description:
      "Import/configuration, one agreed source connection, synthetic testing and handover. Final scope and price are confirmed before work; vendor usage is excluded.",
  },
  {
    id: "installation-api",
    label: "Installation + API wiring",
    price: "Draft estimate: installation from $199 + API wiring from $99",
    description:
      "We help connect documented provider APIs and test approval/error paths. Per-connector complexity, vendor account fees and metered usage are quoted separately.",
  },
  {
    id: "managed-api",
    label: "Installation + covered API costs",
    price: "Custom setup + monthly usage-budget quote",
    description:
      "Ask Aria to coordinate approved provider costs and maintenance. Any capped usage allowance, ownership, recurring charges, overages and cancellation terms must be agreed before connection.",
  },
] as const;
export type SupportOption = (typeof supportOptions)[number]["id"];
export function supportLabel(id: string | null | undefined) {
  return supportOptions.find(x => x.id === id)?.label ?? "Discuss a scope";
}
