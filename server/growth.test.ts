import { describe, expect, it } from "vitest";
import { buildEmailSequence, getNiche } from "../shared/growth";

describe("Growth Engine copy safeguards", () => {
  it("uses a testable process example instead of an unsupported customer case study", () => {
    const niche = getNiche("dental");
    expect(niche).toBeTruthy();
    const sequence = buildEmailSequence(
      niche!,
      { business: "Example Dental", ownerName: "there", city: "Mumbai", agentName: "Aria" },
      "Activate static website"
    );
    expect(sequence[1].body).toContain("pattern we would test");
    expect(sequence[1].body).not.toContain("A clinic we work with");
  });
});
