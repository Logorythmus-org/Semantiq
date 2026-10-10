import { canonicalJson } from "../../sandbox-contracts/src/index.js";
import { loadBenchmarkPack, readBenchmarkPackCase } from "./benchmark-pack.js";
import { BenchmarkRegistry } from "./registry.js";
import { CANONICAL_BENCHMARK_REGISTRY } from "./registry-definitions.js";
import { MetricRegistry } from "./metrics.js";
import { CANONICAL_METRIC_REGISTRY } from "./metric-definitions.js";
import { EvaluatorRegistry } from "./evaluators.js";
import { CANONICAL_EVALUATOR_REGISTRY } from "./evaluator-definitions.js";
import { ReliabilityRegistry } from "./reliability.js";
import { CANONICAL_RELIABILITY_REGISTRY } from "./reliability-definitions.js";
import { ResearchPromotionSystem } from "./research-intake.js";
import {
  evaluateSemanticCoreCase,
  semanticCoreMetricsFor,
  validateSemanticCoreCase,
  validateSemanticCoreResponse
} from "./semantic-core.js";
import {
  SEMANTIC_CORE_BENCHMARK,
  SEMANTIC_CORE_EVALUATOR,
  SEMANTIC_CORE_METRICS,
  SEMANTIC_CORE_CONSTRUCTS
} from "./semantic-core-definitions.js";
import { SEMANTIC_CORE_DIMENSIONS, SEMANTIC_CORE_STATES } from "./semantic-core-types.js";
import {
  SEMANTIC_CORE_QUALIFICATION_PROTOCOL as protocol,
  SemanticCoreQualificationError,
  SEMANTIC_CORE_QUOTA_WINDOW_PROTOCOL
} from "./semantic-core-qualification-types.js";
import {
  assertSemanticCoreFreeRoute,
  semanticCoreDigest,
  serializeSemanticCorePrompt,
  validateSemanticCoreSubjectConfiguration
} from "./semantic-core-openrouter.js";
import { buildSemanticCoreEvidence } from "./semantic-core-qualification-evidence.js";
import type {
  SemanticCoreCase,
  SemanticCoreInput,
  SemanticCoreCaseResult
} from "./semantic-core-types.js";
import type { EvaluatorExecution } from "./evaluator-types.js";
import type { ReliabilityStudyDefinition } from "./reliability-types.js";
import type {
  SemanticCoreSubjectConfiguration,
  SemanticCoreQualificationSubject,
  SemanticCoreSubjectObservation,
  SemanticCoreQualificationOutcome
} from "./semantic-core-qualification-types.js";

const benchmarks = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
const metrics = new MetricRegistry(CANONICAL_METRIC_REGISTRY, benchmarks);
const evaluators = new EvaluatorRegistry(CANONICAL_EVALUATOR_REGISTRY, benchmarks, metrics);
const configuration = evaluators.createConfiguration({
  evaluatorIdentity: SEMANTIC_CORE_EVALUATOR,
  parameters: {}
});
export const SEMANTIC_CORE_FROZEN_PACK_DIGEST =
  "b173eea32402050aba5989308fdb559b75c17956c2e2a9644ef65212a93a358a";
export const SEMANTIC_CORE_QUALIFICATION_LIMITATIONS = [
  "Tier A public synthetic first-party AI-authored cases and public oracles: contamination cannot be ruled out; not held-out; high scores do not establish clean generalization.",
  "Internal execution, reliability and integrity evidence only; model accuracy is not a qualification gate.",
  "Reliability is not validity. No calibration, construct validity, robustness, anti-gaming, independent reproduction, external validation, Core admission or leaderboard eligibility.",
  "Mutable model alias; advertised canonical slug is provenance, not an immutable provider snapshot. Temperature zero and an optional seed do not establish deterministic subject execution.",
  "Original HTTP response bytes are unavailable; only bounded normalized observations and original-byte digests are retained. Engineering evaluator replay is not external reproduction.",
  "Automated records have scientific authority NONE and decision authority NONE. Human/code-owner review and merge govern any public BM3 proposal."
] as const;

