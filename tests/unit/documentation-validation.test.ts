import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Prompt 7.2 — Documentation Validation Verification", () => {
  it("verifies master documentation index and key guide files exist", () => {
    expect(existsSync("Docs/DOCUMENTATION_INDEX.md")).toBe(true);
    expect(existsSync("Docs/DOCUMENTATION_VALIDATION_REPORT.md")).toBe(true);
    expect(existsSync("Docs/QUICK_START.md")).toBe(true);
    expect(existsSync("Docs/FAQ.md")).toBe(true);
  });
});
