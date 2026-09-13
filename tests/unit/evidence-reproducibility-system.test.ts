import { describe, expect, it } from "vitest";
import {
  EVIDENCE_COMPLETENESS_DIMENSIONS,
  EvidenceSystem,
  EvidenceVerifier,
  S09_ANTI_OVERCLAIM_INVARIANTS,
  S09_DISCOVERED_MECHANISMS,
  S09_REPRESENTATIVE_CASES,
  S09_SCIENTIFIC_AUTHORITY,
  S09_SIGNATURE_STATUS,
  S09_VERIFIER_AUTHORITY,
  type ArtifactReference,
  type EnvironmentManifest,
  type EvidencePackage,
  type EvidencePackageInput,
  type EvidenceValue,
  type ExecutionManifest,
  type ReproductionAttemptInput
} from "../../packages/benchmark/src/index.js";

const sha = (character: string) => character.repeat(64);
const known = <T>(value: T): EvidenceValue<T> => ({
  state: "KNOWN",
  value,
  evidenceReferences: ["synthetic:s09"]
});
const na = (reason = "Not applicable to this synthetic engineering run.") => ({
  state: "NOT_APPLICABLE" as const,
  reason
});

const system = new EvidenceSystem({
  hasBenchmark: (identity) =>
    identity.benchmarkId === "provider_tck" && identity.benchmarkVersion === "0.1.0",
  hasMetric: (identity) =>
    identity.metricId === "provider_tck_passed_tests" && identity.metricVersion === "0.1.0",
  hasEvaluator: (identity) =>
    identity.evaluatorId === "provider_tck_assertion" && identity.evaluatorVersion === "0.1.0"
});
const verifier = new EvidenceVerifier();
const equivalenceRuleContractVersion = "1.0.0";

function artifact(overrides: Partial<ArtifactReference> = {}): ArtifactReference {
  return {
    artifactId: "input:fixture",
    artifactVersion: "1.0.0",
    kind: "INPUT",
    contentDigest: { algorithm: "SHA_256", value: sha("a"), representation: "ORIGINAL_BYTES" },
    observedContentDigest: {
      algorithm: "SHA_256",
      value: sha("a"),
      representation: "ORIGINAL_BYTES"
    },
    mediaType: "application/json",
    sizeBytes: 128,
    availability: "EMBEDDED",
    locationClass: "EMBEDDED",
    rightsStatus: "REDISTRIBUTION_ALLOWED",
    provenanceReferences: ["synthetic:s09"],
    limitations: [],
    ...overrides
  };
}

function environment(overrides: Record<string, unknown> = {}): EnvironmentManifest {
  return system.createEnvironmentManifest({
    environmentId: "environment:local-node",
    environmentVersion: "1.0.0",
    schemaVersion: "1.0.0",
    platform: known("linux"),
    architecture: known("x64"),
    runtime: known("node"),
    runtimeVersion: known("22.0.0"),
    containerImageDigest: na(),
    hardwareClass: known("general-purpose-cpu"),
    acceleratorClass: na(),
    locale: known("C.UTF-8"),
    timezonePolicy: known("UTC"),
    environmentVariables: { classification: "NAMES_ONLY_NO_VALUES", names: ["CI"] },
    dependencies: [
      {
        ecosystem: "NODE",
        lockOrGraphReference: "artifact:pnpm-lock",
        digest: { algorithm: "SHA_256", value: sha("b"), representation: "ORIGINAL_BYTES" },
        completeness: "COMPLETE_FOR_DECLARED_SCOPE"
      }
    ],
    dependencyCompleteness: "COMPLETE_FOR_DECLARED_SCOPE",
    networkDependency: "NO_NETWORK",
    toolAvailability: ["node", "vitest"],
    completeness: "FULLY_CAPTURED",
    limitations: ["Synthetic fixture; no empirical claim."],
    scientificAuthority: "NONE",
    auditMetadata: { recordedAt: "2026-09-13T00:00:00Z", requestId: "audit-one" },
    ...overrides
  } as never);
}

