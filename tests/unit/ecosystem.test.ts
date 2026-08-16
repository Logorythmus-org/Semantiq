import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("External Benchmark Ecosystem Verification", () => {
  it("verifies ecosystem files on disk", () => {
    expect(existsSync("examples/ecosystem/benchmark-registry.json")).toBe(true);
    expect(existsSync("examples/ecosystem/external-benchmark-pack.json")).toBe(true);
    expect(existsSync("docs/integrations/custom-adapters.md")).toBe(true);
  });
});
