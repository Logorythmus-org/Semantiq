import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Public Feedback & Disputes Verification", () => {
  it("verifies public feedback and dispute docs exist", () => {
    expect(existsSync("docs/evidence/disputes.md")).toBe(true);
    expect(existsSync("docs/project/governance.md")).toBe(true);
  });
});
