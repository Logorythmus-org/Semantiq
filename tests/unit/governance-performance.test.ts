import { describe, it, expect } from "vitest";
import type {
  GovernanceBenchmarkResult,
  GovernancePerformanceFixture,
  GovernanceRegressionThreshold
} from "../../packages/semantiq/src/governance-performance.js";
import { GovernancePerformanceEngine } from "../../packages/semantiq/src/governance-performance.js";

describe("Governance Performance and Scalability Baseline (Prompt 10.12)", () => {
  const engine = new GovernancePerformanceEngine();

  const fixture: GovernancePerformanceFixture = {
    fixtureId: "fix_101",
    targetOperation: "policy_resolution",
    itemCount: 100,
    isNetworkDependent: false
  };

  const validResult: GovernanceBenchmarkResult = {
    benchmarkId: "bm_101",
    fixtureId: "fix_101",
    hardwareDescription: "AMD Ryzen 9 / 32GB RAM / Win11 x64",
    runCount: 10,
    latencyMsP50: 1.2,
    latencyMsP95: 3.5,
    latencyMsP99: 5.1,
    memoryHeapMb: 14.2,
    isDeterministic: true
  };

  const threshold: GovernanceRegressionThreshold = {
    maxP95LatencyMs: 50.0,
    maxHeapMb: 100.0
  };

  it("approves compliant governance performance benchmark evaluation", () => {
    const report = engine.evaluateBenchmark(fixture, validResult, threshold);
    expect(report).toBeUndefined();
  });

  it("detects network-dependent benchmark failure", () => {
    const netFixture: GovernancePerformanceFixture = {
      ...fixture,
      isNetworkDependent: true
    };
    const report = engine.evaluateBenchmark(netFixture, validResult, threshold);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("network_dependent_benchmark");
  });

  it("detects unstated hardware environment failure", () => {
    const noHwResult: GovernanceBenchmarkResult = {
      ...validResult,
      hardwareDescription: ""
    };
    const report = engine.evaluateBenchmark(fixture, noHwResult, threshold);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("unstated_hardware");
  });

  it("detects single-run metrics failure (run count < 5)", () => {
    const singleRunResult: GovernanceBenchmarkResult = {
      ...validResult,
      runCount: 1 // Less than minimum required 5 runs
    };
    const report = engine.evaluateBenchmark(fixture, singleRunResult, threshold);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("single_run_metrics");
  });

  it("detects missing percentile data failure", () => {
    const missingPercResult: GovernanceBenchmarkResult = {
      ...validResult,
      latencyMsP95: 0 // Invalid P95 latency
    };
    const report = engine.evaluateBenchmark(fixture, missingPercResult, threshold);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("missing_percentile_data");
  });

  it("detects missing regression thresholds failure", () => {
    const report = engine.evaluateBenchmark(fixture, validResult, undefined);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("no_regression_thresholds");
  });
});
