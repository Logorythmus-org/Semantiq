import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Intellectual Property, Provenance & Rights (Prompt 6.18)", () => {
  it("verifies LICENSE file exists in root directory and contains MIT text", () => {
    expect(existsSync("LICENSE")).toBe(true);
    const content = readFileSync("LICENSE", "utf-8");
    expect(content).toContain("MIT License");
  });

  it("verifies all IP and rights documentation files exist", () => {
    expect(existsSync("Docs/INTELLECTUAL_PROPERTY_FRAMEWORK.md")).toBe(true);
    expect(existsSync("Docs/LICENSE_COMPLIANCE_MATRIX.md")).toBe(true);
    expect(existsSync("Docs/PROVENANCE_AND_AUTHORSHIP.md")).toBe(true);
    expect(existsSync("Docs/THIRD_PARTY_NOTICES.md")).toBe(true);
    expect(existsSync("Docs/TRADEMARK_AND_BRANDING.md")).toBe(true);
    expect(existsSync("Docs/CONTRIBUTOR_LICENSE_AGREEMENT.md")).toBe(true);
    expect(existsSync("Docs/ARTIFACT_RIGHTS_SUMMARY.md")).toBe(true);
  });

  it("verifies DCO 1.1 text in contributor agreement", () => {
    const dcoContent = readFileSync("Docs/CONTRIBUTOR_LICENSE_AGREEMENT.md", "utf-8");
    expect(dcoContent).toContain("Developer Certificate of Origin (DCO 1.1)");
  });
});
