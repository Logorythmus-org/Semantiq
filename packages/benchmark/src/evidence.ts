import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import {
  ARTIFACT_AVAILABILITY,
  ARTIFACT_KINDS,
  EVIDENCE_COMPLETENESS_DIMENSIONS,
  EVIDENCE_RECORD_SCOPES,
  type ArtifactReference,
  type ContentDigest,
  type EnvironmentManifest,
  type EnvironmentManifestInput,
  type EvidencePackage,
  type EvidencePackageInput,
  type EvidenceRecordReference,
  type EvidenceValidationViolation,
  type EvidenceValue,
  type EvidenceVerificationResult,
  type ExecutionManifest,
  type ExecutionManifestInput,
  type ReproductionAttempt,
  type ReproductionAttemptInput,
  type ReproductionOutcome,
  type ReplayAssessment,
  type SemanticDigest,
  type VerificationFinding
} from "./evidence-types.js";

const SEMVER = /^\d+\.\d+\.\d+$/;
const SHA256 = /^(?:sha256:)?[a-f0-9]{64}$/i;
const PRIVATE_PATH = /(?:[A-Za-z]:\\Users\\|\/Users\/|\/home\/)[^\s]+/;
const SECRET =
  /(?:BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY|\bgh[pousr]_[A-Za-z0-9_]{20,}\b|\bAKIA[0-9A-Z]{16}\b|\b(?:api[_-]?key|access[_-]?token|password|credential)\s*[:=]\s*[^\s,}]+)/i;
const FORBIDDEN_KEY =
  /^(?:realName|fullName|email|phone|address|deviceId|ipAddress|governmentId|medicalData|diagnosis|password|secret|token|credential|apiKey|privateKey)$/i;
const FORBIDDEN_VALUE =
  /^(?:SCIENTIFICALLY_VERIFIED|PROOF|AUTHENTIC_BY_HASH|PARITY|SUPERHUMAN|HUMAN_LEVEL|SAME_INTELLIGENCE)$/;

function add(
  violations: EvidenceValidationViolation[],
  code: string,
  path: string,
  message: string
): void {
  violations.push({ code, path, message });
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function scan(value: unknown, path: string, violations: EvidenceValidationViolation[]): void {
  if (typeof value === "string") {
    if (PRIVATE_PATH.test(value))
      add(
        violations,
        "PRIVATE_PATH_FORBIDDEN",
        path,
        "Portable S-09 records cannot contain private absolute paths."
      );
    if (SECRET.test(value))
      add(
        violations,
        "CREDENTIAL_FORBIDDEN",
        path,
        "Evidence records cannot contain credentials, tokens, or private keys."
      );
    if (FORBIDDEN_VALUE.test(value))
      add(
        violations,
        "OVERCLAIM_FORBIDDEN",
        path,
        "S-09 cannot encode scientific proof, parity, or human-level claims."
      );
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scan(entry, `${path}[${index}]`, violations));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => {
      if (FORBIDDEN_KEY.test(key))
        add(
          violations,
          "PII_OR_SECRET_FIELD_FORBIDDEN",
          `${path}.${key}`,
          "Direct identity and secret fields are outside the S-09 contract."
        );
      scan(entry, `${path}.${key}`, violations);
    });
  }
}

function withoutAudit<T extends { readonly auditMetadata?: unknown }>(
  input: T
): Omit<T, "auditMetadata"> {
  const value = { ...input } as T & { auditMetadata?: unknown };
  Reflect.deleteProperty(value, "auditMetadata");
  return value;
}

function environmentMaterial(input: EnvironmentManifestInput | EnvironmentManifest): object {
  const value = withoutAudit(input);
  Reflect.deleteProperty(value as { environmentDigest?: string }, "environmentDigest");
  return {
    ...value,
    dependencies: [...value.dependencies].sort((a, b) =>
      `${a.ecosystem}:${a.lockOrGraphReference}`.localeCompare(
        `${b.ecosystem}:${b.lockOrGraphReference}`
      )
    ),
    toolAvailability: sortedUnique(value.toolAvailability),
    limitations: sortedUnique(value.limitations),
    environmentVariables: {
      ...value.environmentVariables,
      names: sortedUnique(value.environmentVariables.names)
    }
  };
}

function executionMaterial(input: ExecutionManifestInput | ExecutionManifest): object {
  const value = withoutAudit(input);
  Reflect.deleteProperty(value as { manifestDigest?: string }, "manifestDigest");
  return {
    ...value,
    intended: {
      ...value.intended,
      modelEvidenceStatuses: sortedUnique(value.intended.modelEvidenceStatuses)
    },
    observed: {
      ...value.observed,
      modelEvidenceStatuses: sortedUnique(value.observed.modelEvidenceStatuses)
    },
    sourceRevision: {
      ...value.sourceRevision,
      schemaVersions: [...value.sourceRevision.schemaVersions].sort((a, b) =>
        `${a.schemaId}@${a.schemaVersion}`.localeCompare(`${b.schemaId}@${b.schemaVersion}`)
      )
    },
    inputArtifactIds: sortedUnique(value.inputArtifactIds),
    expectedOutputArtifactIds: sortedUnique(value.expectedOutputArtifactIds),
    observedOutputArtifactIds: sortedUnique(value.observedOutputArtifactIds),
    evidenceReferences: sortedUnique(value.evidenceReferences)
  };
}

