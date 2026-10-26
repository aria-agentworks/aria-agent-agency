import { describe, expect, it } from "vitest";
import { assertPublicHttpUrl, isBlockedAddress } from "./publicFetch";

describe("public website fetch guard", () => {
  it("blocks private and loopback addresses", () => {
    expect(isBlockedAddress("127.0.0.1")).toBe(true);
    expect(isBlockedAddress("10.0.0.4")).toBe(true);
    expect(isBlockedAddress("192.168.1.10")).toBe(true);
    expect(isBlockedAddress("::1")).toBe(true);
  });

  it("rejects localhost before any network request", async () => {
    await expect(assertPublicHttpUrl("http://localhost:3000")).rejects.toThrow(
      "Private hostnames are not allowed."
    );
  });

  it("rejects credentials embedded in a URL", async () => {
    await expect(assertPublicHttpUrl("https://user:pass@example.com")).rejects.toThrow(
      "Only public HTTP(S) URLs are allowed."
    );
  });
});