function manifest(
  env: EnvironmentManifest,
  overrides: Record<string, unknown> = {}
): ExecutionManifest {
  const randomization = {
    policy: na(),
    algorithm: na(),
    seed: na(),
    scope: na(),
    implementationVersion: na()
  };
  const conditions = {
    configurationReference: known("configuration:provider-tck"),
    configurationDigest: known(sha("c")),
    language: known("en"),
    toolPolicy: known("NO_EXTERNAL_TOOLS"),
    model: na(),
    modelEvidenceStatuses: [],
    samplingConfigurationReference: na(),
    randomization
  };
  return system.createExecutionManifest({
    manifestId: "manifest:provider-tck-run",
    manifestVersion: "1.0.0",
    schemaVersion: "1.0.0",
    executionId: "execution:provider-tck-run",
    executionStatus: "SUCCEEDED",
    targetReference: "result:provider-tck-run",
    benchmarkIdentity: known({ benchmarkId: "provider_tck", benchmarkVersion: "0.1.0" }),
    itemIdentity: known({ itemId: "provider-tck-contract", itemVersion: "1.0.0" }),
    constructReference: known("provider_contract_conformance"),
    metricIdentity: known({ metricId: "provider_tck_passed_tests", metricVersion: "0.1.0" }),
    evaluatorIdentity: known({ evaluatorId: "provider_tck_assertion", evaluatorVersion: "0.1.0" }),
    studyProtocolReference: na(),
    comparisonDefinitionReference: na(),
    intended: conditions,
    observed: conditions,
    environmentDigest: env.environmentDigest,
    sourceRevision: {
      gitCommit: known(sha("d")),
      gitTree: known(sha("e")),
      packageVersion: known("0.1.0-alpha.2"),
      schemaVersions: [{ schemaId: "evidence-package", schemaVersion: "1.0.0" }]
    },
    inputArtifactIds: ["input:fixture"],
    expectedOutputArtifactIds: ["output:result"],
    observedOutputArtifactIds: ["output:result"],
    evidenceReferences: ["benchmark:provider-tck", "metric:provider-tck", "evaluator:provider-tck"],
    scientificAuthority: "NONE",
    auditMetadata: { executedAt: "2026-09-13T00:00:01Z", requestId: "run-one" },
    ...overrides
  } as never);
}

