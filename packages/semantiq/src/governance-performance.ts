export type PerformanceFailureClass =
  | 'nondeterministic_benchmark'
  | 'unstated_hardware'
  | 'single_run_metrics'
  | 'network_dependent_benchmark'
  | 'missing_percentile_data'
  | 'no_regression_thresholds';

export interface GovernancePerformanceFixture {
  readonly fixtureId: string;
  readonly targetOperation: 'policy_resolution' | 'applicability_analysis' | 'approval_verification' | 'incident_bundle_gen' | 'profile_gen';
  readonly itemCount: number;
  readonly isNetworkDependent: boolean;
}

export interface GovernanceBenchmarkResult {
  readonly benchmarkId: string;
  readonly fixtureId: string;
  readonly hardwareDescription: string;
  readonly runCount: number;
  readonly latencyMsP50: number;
  readonly latencyMsP95: number;
  readonly latencyMsP99: number;
  readonly memoryHeapMb: number;
  readonly isDeterministic: boolean;
}

export interface GovernanceRegressionThreshold {
  readonly maxP95LatencyMs: number;
  readonly maxHeapMb: number;
}

export interface PerformanceFailureReport {
  readonly reportId: string;
  readonly failureClass: PerformanceFailureClass;
  readonly benchmarkId: string;
  readonly description: string;
  readonly timestamp: string;
}

/**
 * Governance Performance Engine.
 * Measures latency percentiles, memory usage, and regression thresholds for governance evidence workloads.
 */
export class GovernancePerformanceEngine {
  evaluateBenchmark(
    fixture: GovernancePerformanceFixture,
    result: GovernanceBenchmarkResult,
    threshold: GovernanceRegressionThreshold | undefined
  ): PerformanceFailureReport | undefined {
    // 1. Network-Dependent Benchmark Check
    if (fixture.isNetworkDependent) {
      return {
        reportId: `fail_net_${result.benchmarkId}`,
        failureClass: 'network_dependent_benchmark',
        benchmarkId: result.benchmarkId,
        description: `Benchmark '${result.benchmarkId}' relies on external network requests.`,
        timestamp: new Date().toISOString()
      };
    }

    // 2. Unstated Hardware Check
    if (!result.hardwareDescription || result.hardwareDescription.trim() === '') {
      return {
        reportId: `fail_hw_${result.benchmarkId}`,
        failureClass: 'unstated_hardware',
        benchmarkId: result.benchmarkId,
        description: `Benchmark '${result.benchmarkId}' lacks hardware environment specification.`,
        timestamp: new Date().toISOString()
      };
    }

    // 3. Single-Run Metrics Check
    if (result.runCount < 5) {
      return {
        reportId: `fail_run_${result.benchmarkId}`,
        failureClass: 'single_run_metrics',
        benchmarkId: result.benchmarkId,
        description: `Benchmark '${result.benchmarkId}' run count (${result.runCount}) is below minimum requirement of 5.`,
        timestamp: new Date().toISOString()
      };
    }

    // 4. Missing Percentile Data Check
    if (result.latencyMsP50 <= 0 || result.latencyMsP95 <= 0 || result.latencyMsP99 <= 0) {
      return {
        reportId: `fail_perc_${result.benchmarkId}`,
        failureClass: 'missing_percentile_data',
        benchmarkId: result.benchmarkId,
        description: `Benchmark '${result.benchmarkId}' is missing valid P50/P95/P99 percentile data.`,
        timestamp: new Date().toISOString()
      };
    }

    // 5. No Regression Thresholds Check
    if (!threshold) {
      return {
        reportId: `fail_nothresh_${result.benchmarkId}`,
        failureClass: 'no_regression_thresholds',
        benchmarkId: result.benchmarkId,
        description: `Benchmark '${result.benchmarkId}' has no registered regression threshold.`,
        timestamp: new Date().toISOString()
      };
    }

    // 6. Non-Deterministic Benchmark Check
    if (!result.isDeterministic) {
      return {
        reportId: `fail_nondet_${result.benchmarkId}`,
        failureClass: 'nondeterministic_benchmark',
        benchmarkId: result.benchmarkId,
        description: `Benchmark '${result.benchmarkId}' produced non-deterministic results.`,
        timestamp: new Date().toISOString()
      };
    }

    return undefined;
  }
}
