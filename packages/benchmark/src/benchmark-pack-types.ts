import type { BenchmarkExposureManifest } from "../../semantiq/src/benchmark-integrity.js";
import type { ContentDigest, SemanticDigest } from "./evidence-types.js";
import type { CanonicalConfigurationValue, EvaluatorIdentity } from "./evaluator-types.js";
import type { EvaluatorRegistry } from "./evaluators.js";
import type { MetricIdentity } from "./metric-types.js";
import type { MetricRegistry } from "./metrics.js";
import type {
  BenchmarkIdentity,
  BenchmarkProvenance,
  RegistryInputRightsClass,
  BenchmarkRegistryViolation
} from "./registry-types.js";
import type { BenchmarkRegistry } from "./registry.js";

export interface BenchmarkPackIdentity {
  readonly packId: string;
  readonly packVersion: string;
}
export interface BenchmarkPackCaseReference {
  readonly caseId: string;
  readonly path: string;
  readonly contentType: "application/json" | "text/plain" | "application/octet-stream";
  readonly digest: ContentDigest & { readonly representation: "ORIGINAL_BYTES" };
}
/** Contributor declarations; never governance, maturity or scientific authority. */
export interface BenchmarkPackManifest {
  readonly schemaId: "SEMANTIQ_BENCHMARK_PACK_MANIFEST";
  readonly schemaVersion: "0.1.0";
  readonly identity: BenchmarkPackIdentity;
  readonly benchmark: BenchmarkIdentity;
  readonly evaluator: EvaluatorIdentity;
  readonly metrics: readonly MetricIdentity[];
  readonly cases: readonly BenchmarkPackCaseReference[];
  readonly provenance: Pick<BenchmarkProvenance, "origin" | "provenanceClass" | "sourceReferences">;
  readonly rights: {
    readonly rightsClass: RegistryInputRightsClass;
    readonly license?: { readonly identifier: string; readonly reference: string };
  };
  readonly executionRequirements: {
    readonly inputKind: string;
    readonly subjectKind: string;
    readonly parameters: Readonly<Record<string, CanonicalConfigurationValue>>;
  };
  readonly exposure: BenchmarkExposureManifest;
  /** Inert references; not verified evidence records or promotion inputs. */
  readonly evidenceReferences: readonly string[];
  readonly limitations: readonly string[];
  readonly intendedUse: string;
  readonly scientificAuthority: "NONE";
  /** Explicitly non-material; not part of pack identity. */
  readonly auditMetadata?: {
    readonly recordedAt?: string;
    readonly requestId?: string;
    readonly reviewerComments?: readonly string[];
  };
}
export interface BenchmarkPackValidationResult {
  readonly valid: boolean;
  readonly violations: readonly BenchmarkRegistryViolation[];
}
export interface BenchmarkPackAdmissionResult {
  readonly status: "ADMISSIBLE" | "REVIEW_REQUIRED" | "BLOCKED";
  readonly violations: readonly BenchmarkRegistryViolation[];
  readonly scientificAuthority: "NONE";
}
export interface BenchmarkPackRegistries {
  readonly benchmarks: BenchmarkRegistry;
  readonly evaluators: EvaluatorRegistry;
  readonly metrics: MetricRegistry;
}
export interface BenchmarkPackLoadResult {
  readonly validation: BenchmarkPackValidationResult;
  readonly admission: BenchmarkPackAdmissionResult;
  readonly manifest?: BenchmarkPackManifest;
  readonly packDigest?: SemanticDigest;
  readonly verifiedCases: readonly { readonly caseId: string; readonly digest: ContentDigest }[];
}