function recordMaterial(record: EvidenceRecordReference): EvidenceRecordReference {
  return { ...record, provenanceReferences: sortedUnique(record.provenanceReferences) };
}

function artifactMaterial(artifact: ArtifactReference): ArtifactReference {
  return {
    ...artifact,
    provenanceReferences: sortedUnique(artifact.provenanceReferences),
    limitations: sortedUnique(artifact.limitations)
  };
}

function packageMaterial(input: EvidencePackageInput | EvidencePackage): object {
  const value = withoutAudit(input);
  Reflect.deleteProperty(value as { packageDigest?: string }, "packageDigest");
  return {
    ...value,
    executionManifest: {
      ...executionMaterial(value.executionManifest),
      manifestDigest: value.executionManifest.manifestDigest
    },
    environmentManifest: {
      ...environmentMaterial(value.environmentManifest),
      environmentDigest: value.environmentManifest.environmentDigest
    },
    records: [...value.records]
      .map(recordMaterial)
      .sort((a, b) => a.referenceId.localeCompare(b.referenceId)),
    requirements: [...value.requirements].sort((a, b) =>
      a.requirementId.localeCompare(b.requirementId)
    ),
    artifacts: [...value.artifacts]
      .map(artifactMaterial)
      .sort((a, b) => a.artifactId.localeCompare(b.artifactId)),
    completeness: [...value.completeness]
      .map((entry) => ({ ...entry, evidenceReferences: sortedUnique(entry.evidenceReferences) }))
      .sort((a, b) => a.dimension.localeCompare(b.dimension)),
    chain: [...value.chain].sort((a, b) =>
      `${a.fromReference}:${a.relationship}:${a.toReference}`.localeCompare(
        `${b.fromReference}:${b.relationship}:${b.toReference}`
      )
    ),
    limitations: sortedUnique(value.limitations)
  };
}

function validDigest(digest: ContentDigest | SemanticDigest | undefined): boolean {
  return digest !== undefined && digest.algorithm === "SHA_256" && SHA256.test(digest.value);
}

function sameDigest(left: ContentDigest | undefined, right: ContentDigest | undefined): boolean {
  return (
    left !== undefined &&
    right !== undefined &&
    left.algorithm === right.algorithm &&
    left.value.replace(/^sha256:/, "") === right.value.replace(/^sha256:/, "") &&
    left.representation === right.representation
  );
}

function known<T>(value: EvidenceValue<T>): value is Extract<EvidenceValue<T>, { state: "KNOWN" }> {
  return value.state === "KNOWN";
}

function finding(
  code: string,
  severity: VerificationFinding["severity"],
  subjectReference: string,
  expectedState: string,
  rationale: string,
  observedState?: string,
  evidenceReferences: readonly string[] = []
): VerificationFinding {
  return {
    code,
    severity,
    subjectReference,
    expectedState,
    ...(observedState === undefined ? {} : { observedState }),
    evidenceReferences,
    rationale
  };
}

export class EvidenceValidationError extends Error {
  constructor(readonly violations: readonly EvidenceValidationViolation[]) {
    super(violations.map((entry) => `${entry.code}: ${entry.message}`).join("\n"));
    this.name = "EvidenceValidationError";
  }
}

export interface EvidenceIdentityResolver {
  readonly hasBenchmark?: (identity: { benchmarkId: string; benchmarkVersion: string }) => boolean;
  readonly hasMetric?: (identity: { metricId: string; metricVersion: string }) => boolean;
  readonly hasEvaluator?: (identity: { evaluatorId: string; evaluatorVersion: string }) => boolean;
}

export class EvidenceSystem {
  constructor(readonly identities: EvidenceIdentityResolver = {}) {}

