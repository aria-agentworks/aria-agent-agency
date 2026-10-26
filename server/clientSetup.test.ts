import { describe, it, expect } from "vitest";
import { automations } from "../shared/catalog";
import {
  getIntegrationPlan,
  clientSetupTemplate,
} from "../shared/integrationPlans";
import { getWorkflowContract } from "../shared/workflowContracts";
import { getPageContent, publicPaths } from "../shared/pageContent";
import { supportOptions } from "../shared/supportOptions";
describe("per-product setup contract", () => {
  it("keeps each product separately identified, priced, and documented", () => {
    expect(new Set(automations.map(x => x.id)).size).toBe(automations.length);
    expect(new Set(automations.map(x => x.bundle)).size).toBe(
      automations.length
    );
    for (const a of automations) {
      expect(a.price).toBeGreaterThan(0);
      expect(getIntegrationPlan(a).length).toBeGreaterThan(0);
      expect(getWorkflowContract(a).trigger).toBeTruthy();
      expect(getWorkflowContract(a).action).toBeTruthy();
      const setup = getPageContent(`/automations/${a.id}/setup`);
      expect(setup.missing).not.toBe(true);
      expect(setup.body).toContain("Credentials vault");
      expect(setup.heading).toContain(a.name);
      for (const api of getIntegrationPlan(a)) {
        expect(setup.body).toContain(api.label);
        expect(setup.body).toContain("Credential destination:");
      }
    }
  });
  it("has safe client configuration with no API-secret values or activation", () => {
    for (const a of automations) {
      const c = clientSetupTemplate(a);
      expect(c.enabled).toBe(false);
      expect(c.workflow.require_human_approval).toBe(true);
      expect(c.integrations.every(x => x.credential_values_excluded)).toBe(
        true
      );
      expect(c.integrations.every(x => x.provider === "")).toBe(true);
      expect(c.notes).toContain("Never store API keys");
    }
  });
  it("returns an exact missing guide and not a product fallback", () => {
    expect(getPageContent("/automations/not-a-kit/setup").missing).toBe(true);
    expect(getPageContent("/automations/lead-engine/setup/extra").missing).toBe(
      true
    );
  });
  it("keeps service choices additional/quoted rather than purchasable workflow items", () => {
    expect(supportOptions.map(x => x.id)).toEqual([
      "scope-only",
      "installation",
      "installation-api",
      "managed-api",
    ]);
    expect(
      supportOptions.some(
        x => x.id === "managed-api" && x.price.includes("quote")
      )
    ).toBe(true);
  });
});