function packageFixture(overrides: Record<string, unknown> = {}): EvidencePackage {
  const env = (overrides.environmentManifest as EnvironmentManifest | undefined) ?? environment();
  const run = (overrides.executionManifest as ExecutionManifest | undefined) ?? manifest(env);
  const artifacts = (overrides.artifacts as readonly ArtifactReference[] | undefined) ?? [
    artifact(),
    artifact({
      artifactId: "output:result",
      kind: "OUTPUT",
      contentDigest: { algorithm: "SHA_256", value: sha("f"), representation: "CANONICAL_JSON" },
      observedContentDigest: {
        algorithm: "SHA_256",
        value: sha("f"),
        representation: "CANONICAL_JSON"
      }
    })
  ];
  const canonicalRecordVersion = "1.0.0";
  const records = [
    ["benchmark:provider-tck", "BENCHMARK_S02", "provider_tck", "0.1.0", "1"],
    ["metric:provider-tck", "METRIC_S03", "provider_tck_passed_tests", "0.1.0", "2"],
    ["evaluator:provider-tck", "EVALUATOR_S04", "provider_tck_assertion", "0.1.0", "3"],
    ["reliability:provider-tck", "RELIABILITY_S05", "provider_tck_repeatability", "0.1.0", "4"],
    ["human-rater:none", "HUMAN_RATER_S06", "not_applicable", canonicalRecordVersion, "5"],
    ["human-subject:none", "HUMAN_SUBJECT_S07", "not_applicable", canonicalRecordVersion, "6"],
    ["comparison:none", "HUMAN_AI_COMPARISON_S08", "not_applicable", canonicalRecordVersion, "7"],
    ["result:provider-tck-run", "RESULT", "provider_tck_result", canonicalRecordVersion, "8"]
  ].map(([referenceId, scope, recordId, recordVersion, digit]) => ({
    referenceId: referenceId!,
    scope: scope! as never,
    recordId: recordId!,
    recordVersion: recordVersion!,
    semanticDigest: {
      algorithm: "SHA_256" as const,
      value: sha(digit!),
      canonicalizationProfile: "semantiq-canonical-json-v1" as const
    },
    availability: "AVAILABLE" as const,
    provenanceReferences: ["synthetic:s09"]
  }));
  const input: EvidencePackageInput = {
    packageId: "evidence-package:provider-tck-run",
    packageVersion: "1.0.0",
    schemaVersion: "1.0.0",
    packageMode: "SELF_CONTAINED",
    target: {
      referenceId: "result:provider-tck-run",
      scope: "RESULT",
      claimOrResultType: "ENGINEERING_CONFORMANCE_RESULT"
    },
    records,
    requirements: [
      {
        requirementId: "required-input",
        purpose: "ENGINEERING_CONFORMANCE",
        referenceId: "input:fixture",
        critical: true
      },
      {
        requirementId: "required-output",
        purpose: "ENGINEERING_CONFORMANCE",
        referenceId: "output:result",
        critical: true
      }
    ],
    artifacts,
    executionManifest: run,
    environmentManifest: env,
    completeness: EVIDENCE_COMPLETENESS_DIMENSIONS.map((dimension) => ({
      dimension,
      status: ["HUMAN_PROTOCOL", "COMPARABILITY", "VALIDITY"].includes(dimension)
        ? ("NOT_APPLICABLE" as const)
        : ("COMPLETE" as const),
      critical: [
        "IDENTITY",
        "INPUT",
        "CONFIGURATION",
        "EXECUTION",
        "OUTPUT",
        "ENVIRONMENT"
      ].includes(dimension),
      evidenceReferences: ["synthetic:s09"],
      rationale: "Synthetic evidence explicitly accounts for this dimension."
    })),
    chain: [
      {
        fromReference: "benchmark:provider-tck",
        relationship: "USED_INPUT",
        toReference: "input:fixture"
      },
      {
        fromReference: "input:fixture",
        relationship: "EXECUTED_AS",
        toReference: "execution:provider-tck-run"
      },
      {
        fromReference: "execution:provider-tck-run",
        relationship: "PRODUCED",
        toReference: "result:provider-tck-run"
      },
      {
        fromReference: "result:provider-tck-run",
        relationship: "SUPPORTED_BY",
        toReference: "output:result"
      }
    ],
    determinismClass: "DETERMINISTIC_REPLAY_EXPECTED",
    evaluatorDeterminism: known("DETERMINISTIC"),
    reproducibilityStatus: "MANIFEST_COMPLETE",
    signatureStatus: "NOT_IMPLEMENTED",
    limitations: ["Internal consistency only; no scientific validity claim."],
    scientificAuthority: "NONE"
  };
  return system.createEvidencePackage({ ...input, ...overrides } as EvidencePackageInput);
}

describe("S-09 terminology and anti-overclaim invariants", () => {
  it.each(S09_ANTI_OVERCLAIM_INVARIANTS)("preserves %s", (invariant) => {
    expect(invariant).toMatch(/!=/);
  });

  it("fixes verifier and scientific authority to bounded values", () => {
    expect(S09_SCIENTIFIC_AUTHORITY).toBe("NONE");
    expect(S09_VERIFIER_AUTHORITY).toBe("INTERNAL_CONSISTENCY_ONLY");
    expect(S09_SIGNATURE_STATUS).toBe("NOT_IMPLEMENTED");
  });

  it("classifies prior mechanisms without transferring authority", () => {
    expect(
      S09_DISCOVERED_MECHANISMS.find(
        (entry) => entry.mechanism === "legacy digest-shaped package signature"
      )?.classification
    ).toBe("CONFLICTING");
    expect(
      S09_DISCOVERED_MECHANISMS.find(
        (entry) => entry.mechanism === "sandbox-contracts canonicalJson/computeSha256"
      )?.classification
    ).toBe("CANONICAL_CURRENT");
  });
});

