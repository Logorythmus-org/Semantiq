import type { SemanticCoreInput, SemanticCoreResponse } from "./semantic-core-types.js";

export const SEMANTIC_CORE_QUALIFICATION_PROTOCOL = {
  protocolId: "semantic_core_pilot_bm3_qualification",
  protocolVersion: "0.1.0",
  runs: 3,
  casesPerRun: 24,
  scheduledAttempts: 72,
  retryPolicy: "NONE",
  caseOrderPolicy: "FROZEN_MANIFEST_ORDER",
  isolation: "FRESH_REQUEST_PER_CASE",
  serializerVersion: "0.1.0",
  parserPolicy: "JSON_PARSE_ONLY_NO_REPAIR",
  scientificAuthority: "NONE",
  decisionAuthority: "NONE"
} as const;

export const SEMANTIC_CORE_QUOTA_WINDOW_PROTOCOL = {
  ...SEMANTIC_CORE_QUALIFICATION_PROTOCOL,
  protocolVersion: "0.1.1",
  collectionPolicy: "MULTI_QUOTA_WINDOW_SAME_SUBJECT_CONDITION",
  minimumFreeRequestsPerRun: 24,
  runAtomicity: "COMPLETE_RUN_PER_QUOTA_WINDOW",
  collectionWindowMaximumHours: 168,
  minimumRequestIntervalMs: 3500,
  oracleIsolationPolicy: "SUBJECT_INPUT_PROJECTION_ONLY"
} as const;
export interface SemanticCoreFreeCapacity {
  readonly observedAt: string;
  readonly used: number;
  readonly limit: number;
  readonly remaining: number;
}

export type QualificationFailure =
  | "INSUFFICIENT_FREE_REQUEST_CAPACITY"
  | "CAPTURE_INTEGRITY_FAILURE"
  | "PREFLIGHT_FAILURE"
  | "ZERO_COST_POLICY_FAILURE"
  | "CREDENTIAL_UNAVAILABLE"
  | "PROVIDER_METADATA_MISMATCH"
  | "TRANSPORT_FAILURE"
  | "PROVIDER_REJECTION"
  | "TIMEOUT"
  | "MALFORMED_SUBJECT_OUTPUT"
  | "MISSING_OUTPUT"
  | "EVALUATOR_FAILURE"
  | "EVIDENCE_PACKAGING_FAILURE"
  | "EVIDENCE_VERIFICATION_FAILURE"
  | "REGRESSION_REPLAY_MISMATCH"
  | "IDENTITY_SUBSTITUTION";

export class SemanticCoreQualificationError extends Error {
  constructor(readonly code: QualificationFailure) {
    super(code);
    this.name = "SemanticCoreQualificationError";
  }
}

export interface SemanticCoreSubjectConfiguration {
  readonly provider: "OpenRouter";
  readonly modelId: string;
  readonly snapshotStatus: "MUTABLE_ALIAS";
  readonly providerName: string;
  readonly route: string;
  readonly temperature: 0;
  readonly maxTokens: 128;
  readonly seed?: number;
  readonly responseFormat: "STRICT_JSON_SCHEMA";
}

export interface SemanticCoreProviderMetadata {
  readonly modelId: string;
  /** Advertised slug is provenance, not a guarantee of an immutable snapshot. */
  readonly canonicalSlug: string;
  readonly providerName: string;
  readonly route: string;
  readonly pricing: Readonly<Record<string, string>>;
  readonly supportedParameters: readonly string[];
  readonly status: number;
}

export interface SemanticCoreSubjectObservation {
  readonly status: "RESPONSE" | "MISSING" | "MALFORMED" | "ERROR";
  readonly response?: SemanticCoreResponse;
  readonly error?: QualificationFailure;
  readonly modelId?: string;
  readonly providerName?: string;
  readonly requestId?: string;
  readonly rawResponseDigest?: string;
  readonly rawResponseAvailability: "UNAVAILABLE";
  readonly usage?: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly cost: number;
  };
}

export interface SemanticCoreQualificationContext {
  readonly attemptId: string;
  readonly promptDigest: string;
  readonly conditionDigest: string;
}

/** Only a detached oracle-free case and the frozen condition cross this boundary. */
export interface SemanticCoreQualificationSubject {
  readonly evidenceOrigin: "LIVE_PROVIDER" | "SYNTHETIC_TEST";
  preflight(configuration: SemanticCoreSubjectConfiguration): Promise<SemanticCoreProviderMetadata>;
  capacity?(): Promise<SemanticCoreFreeCapacity>;
  observe(
    input: SemanticCoreInput,
    configuration: SemanticCoreSubjectConfiguration,
    context: SemanticCoreQualificationContext
  ): Promise<SemanticCoreSubjectObservation>;
}

export type SemanticCoreQualificationOutcome =
  "QUALIFIED_FOR_BM3_REVIEW" | "NOT_QUALIFIED" | "INSUFFICIENT_EVIDENCE";
