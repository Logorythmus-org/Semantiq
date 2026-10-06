import { semanticCoreDigest } from "./semantic-core-openrouter.js";
import {
  semanticCoreCaptureDigest,
  evaluateSemanticCoreObservation,
  SEMANTIC_CORE_QUALIFICATION_LIMITATIONS
} from "./semantic-core-qualification.js";
import { semanticCoreMetricsFor } from "./semantic-core.js";
import { replaySemanticCoreLocalContent } from "./semantic-core-local-response.js";
import { SEMANTIC_CORE_CONSTRUCTS } from "./semantic-core-definitions.js";
import { SEMANTIC_CORE_DIMENSIONS, SEMANTIC_CORE_STATES } from "./semantic-core-types.js";
import {
  localEvaluators,
  localMetrics,
  integrityFailure
} from "./semantic-core-local-condition.js";
import { ReliabilityRegistry } from "./reliability.js";
import { CANONICAL_RELIABILITY_REGISTRY } from "./reliability-definitions.js";
import { buildSemanticCoreEvidence } from "./semantic-core-qualification-evidence.js";
import { ResearchPromotionSystem } from "./research-intake.js";
import { validateSemanticCoreQualificationRecord } from "./semantic-core-qualification-record.js";
import type { SemanticCoreLocalCondition } from "./semantic-core-local-condition.js";
import type { SemanticCoreQualificationAttempt } from "./semantic-core-qualification.js";
import type { SemanticCoreLocalObserved } from "./semantic-core-local-observation.js";
import { semanticCoreLocalObservationFromTransport } from "./semantic-core-local-observation.js";
import type { SemanticCoreCase } from "./semantic-core-types.js";
import type { EvaluatorExecution } from "./evaluator-types.js";
import type { SemanticCoreLocalCheckpoint } from "./semantic-core-local-runner.js";