export function semanticCoreSubjectInput(item: SemanticCoreCase): SemanticCoreInput {
  return {
    schemaVersion: item.schemaVersion,
    caseId: item.caseId,
    dimensionId: item.dimensionId,
    target: item.target,
    prompt: item.prompt,
    context: item.context,
    options: item.options.map((o) => ({ optionId: o.optionId, text: o.text })),
    eligibleResponseStates: ["ANSWER", "ABSTAIN"]
  };
}
export async function prepareSemanticCoreQualification(
  packRoot: string,
  source: { gitCommit: string; gitTree: string },
  subjectConfiguration?: SemanticCoreSubjectConfiguration,
  protocolVersion: "0.1.0" | "0.1.1" = "0.1.0"
) {
  const selectedProtocol =
    protocolVersion === "0.1.1" ? SEMANTIC_CORE_QUOTA_WINDOW_PROTOCOL : protocol;
  if (!/^[a-f0-9]{40}$/.test(source.gitCommit) || !/^[a-f0-9]{40}$/.test(source.gitTree))
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  if (subjectConfiguration) validateSemanticCoreSubjectConfiguration(subjectConfiguration);
  const loaded = await loadBenchmarkPack(packRoot);
  if (
    loaded.admission.status !== "ADMISSIBLE" ||
    !loaded.manifest ||
    loaded.packDigest?.value !== SEMANTIC_CORE_FROZEN_PACK_DIGEST
  )
    throw new SemanticCoreQualificationError("IDENTITY_SUBSTITUTION");
  const manifest = loaded.manifest;
  if (
    canonicalJson(manifest.benchmark) !== canonicalJson(SEMANTIC_CORE_BENCHMARK) ||
    canonicalJson(manifest.evaluator) !== canonicalJson(SEMANTIC_CORE_EVALUATOR) ||
    canonicalJson(manifest.metrics) !== canonicalJson(SEMANTIC_CORE_METRICS) ||
    manifest.cases.length !== 24
  )
    throw new SemanticCoreQualificationError("IDENTITY_SUBSTITUTION");
  const items: SemanticCoreCase[] = [];
  for (const ref of manifest.cases) {
    const item = await readBenchmarkPackCase(packRoot, ref);
    if (!validateSemanticCoreCase(item) || item.caseId !== ref.caseId)
      throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
    items.push(item);
  }
  if (!SEMANTIC_CORE_DIMENSIONS.every((d) => items.filter((c) => c.dimensionId === d).length === 8))
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  const prompts = items.map((item) => ({
    caseId: item.caseId,
    promptDigest: semanticCoreDigest(serializeSemanticCorePrompt(semanticCoreSubjectInput(item)))
  }));
  const studies: ReliabilityStudyDefinition[] = [];
  for (const item of items)
    for (const method of ["CATEGORICAL_AGREEMENT", "EXACT_REPEATABILITY"] as const) {
      studies.push(
        study(`${item.caseId}_${method.toLowerCase()}`, method, {
          kind: "EVALUATOR_CONFIGURATION",
          evaluator: SEMANTIC_CORE_EVALUATOR,
          configurationDigest: configuration.configurationDigest
        })
      );
    }
  for (const metric of SEMANTIC_CORE_METRICS)
    studies.push(
      study(metric.metricId + "_stability", "NUMERIC_RUN_TO_RUN_STABILITY", {
        kind: "METRIC",
        metric
      })
    );
  const reliability = new ReliabilityRegistry(
    { ...CANONICAL_RELIABILITY_REGISTRY, studies },
    evaluators,
    metrics
  );
  if (protocolVersion === "0.1.1")
    for (const [index, definition] of studies.entries()) {
      studies[index] = {
        ...definition,
        evidenceReferences: ["protocol:semantic_core_pilot_bm3_qualification@0.1.1"],
        limitations: [
          ...definition.limitations,
          "Observed run-to-run stability across declared provider quota windows; external provider state is not cryptographically frozen."
        ]
      };
    }
  const frozen = {
    protocol: selectedProtocol,
    source: { ...source },
    benchmark: manifest.benchmark,
    packIdentity: manifest.identity,
    packDigest: loaded.packDigest.value,
    cases: manifest.cases.map((ref) => ({ caseId: ref.caseId, digest: ref.digest })),
    schemaVersions: { case: "0.1.0", response: "0.1.0", qualification: protocolVersion },
    evaluator: manifest.evaluator,
    evaluatorConfiguration: configuration,
    metrics: manifest.metrics,
    subjectConfiguration: subjectConfiguration ? structuredClone(subjectConfiguration) : null,
    prompts,
    promptDigest: semanticCoreDigest(prompts),
    studies: studies.map((definition) => ({
      definition,
      definitionDigest: reliability.definitionDigest(definition)
    })),
    rights: manifest.rights,
    provenance: manifest.provenance,
    exposure: manifest.exposure
  };
  return { frozen, items, studies };
}
type Prepared = Awaited<ReturnType<typeof prepareSemanticCoreQualification>>;
function study(
  id: string,
  method: ReliabilityStudyDefinition["method"],
  target: ReliabilityStudyDefinition["target"]
): ReliabilityStudyDefinition {
  return {
    identity: { reliabilityStudyId: id, reliabilityStudyVersion: "0.1.0" },
    versionScope: "RELIABILITY_STUDY",
    name: id,
    question:
      "Describe repeated observations under this frozen engineering condition; no qualitative threshold.",
    target,
    method,
    constantDimensions: [
      "BENCHMARK_VERSION",
      "BENCHMARK_INPUT",
      "METRIC_VERSION",
      "EVALUATOR_VERSION",
      "EVALUATOR_CONFIGURATION",
      "SUBJECT",
      "MODEL_PROVIDER",
      "MODEL_SNAPSHOT",
      "SEED",
      "SAMPLING_CONFIGURATION",
      "ENVIRONMENT"
    ],
    variedDimensions: ["TIME_WINDOW"],
    evidenceReferences: ["protocol:semantic_core_pilot_bm3_qualification@0.1.0"],
    provenanceReferences: ["Docs/benchmarks/SEMANTIC_CORE_PILOT_QUALIFICATION_PLAN.md"],
    scientificAuthority: "NONE",
    limitations: [
      "Three project-controlled runs are an engineering minimum, not statistical significance or validity evidence.",
      "Categorical decisions include full ANSWER option identity or ABSTAIN; absent/malformed/transport outputs are explicitly excluded."
    ]
  };
}

