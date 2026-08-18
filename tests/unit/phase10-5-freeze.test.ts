import { describe, it, expect } from "vitest";
import type {
  Phase10_5CompletionReport,
  Phase11ReadinessRecord
} from "../../packages/semantiq/src/phase10-5-freeze.js";
import { Phase10_5FreezeEngine } from "../../packages/semantiq/src/phase10-5-freeze.js";

describe("Phase 10.5 Freeze and Phase 11 Readiness (Prompt 10.15)", () => {
  const engine = new Phase10_5FreezeEngine();

  const report: Phase10_5CompletionReport = {
    reportId: "rep_10_5",
    phase8Compatible: true,
    phase9Compatible: true,
    phase10Frozen: true,
    verdict: "PHASE 10.5 PASSED — PHASE 11 AUTHORIZED",
    timestamp: "2026-08-02T09:00:00Z"
  };

  const readiness: Phase11ReadinessRecord = {
    readinessId: "read_11",
    preconditions: [
      {
        preconditionId: "prec_1",
        description: "Phase 8 compatibility verified",
        isSatisfied: true
      },
      {
        preconditionId: "prec_2",
        description: "Phase 9 compatibility verified",
        isSatisfied: true
      },
      {
        preconditionId: "prec_3",
        description: "Phase 10 version freeze complete",
        isSatisfied: true
      },
      { preconditionId: "prec_4", description: "Governance replay validated", isSatisfied: true },
      { preconditionId: "prec_5", description: "Documentation truth verified", isSatisfied: true },
      {
        preconditionId: "prec_6",
        description: "Release guard and boundary clean",
        isSatisfied: true
      }
    ],
    isPhase11Authorized: true,
    timestamp: "2026-08-02T09:00:00Z"
  };

  it("approves compliant Phase 10.5 freeze and authorizes Phase 11", () => {
    const failure = engine.evaluateReadiness(report, readiness, true, true);
    expect(failure).toBeUndefined();
  });

  it("detects unresolved contract drift failure", () => {
    const unfrozenReport: Phase10_5CompletionReport = {
      ...report,
      phase10Frozen: false
    };
    const failure = engine.evaluateReadiness(unfrozenReport, readiness, true, true);
    expect(failure).toBeDefined();
    expect(failure?.failureClass).toBe("unresolved_contract_drift");
  });

  it("detects failing boundary validator failure", () => {
    const failure = engine.evaluateReadiness(report, readiness, false, true); // Boundary clean = false
    expect(failure).toBeDefined();
    expect(failure?.failureClass).toBe("failing_boundary_validator");
  });

  it("detects weak release guard failure", () => {
    const failure = engine.evaluateReadiness(report, readiness, true, false); // Release guard active = false
    expect(failure).toBeDefined();
    expect(failure?.failureClass).toBe("weak_release_guard");
  });

  it("detects unsatisfied extraction precondition failure", () => {
    const unsatisfiedReadiness: Phase11ReadinessRecord = {
      ...readiness,
      preconditions: [
        { preconditionId: "prec_4", description: "Governance replay failed", isSatisfied: false }
      ]
    };
    const failure = engine.evaluateReadiness(report, unsatisfiedReadiness, true, true);
    expect(failure).toBeDefined();
    expect(failure?.failureClass).toBe("failing_replay");
  });
});
