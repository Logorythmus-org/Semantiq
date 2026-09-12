/**
 * Canonical benchmark registry contracts.
 *
 * Benchmark maturity is deliberately split across implementation, scientific,
 * and lifecycle axes. The aggregate M0-M6 level is derived by the registry.
 */

export const BENCHMARK_IMPLEMENTATION_STATES = [
  "CONCEPT_ONLY",
  "SPECIFIED",
  "SCAFFOLDED",
  "EXECUTABLE",
  "REPRODUCIBLE"
] as const;

export type BenchmarkImplementationState = (typeof BENCHMARK_IMPLEMENTATION_STATES)[number];

export const BENCHMARK_SCIENTIFIC_MATURITY = [
  "NOT_ESTABLISHED",
  "SYNTHETIC_ONLY",
  "UNVALIDATED_PROXY",
  "CALIBRATION_REQUIRED",
  "CALIBRATED",
  "VALIDATED"
] as const;

export type BenchmarkScientificMaturity = (typeof BENCHMARK_SCIENTIFIC_MATURITY)[number];

export const BENCHMARK_LIFECYCLE_STATES = ["DRAFT", "ACTIVE", "DEPRECATED", "RETIRED"] as const;

export type BenchmarkLifecycleState = (typeof BENCHMARK_LIFECYCLE_STATES)[number];

export const BENCHMARK_EVALUATOR_MECHANISMS = [
  "DETERMINISTIC",
  "RULE_BASED",
  "SELF_EVALUATION",
  "SAME_MODEL_JUDGE",
  "CROSS_MODEL_JUDGE",
  "LLM_AS_JUDGE",
  "SEMANTIQ_EVALUATOR",
  "HUMAN_JUDGE",
  "HYBRID"
] as const;

export type BenchmarkEvaluatorMechanism = (typeof BENCHMARK_EVALUATOR_MECHANISMS)[number];

export const BENCHMARK_HUMAN_ROLES = [
  "HUMAN_AS_JUDGE",
  "HUMAN_AS_SUBJECT",
  "HUMAN_AI_COMPARISON"
] as const;

export type BenchmarkHumanRole = (typeof BENCHMARK_HUMAN_ROLES)[number];

export type BenchmarkMaturityLevel = "M0" | "M1" | "M2" | "M3" | "M4" | "M5" | "M6";

export interface BenchmarkIdentity {
  readonly benchmarkId: string;
  readonly benchmarkVersion: string;
}

export interface BenchmarkFamilyDefinition {
  readonly familyId: string;
  readonly name: string;
  readonly description: string;
}

export type ConstructClaimStrength = "INTENDED" | "ENGINEERING_PROXY" | "SCIENTIFIC_CLAIM";

export interface BenchmarkConstructDefinition {
  readonly constructId: string;
  readonly name: string;
  readonly description: string;
  readonly claimStrength: ConstructClaimStrength;
}

export type RegistryProvenanceClass =
  | "HUMAN_DIRECTION"
  | "AI_ASSISTED"
  | "AI_GENERATED"
  | "THIRD_PARTY_SOURCE"
  | "PROJECT_EXISTING_SOURCE"
  | "MIXED";

export type RegistryInputRightsClass =
  | "FIRST_PARTY_OR_PROJECT"
  | "OPEN_CLEARED"
  | "PUBLIC_REFERENCE_ONLY"
  | "RESTRICTED_REVIEW_REQUIRED"
  | "UNKNOWN_RIGHTS"
  | "PROHIBITED";

export interface BenchmarkProvenance {
  readonly origin: string;
  readonly sourceType: "CURRENT_IMPLEMENTATION" | "CURRENT_FIXTURE" | "HISTORICAL_RESEARCH";
  readonly temporalStatus: "CURRENT" | "HISTORICAL";
  readonly provenanceClass: RegistryProvenanceClass;
  readonly sourceReferences: readonly string[];
  readonly datasetCaseProvenance: {
    readonly status: "REPOSITORY_REFERENCED" | "UNKNOWN" | "NOT_APPLICABLE";
    readonly references: readonly string[];
  };
  readonly rightsClass: RegistryInputRightsClass;
  readonly introducedIn: string;
  readonly supersededBy?: BenchmarkIdentity | undefined;
}

export interface BenchmarkEvaluatorRequirement {
  readonly mechanism: BenchmarkEvaluatorMechanism;
  readonly bindingStatus: "SUPPORTED_BY_SCHEMA" | "IMPLEMENTED_AND_BOUND";
  readonly evaluatorId?: string | undefined;
  readonly evidenceReferences: readonly string[];
}

export interface BenchmarkHumanRoleDeclaration {
  readonly role: BenchmarkHumanRole;
  readonly status: "INTENDED" | "IMPLEMENTED";
  readonly evidenceReferences: readonly string[];
}

export interface BenchmarkEvidenceReferences {
  readonly implementation: readonly string[];
  readonly tests: readonly string[];
  readonly reproducibility: readonly string[];
  readonly calibration: readonly string[];
  readonly validation: readonly string[];
  readonly promotion: readonly string[];
}

export interface BenchmarkAlias {
  readonly value: string;
  readonly kind: "LEGACY_ID" | "LEGACY_NAME" | "HISTORICAL_NAME_COLLISION";
  readonly collidesWith: readonly BenchmarkIdentity[];
}

export interface CanonicalBenchmarkDefinition {
  readonly identity: BenchmarkIdentity;
  readonly versionScope: "BENCHMARK";
  readonly familyId: string;
  readonly name: string;
  readonly description: string;
  readonly constructIds: readonly string[];
  readonly provenance: BenchmarkProvenance;
  readonly implementationState: BenchmarkImplementationState;
  readonly scientificMaturity: BenchmarkScientificMaturity;
  readonly lifecycleState: BenchmarkLifecycleState;
  readonly evaluatorRequirements: readonly BenchmarkEvaluatorRequirement[];
  readonly humanRoles: readonly BenchmarkHumanRoleDeclaration[];
  readonly evidence: BenchmarkEvidenceReferences;
  readonly aliases: readonly BenchmarkAlias[];
  readonly supersedes: readonly BenchmarkIdentity[];
  readonly corePromotion: "NOT_PROMOTED" | "PROMOTED";
  readonly limitations: readonly string[];
}

export interface CanonicalBenchmarkRegistrySnapshot {
  readonly registrySchemaVersion: string;
  readonly families: readonly BenchmarkFamilyDefinition[];
  readonly constructs: readonly BenchmarkConstructDefinition[];
  readonly benchmarks: readonly CanonicalBenchmarkDefinition[];
}

export interface BenchmarkRegistryViolation {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface BenchmarkRegistryValidationResult {
  readonly valid: boolean;
  readonly violations: readonly BenchmarkRegistryViolation[];
}