export interface SemanticCoreQualificationAttempt {
  readonly attemptId: string;
  readonly run: number;
  readonly caseId: string;
  readonly promptDigest: string;
  readonly observation: SemanticCoreSubjectObservation;
  readonly evaluation: SemanticCoreCaseResult;
  readonly evaluationDigest: string;
  readonly replayDigest: string;
  readonly replayExact: boolean;
  readonly evaluatorExecution: EvaluatorExecution;
}
export function evaluateSemanticCoreObservation(
  item: SemanticCoreCase,
  observation: SemanticCoreSubjectObservation
): SemanticCoreCaseResult {
  if (observation.status === "ERROR")
    return {
      caseId: item.caseId,
      dimensionId: item.dimensionId,
      state: "SUBJECT_ERROR",
      scientificAuthority: "NONE"
    };
  return evaluateSemanticCoreCase(
    item,
    observation.status === "RESPONSE"
      ? observation.response
      : observation.status === "MALFORMED"
        ? null
        : undefined
  );
}
function boundedObservation(
  value: SemanticCoreSubjectObservation,
  input: SemanticCoreInput,
  config: SemanticCoreSubjectConfiguration
): SemanticCoreSubjectObservation {
  const allowed = [
    "status",
    "response",
    "error",
    "modelId",
    "providerName",
    "requestId",
    "rawResponseDigest",
    "rawResponseAvailability",
    "usage"
  ];
  if (!value || Object.getPrototypeOf(value) !== Object.prototype)
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (
    Reflect.ownKeys(descriptors).some(
      (key) => typeof key !== "string" || !allowed.includes(key) || !("value" in descriptors[key]!)
    ) ||
    !["RESPONSE", "MISSING", "MALFORMED", "ERROR"].includes(value.status) ||
    value.rawResponseAvailability !== "UNAVAILABLE"
  )
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  if (
    (value.modelId !== undefined && value.modelId !== config.modelId) ||
    (value.providerName !== undefined && value.providerName !== config.providerName)
  )
    throw new SemanticCoreQualificationError("IDENTITY_SUBSTITUTION");
  if (value.usage) {
    const usage = Object.getOwnPropertyDescriptors(value.usage);
    if (
      Reflect.ownKeys(usage).some(
        (key) =>
          typeof key !== "string" ||
          !["promptTokens", "completionTokens", "cost"].includes(key) ||
          !("value" in usage[key]!)
      ) ||
      !Number.isSafeInteger(value.usage.promptTokens) ||
      !Number.isSafeInteger(value.usage.completionTokens) ||
      !Number.isFinite(value.usage.cost)
    )
      throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  }
  if (value.requestId && !/^gen-[a-zA-Z0-9-]{1,100}$/.test(value.requestId))
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  if (value.rawResponseDigest && !/^[a-f0-9]{64}$/.test(value.rawResponseDigest))
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  if (
    value.error &&
    ![
      "PREFLIGHT_FAILURE",
      "ZERO_COST_POLICY_FAILURE",
      "CREDENTIAL_UNAVAILABLE",
      "PROVIDER_METADATA_MISMATCH",
      "TRANSPORT_FAILURE",
      "PROVIDER_REJECTION",
      "TIMEOUT",
      "MALFORMED_SUBJECT_OUTPUT",
      "MISSING_OUTPUT",
      "EVALUATOR_FAILURE",
      "EVIDENCE_PACKAGING_FAILURE",
      "EVIDENCE_VERIFICATION_FAILURE",
      "REGRESSION_REPLAY_MISMATCH",
      "IDENTITY_SUBSTITUTION"
    ].includes(value.error)
  )
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  if (
    value.response &&
    (!validateSemanticCoreResponse(value.response) ||
      value.response.caseId !== input.caseId ||
      (value.response.status === "ANSWER" &&
        !input.options.some(
          (option) =>
            value.response?.status === "ANSWER" &&
            option.optionId === value.response.selectedOptionId
        )))
  ) {
    const { response: _discarded, ...safe } = value;
    return { ...safe, status: "MALFORMED", error: "MALFORMED_SUBJECT_OUTPUT" };
  }
  return structuredClone(value);
}
function baseExecution(
  id: string,
  run: number,
  conditionDigest: string,
  references: string[],
  target: string
): EvaluatorExecution {
  return {
    executionId: id,
    runId: `semantic-core-run-${run}`,
    evaluatorIdentity: SEMANTIC_CORE_EVALUATOR,
    configurationDigest: configuration.configurationDigest,
    subject: { subjectId: conditionDigest, subjectKind: "STRUCTURED_RESPONSE_SUBJECT" },
    evaluationTarget: target,
    inputKind: "SEMANTIC_CORE_SELECTION",
    inputReferences: references,
    status: "SUCCEEDED",
    evidenceReferences: ["condition:" + conditionDigest],
    provenanceReference: "condition:" + conditionDigest,
    executedAt: new Date().toISOString()
  };
}

