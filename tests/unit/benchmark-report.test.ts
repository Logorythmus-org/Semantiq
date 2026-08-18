import { describe, it, expect } from "vitest";
import {
  BenchmarkReportEngine,
  type BenchmarkMethodologySummary,
  type BehavioralFindingsSummary,
  type IntegrityTrustSummary,
  type CostAccountingSummary,
  type ProvenanceSummary
} from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Canonical Benchmark Report Architecture", () => {
  const engine = new BenchmarkReportEngine();

  const methodology: BenchmarkMethodologySummary = {
    benchmarkId: "bench-reasoning-01",
    dslVersion: "1.0.0",
    providerId: "local-docker",
    imageDigest: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
    networkPolicy: "ISOLATED",
    totalStepBudget: 15
  };

  const behavioralFindings: BehavioralFindingsSummary = {
    longHorizonResilienceIndex: 0.92,
    consequenceAttributionIndex: 0.88,
    recoveryResilienceIndex: 0.95,
    detectedTransitions: 2
  };

  const integrityAndTrust: IntegrityTrustSummary = {
    integrityGrade: "SEALED_VALID",
    authenticityClassification: "AUTHENTIC_REASONED",
    observerTrustScore: 1.0
  };

  const costAccounting: CostAccountingSummary = {
    totalCostUsd: 0.0845,
    receiptSignature:
      "3045022100aaaa1111bbbb2222cccc3333dddd44440220eeee5555ffff6666aaaa7777bbbb8888"
  };

  const provenance: ProvenanceSummary = {
    graphMerkleRoot: "2222222222222222222222222222222222222222222222222222222222222222",
    evidenceDigest: "3333333333333333333333333333333333333333333333333333333333333333"
  };

  it("assembles canonical benchmark report with composite score and cryptographic signature", () => {
    const report = engine.assembleReport(
      "scenario-swe-01",
      "run-rep-001",
      "PASSED",
      0.9167,
      methodology,
      behavioralFindings,
      integrityAndTrust,
      costAccounting,
      provenance,
      ["Host CPU throttling observed under peak load (jitter < 5%)"]
    );

    expect(report.scenarioId).toBe("scenario-swe-01");
    expect(report.runId).toBe("run-rep-001");
    expect(report.verdict).toBe("PASSED");
    expect(report.compositeScore).toBe(0.9167);
    expect(report.behavioralFindings.longHorizonResilienceIndex).toBe(0.92);
    expect(report.reportSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it("renders comprehensive GFM Markdown report", () => {
    const report = engine.assembleReport(
      "scenario-swe-01",
      "run-rep-001",
      "PASSED",
      0.9167,
      methodology,
      behavioralFindings,
      integrityAndTrust,
      costAccounting,
      provenance,
      ["Minor latency variance"]
    );

    const markdown = engine.renderReportMarkdown(report);

    expect(markdown).toContain("# SemantIQ Canonical Benchmark Report");
    expect(markdown).toContain("PASSED");
    expect(markdown).toContain("91.7%");
    expect(markdown).toContain("Observable Behavioral Findings");
    expect(markdown).toContain("Long-Horizon Resilience ($LHRI$)");
    expect(markdown).toContain("Integrity, Authenticity & Trust Attestation");
    expect(markdown).toContain("SEALED_VALID");
    expect(markdown).toContain("AUTHENTIC_REASONED");
    expect(markdown).toContain("Declared Limitations & Environmental Variance");
    expect(markdown).toContain("Auditor Cryptographic Signature");
  });

  it("renders formatted JSON report string", () => {
    const report = engine.assembleReport(
      "scenario-swe-01",
      "run-rep-001",
      "PASSED",
      0.9167,
      methodology,
      behavioralFindings,
      integrityAndTrust,
      costAccounting,
      provenance
    );

    const json = engine.renderReportJson(report);
    expect(json).toContain('"verdict": "PASSED"');
    expect(json).toContain('"compositeScore": 0.9167');
  });
});
