/**
 * @package @semantiq/evidence
 * Cross-Run Evidence Graph, R0–R4 Relation Strength, and Comparative Query Types
 */

import type { EvidenceConfidence, RelationType } from "../../../sandbox-contracts/src/index.js";

export const EPISTEMIC_ABSENCE_DISCLAIMER = "Absence of observation is not counterevidence.";

export enum RelationStrengthLevel {
  R0 = "R0", // Unobserved / No observations (0.0)
  R1 = "R1", // Weak / Single observation (0.25)
  R2 = "R2", // Moderate / Multi-case empirical observation (0.50)
  R3 = "R3", // Strong / Multi-case & Multi-environment verification (0.75)
  R4 = "R4" // Deterministic / Cross-model & cross-environment reproducible (1.00)
}

export type RelationEvidenceStatus =
  | "supported"
  | "mixed"
  | "counterevidence_only"
  | "no_observation";

export type EvidencePolarity = "SUPPORTS" | "REFUTES";

export interface RelationObservation {
  readonly id: string;
  readonly relationId: string;
  readonly sourceId: string; // e.g. "DP-001"
  readonly targetId: string; // e.g. "FP-003"
  readonly relationType: RelationType;
  readonly polarity: EvidencePolarity;
  readonly runId: string;
  readonly caseId: string;
  readonly modelId: string;
  readonly environmentId: string;
  readonly confidence: EvidenceConfidence;
  readonly scoreDelta?: number | undefined;
  readonly details?: Readonly<Record<string, unknown>> | undefined;
  readonly recordedAt: string;
}

export interface CaseMatrixCell {
  readonly caseId: string;
  readonly modelId: string;
  readonly environmentId: string;
  readonly status: RelationEvidenceStatus;
  readonly supportingCount: number;
  readonly refutingCount: number;
  readonly observationIds: readonly string[];
}

export interface CaseMatrix {
  readonly benchmarkId?: string | undefined;
  readonly relationId: string;
  readonly cases: readonly string[];
  readonly models: readonly string[];
  readonly environments: readonly string[];
  readonly cells: readonly CaseMatrixCell[];
  readonly coverageSummary: {
    readonly totalPossibleCells: number;
    readonly observedCells: number;
    readonly coverageRatio: number; // 0.0 to 1.0
    readonly uniqueCasesCount: number;
    readonly uniqueModelsCount: number;
    readonly uniqueEnvironmentsCount: number;
  };
}

export interface ComparativeQuery {
  readonly sourceId: string;
  readonly targetId: string;
  readonly relationType?: RelationType | undefined;
  readonly filters?:
    | {
        readonly modelIds?: readonly string[] | undefined;
        readonly environmentIds?: readonly string[] | undefined;
        readonly caseIds?: readonly string[] | undefined;
      }
    | undefined;
}

export interface ComparativeQueryResult {
  readonly query: ComparativeQuery;
  readonly status: RelationEvidenceStatus;
  readonly strength: RelationStrengthLevel;
  readonly strengthScore: number; // 0.0 to 1.0
  readonly supportingObservationsCount: number;
  readonly refutingObservationsCount: number;
  readonly caseMatrix: CaseMatrix;
  readonly epistemicDisclaimer: typeof EPISTEMIC_ABSENCE_DISCLAIMER;
  readonly evaluatedAt: string;
}