export async function runSemanticCoreQualification(options: {
  packRoot: string;
  source: { gitCommit: string; gitTree: string };
  configuration?: SemanticCoreSubjectConfiguration;
  mode?: "dry" | "live";
  authorizeLive?: boolean;
  subject?: SemanticCoreQualificationSubject;
  repositoryValidation?: {
    readonly sourceCommit: string;
    readonly reportDigest: string;
    readonly status: "PASSED";
  };
  protocolVersion?: "0.1.0" | "0.1.1";
  run?: number;
  previous?: SemanticCoreQualificationCapture;
  providerMetadata?: import("./semantic-core-qualification-types.js").SemanticCoreProviderMetadata;
  collectionWindow?: { openedAt: string; deadline: string };
  onCondition?: (
    condition: SemanticCoreQualificationCapture["condition"],
    digest: string
  ) => Promise<void>;
  onPreflight?: (safeSummary: unknown) => void;
  onAttempt?: (attempt: SemanticCoreQualificationAttempt) => Promise<void>;
}) {
  if (
    options.mode === "live" &&
    (!options.authorizeLive || !options.configuration || !options.subject)
  )
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  if (
    options.mode === "live" &&
    options.protocolVersion === "0.1.1" &&
    (![1, 2, 3].includes(options.run ?? 0) ||
      (options.previous?.attempts.length ?? 0) !== ((options.run ?? 0) - 1) * 24)
  )
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  const prepared = await prepareSemanticCoreQualification(
    options.packRoot,
    options.source,
    options.configuration,
    options.protocolVersion
  );
  if (options.mode !== "live")
    return {
      mode: "DRY_RUN" as const,
      empiricalEvidence: false,
      scheduledAttempts: 72,
      frozen: prepared.frozen,
      outcome: "INSUFFICIENT_EVIDENCE" as const
    };
  const subject = options.subject!;
  const config = structuredClone(options.configuration!);
  if (subject.evidenceOrigin === "LIVE_PROVIDER") {
    if (!subject.capacity) throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
    const capacity = await subject.capacity();
    const required = options.protocolVersion === "0.1.1" && options.run ? 24 : 72;
    if (!Number.isSafeInteger(capacity.remaining) || capacity.remaining < required)
      throw new SemanticCoreQualificationError("INSUFFICIENT_FREE_REQUEST_CAPACITY");
  }
  const initialMetadata = options.providerMetadata ?? (await subject.preflight(config));
  assertSemanticCoreFreeRoute(initialMetadata, config);
  const condition = {
    ...prepared.frozen,
    providerMetadata: initialMetadata,
    evidenceOrigin: subject.evidenceOrigin,
    ...(options.collectionWindow ? { collectionWindow: options.collectionWindow } : {})
  };
  const conditionDigest = semanticCoreDigest(condition);
  if (options.previous && options.previous.conditionDigest !== conditionDigest)
    throw new SemanticCoreQualificationError("IDENTITY_SUBSTITUTION");
  await options.onCondition?.(condition, conditionDigest);
  options.onPreflight?.({
    benchmark: SEMANTIC_CORE_BENCHMARK,
    packDigest: condition.packDigest,
    protocol: condition.protocol,
    subject: config,
    pricing: initialMetadata.pricing,
    conditionDigest,
    scheduledAttempts: 72
  });
  const attempts: SemanticCoreQualificationAttempt[] = structuredClone(
    options.previous?.attempts ?? []
  );
  let halted: SemanticCoreSubjectObservation["error"];
  const runNumbers = options.run ? [options.run] : [1, 2, 3];
  for (const run of runNumbers) {
    for (const [index, item] of prepared.items.entries()) {
      const attemptId = `semantic-core-run-${run}-${item.caseId}`;
      const promptDigest = condition.prompts[index]!.promptDigest;
      let observation: SemanticCoreSubjectObservation;
      if (halted)
        observation = { status: "ERROR", error: halted, rawResponseAvailability: "UNAVAILABLE" };
      else {
        try {
          const checked = await prepareSemanticCoreQualification(
            options.packRoot,
            options.source,
            config,
            options.protocolVersion
          );
          if (semanticCoreDigest(checked.frozen) !== semanticCoreDigest(prepared.frozen))
            throw new SemanticCoreQualificationError("IDENTITY_SUBSTITUTION");
          const metadata = await subject.preflight(structuredClone(config));
          assertSemanticCoreFreeRoute(metadata, config);
          if (semanticCoreDigest(metadata) !== semanticCoreDigest(initialMetadata))
            throw new SemanticCoreQualificationError("PROVIDER_METADATA_MISMATCH");
          observation = await subject.observe(
            semanticCoreSubjectInput(item),
            structuredClone(config),
            { attemptId, promptDigest, conditionDigest }
          );
          observation = boundedObservation(observation, semanticCoreSubjectInput(item), config);
          // Trusted transport boundary still must preserve cost and exact observable provenance.
          if (
            observation.status !== "ERROR" &&
            (observation.modelId !== config.modelId ||
              observation.providerName !== config.providerName)
          )
            observation = {
              status: "ERROR",
              error: "IDENTITY_SUBSTITUTION",
              rawResponseAvailability: "UNAVAILABLE"
            };
          if (observation.status !== "ERROR" && observation.usage?.cost !== 0)
            observation = {
              status: "ERROR",
              error: "ZERO_COST_POLICY_FAILURE",
              rawResponseAvailability: "UNAVAILABLE"
            };
        } catch (error) {
          observation = {
            status: "ERROR",
            error:
              error instanceof SemanticCoreQualificationError ? error.code : "TRANSPORT_FAILURE",
            rawResponseAvailability: "UNAVAILABLE"
          };
        }
        if (
          [
            "IDENTITY_SUBSTITUTION",
            "PROVIDER_METADATA_MISMATCH",
            "ZERO_COST_POLICY_FAILURE",
            "CREDENTIAL_UNAVAILABLE",
            "PREFLIGHT_FAILURE"
          ].includes(observation.error ?? "")
        )
          halted = observation.error;
      }
      const evaluation = evaluateSemanticCoreObservation(item, observation);
      const replay = evaluateSemanticCoreObservation(item, structuredClone(observation));
      const response = observation.response;
      const execution = baseExecution(
        attemptId + "-evaluation",
        run,
        conditionDigest,
        ["case:" + item.caseId, "prompt:" + promptDigest],
        item.caseId
      );
      const categorical: EvaluatorExecution =
        response && ["PASSED", "INCORRECT", "ABSTAINED"].includes(evaluation.state)
          ? {
              ...execution,
              benchmarkBinding: {
                benchmark: SEMANTIC_CORE_BENCHMARK,
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
      // PARTIAL without output excludes absent/malformed/provider-failed model decisions from S05;
      // the local evaluator's terminal state is still preserved separately, never an incorrect answer.
      evaluators.recordExecution(categorical, configuration);
      const evaluationDigest = semanticCoreDigest(evaluation);
      const replayDigest = semanticCoreDigest(replay);
      const attempt = {
        attemptId,
        run,
        caseId: item.caseId,
        promptDigest,
        observation,
        evaluation,
        evaluationDigest,
        replayDigest,
        replayExact: evaluationDigest === replayDigest,
        evaluatorExecution: categorical
      };
      attempts.push(attempt);
      await options.onAttempt?.(attempt);
    }
  }
  const runs = [...new Set(attempts.map((a) => a.run))].map((run) => {
    const prior = options.previous?.runs.find((entry) => entry.run === run);
    if (prior) return structuredClone(prior);
    const selected = attempts.filter((a) => a.run === run);
    const results = semanticCoreMetricsFor(
      selected.map((a) => a.evaluation),
      condition.packDigest
    );
    const executions = results.map((result) => {
      const execution: EvaluatorExecution = {
        ...baseExecution(
          `run-${run}-${result.metricIdentity.metricId}`,
          run,
          conditionDigest,
          condition.cases.map((c) => "case:" + c.caseId),
          result.metricIdentity.metricId
        ),
        ...(result.benchmarkBinding ? { benchmarkBinding: result.benchmarkBinding } : {}),
        metricIdentity: result.metricIdentity,
        output: { kind: "METRIC_RESULT", metricResult: result }
      };
      return evaluators.recordExecution(execution, configuration);
    });
    return {
      run,
      accounted: selected.length,
      stateCounts: Object.fromEntries(
        SEMANTIC_CORE_STATES.map((state) => [
          state,
          selected.filter((a) => a.evaluation.state === state).length
        ])
      ),
      metrics: results,
      metricExecutions: executions
    };
  });
  const capture = { schemaVersion: "0.1.0" as const, condition, conditionDigest, attempts, runs };
  if (attempts.length !== 72)
    return {
      mode: "STAGED" as const,
      capture,
      captureDigest: semanticCoreCaptureDigest(capture),
      outcome: "INSUFFICIENT_EVIDENCE" as const
    };
  const registry = new ReliabilityRegistry(
    { ...CANONICAL_RELIABILITY_REGISTRY, studies: prepared.studies },
    evaluators,
    metrics
  );
  const reliability = prepared.studies.map((definition) => {
    const selected =
      definition.target.kind === "METRIC"
        ? runs
            .flatMap((r) => r.metricExecutions)
            .filter(
              (e) =>
                e.metricIdentity!.metricId ===
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
      configurations: [configuration],
      evidenceReferences: ["condition:" + conditionDigest],
      provenanceReference: "condition:" + conditionDigest,
      executedAt: new Date().toISOString()
    });
  });
  const evidence = buildSemanticCoreEvidence(
    condition,
    conditionDigest,
    attempts,
    runs,
    reliability
  );
  const nonPromotion = new ResearchPromotionSystem().assessPromotion({
    assessmentId: "semantic-core-stronger-stage-boundary",
    assessmentVersion: "0.1.0",
    schemaVersion: "1.0.0",
    request: {
      requestId: "semantic-core-non-promotion-proof",
      requestVersion: "0.1.0",
      benchmarkIdentity: {
        state: "KNOWN",
        value: SEMANTIC_CORE_BENCHMARK,
        evidenceReferences: ["condition:" + conditionDigest]
      },
      intakeIdentity: { researchIntakeId: "semantic-core-phase4", researchIntakeVersion: "0.1.0" },
      requestedStage: "VALIDATED",
      candidateKind: "GENERAL",
      requestedByGovernance: false,
      evidenceReferences: evidence.packages.map((p) => p.packageId),
      rationale:
        "Boundary assessment only; absent scientific evidence must block stronger promotion."
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
  const regression = await replaySemanticCoreQualification(options.packRoot, capture);
  const criticalFindings = [
    ...(halted ? [halted] : []),
    ...(options.protocolVersion === "0.1.1" &&
    attempts.some((a) => a.observation.status === "ERROR")
      ? ["INFRASTRUCTURE_FAILURE"]
      : []),
    ...(!attempts.every((a) => a.replayExact) ? ["REGRESSION_REPLAY_MISMATCH"] : []),
    ...(evidence.verifications.some((v) => v.findings.some((f) => f.severity === "ERROR"))
      ? ["EVIDENCE_VERIFICATION_FAILURE"]
      : []),
    ...(!regression.exact ? ["REGRESSION_REPLAY_MISMATCH"] : [])
  ];
  const sufficient =
    subject.evidenceOrigin === "LIVE_PROVIDER" &&
    attempts.some((a) => a.observation.rawResponseDigest) &&
    reliability.every((r) => r.estimate.applicability === "ESTIMATED");
  const validation = options.repositoryValidation;
  const regressionGreen =
    validation?.status === "PASSED" &&
    validation.sourceCommit === condition.source.gitCommit &&
    /^[a-f0-9]{64}$/.test(validation.reportDigest);
  const outcome: SemanticCoreQualificationOutcome = criticalFindings.length
    ? "NOT_QUALIFIED"
    : sufficient && regressionGreen
      ? "QUALIFIED_FOR_BM3_REVIEW"
      : "INSUFFICIENT_EVIDENCE";
  return {
    mode: "LIVE" as const,
    capture,
    captureDigest: semanticCoreCaptureDigest(capture),
    reliability,
    ...evidence,
    nonPromotion,
    regression,
    qualification: {
      identity: {
        qualificationId: protocol.protocolId,
        qualificationVersion: condition.protocol.protocolVersion
      },
      protocol: condition.protocol,
      conditionDigest,
      benchmark: SEMANTIC_CORE_BENCHMARK,
      packDigest: condition.packDigest,
      source: condition.source,
      scheduledRuns: 3,
      scheduledAttempts: 72,
      accountedAttempts: attempts.length,
      evaluatorReplayExact: attempts.every((a) => a.replayExact),
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
      outcome,
      scientificAuthority: "NONE",
      decisionAuthority: "NONE",
      proposesBM3: false,
      acceptance: "HUMAN_REVIEW_AND_MERGE_REQUIRED"
    }
  };
}

/** Audit clocks do not change capture identity; response option identity remains material. */
export function semanticCoreCaptureDigest(capture: unknown): string {
  const portable = JSON.parse(
    JSON.stringify(capture, (key, value: unknown) => (key === "executedAt" ? undefined : value))
  ) as unknown;
  return semanticCoreDigest(portable);
}

/** Captured observations are data; this path never calls a provider or repairs answers. */
export async function replaySemanticCoreQualification(
  packRoot: string,
  capture: {
    condition: Prepared["frozen"] & {
      providerMetadata: unknown;
      evidenceOrigin: string;
      collectionWindow?: { openedAt: string; deadline: string };
    };
    conditionDigest: string;
    attempts: readonly SemanticCoreQualificationAttempt[];
    runs: readonly { run: number; metrics: ReturnType<typeof semanticCoreMetricsFor> }[];
  }
) {
  if (semanticCoreDigest(capture.condition) !== capture.conditionDigest)
    throw new SemanticCoreQualificationError("IDENTITY_SUBSTITUTION");
  const prepared = await prepareSemanticCoreQualification(
    packRoot,
    capture.condition.source,
    capture.condition.subjectConfiguration ?? undefined,
    capture.condition.protocol.protocolVersion
  );
  const {
    providerMetadata: _metadata,
    evidenceOrigin: _origin,
    collectionWindow: _window,
    ...frozen
  } = capture.condition;
  if (semanticCoreDigest(prepared.frozen) !== semanticCoreDigest(frozen))
    throw new SemanticCoreQualificationError("IDENTITY_SUBSTITUTION");
  const evaluated: { run: number; evaluation: SemanticCoreCaseResult }[] = [];
  let exact = capture.attempts.length === 72 && capture.runs.length === 3;
  for (let run = 1; run <= 3; run++)
    for (const [index, item] of prepared.items.entries()) {
      const attempt = capture.attempts[(run - 1) * 24 + index];
      if (
        !attempt ||
        attempt.run !== run ||
        attempt.caseId !== item.caseId ||
        attempt.promptDigest !== prepared.frozen.prompts[index]!.promptDigest
      ) {
        exact = false;
        continue;
      }
      const evaluation = evaluateSemanticCoreObservation(item, attempt.observation);
      if (
        semanticCoreDigest(evaluation) !== attempt.evaluationDigest ||
        canonicalJson(evaluation) !== canonicalJson(attempt.evaluation)
      )
        exact = false;
      evaluated.push({ run, evaluation });
    }
  for (let run = 1; run <= 3; run++) {
    const results = semanticCoreMetricsFor(
      evaluated.filter((e) => e.run === run).map((e) => e.evaluation),
      prepared.frozen.packDigest
    );
    if (canonicalJson(results) !== canonicalJson(capture.runs.find((r) => r.run === run)?.metrics))
      exact = false;
  }
  return {
    exact,
    replayedAttempts: evaluated.length,
    externalReproduction: false,
    scientificAuthority: "NONE" as const
  };
}

export type SemanticCoreQualificationCapture = {
  schemaVersion: "0.1.0";
  condition: Prepared["frozen"] & {
    providerMetadata: import("./semantic-core-qualification-types.js").SemanticCoreProviderMetadata;
    evidenceOrigin: string;
    collectionWindow?: { openedAt: string; deadline: string };
  };
  conditionDigest: string;
  attempts: SemanticCoreQualificationAttempt[];
  runs: {
    run: number;
    accounted: number;
    stateCounts: Record<string, number>;
    metrics: ReturnType<typeof semanticCoreMetricsFor>;
    metricExecutions: EvaluatorExecution[];
  }[];
};