export interface SemanticCoreLocalAttempt extends SemanticCoreQualificationAttempt {
  wireRequestDigest: string;
  requestStartedAt: string | null;
  requestIntentAt: string | null;
  transport: SemanticCoreLocalObserved["transport"];
  contentReplayExact: boolean;
}
const base = (
  condition: SemanticCoreLocalCondition,
  digest: string,
  run: number,
  id: string,
  target: string,
  references: string[],
  executedAt: string
): EvaluatorExecution => ({
  executionId: id,
  runId: `semantic-core-run-${run}`,
  evaluatorIdentity: condition.evaluator,
  configurationDigest: condition.evaluatorConfiguration.configurationDigest,
  subject: { subjectId: digest, subjectKind: "STRUCTURED_RESPONSE_SUBJECT" },
  evaluationTarget: target,
  inputKind: "SEMANTIC_CORE_SELECTION",
  inputReferences: references,
  status: "SUCCEEDED",
  evidenceReferences: ["condition:" + digest],
  provenanceReference: "condition:" + digest,
  executedAt
});
export function makeSemanticCoreLocalAttempt(
  condition: SemanticCoreLocalCondition,
  conditionDigest: string,
  item: SemanticCoreCase,
  run: number,
  observed: SemanticCoreLocalObserved,
  requestStartedAt: string | null,
  executedAt: string,
  requestIntentAt: string | null = requestStartedAt
): SemanticCoreLocalAttempt {
  const reference = condition.cases.find((c) => c.caseId === item.caseId);
  if (!reference) return integrityFailure();
  const attemptId = `semantic-core-0.1.3-run-${run}-${item.caseId}`;
  const evaluation = evaluateSemanticCoreObservation(item, observed.observation);
  const replay = evaluateSemanticCoreObservation(item, structuredClone(observed.observation));
  const evaluationDigest = semanticCoreDigest(evaluation);
  const replayDigest = semanticCoreDigest(replay);
  const contentReplayExact =
    observed.transport.contentEvidence === null ||
    (observed.transport.contentEvidence.replayAvailable &&
      Boolean(replaySemanticCoreLocalContent(observed.transport.contentEvidence, item)));
  const response = observed.observation.response;
  const execution = base(
    condition,
    conditionDigest,
    run,
    attemptId + "-evaluation",
    item.caseId,
    ["case:" + item.caseId, "prompt:" + reference.promptDigest],
    executedAt
  );
  const evaluatorExecution: EvaluatorExecution =
    response && ["PASSED", "INCORRECT", "ABSTAINED"].includes(evaluation.state)
      ? {
          ...execution,
          benchmarkBinding: {
            benchmark: condition.benchmark,
            constructId:
              SEMANTIC_CORE_CONSTRUCTS[SEMANTIC_CORE_DIMENSIONS.indexOf(item.dimensionId)]!
          },
          output: {
            kind: "CATEGORICAL_DECISION",
            category:
              response.status === "ANSWER" ? `ANSWER:${response.selectedOptionId}` : "ABSTAIN",
            evidenceReferences: [attemptId]
          }
        }
      : {
          ...execution,
          status: "PARTIAL",
          evidenceReferences: [attemptId, "evaluation-state:" + evaluation.state]
        };
  localEvaluators.recordExecution(evaluatorExecution, condition.evaluatorConfiguration);
  return {
    attemptId,
    run,
    caseId: item.caseId,
    promptDigest: reference.promptDigest,
    wireRequestDigest: reference.wireRequestDigest,
    requestStartedAt,
    requestIntentAt,
    ...observed,
    evaluation,
    evaluationDigest,
    replayDigest,
    contentReplayExact,
    replayExact: evaluationDigest === replayDigest && contentReplayExact,
    evaluatorExecution
  };
}
export function validateSemanticCoreLocalAttempt(
  condition: SemanticCoreLocalCondition,
  digest: string,
  item: SemanticCoreCase,
  run: number,
  attempt: SemanticCoreLocalAttempt
) {
  try {
    if (
      Object.keys(attempt.transport).sort().join(",") !==
        "contentEvidence,embeddedProviderError,error,httpStatus,returnedModel,returnedProvider,stages,usage" ||
      !Array.isArray(attempt.transport.stages) ||
      attempt.transport.stages.some(
        (stage) =>
          ![
            "GENERATION_REQUEST_PREPARED",
            "GENERATION_POST_SUBMITTED",
            "GENERATION_RESPONSE_HEADERS_RECEIVED",
            "GENERATION_RESPONSE_BODY_RECEIVED",
            "GENERATION_RESPONSE_PARSED"
          ].includes(stage)
      )
    )
      integrityFailure();
    if (
      semanticCoreDigest(semanticCoreLocalObservationFromTransport(attempt.transport)) !==
      semanticCoreDigest(attempt.observation)
    )
      integrityFailure();
    const rebuilt = makeSemanticCoreLocalAttempt(
      condition,
      digest,
      item,
      run,
      { observation: attempt.observation, transport: attempt.transport },
      attempt.requestStartedAt,
      attempt.evaluatorExecution.executedAt,
      attempt.requestIntentAt
    );
    if (semanticCoreDigest(rebuilt) !== semanticCoreDigest(attempt)) integrityFailure();
    const local = attempt.transport.contentEvidence;
    if (attempt.observation.status !== "ERROR") {
      if (
        attempt.transport.httpStatus !== 200 ||
        attempt.transport.error !== null ||
        attempt.transport.embeddedProviderError ||
        (attempt.transport.returnedModel !== condition.subject.model &&
          attempt.transport.returnedModel !== condition.subject.canonicalSlug) ||
        attempt.transport.returnedProvider !== condition.subject.providerName ||
        attempt.transport.usage?.cost !== 0 ||
        !local ||
        attempt.observation.status !== local.state ||
        (local.state === "RESPONSE" &&
          semanticCoreDigest(attempt.observation.response ?? null) !==
            semanticCoreDigest(local.response))
      )
        integrityFailure();
      if (
        semanticCoreDigest(attempt.observation.usage) !==
          semanticCoreDigest(attempt.transport.usage) ||
        attempt.observation.rawResponseDigest !== (local?.contentSha256 ?? undefined) ||
        attempt.observation.modelId !== condition.subject.model ||
        attempt.observation.providerName !== condition.subject.providerName
      )
        integrityFailure();
    } else if (
      !attempt.transport.error ||
      attempt.transport.error !== attempt.observation.error ||
      attempt.observation.response
    )
      integrityFailure();
    if (attempt.requestStartedAt !== null && !Number.isFinite(Date.parse(attempt.requestStartedAt)))
      integrityFailure();
    if (
      (attempt.requestStartedAt !== null) !==
        attempt.transport.stages.includes("GENERATION_POST_SUBMITTED") ||
      (attempt.requestIntentAt !== null && !Number.isFinite(Date.parse(attempt.requestIntentAt))) ||
      (attempt.requestStartedAt !== null &&
        (attempt.requestIntentAt === null ||
          Date.parse(attempt.requestStartedAt) < Date.parse(attempt.requestIntentAt)))
    )
      integrityFailure();
    return rebuilt;
  } catch {
    return integrityFailure();
  }
}
export function summarizeSemanticCoreLocalRun(
  condition: SemanticCoreLocalCondition,
  digest: string,
  run: number,
  attempts: SemanticCoreLocalAttempt[],
  executedAt: string
) {
  if (attempts.length !== 24 || attempts.some((a) => a.run !== run)) integrityFailure();
  const metrics = semanticCoreMetricsFor(
    attempts.map((a) => a.evaluation),
    condition.packDigest
  );
  const metricExecutions = metrics.map((result) =>
    localEvaluators.recordExecution(
      {
        ...base(
          condition,
          digest,
          run,
          `run-${run}-${result.metricIdentity.metricId}`,
          result.metricIdentity.metricId,
          condition.cases.map((c) => "case:" + c.caseId),
          executedAt
        ),
        ...(result.benchmarkBinding ? { benchmarkBinding: result.benchmarkBinding } : {}),
        metricIdentity: result.metricIdentity,
        output: { kind: "METRIC_RESULT", metricResult: result }
      },
      condition.evaluatorConfiguration
    )
  );
  return {
    run,
    accounted: 24,
    stateCounts: Object.fromEntries(
      SEMANTIC_CORE_STATES.map((state) => [
        state,
        attempts.filter((a) => a.evaluation.state === state).length
      ])
    ),
    metrics,
    metricExecutions
  };
}
export type SemanticCoreLocalRunSummary = ReturnType<typeof summarizeSemanticCoreLocalRun>;
export function replaySemanticCoreLocalStudy(
  condition: SemanticCoreLocalCondition,
  digest: string,
  items: SemanticCoreCase[],
  attempts: SemanticCoreLocalAttempt[],
  runs: SemanticCoreLocalRunSummary[]
) {
  if (attempts.length !== 72 || runs.length !== 3) integrityFailure();
  let exact = true;
  for (const [index, attempt] of attempts.entries()) {
    const item = items[index % 24];
    if (!item) return integrityFailure();
    validateSemanticCoreLocalAttempt(condition, digest, item, Math.floor(index / 24) + 1, attempt);
    exact &&= attempt.replayExact;
  }
  for (const run of [1, 2, 3]) {
    const prior = runs[run - 1];
    if (!prior) return integrityFailure();
    const summary = summarizeSemanticCoreLocalRun(
      condition,
      digest,
      run,
      attempts.slice((run - 1) * 24, run * 24),
      prior.metricExecutions[0]!.executedAt
    );
    if (semanticCoreCaptureDigest(summary) !== semanticCoreCaptureDigest(prior)) integrityFailure();
  }
  return {
    exact,
    replayedAttempts: 72,
    externalReproduction: false,
    scientificAuthority: "NONE" as const
  };
}
/** This is a pure evidence finalizer, not a subject adapter. Never called for partial studies. */
export function finalizeSemanticCoreLocalStudy(options: {
  condition: SemanticCoreLocalCondition;
  conditionDigest: string;
  items: SemanticCoreCase[];
  attempts: SemanticCoreLocalAttempt[];
  runs: SemanticCoreLocalRunSummary[];
  evidenceOrigin: "LIVE_PROVIDER" | "SYNTHETIC_TEST";
  repositoryValidation: { sourceCommit: string; reportDigest: string; status: "PASSED" };
  infrastructureFindings: string[];
  checkpoints: readonly SemanticCoreLocalCheckpoint[];
}) {
  const { condition, conditionDigest, attempts, runs } = options;
  if (attempts.length !== 72 || runs.length !== 3 || !Array.isArray(options.checkpoints))
    integrityFailure();
  if (
    options.checkpoints.length !== 3 ||
    options.checkpoints.some(
      (checkpoint, index) =>
        checkpoint.run !== index + 1 ||
        checkpoint.conditionDigest !== conditionDigest ||
        checkpoint.terminalAttempts !== 24
    )
  )
    integrityFailure();
  const regression = replaySemanticCoreLocalStudy(
    condition,
    conditionDigest,
    options.items,
    attempts,
    runs
  );
  const studies = condition.studies.map((entry) => entry.definition);
  const registry = new ReliabilityRegistry(
    { ...CANONICAL_RELIABILITY_REGISTRY, studies },
    localEvaluators,
    localMetrics
  );
  const reliability = studies.map((definition) => {
    const selected =
      definition.target.kind === "METRIC"
        ? runs
            .flatMap((run) => run.metricExecutions)
            .filter(
              (e) =>
                e.metricIdentity?.metricId ===
                (definition.target as { metric: { metricId: string } }).metric.metricId
            )
        : attempts
            .filter((a) => definition.identity.reliabilityStudyId.startsWith(a.caseId + "_"))
            .map((a) => a.evaluatorExecution);
    return registry.execute({
      executionId: definition.identity.reliabilityStudyId + "-execution",
      studyIdentity: definition.identity,
      definitionDigest: registry.definitionDigest(definition),
      executionReferences: selected.map((e) => e.executionId),
      evaluatorExecutions: selected,
      configurations: [condition.evaluatorConfiguration],
      evidenceReferences: ["condition:" + conditionDigest],
      provenanceReference: "condition:" + conditionDigest,
      executedAt: new Date().toISOString()
    });
  });
  const evidence = buildSemanticCoreEvidence(
    condition,
    conditionDigest,
    attempts,
    runs.map((run, index) => ({ ...run, collectionAudit: options.checkpoints[index] })),
    reliability
  );
  const nonPromotion = new ResearchPromotionSystem().assessPromotion({
    assessmentId: "semantic-core-0.1.3-stronger-stage-boundary",
    assessmentVersion: "0.1.0",
    schemaVersion: "1.0.0",
    request: {
      requestId: "semantic-core-0.1.3-non-promotion-proof",
      requestVersion: "0.1.0",
      benchmarkIdentity: {
        state: "KNOWN",
        value: condition.benchmark,
        evidenceReferences: ["condition:" + conditionDigest]
      },
      intakeIdentity: { researchIntakeId: "semantic-core-phase4", researchIntakeVersion: "0.1.0" },
      requestedStage: "VALIDATED",
      candidateKind: "GENERAL",
      requestedByGovernance: false,
      evidenceReferences: evidence.packages.map((p) => p.packageId),
      rationale: "Boundary assessment only; absent scientific evidence blocks stronger promotion."
    },
    gateEvidence: [],
    evidenceRecords: [],
    evidencePackages: evidence.packages,
    knownConfounds: ["Public cases and oracles; contamination unknown."],
    unresolvedMethodologicalCriticism: [
      "No calibration, validity, robustness, anti-gaming or independent reproduction."
    ],
    limitations: [...SEMANTIC_CORE_QUALIFICATION_LIMITATIONS],
    scientificAuthority: "NONE"
  });
  const criticalFindings = [
    ...new Set([
      ...options.infrastructureFindings,
      ...(attempts.some((a) => a.observation.status === "ERROR") ? ["INFRASTRUCTURE_FAILURE"] : []),
      ...(!regression.exact ? ["REGRESSION_REPLAY_MISMATCH"] : []),
      ...(evidence.verifications.some((v) => v.findings.some((f) => f.severity === "ERROR"))
        ? ["EVIDENCE_VERIFICATION_FAILURE"]
        : [])
    ])
  ];
  const sufficient =
    options.evidenceOrigin === "LIVE_PROVIDER" &&
    attempts.some((a) => a.observation.rawResponseDigest) &&
    reliability.length === 53 &&
    reliability.every((r) => r.estimate.applicability === "ESTIMATED");
  const validation = options.repositoryValidation;
  const regressionGreen =
    validation.status === "PASSED" &&
    validation.sourceCommit === condition.source.gitCommit &&
    /^[a-f0-9]{64}$/.test(validation.reportDigest);
  const qualification = {
    identity: { qualificationId: condition.protocol.protocolId, qualificationVersion: "0.1.3" },
    protocol: condition.protocol,
    conditionDigest,
    benchmark: condition.benchmark,
    packDigest: condition.packDigest,
    source: condition.source,
    scheduledRuns: 3,
    scheduledAttempts: 72,
    accountedAttempts: 72,
    evaluatorReplayExact: regression.exact,
    reliabilityReferences: reliability.map((r) => r.execution.executionId),
    packages: evidence.verifications.map((v) => ({
      packageId: v.packageId,
      packageDigest: v.packageDigest,
      outcome: v.outcome
    })),
    regression,
    criticalFindings,
    exposure: "TIER_A_PUBLIC_NOT_HELD_OUT_CONTAMINATION_UNKNOWN",
    limitations: [...SEMANTIC_CORE_QUALIFICATION_LIMITATIONS],
    repositoryRegression: regressionGreen
      ? "PASSED_REFERENCED_OPERATOR_REPORT"
      : "PENDING_EXTERNAL_VALIDATION",
    repositoryValidation: regressionGreen ? validation : null,
    outcome: criticalFindings.length
      ? "NOT_QUALIFIED"
      : sufficient && regressionGreen
        ? "QUALIFIED_FOR_BM3_REVIEW"
        : "INSUFFICIENT_EVIDENCE",
    scientificAuthority: "NONE",
    decisionAuthority: "NONE",
    proposesBM3: false,
    acceptance: "HUMAN_REVIEW_AND_MERGE_REQUIRED"
  };
  if (!validateSemanticCoreQualificationRecord(qualification)) integrityFailure();
  return {
    capture: {
      schemaVersion: "0.1.3",
      condition,
      conditionDigest,
      evidenceOrigin: options.evidenceOrigin,
      attempts,
      runs
    },
    reliability,
    ...evidence,
    nonPromotion,
    regression,
    qualification
  };
}
