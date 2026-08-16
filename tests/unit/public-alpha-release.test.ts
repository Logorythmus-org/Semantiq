import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Prompt 7.1 — GitHub Public Alpha Release Verification", () => {
  it("verifies repository URL in README.md, CITATION.cff, and codemeta.json", () => {
    const readme = readFileSync("README.md", "utf-8");
    const cff = readFileSync("CITATION.cff", "utf-8");
    const codemeta = JSON.parse(readFileSync("codemeta.json", "utf-8")) as {
      codeRepository: string;
    };

    expect(readme).toContain("https://github.com/Semant-iq/Semantiq.git");
    expect(cff).toContain("https://github.com/Semant-iq/Semantiq.git");
    expect(codemeta.codeRepository).toEqual("https://github.com/Semant-iq/Semantiq.git");
  });
});
