import { describe, it, expect } from "vitest";
import type { GovernanceEvidenceSpecification } from "../../packages/semantiq/src/governance-evidence-integration.js";
import { GovernanceEvidenceIntegrationEngine } from "../../packages/semantiq/src/governance-evidence-integration.js";

describe("Governance Evidence Integration (Prompt 10.10)", () => {
  const engine = new GovernanceEvidenceIntegrationEngine();

  const spec: GovernanceEvidenceSpecification = {
    specVersion: "v1.0.0",
    phase: "Phase 10",
    isFrozen: true
  };

  it("approves compliant integration verification", () => {
    const res = engine.verifyIntegration(spec, true, true);
    expect(res.report.status).toBe("PASSED");
    expect(res.report.verdict).toBe("PHASE 10 PASSED — PHASE 10.5 AUTHORIZED");
    expect(res.failure).toBeUndefined();
  });

  it("detects backward incompatibility failure", () => {
    const res = engine.verifyIntegration(spec, false, true);
    expect(res.report.status).toBe("FAILED");
    expect(res.failure).toBeDefined();
    expect(res.failure?.failureClass).toBe("backward_incompatibility");
  });

  it("detects boundary violation failure", () => {
    const res = engine.verifyIntegration(spec, true, false);
    expect(res.report.status).toBe("FAILED");
    expect(res.failure).toBeDefined();
    expect(res.failure?.failureClass).toBe("boundary_violation");
  });

  it("detects unfrozen contract drift failure", () => {
    const unfrozenSpec: GovernanceEvidenceSpecification = {
      ...spec,
      isFrozen: false
    };
    const res = engine.verifyIntegration(unfrozenSpec, true, true);
    expect(res.report.status).toBe("FAILED");
    expect(res.failure).toBeDefined();
    expect(res.failure?.failureClass).toBe("contract_drift");
  });
});
