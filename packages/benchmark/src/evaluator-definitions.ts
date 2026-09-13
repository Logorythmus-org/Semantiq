import { BENCHMARK_EVALUATOR_MECHANISMS } from "./registry-types.js";
import type {
  CanonicalEvaluatorDefinition,
  CanonicalEvaluatorRegistrySnapshot,
  CanonicalRubricDefinition
} from "./evaluator-types.js";

const longHorizonRubric: CanonicalRubricDefinition = {
  identity: { rubricId: "long_horizon_heuristic_weights", rubricVersion: "0.1.0" },
  versionScope: "RUBRIC",
  name: "Long-horizon heuristic weights",
  description: "Named criteria used by the existing supplied-trace resilience calculation.",
  criteria: [
    {
      criterionId: "milestone_completion",
      description: "Completed milestones divided by declared milestones.",
      weight: 0.35,
      reference: "packages/sandbox-contracts/src/long-horizon.ts"
    },
    {
      criterionId: "goal_convergence",
      description: "Goal-convergence value carried by the trajectory.",
      weight: 0.25,
      reference: "packages/sandbox-contracts/src/long-horizon.ts"
    },
    {
      criterionId: "memory_coherence_proxy",
      description: "Current memory-coherence heuristic.",
      weight: 0.2,
      reference: "packages/sandbox-contracts/src/long-horizon.ts"
    },
    {
      criterionId: "budget_efficiency_proxy",
      description: "Current token-budget efficiency heuristic.",
      weight: 0.2,
      reference: "packages/sandbox-contracts/src/long-horizon.ts"
    }
  ],
  provenance: {
    origin: "Existing LongHorizonTestingEngine formula",
    provenanceClass: "PROJECT_EXISTING_SOURCE",
    sourceReferences: ["packages/sandbox-contracts/src/long-horizon.ts"],
    introducedIn: "S04"
  },
  limitations: [
    "The weights are existing engineering heuristics without registered calibration or validation evidence."
  ]
};

const providerTck: CanonicalEvaluatorDefinition = {
  identity: { evaluatorId: "sandbox_tck_suite", evaluatorVersion: "0.1.0" },
  versionScope: "EVALUATOR",
  name: "Sandbox TCK suite evaluator",
  description: "Adapts deterministic provider conformance checks to canonical S-03 metric results.",
  kind: "DETERMINISTIC",
  bindingStatus: "IMPLEMENTED_AND_BOUND",
  implementationId: "SandboxTCK.runSuite",
  authority: ["PRODUCE_OBSERVATION", "COMPUTE_METRIC"],
  scientificAuthority: "NONE",
  benchmarkBindings: [
    {
      benchmark: { benchmarkId: "provider_tck", benchmarkVersion: "0.1.0" },
      constructIds: ["provider_contract_conformance"]
    }
  ],
  metricBindings: [
    { metricId: "provider_tck_passed_tests", metricVersion: "0.1.0" },
    { metricId: "provider_tck_pass_rate", metricVersion: "0.1.0" }
  ],
  inputs: { inputKinds: ["TCK_REPORT"], minimumInputs: 1, subjectKinds: ["SANDBOX_PROVIDER"] },
  outputs: { kinds: ["METRIC_RESULT"], numericOutputRequiresMetricResult: true },
  rubric: { requirement: "FORBIDDEN" },
  modelRequirement: "FORBIDDEN",
  determinism: "DETERMINISTIC",
  judgeIndependence: "NON_MODEL",
  parameters: [],
  evidenceReferences: [
    "packages/sandbox-tck/src/tck-suite.ts",
    "tests/unit/sandbox-evidence-tck.test.ts"
  ],
  provenance: {
    origin: "Existing SandboxTCK.runSuite output",
    provenanceClass: "PROJECT_EXISTING_SOURCE",
    sourceReferences: ["packages/sandbox-tck/src/tck-suite.ts"],
    introducedIn: "S04"
  },
  limitations: ["Passing checks establish engineering conformance only."]
};

