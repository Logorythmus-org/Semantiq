import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { canonicalJson } from "../../sandbox-contracts/src/index.js";
import { EvidenceSystem, EvidenceVerifier } from "./evidence.js";
import { EVIDENCE_COMPLETENESS_DIMENSIONS } from "./evidence-types.js";
import type {
  ArtifactReference,
  EvidenceRecordReference,
  EvidenceValue,
  ExecutionConditionEvidence
} from "./evidence-types.js";
import type { SemanticCoreQualificationAttempt } from "./semantic-core-qualification.js";
import { SEMANTIC_CORE_QUALIFICATION_LIMITATIONS } from "./semantic-core-qualification.js";
import { SEMANTIC_CORE_BENCHMARK, SEMANTIC_CORE_EVALUATOR } from "./semantic-core-definitions.js";
import { semanticCoreDigest } from "./semantic-core-openrouter.js";
import type { SemanticCoreSubjectConfiguration } from "./semantic-core-qualification-types.js";

const known = <T>(value: T): EvidenceValue<T> => ({
  state: "KNOWN",
  value,
  evidenceReferences: ["capture:semantic-core"]
});
const na = (reason = "Outside this engineering claim.") => ({
  state: "NOT_APPLICABLE" as const,
  reason
});
const unknown = (reason: string) => ({ state: "UNKNOWN" as const, reason });
const system = new EvidenceSystem();
const verifier = new EvidenceVerifier();

