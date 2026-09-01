import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Prompt 7.1 — GitHub Public Alpha Release Verification", () => {
  it("verifies repository URL in README.md, CITATION.cff, and codemeta.json", () => {
    const canonicalRepository = "https://github.com/Logorythmus-org/Semantiq.git";
    const readme = readFileSync("README.md", "utf-8");
    const cff = readFileSync("CITATION.cff", "utf-8");
    const codemeta = JSON.parse(readFileSync("codemeta.json", "utf-8")) as {
      codeRepository: string;
    };

    expect(readme).toContain(canonicalRepository);
    expect(cff).toContain(`repository-code: "${canonicalRepository}"`);
    expect(codemeta.codeRepository).toBe(canonicalRepository);
  });

  it("states the Public Alpha maturity and evidence boundaries", () => {
    const readme = readFileSync("README.md", "utf-8");

    expect(readme).toContain("SemantIQ `0.1.0-alpha.2` is **Public Alpha (Experimental)**");
    for (const evidenceState of [
      "IMPLEMENTED",
      "INTERNALLY VALIDATED",
      "EXTERNALLY REPLICATED",
      "NOT YET VALIDATED"
    ]) {
      expect(readme).toContain(`**${evidenceState}**`);
    }

    expect(readme).toContain(
      "Clean-room execution within the project environment is not independent replication."
    );
    expect(readme).toContain("No independent third-party replication or audit has been verified");
    expect(readme).toContain("not production-ready");
    expect(readme).toContain("not a certification authority");
  });
});
