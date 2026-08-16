import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Release Candidate Verification (Prompt 6.15)", () => {
  it("verifies CITATION.cff exists and specifies valid version", () => {
    expect(existsSync("CITATION.cff")).toBe(true);
    const content = readFileSync("CITATION.cff", "utf-8");
    expect(content).toContain('version: "0.1.0-alpha.1"');
    expect(content).toContain('license: "MIT"');
  });

  it("verifies release candidate documentation files exist", () => {
    expect(existsSync("Docs/FINAL_RELEASE_CANDIDATE_REPORT.md")).toBe(true);
    expect(existsSync("Docs/FULL_TEST_AND_QUALITY_GATE_REPORT.md")).toBe(true);
    expect(existsSync("Docs/GITHUB_RELEASE_DRAFT.md")).toBe(true);
    expect(existsSync("Docs/ARTIFACT_CHECKSUMS.md")).toBe(true);
    expect(existsSync("Docs/GO_NO_GO_DECISION.md")).toBe(true);
    expect(existsSync("Docs/PHASE_7_HANDOFF.md")).toBe(true);
  });

  it("verifies GO decision document declares explicit GO decision", () => {
    const content = readFileSync("Docs/GO_NO_GO_DECISION.md", "utf-8");
    expect(content).toContain("# DECISION: GO");
    expect(content).toContain("v0.1.0-alpha.1");
  });
});
