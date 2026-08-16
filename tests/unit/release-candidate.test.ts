import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Release Candidate & Baseline Verification", () => {
  it("verifies release documentation files exist in curated docs", () => {
    expect(existsSync("docs/project/roadmap.md")).toBe(true);
    expect(existsSync("docs/project/limitations.md")).toBe(true);
    expect(existsSync("CHANGELOG.md")).toBe(true);
  });

  it("verifies baseline version declaration in roadmap and changelog", () => {
    const roadmap = readFileSync("docs/project/roadmap.md", "utf-8");
    expect(roadmap).toContain("v0.1.0-alpha.1");
  });
});
