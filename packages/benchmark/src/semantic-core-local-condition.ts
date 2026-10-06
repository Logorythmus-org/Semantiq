import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { semanticCoreDigest } from "./semantic-core-openrouter.js";
import {
  prepareSemanticCoreQualification,
  semanticCoreSubjectInput
} from "./semantic-core-qualification.js";
import {
  assertSemanticCoreCanaryDGate,
  replaySemanticCoreLocalContent,
  semanticCoreLocalWireRequest,
  SEMANTIC_CORE_LOCAL_REQUEST_CONDITION,
  SEMANTIC_CORE_LOCAL_RESPONSE_PROTOCOL
} from "./semantic-core-local-response.js";
import { SemanticCoreQualificationError } from "./semantic-core-qualification-types.js";
import { BenchmarkRegistry } from "./registry.js";
import { CANONICAL_BENCHMARK_REGISTRY } from "./registry-definitions.js";
import { MetricRegistry } from "./metrics.js";
import { CANONICAL_METRIC_REGISTRY } from "./metric-definitions.js";
import { EvaluatorRegistry } from "./evaluators.js";
import { CANONICAL_EVALUATOR_REGISTRY } from "./evaluator-definitions.js";
import { ReliabilityRegistry } from "./reliability.js";
import { CANONICAL_RELIABILITY_REGISTRY } from "./reliability-definitions.js";

export const localBenchmarks = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
export const localMetrics = new MetricRegistry(CANONICAL_METRIC_REGISTRY, localBenchmarks);
export const localEvaluators = new EvaluatorRegistry(
  CANONICAL_EVALUATOR_REGISTRY,
  localBenchmarks,
  localMetrics
);
export const LOCAL_SUPERSEDED_CONDITION =
  "d81553e1da6f2b2c1f5b26b20de06481feb5badea4e128faab52c30d833fba10";
export const identityFailure = (): never => {
  throw new SemanticCoreQualificationError("IDENTITY_SUBSTITUTION");
};
export const integrityFailure = (): never => {
  throw new SemanticCoreQualificationError("CAPTURE_INTEGRITY_FAILURE");
};

/** Same deterministic builder is used by the freeze and the runner. No network or inference. */
export async function prepareSemanticCoreLocalCondition(
  repositoryRoot: string,
  packRoot: string,
  source: { gitCommit: string; gitTree: string }
) {
  const bytes = await readFile(
    join(repositoryRoot, "fixtures/semantic-core-qualification-0.1.3/canary-D.json")
  );
  if (
    createHash("sha256").update(bytes).digest("hex") !==
    "c3c6c34b5be898acbc1457cd9072af4584c1fdaef1c46f5a1069a0ea1bee887e"
  )
    identityFailure();
  const canary = JSON.parse(bytes.toString("utf8"));
  assertSemanticCoreCanaryDGate(canary);
  const replay = replaySemanticCoreLocalContent(canary.contentEvidence);
  if (
    canary.httpStatus !== 200 ||
    canary.returnedModel !== SEMANTIC_CORE_LOCAL_REQUEST_CONDITION.model ||
    canary.returnedProvider !== "Novita" ||
    canary.usage?.cost !== 0 ||
    canary.embeddedProviderError !== false ||
    canary.error !== null ||
    replay.state !== "RESPONSE" ||
    canary.purpose !== "ENGINEERING_CONTENT_TRANSPORT_ONLY" ||
    canary.scientificAuthority !== "NONE" ||
    canary.bmMaturityAuthority !== "NONE" ||
    semanticCoreDigest(canary.condition) !==
      semanticCoreDigest(SEMANTIC_CORE_LOCAL_REQUEST_CONDITION) ||
    semanticCoreDigest(canary.protocol) !==
      semanticCoreDigest(SEMANTIC_CORE_LOCAL_RESPONSE_PROTOCOL) ||
    canary.wireRequestDigest !== semanticCoreDigest(semanticCoreLocalWireRequest())
  )
    identityFailure();
  const prepared = await prepareSemanticCoreQualification(packRoot, source);
  const studies = prepared.studies.map((definition) => ({
    ...definition,
    evidenceReferences: ["protocol:semantic_core_pilot_bm3_qualification@0.1.3"],
    limitations: [
      ...definition.limitations,
      "Local strict parsing; complete runs may span declared provider quota windows."
    ]
  }));
  const registry = new ReliabilityRegistry(
    { ...CANONICAL_RELIABILITY_REGISTRY, studies },
    localEvaluators,
    localMetrics
  );
  const cases = prepared.items.map((item, index) => {
    const wire = semanticCoreLocalWireRequest(semanticCoreSubjectInput(item));
    const reference = prepared.frozen.cases[index];
    if (!reference || reference.caseId !== item.caseId) return identityFailure();
    return {
      caseId: item.caseId,
      caseDigest: reference.digest,
      promptDigest: semanticCoreDigest(wire.messages),
      wireRequestDigest: semanticCoreDigest(wire)
    };
  });
  const prompts = cases.map(({ caseId, promptDigest }) => ({ caseId, promptDigest }));
  const condition = {
    protocol: SEMANTIC_CORE_LOCAL_RESPONSE_PROTOCOL,
    source,
    benchmark: prepared.frozen.benchmark,
    packIdentity: prepared.frozen.packIdentity,
    packDigest: prepared.frozen.packDigest,
    cases,
    evaluator: prepared.frozen.evaluator,
    evaluatorConfiguration: prepared.frozen.evaluatorConfiguration,
    metrics: prepared.frozen.metrics,
    subject: SEMANTIC_CORE_LOCAL_REQUEST_CONDITION,
    endpointProvenance: {
      observedAt: canary.observedAt as string,
      source: "CANARY_D_DISCOVERY",
      metadata: canary.metadata as {
        modelId: string;
        canonicalSlug: string;
        providerName: string;
        discoveryEndpointTag: string;
        providerRoutingSelector: string;
        pricing: Record<string, string>;
        supportedParameters: string[];
        maxCompletionTokens: number;
        status: number;
      }
    },
    requestPolicy: Object.fromEntries(
      Object.entries(semanticCoreLocalWireRequest()).filter(([key]) => key !== "messages")
    ),
    prompts,
    promptInventoryDigest: semanticCoreDigest(prompts),
    runOrder: [1, 2, 3].map((run) => ({ run, caseIds: cases.map(({ caseId }) => caseId) })),
    quotaWindowPolicy: {
      minimumAvailableBeforeEachRun: 24,
      completeRunPerWindow: true,
      maximumCollectionHours: 168,
      minimumRequestIntervalMs: 3500,
      freshLiveRouteAndQuotaPreflightRequiredBeforeEachRun: true,
      materiallyChangedCondition: "STOP_NO_SUBSTITUTION"
    },
    retryPolicy: "NONE_NO_REPLACEMENT_ALL_ATTEMPTS_RETAINED",
    studies: studies.map((definition) => ({
      definition,
      definitionDigest: registry.definitionDigest(definition)
    })),
    rights: prepared.frozen.rights,
    provenance: prepared.frozen.provenance,
    exposure: prepared.frozen.exposure,
    canaryDArtifactSha256: createHash("sha256").update(bytes).digest("hex"),
    scientificStatus: "UNVALIDATED_PROXY",
    coreStatus: "NOT_PROMOTED"
  };
  return { condition, items: prepared.items, studies };
}
export type SemanticCoreLocalCondition = Awaited<
  ReturnType<typeof prepareSemanticCoreLocalCondition>
