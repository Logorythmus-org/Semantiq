import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Governance & Truth Verification", () => {
  it("verifies open-source governance and security docs", () => {
    expect(existsSync("docs/project/governance.md")).toBe(true);
    expect(existsSync("docs/security/reporting.md")).toBe(true);
    expect(existsSync("docs/security/privacy.md")).toBe(true);
  });
});
