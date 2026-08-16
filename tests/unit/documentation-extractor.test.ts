import { describe, it, expect } from "vitest";
import { DocumentationExtractorEngine } from "../../packages/semantiq/src/documentation-extractor.js";

describe("Documentation Extraction and Product Truth (Prompt 11.8)", () => {
  const engine = new DocumentationExtractorEngine();

  it("lists all 21 required documentation sections", () => {
    const sections = engine.getRequiredSections();
    expect(sections).toContain("readme");
    expect(sections).toContain("quickstart");
    expect(sections).toContain("architecture");
    expect(sections).toContain("cli");
    expect(sections).toContain("limitations");
    expect(sections).toContain("governance-evidence");
    expect(sections).toContain("citation");
    expect(sections.length).toBe(21);
  });

  it("validates clean section with no forbidden content", () => {
    const result = engine.validateSection(
      "readme",
      "SemantIQ Benchmarks evaluates AI governance evidence independently."
    );
    expect(result.isIncluded).toBe(true);
    expect(result.hasForbiddenContent).toBe(false);
    expect(result.claimsAreVerifiable).toBe(true);
  });

  it("detects premature release claim as forbidden", () => {
    const forbidden = engine.auditDocContent("Phase 12 published and now available on npm.");
    expect(forbidden).toContain("premature-release-claims");
  });

  it("runs full truth audit and passes clean doc set", () => {
    const sections = [
      { section: "readme" as const, content: "SemantIQ Benchmarks is an evaluation framework." },
      { section: "cli" as const, content: "Run: semantiq doctor" },
      { section: "limitations" as const, content: "Does not make legal determinations." }
    ];
    const report = engine.runTruthAudit(sections);
    expect(report.isClean).toBe(true);
    expect(report.passedSections).toBe(3);
    expect(report.forbiddenTopicsFound.length).toBe(0);
  });
});
