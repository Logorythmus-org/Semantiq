/**
 * @package @tech-club/semantiq
 * Unified Application Service Layer Contracts
 * 
 * Invariants:
 * 1. Authoritative application services over the integrated product domain.
 * 2. Pure domain models with NO transport-specific (HTTP/CLI) artifacts.
 */

import type {
  Evaluation,
  ResearchBundle,
  Run,
  SystemProfile,
  Trace
} from "../../../sandbox-contracts/src/index.js";

import type {
  CaseStudy,
  GovernedEvidenceClaim,
  ReproducibilityMetadata
} from "../../../evidence/src/index.js";

export interface IngestBenchmarkRunRequest {
  readonly rawArtifact: Record<string, unknown>;
  readonly sourceFormat: "smf_v1" | "hacs_v1" | "vision_v1";
}

export interface IngestBenchmarkRunResponse {
  readonly run: Run;
  readonly evaluation: Evaluation;
  readonly trace?: Trace | undefined;
}

export interface RecordEvaluationRequest {
  readonly evaluation: Evaluation;
  readonly contentFingerprint: string;
  readonly configFingerprint: string;
  readonly reproducibility: ReproducibilityMetadata;
}

export interface ExportBundleRequest {
  readonly bundleId: string;
  readonly title: string;
  readonly author: string;
  readonly description?: string | undefined;
  readonly runs: readonly Run[];
  readonly evaluations: readonly Evaluation[];
  readonly claims: readonly GovernedEvidenceClaim[];
  readonly caseStudies?: readonly CaseStudy[] | undefined;
  readonly systemProfiles?: readonly SystemProfile[] | undefined;
}

export interface ImportBundleResult {
  readonly verified: boolean;
  readonly bundleId: string;
  readonly importedClaimsCount: number;
  readonly importedRunsCount: number;
  readonly importedEvaluationsCount: number;
}
