import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Alpha Stabilization Verification", () => {
  it("verifies project limitations and diagnostics", () => {
    expect(existsSync("docs/project/limitations.md")).toBe(true);
    expect(existsSync("docs/getting-started/installation.md")).toBe(true);
  });
});
