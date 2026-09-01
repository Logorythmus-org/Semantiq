import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Prompt 06 — Contributor Journey", () => {
  it("routes visitors from public navigation to the canonical contributor guide", () => {
    expect(readFileSync("README.md", "utf8")).toContain("[Contributing](CONTRIBUTING.md)");
    expect(readFileSync("Docs/DOCUMENTATION_INDEX.md", "utf8")).toContain(
      "[Contributor Guide](../CONTRIBUTING.md)"
    );
  });

  it("distinguishes bounded Fast contributions from rigorous Core changes", () => {
    const guide = readFileSync("CONTRIBUTING.md", "utf8");

    expect(guide).toContain("## Fast contribution path");
    expect(guide).toContain("## Core change path");
    expect(guide).toContain("No Spec-Kit record, backlog ID, RFC, or prior issue is required");
    expect(guide).toContain("Branch protection and [CODEOWNERS](.github/CODEOWNERS) apply");
    expect(guide).toContain("benchmark semantics");
    expect(guide).toContain("scientific claims");
    expect(guide).toContain("security-sensitive behavior");
  });

  it("keeps Core review gates while giving Fast reports a usable entry point", () => {
    const template = readFileSync(".github/pull_request_template.md", "utf8");

    expect(template).toContain("**Fast contribution path**");
    expect(template).toContain("**Core change path**");
    expect(template).toContain("## 3. Compatibility & Cross-Language Parity");
    expect(template).toContain("## 4. Security & Privacy Impact");
    expect(template).toContain("## 5. Scientific Methodology & Behavioral Evidence Impact");
    expect(template).toContain("Required CI and CODEOWNER review will not be bypassed");
    expect(existsSync(".github/ISSUE_TEMPLATE/reproduction_report.yml")).toBe(true);
  });
});