>["condition"];
export interface SemanticCoreLocalFrozenFile {
  freezeStatus: "ACTIVE_PROSPECTIVE_EMPIRICAL_CONDITION";
  empiricalAttempts: 0;
  qualificationOutcome: "INSUFFICIENT_EVIDENCE";
  supersedes: typeof LOCAL_SUPERSEDED_CONDITION;
  condition: SemanticCoreLocalCondition;
  conditionDigest: string;
}
export async function validateSemanticCoreLocalCondition(
  repositoryRoot: string,
  packRoot: string,
  frozen: SemanticCoreLocalFrozenFile,
  source: SemanticCoreLocalCondition["source"]
) {
  try {
    if (
      Object.keys(frozen).sort().join(",") !==
      "condition,conditionDigest,empiricalAttempts,freezeStatus,qualificationOutcome,supersedes"
    )
      identityFailure();
    if (
      frozen.freezeStatus !== "ACTIVE_PROSPECTIVE_EMPIRICAL_CONDITION" ||
      frozen.empiricalAttempts !== 0 ||
      frozen.qualificationOutcome !== "INSUFFICIENT_EVIDENCE" ||
      frozen.supersedes !== LOCAL_SUPERSEDED_CONDITION ||
      semanticCoreDigest(frozen.condition) !== frozen.conditionDigest ||
      semanticCoreDigest(source) !== semanticCoreDigest(frozen.condition.source)
    )
      identityFailure();
    const prepared = await prepareSemanticCoreLocalCondition(repositoryRoot, packRoot, source);
    if (semanticCoreDigest(prepared.condition) !== frozen.conditionDigest) identityFailure();
    return prepared;
  } catch {
    return identityFailure();
  }
}
export const LOCAL_REQUIRED_CHECKS = [
  "Core Lint, Typecheck, Boundaries & Build",
  "Build & Verify Documentation Site",
  "dependency-review",
  "Python SDK, Build & Tests (Py 3.10)",
  "Python SDK, Build & Tests (Py 3.11)",
  "Python SDK, Build & Tests (Py 3.12)",
  "TypeScript SDK Build & Contract Battery",
  "Cross-Language Schema & Contract Parity",
  "Docs Build & Link Validation",
  "Security Boundaries & Secret Redaction",
  "Benchmark & Full Node Regression",
  "Web UI Build (Non-Core Optional Client)"
];
export function validateSemanticCoreLocalClearance(
  value: unknown,
  source: SemanticCoreLocalCondition["source"]
) {
  const report = value as {
    source?: unknown;
    pr?: {
      headRefOid?: string;
      baseRefName?: string;
      isDraft?: boolean;
      state?: string;
      statusCheckRollup?: { name: string; status: string; conclusion: string }[];
    };
    repositoryValidation?: unknown;
  };
  const pr = report?.pr;
  if (
    !pr ||
    semanticCoreDigest(report.source ?? null) !== semanticCoreDigest(source) ||
    pr.headRefOid !== source.gitCommit ||
    pr.baseRefName !== "main" ||
    pr.isDraft !== true ||
    pr.state !== "OPEN" ||
    !Array.isArray(pr.statusCheckRollup) ||
    pr.statusCheckRollup.length !== 12 ||
    !LOCAL_REQUIRED_CHECKS.every(
      (name) =>
        pr.statusCheckRollup!.filter(
          (check) =>
            check.name === name && check.status === "COMPLETED" && check.conclusion === "SUCCESS"
        ).length === 1
    )
  )
    identityFailure();
  const validation = {
    sourceCommit: source.gitCommit,
    reportDigest: semanticCoreDigest(pr),
    status: "PASSED" as const
  };
  if (
    report.repositoryValidation &&
    semanticCoreDigest(report.repositoryValidation) !== semanticCoreDigest(validation)
  )
    identityFailure();
  return validation;
}
