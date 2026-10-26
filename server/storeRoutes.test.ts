import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resolveApprovedOrigin,
  runSyntheticDemo,
  serializeOrder,
  validateInquiryInput,
} from "./storeRoutes";

afterEach(() => vi.unstubAllEnvs());

describe("store input and safety guards", () => {
  it("does not expose subscription or installation rows as kit downloads", () => {
    const order = {
      id: "order-1",
      createdAt: new Date(),
      status: "paid",
      items: JSON.stringify(["plan:business", "install:business", "front-office"]),
      amount: 42800,
      currency: "USD",
    } as any;
    expect(serializeOrder(order).downloads).toEqual([
      "/api/store/download/order-1/front-office",
    ]);
  });

  it("requires consent and rejects oversized inquiry fields", () => {
    const base = {
      name: "A",
      email: "owner@example.com",
      business: "DemoCare",
      industry: "healthcare",
      automation: "front-office",
      tools: "n8n",
      goals: "Organize enquiry handoffs",
      consent: true,
    };
    expect(validateInquiryInput({ ...base, consent: false })).toMatchObject({
      ok: false,
    });
    expect(
      validateInquiryInput({ ...base, goals: "x".repeat(6001) })
    ).toMatchObject({ ok: false });
    expect(validateInquiryInput(base)).toMatchObject({ ok: true });
    expect(
      validateInquiryInput({ ...base, industry: "invented" })
    ).toMatchObject({ ok: false });
    expect(
      validateInquiryInput({ ...base, automation: "not-a-product" })
    ).toMatchObject({ ok: false });
  });

  it("accepts structured support selections and defaults to scope-only", () => {
    const base = {
      name: "A",
      email: "owner@example.com",
      business: "DemoCare",
      industry: "healthcare",
      automation: "front-office",
      tools: "n8n",
      goals: "Organize enquiry handoffs",
      consent: true,
    };
    expect(validateInquiryInput(base)).toMatchObject({
      ok: true,
      value: { supportOption: "scope-only" },
    });
    expect(
      validateInquiryInput({
        ...base,
        supportOption: "installation-api",
        location: "London",
        country: "United Kingdom",
        timezone: "Europe/London",
        languages: "English, French",
        ownerRole: "Operations lead",
        apiProviders: "Stripe API docs; Google Maps API docs",
      })
    ).toMatchObject({
      ok: true,
      value: {
        supportOption: "installation-api",
        location: "London",
        apiProviders: "Stripe API docs; Google Maps API docs",
      },
    });
  });

  it("rejects invalid support selections, field lengths, timezones, and secrets", () => {
    const base = {
      name: "A",
      email: "owner@example.com",
      business: "DemoCare",
      industry: "healthcare",
      automation: "front-office",
      tools: "n8n",
      goals: "Organize enquiry handoffs",
      consent: true,
    };
    expect(
      validateInquiryInput({ ...base, supportOption: "custom" })
    ).toMatchObject({ ok: false, error: "Choose a supported support option." });
    expect(
      validateInquiryInput({ ...base, location: "x".repeat(181) })
    ).toMatchObject({ ok: false, error: "location is invalid." });
    expect(
      validateInquiryInput({ ...base, timezone: "not/a-timezone" })
    ).toMatchObject({ ok: false, error: "timezone is invalid." });
    const secret = "sk-live-1234567890abcdef";
    const result = validateInquiryInput({
      ...base,
      goals: `Please configure api_key=${secret}`,
    });
    expect(result).toMatchObject({ ok: false });
    expect(result).not.toHaveProperty("error", expect.stringContaining(secret));
    expect(result).toMatchObject({
      error:
        "Enter credentials directly in your client-owned vault, not this form.",
    });
  });

  it("only accepts configured origins for checkout redirects", () => {
    vi.stubEnv("APPROVED_SITE_ORIGIN", "https://aria.example");
    const req = { headers: { origin: "https://evil.example" } } as any;
    expect(resolveApprovedOrigin(req, "https://evil.example")).toBeNull();
    expect(
      resolveApprovedOrigin(
        { headers: { origin: "https://aria.example" } } as any,
        "https://aria.example"
      )
    ).toBe("https://aria.example");
    expect(
      resolveApprovedOrigin(
        { headers: { origin: "https://evil.example" } } as any,
        "https://aria.example"
      )
    ).toBeNull();
  });

  it("keeps clinical demos in human review and never interprets results", async () => {
    const result = await runSyntheticDemo("clinical-review", "standard");
    expect(result.status).toBe("human-review");
    expect(result.aiPowered).toBe(false);
    expect(result.output).toMatchObject({
      clinicalInterpretation: false,
      humanReviewRequired: true,
    });
    expect(result.steps.some(step => step.status === "skipped")).toBe(true);
  });

  it("stops duplicate no-show follow-up", async () => {
    const result = await runSyntheticDemo("no-show", "duplicate");
    expect(result.status).toBe("human-review");
    expect(result.output).toMatchObject({
      appointmentStatus: "no-show",
      duplicateDetected: true,
    });
  });
});

describe("hospital demo lifecycle", () => {
  it("uses an approved date and supplied feedback to create an owned service-recovery draft", async () => {
    const result = await runSyntheticDemo("discharge", "standard");
    expect(result.output).toMatchObject({
      approvedFollowup: true,
      outboundAction: false,
      clinicalInterpretation: false,
      task: { dueDate: "2026-11-07", owner: "DemoCare coordinator" },
      serviceRecoveryTask: {
        owner: "DemoCare service-recovery coordinator",
        status: "draft",
      },
    });
    expect(
      result.steps.some(s => s.label === "Prepare service-recovery handoff")
    ).toBe(true);
  });
  it("stops downstream follow-up stages without an approved instruction", async () => {
    const result = await runSyntheticDemo("discharge", "duplicate");
    expect(result.status).toBe("skipped");
    expect(result.output).toMatchObject({
      task: null,
      serviceRecoveryTask: null,
      feedback: null,
    });
  });
  it("prepares only an approved administrative diagnostic notification", async () => {
    const result = await runSyntheticDemo("diagnostic", "standard");
    expect(result.output).toMatchObject({
      clinicalInterpretation: false,
      outboundAction: false,
    });
    expect(result.output.patientMessageDraft).toContain(
      "administrative coordinator"
    );
    const duplicate = await runSyntheticDemo("diagnostic", "duplicate");
    expect(duplicate.output.patientMessageDraft).toBeNull();
  });
});

describe("credential-free inquiry regressions", () => {
  it("rejects reviewed client_secret, password, generic-secret, signed URLs and basic-auth URLs without echoing them", () => {
    const base = {
      name: "Demo",
      email: "demo@example.test",
      business: "Demo Firm",
      industry: "professional",
      automation: "front-office",
      tools: "API setup",
      goals: "Configure a documented client workflow",
      consent: true,
    };
    for (const value of [
      "client_secret=abcdefghijklmnop",
      "password=abcdefghijklmnop",
      "secret: abcdefghijklmnop",
      "https://user:password@example.com/docs",
      "https://example.com/docs?access_token=abcdefghijklmnop",
      "https://example.com/docs?X-Amz-Signature=abcdefghijklmnop",
    ]) {
      const r = validateInquiryInput({ ...base, apiProviders: value });
      expect(r).toEqual({
        ok: false,
        error:
          "Enter credentials directly in your client-owned vault, not this form.",
      });
    }
    expect(
      validateInquiryInput({
        ...base,
        apiProviders:
          "Public API docs: https://example.com/docs/api; provider name: Demo CRM",
      }).ok
    ).toBe(true);
  });
});