describe("S-09 canonical manifests and package", () => {
  it("creates an internally consistent, replayable local engineering package", () => {
    const pkg = packageFixture();
    expect(verifier.verify(pkg)).toMatchObject({
      outcome: "VERIFIED_INTERNAL_CONSISTENCY",
      authority: "INTERNAL_CONSISTENCY_ONLY",
      schemaValid: true,
      digestConsistent: true,
      referenceClosure: true,
      scientificAuthority: "NONE"
    });
    expect(verifier.assessReplay(pkg)).toMatchObject({
      outcome: "READY_FOR_REPLAY",
      replayIsReproduction: false,
      scientificAuthority: "NONE"
    });
  });

  it("canonicalizes set-like fields and ignores audit timestamps/request IDs", () => {
    const first = environment();
    const second = environment({
      toolAvailability: [...first.toolAvailability].reverse(),
      auditMetadata: { recordedAt: "2099-01-01T00:00:00Z", requestId: "other" }
    });
    expect(second.environmentDigest).toBe(first.environmentDigest);
    const runOne = manifest(first);
    const runTwo = manifest(second, {
      evidenceReferences: [...runOne.evidenceReferences].reverse(),
      auditMetadata: { executedAt: "2099-01-01T00:00:00Z" }
    });
    expect(runTwo.manifestDigest).toBe(runOne.manifestDigest);
    const packageOne = packageFixture({ environmentManifest: first, executionManifest: runOne });
    const packageTwo = packageFixture({
      environmentManifest: second,
      executionManifest: runTwo,
      records: [...packageOne.records].reverse(),
      completeness: [...packageOne.completeness].reverse(),
      auditMetadata: { createdAt: "2099-01-01T00:00:00Z" }
    });
    expect(packageTwo.packageDigest).toBe(packageOne.packageDigest);
  });

  it("changes semantic digests when material execution configuration changes", () => {
    const env = environment();
    const original = manifest(env);
    const changed = manifest(env, {
      observed: { ...original.observed, configurationDigest: known(sha("9")) }
    });
    expect(changed.manifestDigest).not.toBe(original.manifestDigest);
  });

  it("preserves intended and observed execution separately", () => {
    const env = environment();
    const original = manifest(env);
    const changed = manifest(env, {
      observed: { ...original.observed, toolPolicy: known("NETWORK_ALLOWED") }
    });
    expect(changed.intended.toolPolicy).not.toEqual(changed.observed.toolPolicy);
  });

  it("preserves failed executions as evidence", () => {
    const env = environment();
    const failed = manifest(env, {
      executionStatus: "FAILED",
      failure: {
        failureClass: "ASSERTION_FAILURE",
        detail: "Expected fixture outcome was not produced."
      },
      observedOutputArtifactIds: []
    });
    const pkg = packageFixture({ environmentManifest: env, executionManifest: failed });
    expect(pkg.executionManifest.failure?.failureClass).toBe("ASSERTION_FAILURE");
    expect(verifier.verify(pkg).outcome).toBe("VERIFIED_INTERNAL_CONSISTENCY");
  });
});

describe("S-09 verification fails closed", () => {
  it("detects artifact content mismatch", () => {
    const pkg = packageFixture();
    const tampered = {
      ...pkg,
      artifacts: pkg.artifacts.map((entry) =>
        entry.artifactId === "input:fixture"
          ? {
              ...entry,
              observedContentDigest: {
                algorithm: "SHA_256" as const,
                value: sha("0"),
                representation: "ORIGINAL_BYTES" as const
              }
            }
          : entry
      )
    };
    expect(verifier.verify(tampered)).toMatchObject({
      outcome: "VERIFICATION_FAILED",
      digestConsistent: false
    });
    expect(verifier.verify(tampered).findings.map((entry) => entry.code)).toContain(
      "ARTIFACT_DIGEST_MISMATCH"
    );
  });

  it("rejects unresolved required evidence and broken chain links", () => {
    const pkg = packageFixture();
    const tampered = {
      ...pkg,
      requirements: [
        ...pkg.requirements,
        {
          requirementId: "missing",
          purpose: "ENGINEERING_CONFORMANCE" as const,
          referenceId: "artifact:missing",
          critical: true
        }
      ],
      chain: [
        ...pkg.chain,
        {
          fromReference: "artifact:missing",
          relationship: "SUPPORTED_BY" as const,
          toReference: pkg.target.referenceId
        }
      ]
    };
    const output = verifier.verify(tampered);
    expect(output.outcome).toBe("VERIFICATION_FAILED");
    expect(output.referenceClosure).toBe(false);
  });

  it("rejects a false self-contained package", () => {
    const limited = artifact({
      availability: "RESTRICTED",
      locationClass: "EXTERNAL_REFERENCE",
      rightsStatus: "RESTRICTED"
    });
    expect(() =>
      packageFixture({
        artifacts: [limited, artifact({ artifactId: "output:result", kind: "OUTPUT" })]
      })
    ).toThrowError(/FALSE_SELF_CONTAINED_DECLARATION/);
  });

  it.each([
    [
      "private path",
      { limitations: [["C:", "Users", "synthetic-subject", "private", "result.json"].join("\\")] },
      "PRIVATE_PATH_FORBIDDEN"
    ],
    [
      "secret",
      { limitations: [["api", "key"].join("_") + "=" + "synthetic-secret-material"] },
      "CREDENTIAL_FORBIDDEN"
    ],
    [
      "PII key",
      { auditMetadata: { email: "person@example.invalid" } },
      "PII_OR_SECRET_FIELD_FORBIDDEN"
    ]
  ])("rejects %s material", (_name, overrides, code) => {
    expect(() => packageFixture(overrides)).toThrowError(new RegExp(code));
  });

  it("rejects unknown canonical identities when a registry resolver is supplied", () => {
    const env = environment();
    expect(() =>
      manifest(env, {
        benchmarkIdentity: known({ benchmarkId: "unknown", benchmarkVersion: "9.9.9" })
      })
    ).toThrowError(/UNKNOWN_BENCHMARK_IDENTITY/);
  });

  it("rejects unknown schema versions without silently parsing them", () => {
    const env = environment();
    expect(() =>
      system.createExecutionManifest({ ...manifest(env), schemaVersion: "2.0.0" } as never)
    ).toThrowError(/UNSUPPORTED_EXECUTION_SCHEMA/);
  });

  it("rejects false exact-environment completeness", () => {
    expect(() =>
      environment({ completeness: "FULLY_CAPTURED", dependencyCompleteness: "PARTIAL" })
    ).toThrowError(/FALSE_ENVIRONMENT_COMPLETENESS/);
  });
});

