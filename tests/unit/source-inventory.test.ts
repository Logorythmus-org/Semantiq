import { describe, it, expect } from "vitest";
import { SemantIQSourceInventoryEngine } from "../../packages/semantiq/src/source-inventory.js";

describe("SemantIQ Source Inventory Freeze (Prompt 11.1)", () => {
  const engine = new SemantIQSourceInventoryEngine();

  it("classifies public core source path correctly", () => {
    const item = engine.classifyPath("packages/semantiq/src/policy-evidence-model.ts", true);
    expect(item.classification).toBe("PUBLIC_CORE");
    expect(item.owningPackage).toBe("@semantiq/semantiq");
    expect(item.licenseStatus).toBe("MIT");
  });

  it("classifies public test path correctly", () => {
    const item = engine.classifyPath("tests/unit/policy-evidence-model.test.ts", true);
    expect(item.classification).toBe("PUBLIC_TEST");
  });

  it("classifies public documentation path correctly", () => {
    const item = engine.classifyPath("Docs/phase-10/POLICY_EVIDENCE_MODEL.md", true);
    expect(item.classification).toBe("PUBLIC_DOCUMENTATION");
  });

  it("classifies parent-only workspace path correctly", () => {
    const item = engine.classifyPath("packages/sprint1-runtime/src/index.ts", false);
    expect(item.classification).toBe("PARENT_ONLY");
    expect(item.licenseStatus).toBe("Internal");
  });

  it("generates source inventory summary correctly", () => {
    const items = [
      engine.classifyPath("packages/semantiq/src/policy-evidence-model.ts", true),
      engine.classifyPath("tests/unit/policy-evidence-model.test.ts", true),
      engine.classifyPath("packages/sprint1-runtime/src/index.ts", false)
    ];

    const summary = engine.generateSummary(items);
    expect(summary.totalItemsCount).toBe(3);
    expect(summary.publicItemsCount).toBe(2);
    expect(summary.parentOnlyItemsCount).toBe(1);
    expect(summary.unresolvedItemsCount).toBe(0);
  });
});
