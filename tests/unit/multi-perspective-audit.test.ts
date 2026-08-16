import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Multi-Perspective Audit & Methodology Verification", () => {
  it("verifies core benchmark methodology and evidence specs exist", () => {
    expect(existsSync("docs/benchmarks/methodology.md")).toBe(true);
    expect(existsSync("docs/benchmarks/anti-gaming.md")).toBe(true);
    expect(existsSync("docs/evidence/provenance.md")).toBe(true);
  });
});