const longHorizon: CanonicalEvaluatorDefinition = {
  identity: { evaluatorId: "long_horizon_rule_evaluator", evaluatorVersion: "0.1.0" },
  versionScope: "EVALUATOR",
  name: "Long-horizon rule evaluator",
  description: "Adapts the existing supplied-trace heuristic and preserves its current behavior.",
  kind: "RULE_BASED",
  bindingStatus: "IMPLEMENTED_AND_BOUND",
  implementationId: "LongHorizonTestingEngine.evaluateLongHorizonTrajectory",
  authority: ["PRODUCE_OBSERVATION", "COMPUTE_METRIC"],
  scientificAuthority: "NONE",
  benchmarkBindings: [
    {
      benchmark: { benchmarkId: "long_horizon", benchmarkVersion: "0.1.0" },
      constructIds: ["long_horizon_resilience"]
    }
  ],
  metricBindings: [{ metricId: "long_horizon_resilience_index", metricVersion: "0.1.0" }],
  inputs: {
    inputKinds: ["LONG_HORIZON_TRACE"],
    minimumInputs: 1,
    subjectKinds: ["AGENT_TRAJECTORY"]
  },
  outputs: { kinds: ["METRIC_RESULT"], numericOutputRequiresMetricResult: true },
  rubric: { requirement: "REQUIRED", identity: longHorizonRubric.identity },
  modelRequirement: "FORBIDDEN",
  determinism: "DETERMINISTIC",
  judgeIndependence: "NON_MODEL",
  parameters: [],
  evidenceReferences: [
    "packages/sandbox-contracts/src/long-horizon.ts",
    "tests/unit/long-horizon.test.ts"
  ],
  provenance: {
    origin: "Existing LongHorizonTestingEngine output",
    provenanceClass: "PROJECT_EXISTING_SOURCE",
    sourceReferences: ["packages/sandbox-contracts/src/long-horizon.ts"],
    introducedIn: "S04"
  },
  limitations: ["The score is an uncalibrated and unvalidated heuristic over supplied traces."]
};

const statisticalContrast: CanonicalEvaluatorDefinition = {
  identity: { evaluatorId: "matched_statistical_contrast", evaluatorVersion: "0.1.0" },
  versionScope: "EVALUATOR",
  name: "Matched statistical contrast evaluator",
  description: "Adapts deterministic matched-pair arithmetic and optional seeded bootstrap output.",
  kind: "DETERMINISTIC",
  bindingStatus: "IMPLEMENTED_AND_BOUND",
  implementationId: "StatisticalContrastEngine.evaluateContrast",
  authority: ["PRODUCE_OBSERVATION", "COMPUTE_METRIC"],
  scientificAuthority: "NONE",
  benchmarkBindings: [],
  metricBindings: [{ metricId: "matched_pair_mean_delta", metricVersion: "0.1.0" }],
  inputs: { inputKinds: ["MATCHED_RUN_PAIR"], minimumInputs: 1, subjectKinds: ["RUN_POPULATION"] },
  outputs: { kinds: ["METRIC_RESULT"], numericOutputRequiresMetricResult: true },
  rubric: { requirement: "FORBIDDEN" },
  modelRequirement: "FORBIDDEN",
  determinism: "SEEDED_STOCHASTIC",
  judgeIndependence: "NON_MODEL",
  parameters: [
    {
      parameterId: "bootstrapSeed",
      type: "NUMBER",
      required: false,
      description: "Integer seed used when a bootstrap interval is requested."
    }
  ],
  evidenceReferences: [
    "packages/evidence/src/statistical-contrast/statistical-contrast-engine.ts",
    "tests/unit/matched-statistical-contrast.test.ts"
  ],
  provenance: {
    origin: "Existing StatisticalContrastEngine output",
    provenanceClass: "PROJECT_EXISTING_SOURCE",
    sourceReferences: ["packages/evidence/src/statistical-contrast/statistical-contrast-engine.ts"],
    introducedIn: "S04"
  },
  limitations: [
    "Matched association is not proof of causal effect; evaluator execution does not validate a construct."
  ]
};