describe("S-09 replay and reproduction boundaries", () => {
  it("blocks exact replay for an unknown external provider snapshot", () => {
    const env = environment({
      networkDependency: "EXTERNAL_PROVIDER",
      completeness: "PARTIALLY_CAPTURED",
      dependencyCompleteness: "PARTIAL"
    });
    const run = manifest(env);
    const model = known({
      provider: "synthetic-provider",
      modelId: "mutable-model",
      snapshotStatus: "UNKNOWN" as const
    });
    const externalRun = system.createExecutionManifest({
      ...run,
      environmentDigest: env.environmentDigest,
      intended: {
        ...run.intended,
        model,
        modelEvidenceStatuses: ["MODEL_ID_DECLARED", "SNAPSHOT_UNKNOWN"]
      },
      observed: {
        ...run.observed,
        model,
        modelEvidenceStatuses: [
          "MODEL_ID_DECLARED",
          "SNAPSHOT_UNKNOWN",
          "PROVIDER_STATE_UNAVAILABLE"
        ]
      }
    });
    const pkg = packageFixture({
      environmentManifest: env,
      executionManifest: externalRun,
      determinismClass: "EXTERNAL_NONDETERMINISTIC",
      packageMode: "PARTIALLY_SELF_CONTAINED"
    });
    expect(verifier.assessReplay(pkg)).toMatchObject({ outcome: "REPLAY_BLOCKED" });
    expect(verifier.assessReplay(pkg).blockers).toContain("MODEL_SNAPSHOT_NOT_IMMUTABLE");
  });

  it.each(["HUMAN_NONREPLAYABLE", "UNKNOWN"] as const)(
    "blocks replay for %s execution",
    (determinismClass) => {
      expect(verifier.assessReplay(packageFixture({ determinismClass })).outcome).toBe(
        "REPLAY_BLOCKED"
      );
    }
  );

  it("treats a restricted input as a visible replay limitation", () => {
    const restricted = artifact({
      availability: "RESTRICTED",
      locationClass: "EXTERNAL_REFERENCE",
      rightsStatus: "RESTRICTED"
    });
    const pkg = packageFixture({
      packageMode: "PARTIALLY_SELF_CONTAINED",
      artifacts: [restricted, artifact({ artifactId: "output:result", kind: "OUTPUT" })]
    });
    expect(verifier.verify(pkg).outcome).toBe("PARTIALLY_VERIFIED");
    expect(verifier.assessReplay(pkg)).toMatchObject({ outcome: "LIMITED_REPLAY_POSSIBLE" });
  });

  function attempt(
    pkg: EvidencePackage,
    overrides: Partial<ReproductionAttemptInput> = {}
  ): ReproductionAttemptInput {
    return {
      attemptId: "reproduction:one",
      attemptVersion: "1.0.0",
      originalPackageDigest: pkg.packageDigest,
      reproductionExecutionManifestDigest: pkg.executionManifest.manifestDigest,
      reproductionEnvironmentDigest: pkg.environmentManifest.environmentDigest,
      originalResultDigest: known(sha("f")),
      reproducedResultDigest: known(sha("f")),
      equivalenceRule: {
        ruleId: "exact-canonical-result",
        ruleVersion: equivalenceRuleContractVersion,
        resultType: "CANONICAL_JSON",
        method: "EXACT",
        justification: "Canonical engineering result requires exact equality."
      },
      reproductionArtifactIds: ["output:reproduction"],
      limitations: ["Engineering reproduction only."],
      ...overrides
    };
  }

  it("records exact engineering reproduction without claiming replication", () => {
    const pkg = packageFixture();
    expect(verifier.recordReproduction(pkg, attempt(pkg))).toMatchObject({
      outcome: "EXACT_MATCH",
      replicationStatus: "NOT_PERFORMED",
      scientificAuthority: "NONE"
    });
  });

  it("requires exact configuration and environment for an exact reproduction outcome", () => {
    const pkg = packageFixture();
    expect(
      verifier.recordReproduction(pkg, attempt(pkg, { reproductionEnvironmentDigest: sha("0") }))
        .outcome
    ).toBe("MATERIAL_DIFFERENCE");
  });

  it("supports only a declared, versioned, result-specific numeric tolerance", () => {
    const pkg = packageFixture();
    const output = verifier.recordReproduction(
      pkg,
      attempt(pkg, {
        originalNumericValue: 1,
        reproducedNumericValue: 1.1,
        equivalenceRule: {
          ruleId: "bounded-float",
          ruleVersion: equivalenceRuleContractVersion,
          resultType: "NUMERIC",
          method: "DECLARED_NUMERIC_TOLERANCE",
          tolerance: 0.2,
          justification: "Method-specific floating result tolerance."
        }
      })
    );
    expect(output.outcome).toBe("WITHIN_DECLARED_TOLERANCE");
    expect(() =>
      verifier.recordReproduction(
        pkg,
        attempt(pkg, {
          equivalenceRule: {
            ruleId: "bad",
            ruleVersion: equivalenceRuleContractVersion,
            resultType: "NUMERIC",
            method: "DECLARED_NUMERIC_TOLERANCE",
            justification: "Missing tolerance."
          }
        })
      )
    ).toThrowError(/INVALID_NUMERIC_TOLERANCE/);
  });

  it("does not overwrite or detach the original evidence package", () => {
    const pkg = packageFixture();
    expect(() =>
      verifier.recordReproduction(pkg, attempt(pkg, { originalPackageDigest: sha("0") }))
    ).toThrowError(/ORIGINAL_PACKAGE_MISMATCH/);
  });
});

