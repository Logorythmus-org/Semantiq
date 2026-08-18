import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Prompt 7.2 — Documentation Validation Verification", () => {
  it("verifies master documentation index and key guide files exist", () => {
    expect(existsSync("Docs/DOCUMENTATION_INDEX.md")).toBe(true);
    expect(existsSync("Docs/DOCUMENTATION_VALIDATION_REPORT.md")).toBe(true);
    expect(existsSync("Docs/QUICK_START.md")).toBe(true);
    expect(existsSync("Docs/FAQ.md")).toBe(true);
    expect(existsSync("scripts/build-docs.mjs")).toBe(true);
  });

  it("verifies all 13 scalable documentation areas exist", () => {
    const areas = [
      "getting-started", "concepts", "architecture", "benchmarks",
      "evidence", "research", "governance", "partners", "api",
      "sdk", "security", "releases", "adr"
    ];
    for (const area of areas) {
      expect(existsSync(`Docs/${area}/README.md`)).toBe(true);
    }
  });

  it("verifies static documentation site generated output", () => {
    expect(existsSync("dist/docs/index.html")).toBe(true);
    expect(existsSync("dist/docs/getting-started/index.html")).toBe(true);
    expect(existsSync("dist/docs/architecture/index.html")).toBe(true);
    expect(existsSync("dist/docs/evidence/index.html")).toBe(true);
    expect(existsSync("dist/docs/sdk/index.html")).toBe(true);
  });
});
