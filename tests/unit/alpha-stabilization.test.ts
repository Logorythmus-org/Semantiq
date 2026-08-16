import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  detectScoreRegressions,
  executeStabilizedEvaluation,
  LocalSemantiqEngine,
  profileSystemStability,
  type BenchmarkReport,
  type BenchmarkSubject,
  type ScoringProfile
} from "../../packages/semantiq/src/index.js";

describe("Prompt 7.9 — Alpha Stabilization Verification", () => {
  it("profiles system heap stability and uptime", () => {
    const profile = profileSystemStability();
    expect(profile.heapUsedMB).toBeGreaterThan(0);
    expect(profile.status).toEqual("stable");
  });

  it("detects score regressions between baseline and current reports", () => {
    const baseReport = { weightedScore: 0.90, subjectId: "s1" } as BenchmarkReport;
    const currentReport = { weightedScore: 0.80, subjectId: "s1" } as BenchmarkReport;

    const res = detectScoreRegressions(baseReport, currentReport, 0.05);
    expect(res.regressionDetected).toBe(true);
    expect(res.delta).toBeCloseTo(-0.10);
  });

  it("executes stabilized evaluation with fallback recovery", async () => {
    const engine = new LocalSemantiqEngine();
    const subject: BenchmarkSubject = {
      id: "stab_sub_1",
      kind: "question",
      version: "1.0.0",
      content: "Stabilization test content.",
      contextIds: [],
      evidenceIds: []
    };
    const profile: ScoringProfile = { id: "p1", version: "1.0.0", name: "P1", weights: {} };

    const res = await executeStabilizedEvaluation(engine, subject, profile);
    expect(res.report).toBeDefined();
    expect(res.recovered).toBe(false);
  });

  it("verifies stabilization report files on disk", () => {
    expect(existsSync("Docs/ALPHA_STABILIZATION.md")).toBe(true);
    expect(existsSync("Docs/SYSTEM_RELIABILITY_REPORT.md")).toBe(true);
    expect(existsSync("Docs/STABILIZATION_VERIFICATION_REPORT.md")).toBe(true);
    expect(existsSync("Docs/PHASE_7_COMPLETE_SUMMARY.md")).toBe(true);
  });
});