  createEnvironmentManifest(input: EnvironmentManifestInput): EnvironmentManifest {
    const violations: EvidenceValidationViolation[] = [];
    if (!input.environmentId || !SEMVER.test(input.environmentVersion))
      add(
        violations,
        "INVALID_ENVIRONMENT_IDENTITY",
        "environment",
        "Environment identity and semantic version are required."
      );
    if (input.schemaVersion !== "1.0.0")
      add(
        violations,
        "UNSUPPORTED_ENVIRONMENT_SCHEMA",
        "environment.schemaVersion",
        "Unknown environment schema versions fail closed."
      );
    if (input.scientificAuthority !== "NONE")
      add(
        violations,
        "SCIENTIFIC_AUTHORITY_FORBIDDEN",
        "environment.scientificAuthority",
        "Environment capture has no scientific authority."
      );
    if (
      input.environmentVariables.classification !== "NAMES_ONLY_NO_VALUES" &&
      input.environmentVariables.names.length > 0
    )
      add(
        violations,
        "ENVIRONMENT_VALUES_FORBIDDEN",
        "environment.environmentVariables",
        "Environment values cannot be captured by S-09."
      );
    if (input.environmentVariables.names.some((name) => /=/.test(name)))
      add(
        violations,
        "ENVIRONMENT_VALUES_FORBIDDEN",
        "environment.environmentVariables.names",
        "Only environment variable names may be recorded."
      );
    for (const [index, dependency] of input.dependencies.entries()) {
      if (!validDigest(dependency.digest))
        add(
          violations,
          "INVALID_DEPENDENCY_DIGEST",
          `environment.dependencies[${index}]`,
          "Dependency evidence requires a valid SHA-256 content digest."
        );
    }
    if (
      input.completeness === "FULLY_CAPTURED" &&
      input.dependencyCompleteness !== "COMPLETE_FOR_DECLARED_SCOPE"
    )
      add(
        violations,
        "FALSE_ENVIRONMENT_COMPLETENESS",
        "environment.completeness",
        "A fully captured environment requires complete dependency evidence for its declared scope."
      );
    scan(input, "environment", violations);
    if (violations.length > 0) throw new EvidenceValidationError(violations);
    return {
      ...input,
      environmentDigest: computeSha256(canonicalJson(environmentMaterial(input)))
    };
  }

  createExecutionManifest(input: ExecutionManifestInput): ExecutionManifest {
    const violations: EvidenceValidationViolation[] = [];
    if (!input.manifestId || !SEMVER.test(input.manifestVersion))
      add(
        violations,
        "INVALID_MANIFEST_IDENTITY",
        "manifest",
        "Execution manifest identity and semantic version are required."
      );
    if (input.schemaVersion !== "1.0.0")
      add(
        violations,
        "UNSUPPORTED_EXECUTION_SCHEMA",
        "manifest.schemaVersion",
        "Unknown execution manifest versions fail closed."
      );
    if (!SHA256.test(input.environmentDigest))
      add(
        violations,
        "INVALID_ENVIRONMENT_REFERENCE",
        "manifest.environmentDigest",
        "Execution must bind a canonical environment digest."
      );
    if (input.executionStatus === "FAILED" && !input.failure)
      add(
        violations,
        "MISSING_FAILURE_EVIDENCE",
        "manifest.failure",
        "Failed executions require a retained failure class and detail."
      );
    if (input.executionStatus !== "FAILED" && input.failure)
      add(
        violations,
        "CONTRADICTED_FAILURE_STATUS",
        "manifest.failure",
        "Failure evidence must not contradict execution status."
      );
    if (
      known(input.benchmarkIdentity) &&
      this.identities.hasBenchmark &&
      !this.identities.hasBenchmark(input.benchmarkIdentity.value)
    )
      add(
        violations,
        "UNKNOWN_BENCHMARK_IDENTITY",
        "manifest.benchmarkIdentity",
        "The referenced S-02 benchmark identity is not registered."
      );
    if (
      known(input.metricIdentity) &&
      this.identities.hasMetric &&
      !this.identities.hasMetric(input.metricIdentity.value)
    )
      add(
        violations,
        "UNKNOWN_METRIC_IDENTITY",
        "manifest.metricIdentity",
        "The referenced S-03 metric identity is not registered."
      );
    if (
      known(input.evaluatorIdentity) &&
      this.identities.hasEvaluator &&
      !this.identities.hasEvaluator(input.evaluatorIdentity.value)
    )
      add(
        violations,
        "UNKNOWN_EVALUATOR_IDENTITY",
        "manifest.evaluatorIdentity",
        "The referenced S-04 evaluator identity is not registered."
      );
    scan(input, "manifest", violations);
    if (violations.length > 0) throw new EvidenceValidationError(violations);
    return { ...input, manifestDigest: computeSha256(canonicalJson(executionMaterial(input))) };
  }

