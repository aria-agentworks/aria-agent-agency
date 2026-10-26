import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dodoRecoveryMinimumCents,
  dodoRecoverySuggestedPriceCents,
  gatewayStatus,
} from "./dodo";

afterEach(() => vi.unstubAllEnvs());

describe("Dodo readiness", () => {
  it("does not report subscriptions ready without a webhook key", () => {
    vi.stubEnv("DODO_PAYMENTS_API_KEY", "dodo_test_key_123456");
    vi.stubEnv("DODO_WEBHOOK_KEY", "");
    expect(gatewayStatus()).toMatchObject({
      gateway: "dodo",
      subscriptionsReady: false,
      webhookReady: false,
    });
  });

  it("reports subscriptions ready only when both keys exist", () => {
    vi.stubEnv("DODO_PAYMENTS_API_KEY", "dodo_test_key_123456");
    vi.stubEnv("DODO_WEBHOOK_KEY", "whsec_test_key_123456");
    expect(gatewayStatus()).toMatchObject({
      gateway: "dodo",
      subscriptionsReady: true,
      webhookReady: true,
    });
  });

  it("defaults the recovery product to a one-dollar minimum", () => {
    expect(dodoRecoveryMinimumCents()).toBe(100);
    expect(dodoRecoverySuggestedPriceCents()).toBe(100);
  });

  it("keeps the suggested recovery amount above the configured minimum", () => {
    vi.stubEnv("DODO_RECOVERY_MINIMUM_CENTS", "450");
    vi.stubEnv("DODO_RECOVERY_SUGGESTED_PRICE_CENTS", "100");
    expect(dodoRecoveryMinimumCents()).toBe(450);
    expect(dodoRecoverySuggestedPriceCents()).toBe(450);
  });
});
