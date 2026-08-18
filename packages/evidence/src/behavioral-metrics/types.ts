/**
 * @package @semantiq/evidence
 * Behavioral Metrics Engine Types
 */

import type { EvidenceConfidence } from "../../../sandbox-contracts/src/index.js";

export enum MetricEvaluationStatus {
  COMPUTED = "computed",
  PARTIAL = "partial",
  INSUFFICIENT_DATA = "insufficient_data",
  FAILED = "failed"
}

export interface MetricThresholdHeuristic {
  readonly label: string; // e.g. "[SemantIQ Heuristic] Critical Norm Drift"
  readonly thresholdValue: number;
  readonly comparison: ">=" | "<=" | ">" | "<" | "==";
  readonly interpretation: string;
}

export interface MetricInputRequirement {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly description: string;
}

export interface MetricResult<T = number> {
  readonly metricId: string;
  readonly metricName: string;
  readonly value: T | null;
  readonly status: MetricEvaluationStatus;
  readonly confidence: EvidenceConfidence;
  readonly requiredInputs: readonly string[];
  readonly providedInputs: readonly string[];
  readonly missingInputs: readonly string[];
  readonly thresholdHeuristics: readonly MetricThresholdHeuristic[];
  readonly evaluationNotes: string;
}

export interface BehavioralMetricsSuiteReport {
  readonly reportId: string;
  readonly evaluationTargetId: string;
  readonly evaluatedAt: string;
  readonly metrics: Record<string, MetricResult>;
  readonly overallComputedRatio: number;
  readonly flaggedHeuristicCount: number;
}