const behavioralLegacy: CanonicalEvaluatorDefinition = {
  identity: { evaluatorId: "behavioral_metrics_legacy_suite", evaluatorVersion: "0.1.0" },
  versionScope: "EVALUATOR",
  name: "Legacy behavioral metrics suite",
  description:
    "Registers the existing behavioral heuristic producer without reclassifying its values as S-03 metrics.",
  kind: "RULE_BASED",
  bindingStatus: "IMPLEMENTED_AND_BOUND",
  implementationId: "BehavioralMetricsEngine.evaluate",
  authority: ["PRODUCE_OBSERVATION"],
  scientificAuthority: "NONE",
  benchmarkBindings: [],
  metricBindings: [],
  inputs: { inputKinds: ["BEHAVIORAL_EVIDENCE"], minimumInputs: 1, subjectKinds: ["AGENT_RUN"] },
  outputs: { kinds: ["LEGACY_ARTIFACT_REFERENCE"], numericOutputRequiresMetricResult: true },
  rubric: { requirement: "FORBIDDEN" },
  modelRequirement: "FORBIDDEN",
  determinism: "DETERMINISTIC",
  judgeIndependence: "NON_MODEL",
  parameters: [],
  evidenceReferences: [
    "packages/evidence/src/behavioral-metrics/behavioral-metrics-engine.ts",
    "packages/evidence/src/behavioral-metrics/metric-definitions.ts"
  ],
  provenance: {
    origin: "Existing BehavioralMetricsEngine output",
    provenanceClass: "PROJECT_EXISTING_SOURCE",
    sourceReferences: [
      "packages/evidence/src/behavioral-metrics/behavioral-metrics-engine.ts",
      "packages/evidence/src/behavioral-metrics/types.ts"
    ],
    introducedIn: "S04"
  },
  limitations: [
    "Legacy confidence labels are provenance context, not S-03 uncertainty, calibration, or validation."
  ]
};

const humanJudgeContract: CanonicalEvaluatorDefinition = {
  identity: { evaluatorId: "human_judge_contract", evaluatorVersion: "0.1.0" },
  versionScope: "EVALUATOR",
  name: "Human judge contract",
  description:
    "S-06 governed Human-as-Judge adapter from pseudonymous ratings to canonical evaluator executions.",
  kind: "HUMAN_JUDGE",
  bindingStatus: "IMPLEMENTED_AND_BOUND",
  implementationId: "HumanRaterSystem.toEvaluatorExecution",
  authority: ["PRODUCE_JUDGMENT", "RECOMMEND_RATING"],
  scientificAuthority: "NONE",
  benchmarkBindings: [],
  metricBindings: [],
  studyDeclaredBindingPolicy: { benchmark: "ALLOWED", metric: "ALLOWED" },
  inputs: {
    inputKinds: ["EVIDENCE_BUNDLE"],
    minimumInputs: 1,
    subjectKinds: ["EVALUATION_SUBJECT"]
  },
  outputs: {
    kinds: ["METRIC_RESULT", "STRUCTURED_JUDGMENT", "CATEGORICAL_DECISION"],
    numericOutputRequiresMetricResult: true
  },
  rubric: { requirement: "OPTIONAL" },
  modelRequirement: "FORBIDDEN",
  determinism: "UNKNOWN",
  judgeIndependence: "HUMAN",
  parameters: [
    {
      parameterId: "presentationMode",
      type: "STRING",
      required: true,
      description: "S-06 presentation mode fixed by the Human Rating Study."
    },
    {
      parameterId: "blindingPolicy",
      type: "STRING",
      required: true,
      description: "Declared S-06 metadata-blinding policy."
    },
    {
      parameterId: "ratingScale",
      type: "STRING",
      required: true,
      description: "Canonical S-06 output-contract kind."
    },
    {
      parameterId: "comparisonPolicy",
      type: "STRING",
      required: true,
      description: "Study-declared comparison policy; it carries no validity claim."
    }
  ],
  evidenceReferences: [
    "packages/benchmark/src/human-rater.ts",
    "tests/unit/human-rater-system.test.ts"
  ],
  provenance: {
    origin: "S-04 canonical contract",
    provenanceClass: "HUMAN_DIRECTION",
    sourceReferences: [
      "Docs/research/core/S04_EVALUATOR_LABORATORY.md",
      "Docs/research/core/S06_HUMAN_RATER_SYSTEM.md"
    ],
    introducedIn: "S04"
  },
  limitations: [
    "S-06 implements Human-as-Judge record conversion only; it does not implement Human-as-Subject, Human-AI comparison, rater-quality scoring, or scientific validation."
  ]
};

