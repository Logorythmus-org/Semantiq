import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Beta Planning & Roadmap Verification", () => {
  it("verifies roadmap and limitations docs exist", () => {
    expect(existsSync("docs/project/roadmap.md")).toBe(true);
    expect(existsSync("docs/project/limitations.md")).toBe(true);
  });
});
