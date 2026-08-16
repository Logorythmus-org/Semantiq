import { describe, it, expect } from "vitest";
import { TestHarnessEngine } from "../../packages/semantiq/src/test-harness.js";

describe("Independent Test Harness (Prompt 11.7)", () => {
  const engine = new TestHarnessEngine();

  it("reports all 13 test categories registered", () => {
    const categories = engine.listCategories();
    expect(categories).toContain("unit");
    expect(categories).toContain("integration");
    expect(categories).toContain("contracts");
    expect(categories).toContain("migration");
    expect(categories).toContain("replay");
    expect(categories).toContain("scenarios");
    expect(categories).toContain("boundary");
    expect(categories).toContain("no-egress");
    expect(categories).toContain("cli");
    expect(categories).toContain("smoke");
    expect(categories).toContain("security");
    expect(categories).toContain("packaging");
    expect(categories).toContain("docs");
    expect(categories.length).toBe(13);
  });

  it("validates clean import list with no parent imports or egress", () => {
    const report = engine.validateHarness([
      "./governance-decision.js",
      "./policy-evidence-model.js",
      "vitest"
    ]);
    expect(report.passed).toBe(true);
    expect(report.hasParentImports).toBe(false);
    expect(report.hasNetworkEgress).toBe(false);
    expect(report.hasDeterministicSeed).toBe(true);
  });

  it("detects parent import violation in harness", () => {
    const report = engine.validateHarness(["@tech-club/sprint1-runtime"]);
    expect(report.passed).toBe(false);
    expect(report.hasParentImports).toBe(true);
  });

  it("defaults to no-network-egress and deterministic seed", () => {
    const config = engine.getConfig();
    expect(config.noNetworkEgress).toBe(true);
    expect(config.deterministicSeed).toBe(42);
    expect(config.cleanupOnExit).toBe(true);
  });
});