export const HIB_OBJECTIVE_RULE_EVALUATOR_IDENTITY = {
  evaluatorId: "hib_objective_rule",
  evaluatorVersion: "0.1.0"
} as const;

const hibObjectiveRule: CanonicalEvaluatorDefinition = {
  identity: HIB_OBJECTIVE_RULE_EVALUATOR_IDENTITY,
  versionScope: "EVALUATOR",
  name: "HIB objective categorical rule evaluator",
  description:
    "Applies an item-declared exact categorical rule to a submitted Human-as-Subject response.",
  kind: "RULE_BASED",
  bindingStatus: "IMPLEMENTED_AND_BOUND",
  implementationId: "HumanBenchmarkSystem.scoreObjectiveResponse",
  authority: ["PRODUCE_OBSERVATION"],
  scientificAuthority: "NONE",
  benchmarkBindings: [
    {
      benchmark: { benchmarkId: "hib_research_candidate", benchmarkVersion: "0.1.0" },
      constructIds: ["meaning_context_behavior"]
    }
  ],
  metricBindings: [],
  inputs: {
    inputKinds: ["HUMAN_SUBJECT_RESPONSE"],
    minimumInputs: 1,
    subjectKinds: ["HUMAN_SUBJECT"]
  },
  outputs: { kinds: ["CATEGORICAL_DECISION"], numericOutputRequiresMetricResult: true },
  rubric: { requirement: "FORBIDDEN" },
  modelRequirement: "FORBIDDEN",
  determinism: "DETERMINISTIC",
  judgeIndependence: "NON_MODEL",
  parameters: [
    {
      parameterId: "ruleReference",
      type: "STRING",
      required: true,
      description: "Exact candidate-item rule reference used for categorical evaluation."
    }
  ],
  evidenceReferences: [
    "packages/benchmark/src/human-benchmark.ts",
    "tests/unit/human-benchmark-reconstruction.test.ts"
  ],
  provenance: {
    origin: "S-07 synthetic HIB research-candidate architecture",
    provenanceClass: "HUMAN_DIRECTION",
    sourceReferences: ["Docs/research/core/S07_HIB_HUMAN_BENCHMARK_RECONSTRUCTION.md"],
    introducedIn: "S07"
  },
  limitations: [
    "Categorical correctness on one synthetic item is not a numeric metric, human ability estimate, calibration result, or validity claim."
  ]
};

export const CANONICAL_EVALUATOR_REGISTRY: CanonicalEvaluatorRegistrySnapshot = {
  evaluatorRegistrySchemaVersion: "0.1.0",
  supportedKinds: BENCHMARK_EVALUATOR_MECHANISMS,
  rubrics: [longHorizonRubric],
  definitions: [
    providerTck,
    longHorizon,
    statisticalContrast,
    behavioralLegacy,
    humanJudgeContract,
    hibObjectiveRule
  ]
};
