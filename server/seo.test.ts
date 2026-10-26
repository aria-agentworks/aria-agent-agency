import { describe, it, expect } from "vitest";
import { getPageContent, publicPaths, escapeHtml } from "../shared/pageContent";
import { automations } from "../shared/catalog";
describe("public page content", () => {
  it("renders every catalog detail with package requirements and draft prices", () => {
    for (const item of automations) {
      const page = getPageContent(`/automations/${item.id}`);
      expect(page.missing).toBeUndefined();
      expect(page.heading).toBe(item.name);
      expect(page.body).toContain("Before you connect it");
      expect(page.body).toContain("Draft test price");
    }
  });
  it("returns a real missing result for unknown and extra path segments", () => {
    expect(getPageContent("/automations/unknown").missing).toBe(true);
    expect(getPageContent("/automations/front-office/extra").missing).toBe(
      true
    );
    expect(getPageContent("/unknown").noindex).toBe(true);
  });
  it("keeps authenticated records out of indexable content", () => {
    expect(getPageContent("/orders").noindex).toBe(true);
    expect(getPageContent("/admin").noindex).toBe(true);
    expect(publicPaths).not.toContain("/orders");
    expect(publicPaths).not.toContain("/admin");
    expect(getPageContent("/admin").body).not.toContain("customerEmail");
  });
  it("escapes HTML in metadata and supplied content", () => {
    expect(escapeHtml('<script>"x" & y</script>')).toBe(
      "&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;"
    );
  });
});
