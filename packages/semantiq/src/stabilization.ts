import type { BenchmarkReport, BenchmarkSubject, ScoringProfile } from "./contracts.js";
import { LocalSemantiqEngine } from "./index.js";

export interface SystemStabilityProfile {
  readonly heapUsedMB: number;
  readonly uptimeSeconds: number;
  readonly status: "stable" | "degraded" | "critical";
}

export interface ScoreRegressionResult {
  readonly subjectId: string;
  readonly baselineScore: number;
  readonly currentScore: number;
  readonly delta: number;
  readonly regressionDetected: boolean;
}

export function profileSystemStability(): SystemStabilityProfile {
  const mem = process.memoryUsage();
  const heapUsedMB = Math.round(mem.heapUsed / (1024 * 1024));
  return {
    heapUsedMB,
    uptimeSeconds: Math.round(process.uptime()),
    status: heapUsedMB < 150 ? "stable" : "degraded"
  };
}

export function detectScoreRegressions(
  baselineReport: BenchmarkReport,
  currentReport: BenchmarkReport,
  threshold: number = 0.05
): ScoreRegressionResult {
  const delta = currentReport.weightedScore - baselineReport.weightedScore;
  return {
    subjectId: currentReport.subjectId,
    baselineScore: baselineReport.weightedScore,
    currentScore: currentReport.weightedScore,
    delta,
    regressionDetected: delta < -threshold
  };
}

export async function executeStabilizedEvaluation(
  engine: LocalSemantiqEngine,
  subject: BenchmarkSubject,
  profile: ScoringProfile
): Promise<{ report: BenchmarkReport; recovered: boolean }> {
  try {
    const report = await engine.evaluate(subject, profile);
    return { report, recovered: false };
  } catch (_err) {
    // Graceful fallback to default profile if custom evaluation fails
    const fallbackProfile: ScoringProfile = {
      id: "fallback",
      version: "1.0.0",
      name: "Fallback Profile",
      weights: {}
    };
    const report = await engine.evaluate(subject, fallbackProfile);
    return { report, recovered: true };
  }
}
