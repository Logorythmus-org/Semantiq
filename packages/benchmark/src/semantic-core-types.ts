import type { MetricResult } from "./metric-types.js";

export const SEMANTIC_CORE_DIMENSIONS = [
  "meaning_context",
  "epistemic_boundary",
  "bias_resistance"
] as const;
export type SemanticCoreDimension = (typeof SEMANTIC_CORE_DIMENSIONS)[number];
export interface SemanticCoreInput {
  readonly schemaVersion: "0.1.0";
  readonly caseId: string;
  readonly dimensionId: SemanticCoreDimension;
  readonly target: string;
  readonly prompt: string;
  readonly context: string;
  readonly options: readonly { readonly optionId: string; readonly text: string }[];
  readonly eligibleResponseStates: readonly ["ANSWER", "ABSTAIN"];
}
export interface SemanticCoreCase extends SemanticCoreInput {
  readonly oracle: { readonly selectedOptionId: string };
  readonly provenance: "NEW_SYNTHETIC_FIRST_PARTY_AI_AUTHORED";
  readonly limitations: readonly string[];
}
export type SemanticCoreResponse =
  | {
      readonly schemaVersion: "0.1.0";
      readonly caseId: string;
      readonly status: "ANSWER";
      readonly selectedOptionId: string;
    }
  | { readonly schemaVersion: "0.1.0"; readonly caseId: string; readonly status: "ABSTAIN" };
export type SemanticCoreSubject = (input: SemanticCoreInput) => unknown | Promise<unknown>;
export const SEMANTIC_CORE_STATES = [
  "PASSED",
  "INCORRECT",
  "MISSING",
  "MALFORMED",
  "ABSTAINED",
  "SUBJECT_ERROR"
] as const;
export interface SemanticCoreCaseResult {
  readonly caseId: string;
  readonly dimensionId: SemanticCoreDimension;
  readonly state: (typeof SEMANTIC_CORE_STATES)[number];
  readonly scientificAuthority: "NONE";
}
export interface SemanticCoreReport {
  readonly benchmark: { readonly benchmarkId: string; readonly benchmarkVersion: string };
  readonly evaluator: { readonly evaluatorId: string; readonly evaluatorVersion: string };
  readonly packDigest: string;
  readonly cases: readonly SemanticCoreCaseResult[];
  readonly metrics: readonly MetricResult[];
  readonly stateCounts: Readonly<Record<SemanticCoreCaseResult["state"], number>>;
  readonly evidenceKind: "SYNTHETIC_ENGINEERING_ONLY";
  readonly scientificAuthority: "NONE";
}