describe("S-09 representative architecture cases", () => {
  it("accounts for cases A through J without empirical evidence claims", () => {
    expect(S09_REPRESENTATIVE_CASES.map((entry) => entry.caseId)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J"
    ]);
    expect(
      S09_REPRESENTATIVE_CASES.every(
        (entry) => entry.scientificEvidence === "NONE_SYNTHETIC_FIXTURE"
      )
    ).toBe(true);
  });

  it("keeps reproducible S-08 computation separate from comparability authority", () => {
    expect(S09_REPRESENTATIVE_CASES.find((entry) => entry.caseId === "H")).toMatchObject({
      verificationOutcome: "VERIFIED_INTERNAL_CONSISTENCY",
      scientificEvidence: "NONE_SYNTHETIC_FIXTURE"
    });
  });

  it("retains failure as evidence and human executions as non-replayable", () => {
    expect(
      S09_REPRESENTATIVE_CASES.find((entry) => entry.caseId === "J")?.verificationOutcome
    ).toBe("VERIFIED_INTERNAL_CONSISTENCY");
    expect(
      S09_REPRESENTATIVE_CASES.filter((entry) => ["F", "G"].includes(entry.caseId)).every(
        (entry) => entry.replayOutcome === "REPLAY_BLOCKED"
      )
    ).toBe(true);
  });
});