  createEvidencePackage(input: EvidencePackageInput): EvidencePackage {
    const violations: EvidenceValidationViolation[] = [];
    if (!input.packageId || !SEMVER.test(input.packageVersion))
      add(
        violations,
        "INVALID_PACKAGE_IDENTITY",
        "package",
        "Evidence package identity and semantic version are required."
      );
    if (input.schemaVersion !== "1.0.0")
      add(
        violations,
        "UNSUPPORTED_PACKAGE_SCHEMA",
        "package.schemaVersion",
        "Unknown evidence package schemas fail closed."
      );
    if (input.signatureStatus !== "NOT_IMPLEMENTED")
      add(
        violations,
        "SIGNATURE_CLAIM_FORBIDDEN",
        "package.signatureStatus",
        "S-09 does not implement cryptographic signing."
      );
    if (input.scientificAuthority !== "NONE")
      add(
        violations,
        "SCIENTIFIC_AUTHORITY_FORBIDDEN",
        "package.scientificAuthority",
        "Evidence packaging does not grant scientific authority."
      );
    if (input.executionManifest.environmentDigest !== input.environmentManifest.environmentDigest)
      add(
        violations,
        "ENVIRONMENT_LINK_MISMATCH",
        "package.executionManifest.environmentDigest",
        "Execution and package must bind the same environment record."
      );
    const expectedManifest = computeSha256(
      canonicalJson(executionMaterial(input.executionManifest))
    );
    if (input.executionManifest.manifestDigest !== expectedManifest)
      add(
        violations,
        "MANIFEST_DIGEST_MISMATCH",
        "package.executionManifest",
        "Execution manifest content does not match its semantic digest."
      );
    const expectedEnvironment = computeSha256(
      canonicalJson(environmentMaterial(input.environmentManifest))
    );
    if (input.environmentManifest.environmentDigest !== expectedEnvironment)
      add(
        violations,
        "ENVIRONMENT_DIGEST_MISMATCH",
        "package.environmentManifest",
        "Environment content does not match its semantic digest."
      );
    const duplicate = (values: readonly string[]) => new Set(values).size !== values.length;
    if (duplicate(input.records.map((entry) => entry.referenceId)))
      add(
        violations,
        "DUPLICATE_RECORD_REFERENCE",
        "package.records",
        "Evidence reference IDs must be unique."
      );
    if (duplicate(input.artifacts.map((entry) => entry.artifactId)))
      add(
        violations,
        "DUPLICATE_ARTIFACT_REFERENCE",
        "package.artifacts",
        "Artifact IDs must be unique."
      );
    if (duplicate(input.completeness.map((entry) => entry.dimension)))
      add(
        violations,
        "DUPLICATE_COMPLETENESS_DIMENSION",
        "package.completeness",
        "Completeness dimensions may appear once."
      );
    for (const [index, record] of input.records.entries()) {
      if (!(EVIDENCE_RECORD_SCOPES as readonly string[]).includes(record.scope))
        add(
          violations,
          "INVALID_RECORD_SCOPE",
          `package.records[${index}]`,
          "Record scope must use the bounded S-02 through S-09 vocabulary."
        );
      if (!SEMVER.test(record.recordVersion) || !validDigest(record.semanticDigest))
        add(
          violations,
          "INVALID_RECORD_IDENTITY",
          `package.records[${index}]`,
          "Evidence records require explicit version and semantic digest."
        );
    }
    for (const [index, artifact] of input.artifacts.entries()) {
      if (
        !(ARTIFACT_KINDS as readonly string[]).includes(artifact.kind) ||
        !(ARTIFACT_AVAILABILITY as readonly string[]).includes(artifact.availability)
      )
        add(
          violations,
          "INVALID_ARTIFACT_CLASSIFICATION",
          `package.artifacts[${index}]`,
          "Artifact kind and availability must use the canonical vocabulary."
        );
      if (!SEMVER.test(artifact.artifactVersion))
        add(
          violations,
          "INVALID_ARTIFACT_VERSION",
          `package.artifacts[${index}].artifactVersion`,
          "Artifact versions must be explicit."
        );
      if (artifact.contentDigest && !validDigest(artifact.contentDigest))
        add(
          violations,
          "INVALID_ARTIFACT_DIGEST",
          `package.artifacts[${index}].contentDigest`,
          "Artifact digests must be valid SHA-256 content digests."
        );
      if (
        (artifact.availability === "EMBEDDED" || artifact.availability === "AVAILABLE") &&
        !artifact.contentDigest
      )
        add(
          violations,
          "MISSING_ARTIFACT_DIGEST",
          `package.artifacts[${index}]`,
          "Available artifact content requires a content digest."
        );
      if (artifact.availability === "REDACTED" && !artifact.redaction)
        add(
          violations,
          "MISSING_REDACTION_RECORD",
          `package.artifacts[${index}]`,
          "Redacted artifacts require an explicit redaction record."
        );
    }
    if (input.packageMode === "SELF_CONTAINED") {
      const nonPortable = input.artifacts.filter(
        (artifact) =>
          artifact.availability !== "EMBEDDED" ||
          artifact.locationClass !== "EMBEDDED" ||
          artifact.rightsStatus !== "REDISTRIBUTION_ALLOWED"
      );
      if (nonPortable.length > 0)
        add(
          violations,
          "FALSE_SELF_CONTAINED_DECLARATION",
          "package.packageMode",
          "A self-contained package requires every artifact to be embedded and redistributable."
        );
    }
    scan(input, "package", violations);
    if (violations.length > 0) throw new EvidenceValidationError(violations);
    return { ...input, packageDigest: computeSha256(canonicalJson(packageMaterial(input))) };
  }

  packageDigest(input: EvidencePackageInput | EvidencePackage): string {
    return computeSha256(canonicalJson(packageMaterial(input)));
  }
}