/** Payloads are supplied alongside S09 references; availability never follows from a hash alone. */
export function buildSemanticCoreEvidence(
  condition: {
    source: { gitCommit: string; gitTree: string };
    subjectConfiguration: SemanticCoreSubjectConfiguration | null;
    packDigest: string;
    cases: readonly unknown[];
    prompts: readonly unknown[];
    evaluatorConfiguration: unknown;
    providerMetadata: unknown;
  },
  conditionDigest: string,
  attempts: readonly SemanticCoreQualificationAttempt[],
  runs: readonly { run: number }[],
  reliability: readonly unknown[]
) {
  const config = condition.subjectConfiguration!;
  const lock = readFileSync(new URL("../../../pnpm-lock.yaml", import.meta.url));
  const lockDigest = createHash("sha256").update(lock).digest("hex");
  const environment = system.createEnvironmentManifest({
    environmentId: "semantic-core-node-environment",
    environmentVersion: "0.1.0",
    schemaVersion: "1.0.0",
    platform: known(process.platform),
    architecture: known(process.arch),
    runtime: known("node"),
    runtimeVersion: known(process.version),
    containerImageDigest: na("No container used."),
    hardwareClass: known("general-purpose-cpu"),
    acceleratorClass: na("Remote provider hardware unavailable."),
    locale: unknown("Locale not material to canonical JSON evaluation; not captured."),
    timezonePolicy: known("UTC_AUDIT_ONLY"),
    environmentVariables: { classification: "NOT_CAPTURED", names: [] },
    dependencies: [
      {
        ecosystem: "NODE",
        lockOrGraphReference: "artifact:dependency-lock",
        digest: { algorithm: "SHA_256", value: lockDigest, representation: "ORIGINAL_BYTES" },
        completeness: "PARTIAL"
      }
    ],
    dependencyCompleteness: "PARTIAL",
    networkDependency: "EXTERNAL_PROVIDER",
    toolAvailability: ["node"],
    completeness: "PARTIALLY_CAPTURED",
    limitations: [
      "Lockfile retained in repository; no provider environment or complete OS image captured."
    ],
    scientificAuthority: "NONE"
  });
  const conditions: ExecutionConditionEvidence = {
    configurationReference: known("condition:" + conditionDigest),
    configurationDigest: known(conditionDigest),
    language: known("en"),
    toolPolicy: known("NO_TOOLS_FRESH_CONTEXT"),
    model: known({
      provider: config.providerName,
      modelId: config.modelId,
      snapshotStatus: config.snapshotStatus
    }),
    modelEvidenceStatuses: [
      "MODEL_ID_DECLARED",
      "SNAPSHOT_UNKNOWN",
      "PROVIDER_NONDETERMINISTIC",
      "PROVIDER_STATE_UNAVAILABLE"
    ],
    samplingConfigurationReference: known("condition:" + conditionDigest),
    randomization: {
      policy: known("FROZEN_MANIFEST_ORDER"),
      algorithm: na("No case randomization."),
      seed: config.seed === undefined ? na("No seed requested.") : known(config.seed),
      scope: known("EACH_FRESH_PROVIDER_REQUEST"),
      implementationVersion: known("0.1.0")
    }
  };
  const bundles = [
    ...runs.map((run) => ({
      id: `semantic-core-run-${run.run}`,
      payload: {
        condition,
        attempts: attempts.filter((a) => a.run === run.run),
        run,
        reliability: [] as readonly unknown[]
      }
    })),
    { id: "semantic-core-qualification", payload: { condition, attempts, runs, reliability } }
  ];
  const payloads: Record<string, unknown> = {};
  const packages = bundles.map((bundle) => {
    const inputId = bundle.id + ":input";
    const outputId = bundle.id + ":output";
    const configId = bundle.id + ":configuration";
    payloads[inputId] = {
      cases: condition.cases,
      prompts: condition.prompts,
      packDigest: condition.packDigest
    };
    payloads[outputId] = bundle.payload;
    payloads[configId] = condition;
    const artifact = (id: string, kind: ArtifactReference["kind"]): ArtifactReference => {
      const bytes = canonicalJson(payloads[id]);
      const digest = {
        algorithm: "SHA_256" as const,
        value: semanticCoreDigest(payloads[id]),
        representation: "CANONICAL_JSON" as const
      };
      return {
        artifactId: id,
        artifactVersion: "0.1.0",
        kind,
        contentDigest: digest,
        observedContentDigest: digest,
        mediaType: "application/json",
        sizeBytes: Buffer.byteLength(bytes),
        availability: "AVAILABLE",
        locationClass: "PORTABLE_RELATIVE",
        rightsStatus: "REDISTRIBUTION_ALLOWED",
        provenanceReferences: ["condition:" + conditionDigest],
        limitations: ["Safe normalized capture; original HTTP bytes are unavailable."]
      };
    };
    const records: EvidenceRecordReference[] = [
      [bundle.id + ":result", "RESULT", bundle.payload],
      [bundle.id + ":benchmark", "BENCHMARK_S02", SEMANTIC_CORE_BENCHMARK],
      [bundle.id + ":evaluator", "EVALUATOR_S04", condition.evaluatorConfiguration],
      [bundle.id + ":reliability", "RELIABILITY_S05", bundle.payload.reliability]
    ].map(([referenceId, scope, value]) => ({
      referenceId: referenceId as string,
      scope: scope as EvidenceRecordReference["scope"],
      recordId:
        scope === "BENCHMARK_S02"
          ? SEMANTIC_CORE_BENCHMARK.benchmarkId
          : scope === "EVALUATOR_S04"
            ? SEMANTIC_CORE_EVALUATOR.evaluatorId
            : (referenceId as string),
      recordVersion: "0.1.0",
      semanticDigest: {
        algorithm: "SHA_256",
        value: semanticCoreDigest(value),
        canonicalizationProfile: "semantiq-canonical-json-v1"
      },
      availability: "AVAILABLE",
      provenanceReferences: ["condition:" + conditionDigest]
    }));
    const observed = {
      ...conditions,
      randomization: {
        ...conditions.randomization,
        seed:
          config.seed === undefined
            ? na("No seed requested.")
            : unknown(
                "Provider acknowledgement of the seed is unavailable; request alone is not observation."
              )
      }
    };
    const manifest = system.createExecutionManifest({
      manifestId: bundle.id + ":manifest",
      manifestVersion: "0.1.0",
      schemaVersion: "1.0.0",
      executionId: bundle.id,
      executionStatus: "SUCCEEDED",
      targetReference: bundle.id + ":result",
      benchmarkIdentity: known(SEMANTIC_CORE_BENCHMARK),
      itemIdentity: na("Multi-case run; exact individual identities retained in capture."),
      constructReference: na("Three distinct constructs retained in metric bindings."),
      metricIdentity: na("Five distinct metrics retained in capture."),
      evaluatorIdentity: known(SEMANTIC_CORE_EVALUATOR),
      studyProtocolReference: known("semantic_core_pilot_bm3_qualification@0.1.0"),
      comparisonDefinitionReference: na(),
      intended: conditions,
      observed,
      environmentDigest: environment.environmentDigest,
      sourceRevision: {
        gitCommit: known(condition.source.gitCommit),
        gitTree: known(condition.source.gitTree),
        packageVersion: known("0.1.0-alpha.2"),
        schemaVersions: [
          { schemaId: "semantic-core-case", schemaVersion: "0.1.0" },
          { schemaId: "semantic-core-response", schemaVersion: "0.1.0" },
          { schemaId: "evidence-package", schemaVersion: "1.0.0" }
        ]
      },
      inputArtifactIds: [inputId, configId],
      expectedOutputArtifactIds: [outputId],
      observedOutputArtifactIds: [outputId],
      evidenceReferences: records.map((r) => r.referenceId),
      scientificAuthority: "NONE"
    });
    return system.createEvidencePackage({
      packageId: bundle.id + ":evidence",
      packageVersion: "0.1.0",
      schemaVersion: "1.0.0",
      packageMode: "PARTIALLY_SELF_CONTAINED",
      target: {
        referenceId: bundle.id + ":result",
        scope: "RESULT",
        claimOrResultType: "CONTROLLED_INTERNAL_ENGINEERING_QUALIFICATION"
      },
      records,
      requirements: [inputId, outputId, configId].map((id) => ({
        requirementId: "required:" + id,
        purpose: "ENGINEERING_CONFORMANCE",
        referenceId: id,
        critical: true
      })),
      artifacts: [
        artifact(inputId, "INPUT"),
        artifact(outputId, "OUTPUT"),
        artifact(configId, "CONFIGURATION"),
        {
          artifactId: "artifact:dependency-lock",
          artifactVersion: "0.1.0",
          kind: "DEPENDENCY_LOCK",
          contentDigest: {
            algorithm: "SHA_256",
            value: lockDigest,
            representation: "ORIGINAL_BYTES"
          },
          observedContentDigest: {
            algorithm: "SHA_256",
            value: lockDigest,
            representation: "ORIGINAL_BYTES"
          },
          availability: "AVAILABLE",
          locationClass: "PORTABLE_RELATIVE",
          mediaType: "text/yaml",
          rightsStatus: "REDISTRIBUTION_ALLOWED",
          provenanceReferences: ["repository:pnpm-lock.yaml"],
          limitations: []
        }
      ],
      executionManifest: manifest,
      environmentManifest: environment,
      completeness: EVIDENCE_COMPLETENESS_DIMENSIONS.map((dimension) => ({
        dimension,
        status: ["VALIDITY", "HUMAN_PROTOCOL", "COMPARABILITY"].includes(dimension)
          ? "NOT_APPLICABLE"
          : ["ENVIRONMENT", "DEPENDENCIES", "RELIABILITY"].includes(dimension)
            ? "PARTIAL"
            : "COMPLETE",
        critical: [
          "IDENTITY",
          "INPUT",
          "CONFIGURATION",
          "EXECUTION",
          "OUTPUT",
          "METRIC",
          "EVALUATOR"
        ].includes(dimension),
        evidenceReferences: [outputId, configId],
        rationale: ["ENVIRONMENT", "DEPENDENCIES"].includes(dimension)
          ? "Provider environment and OS image unavailable; declared normalized engineering scope only."
          : "Bounded captured engineering scope; no scientific validity claim."
      })),
      chain: [
        { fromReference: bundle.id, relationship: "PRODUCED", toReference: bundle.id + ":result" },
        { fromReference: inputId, relationship: "USED_INPUT", toReference: bundle.id + ":result" },
        {
          fromReference: bundle.id + ":result",
          relationship: "SUPPORTED_BY",
          toReference: outputId
        }
      ],
      determinismClass: "EXTERNAL_NONDETERMINISTIC",
      evaluatorDeterminism: known("DETERMINISTIC"),
      reproducibilityStatus: "VERIFIABLE",
      signatureStatus: "NOT_IMPLEMENTED",
      limitations: [...SEMANTIC_CORE_QUALIFICATION_LIMITATIONS],
      scientificAuthority: "NONE"
    });
  });
  return {
    packages,
    payloads,
    verifications: packages.map((pkg) => verifier.verify(pkg)),
    replayAssessments: packages.map((pkg) => verifier.assessReplay(pkg))
  };
}
