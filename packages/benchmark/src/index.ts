export interface BenchmarkCase {
  readonly id: string;
  readonly input: string;
  readonly expectedSignals: readonly string[];
}

export interface BenchmarkResult {
  readonly caseId: string;
  readonly passed: boolean;
  readonly notes: string;
}