export class EvidenceVerifier {
  verify(pkg: EvidencePackage): EvidenceVerificationResult {
    const findings: VerificationFinding[] = [];
    const expectedPackageDigest = computeSha256(canonicalJson(packageMaterial(pkg)));
    if (pkg.packageDigest !== expectedPackageDigest)
      findings.push(
        finding(
          "PACKAGE_DIGEST_MISMATCH",
          "ERROR",
          pkg.packageId,
          expectedPackageDigest,
          "Package material changed after its digest was created.",
          pkg.packageDigest
        )
      );
    const expectedManifestDigest = computeSha256(
      canonicalJson(executionMaterial(pkg.executionManifest))
    );
    if (pkg.executionManifest.manifestDigest !== expectedManifestDigest)
      findings.push(
        finding(
          "MANIFEST_DIGEST_MISMATCH",
          "ERROR",
          pkg.executionManifest.manifestId,
          expectedManifestDigest,
          "Execution manifest material is inconsistent.",
          pkg.executionManifest.manifestDigest
        )
      );
    const expectedEnvironmentDigest = computeSha256(
      canonicalJson(environmentMaterial(pkg.environmentManifest))
    );
    if (pkg.environmentManifest.environmentDigest !== expectedEnvironmentDigest)
      findings.push(
        finding(
          "ENVIRONMENT_DIGEST_MISMATCH",
          "ERROR",
          pkg.environmentManifest.environmentId,
          expectedEnvironmentDigest,
          "Environment material is inconsistent.",
          pkg.environmentManifest.environmentDigest
        )
      );
    if (pkg.executionManifest.environmentDigest !== pkg.environmentManifest.environmentDigest)
      findings.push(
        finding(
          "ENVIRONMENT_LINK_MISMATCH",
          "ERROR",
          pkg.executionManifest.executionId,
          pkg.environmentManifest.environmentDigest,
          "Execution points to a different environment.",
          pkg.executionManifest.environmentDigest
        )
      );

    const resolvable = new Set<string>([
      pkg.target.referenceId,
      pkg.executionManifest.executionId,
      pkg.executionManifest.manifestId,
      pkg.environmentManifest.environmentId,
      ...pkg.records.map((entry) => entry.referenceId),
      ...pkg.artifacts.map((entry) => entry.artifactId),
      ...pkg.executionManifest.evidenceReferences
    ]);
    const missingEvidence = pkg.requirements
      .filter((entry) => !resolvable.has(entry.referenceId))
      .map((entry) => entry.referenceId);
    for (const missing of missingEvidence)
      findings.push(
        finding(
          "UNRESOLVED_REQUIRED_REFERENCE",
          "ERROR",
          missing,
          "RESOLVABLE",
          "A declared evidence requirement has no package record or artifact.",
          "MISSING"
        )
      );
    for (const link of pkg.chain) {
      if (!resolvable.has(link.fromReference) || !resolvable.has(link.toReference))
        findings.push(
          finding(
            "BROKEN_EVIDENCE_CHAIN",
            "ERROR",
            `${link.fromReference}->${link.toReference}`,
            "BOTH_ENDPOINTS_RESOLVABLE",
            "Typed evidence chain contains an unresolved endpoint."
          )
        );
    }
    if (
      pkg.target.scope === "RESULT" &&
      !pkg.chain.some(
        (link) =>
          link.fromReference === pkg.executionManifest.executionId &&
          link.relationship === "PRODUCED" &&
          link.toReference === pkg.target.referenceId
      )
    )
      findings.push(
        finding(
          "RESULT_EXECUTION_LINK_MISSING",
          "ERROR",
          pkg.target.referenceId,
          "PRODUCED_BY_BOUND_EXECUTION",
          "A result must remain linked to the exact execution that produced it."
        )
      );
    const requiredScope = (
      scope: EvidenceRecordReference["scope"],
      recordId: string,
      recordVersion: string
    ) =>
      pkg.records.some(
        (entry) =>
          entry.scope === scope &&
          entry.recordId === recordId &&
          entry.recordVersion === recordVersion
      );
    if (
      known(pkg.executionManifest.benchmarkIdentity) &&
      !requiredScope(
        "BENCHMARK_S02",
        pkg.executionManifest.benchmarkIdentity.value.benchmarkId,
        pkg.executionManifest.benchmarkIdentity.value.benchmarkVersion
      )
    )
      findings.push(
        finding(
          "BENCHMARK_LINEAGE_MISMATCH",
          "ERROR",
          pkg.executionManifest.executionId,
          "EXACT_S02_IDENTITY",
          "The execution benchmark identity has no exact S-02 record."
        )
      );
    if (
      known(pkg.executionManifest.metricIdentity) &&
      !requiredScope(
        "METRIC_S03",
        pkg.executionManifest.metricIdentity.value.metricId,
        pkg.executionManifest.metricIdentity.value.metricVersion
      )
    )
      findings.push(
        finding(
          "METRIC_LINEAGE_MISMATCH",
          "ERROR",
          pkg.executionManifest.executionId,
          "EXACT_S03_IDENTITY",
          "The execution metric identity has no exact S-03 record."
        )
      );
    if (
      known(pkg.executionManifest.evaluatorIdentity) &&
      !requiredScope(
        "EVALUATOR_S04",
        pkg.executionManifest.evaluatorIdentity.value.evaluatorId,
        pkg.executionManifest.evaluatorIdentity.value.evaluatorVersion
      )
    )
      findings.push(
        finding(
          "EVALUATOR_LINEAGE_MISMATCH",
          "ERROR",
          pkg.executionManifest.executionId,
          "EXACT_S04_IDENTITY",
          "The execution evaluator identity has no exact S-04 record."
        )
      );
    const targetRequirements: readonly [string, EvidenceRecordReference["scope"]][] = [
      ["RELIABILITY", "RELIABILITY_S05"],
      ["HUMAN_RATER", "HUMAN_RATER_S06"],
      ["HUMAN_SUBJECT", "HUMAN_SUBJECT_S07"],
      ["HUMAN_AI_COMPARISON", "HUMAN_AI_COMPARISON_S08"]
    ];
    for (const [marker, scope] of targetRequirements) {
      if (
        pkg.target.claimOrResultType.includes(marker) &&
        !pkg.records.some((entry) => entry.scope === scope && entry.availability !== "UNKNOWN")
      )
        findings.push(
          finding(
            "DOMAIN_LINEAGE_MISSING",
            "ERROR",
            pkg.target.referenceId,
            scope,
            `The ${marker} target is detached from its canonical phase lineage.`
          )
        );
    }
    for (const artifact of pkg.artifacts) {
      if (
        artifact.observedContentDigest &&
        !sameDigest(artifact.contentDigest, artifact.observedContentDigest)
      )
        findings.push(
          finding(
            "ARTIFACT_DIGEST_MISMATCH",
            "ERROR",
            artifact.artifactId,
            artifact.contentDigest?.value ?? "DECLARED_DIGEST",
            "Observed artifact content does not match the declared content digest.",
            artifact.observedContentDigest.value,
            artifact.provenanceReferences
          )
        );
    }
    const restrictedEvidence = [
      ...pkg.records
        .filter((entry) => ["RESTRICTED", "REDACTED"].includes(entry.availability))
        .map((entry) => entry.referenceId),
      ...pkg.artifacts
        .filter((entry) => ["RESTRICTED", "REDACTED"].includes(entry.availability))
        .map((entry) => entry.artifactId)
    ];
    for (const reference of restrictedEvidence)
      findings.push(
        finding(
          "RESTRICTED_EVIDENCE",
          "WARNING",
          reference,
          "DECLARED_LIMITATION",
          "Restricted or redacted evidence limits independent inspection.",
          "RESTRICTED"
        )
      );
    if (
      pkg.packageMode === "SELF_CONTAINED" &&
      pkg.artifacts.some(
        (entry) => entry.availability !== "EMBEDDED" || entry.locationClass !== "EMBEDDED"
      )
    )
      findings.push(
        finding(
          "FALSE_SELF_CONTAINED_DECLARATION",
          "ERROR",
          pkg.packageId,
          "ALL_ARTIFACTS_EMBEDDED",
          "The package mode overstates artifact availability."
        )
      );
    const incompleteCritical = pkg.completeness.filter(
      (entry) => entry.critical && !["COMPLETE", "NOT_APPLICABLE"].includes(entry.status)
    );
    for (const entry of incompleteCritical)
      findings.push(
        finding(
          "CRITICAL_EVIDENCE_INCOMPLETE",
          entry.status === "MISSING" ? "ERROR" : "WARNING",
          entry.dimension,
          "COMPLETE_OR_NOT_APPLICABLE",
          entry.rationale,
          entry.status,
          entry.evidenceReferences
        )
      );
    const unknownDimensions = EVIDENCE_COMPLETENESS_DIMENSIONS.filter(
      (dimension) => !pkg.completeness.some((entry) => entry.dimension === dimension)
    );
    for (const dimension of unknownDimensions)
      findings.push(
        finding(
          "COMPLETENESS_NOT_ASSESSED",
          "WARNING",
          dimension,
          "EXPLICIT_STATUS",
          "Evidence completeness is dimensional; absent dimensions remain unknown."
        )
      );

    const schemaValid =
      pkg.schemaVersion === "1.0.0" &&
      pkg.executionManifest.schemaVersion === "1.0.0" &&
      pkg.environmentManifest.schemaVersion === "1.0.0";
    if (!schemaValid)
      findings.push(
        finding(
          "UNSUPPORTED_SCHEMA",
          "ERROR",
          pkg.packageId,
          "1.0.0",
          "Unknown schemas cannot be verified as current."
        )
      );
    const errors = findings.filter((entry) => entry.severity === "ERROR");
    const warnings = findings.filter((entry) => entry.severity === "WARNING");
    const digestConsistent = !findings.some((entry) => entry.code.includes("DIGEST_MISMATCH"));
    const referenceClosure = !findings.some(
      (entry) =>
        entry.code === "UNRESOLVED_REQUIRED_REFERENCE" || entry.code === "BROKEN_EVIDENCE_CHAIN"
    );
    const outcome =
      errors.length > 0
        ? "VERIFICATION_FAILED"
        : warnings.length > 0
          ? "PARTIALLY_VERIFIED"
          : pkg.records.length === 0
            ? "INSUFFICIENT_EVIDENCE"
            : "VERIFIED_INTERNAL_CONSISTENCY";
    return {
      packageId: pkg.packageId,
      packageDigest: pkg.packageDigest,
      outcome,
      authority: "INTERNAL_CONSISTENCY_ONLY",
      schemaValid,
      digestConsistent,
      referenceClosure,
      findings,
      missingEvidence,
      restrictedEvidence,
      scientificAuthority: "NONE"
    };
  }

