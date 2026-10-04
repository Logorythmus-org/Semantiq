import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Public release surface", () => {
  it("verifies CITATION.cff exists and specifies the current software version", () => {
    expect(existsSync("CITATION.cff")).toBe(true);
    const content = readFileSync("CITATION.cff", "utf-8");
    expect(content).toContain('version: "0.1.0-alpha.2"');
    expect(content).toContain('license: "MIT"');
  });

  it("verifies canonical release documentation exists", () => {
    expect(existsSync("CHANGELOG.md")).toBe(true);
    expect(existsSync("RELEASE_NOTES.md")).toBe(true);
    expect(existsSync("Docs/VERSIONING_POLICY.md")).toBe(true);
    expect(existsSync("Docs/KNOWN_LIMITATIONS.md")).toBe(true);
  });

  it("keeps the public maturity boundary explicit", () => {
    const limitations = readFileSync("Docs/KNOWN_LIMITATIONS.md", "utf-8");
    expect(limitations).toContain("Public Alpha (Experimental)");
    expect(limitations).toContain("not presented as production-ready");
    expect(limitations).toContain("0.1.0-alpha.2");
  });
});
