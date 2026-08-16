import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Release Candidate Integrity", () => {
  it("verifies release documentation integrity", () => {
    expect(existsSync("docs/project/roadmap.md")).toBe(true);
    expect(existsSync("docs/README.md")).toBe(true);
  });
});