  assessReplay(pkg: EvidencePackage): ReplayAssessment {
    const verification = this.verify(pkg);
    const blockers: string[] = [];
    const limitations: string[] = [];
    const manifest = pkg.executionManifest;
    if (verification.outcome === "VERIFICATION_FAILED") blockers.push("VERIFICATION_FAILED");
    if (pkg.determinismClass === "HUMAN_NONREPLAYABLE")
      blockers.push("HUMAN_EXECUTION_NONREPLAYABLE");
    if (pkg.determinismClass === "UNKNOWN") blockers.push("DETERMINISM_UNKNOWN");
    if (pkg.determinismClass === "EXTERNAL_NONDETERMINISTIC")
      blockers.push("EXTERNAL_PROVIDER_NONDETERMINISTIC");
    if (
      pkg.determinismClass === "SEEDED_REPLAY_EXPECTED" &&
      !known(manifest.observed.randomization.seed)
    )
      blockers.push("OBSERVED_SEED_UNAVAILABLE");
    if (
      pkg.determinismClass === "DETERMINISTIC_REPLAY_EXPECTED" &&
      (!known(pkg.evaluatorDeterminism) || pkg.evaluatorDeterminism.value !== "DETERMINISTIC")
    )
      blockers.push("FALSE_DETERMINISTIC_REPLAY_DECLARATION");
    for (const condition of [manifest.intended, manifest.observed]) {
      if (known(condition.model) && condition.model.value.snapshotStatus !== "DECLARED_IMMUTABLE")
        blockers.push("MODEL_SNAPSHOT_NOT_IMMUTABLE");
      if (condition.modelEvidenceStatuses.includes("SNAPSHOT_UNKNOWN"))
        blockers.push("MODEL_SNAPSHOT_UNKNOWN");
      if (condition.modelEvidenceStatuses.includes("PROVIDER_NONDETERMINISTIC"))
        blockers.push("PROVIDER_NONDETERMINISTIC");
      if (condition.modelEvidenceStatuses.includes("PROVIDER_STATE_UNAVAILABLE"))
        blockers.push("PROVIDER_STATE_UNAVAILABLE");
    }
    if (!known(manifest.sourceRevision.gitCommit) || !known(manifest.sourceRevision.gitTree))
      blockers.push("SOURCE_REVISION_INCOMPLETE");
    if (!known(manifest.observed.configurationDigest))
      blockers.push("OBSERVED_CONFIGURATION_UNAVAILABLE");
    const inputIds = new Set(manifest.inputArtifactIds);
    const inputs = pkg.artifacts.filter((entry) => inputIds.has(entry.artifactId));
    for (const input of inputs) {
      if (["UNAVAILABLE", "UNKNOWN"].includes(input.availability))
        blockers.push(`INPUT_UNAVAILABLE:${input.artifactId}`);
      if (["RESTRICTED", "REDACTED", "REFERENCED"].includes(input.availability))
        limitations.push(`INPUT_LIMITED:${input.artifactId}`);
    }
    if (inputs.length !== inputIds.size) blockers.push("MISSING_INPUT_REFERENCE");
    if (pkg.environmentManifest.completeness !== "FULLY_CAPTURED")
      limitations.push("ENVIRONMENT_NOT_FULLY_CAPTURED");
    if (pkg.environmentManifest.dependencyCompleteness !== "COMPLETE_FOR_DECLARED_SCOPE")
      limitations.push("DEPENDENCY_STATE_INCOMPLETE");
    if (
      ["EXTERNAL_PROVIDER", "EXTERNAL_DATA_SOURCE", "UNKNOWN"].includes(
        pkg.environmentManifest.networkDependency
      )
    )
      limitations.push("EXTERNAL_STATE_REQUIRED");
    const availableInputs = inputs
      .filter((entry) => ["AVAILABLE", "EMBEDDED"].includes(entry.availability))
      .map((entry) => entry.artifactId);
    let outcome: ReplayAssessment["outcome"];
    if (manifest.executionStatus === "NOT_APPLICABLE") outcome = "NOT_APPLICABLE";
    else if (blockers.length > 0) outcome = "REPLAY_BLOCKED";
    else if (limitations.length > 0) outcome = "LIMITED_REPLAY_POSSIBLE";
    else outcome = "READY_FOR_REPLAY";
    return {
      packageDigest: pkg.packageDigest,
      outcome,
      determinismClass: pkg.determinismClass,
      blockers: sortedUnique(blockers),
      availableInputs: sortedUnique(availableInputs),
      limitations: sortedUnique(limitations),
      replayIsReproduction: false,
      scientificAuthority: "NONE"
    };
  }

