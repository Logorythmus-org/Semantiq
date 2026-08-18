/**
 * @package @semantiq/evidence
 * Research Sources, Claims, Epistemic Nature, Pattern Candidates, and Failure Extraction Types
 */

import type { EvidenceConfidence } from "../../../sandbox-contracts/src/index.js";
import type { PatternDefinition } from "../../../patterns/src/index.js";

/**
 * Epistemic nature categorization.
 * Invariant: Observed != Inferred.
 */
export type EpistemicStatus =
  | "source_fact"            // Directly cited from authoritative paper/advisory
  | "semantiq_observation"    // Directly observed from empirical trace/telemetry execution
  | "inference"              // Derived via deterministic logic or pattern graph rule
  | "hypothesis";            // Proposed candidate requiring empirical verification

export type ResearchSourceType =
  | "academic_paper"
  | "benchmark_dataset"
  | "security_advisory"
  | "technical_report"
  | "runtime_telemetry";

export interface ResearchSource {
  readonly id: string;
  readonly title: string;
  readonly sourceType: ResearchSourceType;
  readonly authors: readonly string[];
  readonly uri?: string | undefined;
  readonly publicationDate?: string | undefined;
  readonly doiOrChecksum?: string | undefined;
  readonly peerReviewed: boolean;
  readonly relevanceTag: string;
  readonly extractedAt: string;
}

export interface ResearchClaim {
  readonly id: string;
  readonly researchSourceId: string;
  readonly statement: string;
  readonly nature: EpistemicStatus;
  readonly confidence: EvidenceConfidence;
  readonly supportingEvidenceIds: readonly string[];
  readonly refutingEvidenceIds: readonly string[];
  readonly scope: {
    readonly context: string;
    readonly restrictions?: readonly string[] | undefined;
  };
  readonly reviewedAt?: string | undefined;
}

export type CandidateReviewStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "rejected";

export interface PatternCandidate {
  readonly candidateId: string;
  readonly patternDraft: PatternDefinition;
  readonly proposedBy: string;
  readonly sourceEvidenceIds: readonly string[];
  readonly epistemicNature: "hypothesis" | "inference";
  readonly reviewStatus: CandidateReviewStatus;
  readonly reviews: readonly {
    readonly reviewerId: string;
    readonly decision: "approve" | "reject" | "request_changes";
    readonly comments: string;
    readonly reviewedAt: string;
  }[];
  readonly submittedAt: string;
  readonly approvedAt?: string | undefined;
}

export interface MetricBackedFailureObservation {
  readonly observationId: string;
  readonly runId: string;
  readonly metricId: string;
  readonly metricValue: number;
  readonly thresholdLabel: string;
  readonly thresholdValue: number;
  readonly associatedFailurePatternCode: string;
  readonly epistemicNature: "semantiq_observation";
  readonly summary: string;
  readonly evidenceTraceId: string;
  readonly recordedAt: string;
}

export interface FailureExtractionResult {
  readonly runId: string;
  readonly isArchitectureOnly: boolean;
  readonly failureObservations: readonly MetricBackedFailureObservation[];
  readonly inferredRiskHypotheses: readonly {
    readonly statement: string;
    readonly nature: "inference" | "hypothesis";
    readonly targetPatternCode: string;
  }[];
  readonly totalFailuresExtracted: number;
}