  recordReproduction(pkg: EvidencePackage, input: ReproductionAttemptInput): ReproductionAttempt {
    const violations: EvidenceValidationViolation[] = [];
    if (input.originalPackageDigest !== pkg.packageDigest)
      add(
        violations,
        "ORIGINAL_PACKAGE_MISMATCH",
        "attempt.originalPackageDigest",
        "A reproduction attempt must retain its exact original package."
      );
    if (!SEMVER.test(input.attemptVersion) || !SEMVER.test(input.equivalenceRule.ruleVersion))
      add(
        violations,
        "INVALID_REPRODUCTION_VERSION",
        "attempt",
        "Attempt and equivalence rule versions must be explicit."
      );
    if (!input.equivalenceRule.justification.trim())
      add(
        violations,
        "MISSING_EQUIVALENCE_JUSTIFICATION",
        "attempt.equivalenceRule",
        "Equivalence must be result-specific and justified."
      );
    if (
      input.equivalenceRule.method === "DECLARED_NUMERIC_TOLERANCE" &&
      (input.equivalenceRule.resultType !== "NUMERIC" ||
        input.equivalenceRule.tolerance === undefined ||
        input.equivalenceRule.tolerance < 0 ||
        !Number.isFinite(input.equivalenceRule.tolerance))
    )
      add(
        violations,
        "INVALID_NUMERIC_TOLERANCE",
        "attempt.equivalenceRule",
        "Numeric tolerance must be finite, nonnegative, declared, versioned, and numeric-result-specific."
      );
    if (
      input.equivalenceRule.method !== "DECLARED_NUMERIC_TOLERANCE" &&
      input.equivalenceRule.tolerance !== undefined
    )
      add(
        violations,
        "UNSCOPED_NUMERIC_TOLERANCE",
        "attempt.equivalenceRule.tolerance",
        "A tolerance cannot be applied outside a numeric tolerance rule."
      );
    scan(input, "attempt", violations);
    if (violations.length > 0) throw new EvidenceValidationError(violations);
    let outcome: ReproductionOutcome = "INSUFFICIENT_EVIDENCE";
    const originalKnown = known(input.originalResultDigest);
    const reproducedKnown = known(input.reproducedResultDigest);
    if (input.equivalenceRule.method === "EXACT" && originalKnown && reproducedKnown) {
      outcome =
        input.originalResultDigest.value === input.reproducedResultDigest.value &&
        input.reproductionExecutionManifestDigest === pkg.executionManifest.manifestDigest &&
        input.reproductionEnvironmentDigest === pkg.environmentManifest.environmentDigest
          ? "EXACT_MATCH"
          : "MATERIAL_DIFFERENCE";
    } else if (input.equivalenceRule.method === "SEMANTIC" && originalKnown && reproducedKnown) {
      outcome =
        input.originalResultDigest.value === input.reproducedResultDigest.value
          ? "SEMANTICALLY_EQUIVALENT"
          : "MATERIAL_DIFFERENCE";
    } else if (
      input.equivalenceRule.method === "DECLARED_NUMERIC_TOLERANCE" &&
      input.originalNumericValue !== undefined &&
      input.reproducedNumericValue !== undefined &&
      input.equivalenceRule.tolerance !== undefined
    ) {
      outcome =
        Math.abs(input.originalNumericValue - input.reproducedNumericValue) <=
        input.equivalenceRule.tolerance
          ? "WITHIN_DECLARED_TOLERANCE"
          : "MATERIAL_DIFFERENCE";
    } else if (
      input.equivalenceRule.method === "PROTOCOL_LEVEL" &&
      originalKnown &&
      reproducedKnown
    ) {
      outcome =
        input.originalResultDigest.value === input.reproducedResultDigest.value
          ? "SEMANTICALLY_EQUIVALENT"
          : "NOT_COMPARABLE";
    }
    const material = {
      ...input,
      outcome,
      replicationStatus: "NOT_PERFORMED" as const,
      scientificAuthority: "NONE" as const
    };
    return { ...material, attemptDigest: computeSha256(canonicalJson(material)) };
  }
}
