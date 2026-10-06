import type { CanonicalBenchmarkDefinition } from "./registry-types.js";
import type { CanonicalEvaluatorDefinition } from "./evaluator-types.js";
import type { CanonicalMetricDefinition } from "./metric-types.js";

export const SEMANTIC_CORE_BENCHMARK = {
  benchmarkId: "semantic_core_pilot",
  benchmarkVersion: "0.1.0"
} as const;
export const SEMANTIC_CORE_EVALUATOR = {
  evaluatorId: "semantic_core_rule_evaluator",
  evaluatorVersion: "0.1.0"
} as const;
export const SEMANTIC_CORE_CONSTRUCTS = [
  "meaning_context_behavior",
  "uncertainty_evidence_boundary",
  "bias_mechanism_reasoning"
] as const;
export const SEMANTIC_CORE_METRIC_IDS = [
  "semantic_core_eligible_cases",
  "semantic_core_passed_cases",
  "semantic_core_meaning_context_pass_proportion",
  "semantic_core_epistemic_boundary_pass_proportion",
  "semantic_core_bias_resistance_pass_proportion"
] as const;
export const SEMANTIC_CORE_METRICS = SEMANTIC_CORE_METRIC_IDS.map((metricId) => ({
  metricId,
  metricVersion: "0.1.0"
}));
const implementation = "evaluateSemanticCoreCase";
const source = "packages/benchmark/src/semantic-core.ts";
const tests = "tests/unit/semantic-core-pilot.test.ts";
const limitations = [
  "Uncalibrated and unvalidated bounded engineering proxy. BM3 is not established.",
  "Synthetic first-party cases; no real-model results or external reproduction.",
  "Historical design ancestry only; does not implement the complete historical SMF/WIF/CBF suites."
];
export const SEMANTIC_CORE_BENCHMARK_DEFINITION: CanonicalBenchmarkDefinition = {
  identity: SEMANTIC_CORE_BENCHMARK,
  versionScope: "BENCHMARK",
  familyId: "agent_behavior",
  name: "Semantic Core Pilot",
  description: "24 structured-selection cases: eight per declared dimension.",
  constructIds: SEMANTIC_CORE_CONSTRUCTS,
  provenance: {
    origin: "Phase 3 newly reconstructed synthetic first-party pilot",
    sourceType: "CURRENT_IMPLEMENTATION",
    temporalStatus: "CURRENT",
    provenanceClass: "AI_GENERATED",
    sourceReferences: [source, "Docs/benchmarks/SEMANTIC_CORE_PILOT.md"],
    datasetCaseProvenance: {
      status: "REPOSITORY_REFERENCED",
      references: ["fixtures/benchmark-packs/semantic-core-pilot-0.1.0/manifest.json"]
    },
    rightsClass: "FIRST_PARTY_OR_PROJECT",
    introducedIn: "PHASE3"
  },
  implementationState: "EXECUTABLE",
  scientificMaturity: "UNVALIDATED_PROXY",
  lifecycleState: "ACTIVE",
  evaluatorRequirements: [
    {
      mechanism: "RULE_BASED",
      bindingStatus: "IMPLEMENTED_AND_BOUND",
      evaluatorId: implementation,
      evidenceReferences: [source]
    }
  ],
  humanRoles: [],
  evidence: {
    implementation: [source],
    tests: [tests],
    reproducibility: [],
    calibration: [],
    validation: [],
    promotion: []
  },
  aliases: [],
  supersedes: [],
  corePromotion: "NOT_PROMOTED",
  limitations
};
export const SEMANTIC_CORE_EVALUATOR_DEFINITION: CanonicalEvaluatorDefinition = {
  identity: SEMANTIC_CORE_EVALUATOR,
  versionScope: "EVALUATOR",
  name: "Semantic Core observable rule evaluator",
  description: "Exact option identity comparison after response validation; no normalization.",
  kind: "RULE_BASED",
  bindingStatus: "IMPLEMENTED_AND_BOUND",
  implementationId: implementation,
  authority: ["PRODUCE_OBSERVATION", "COMPUTE_METRIC"],
  scientificAuthority: "NONE",
  benchmarkBindings: [
    { benchmark: SEMANTIC_CORE_BENCHMARK, constructIds: SEMANTIC_CORE_CONSTRUCTS }
  ],
  metricBindings: SEMANTIC_CORE_METRICS,
  inputs: {
    inputKinds: ["SEMANTIC_CORE_SELECTION"],
    minimumInputs: 1,
    subjectKinds: ["STRUCTURED_RESPONSE_SUBJECT"]
  },
  outputs: {
    kinds: ["METRIC_RESULT", "CATEGORICAL_DECISION"],
    numericOutputRequiresMetricResult: true
  },
  rubric: { requirement: "FORBIDDEN" },
  modelRequirement: "FORBIDDEN",
  determinism: "DETERMINISTIC",
  judgeIndependence: "NON_MODEL",
  parameters: [],
  evidenceReferences: [source, tests],
  provenance: {
    origin: "Phase 3 deterministic evaluator",
    provenanceClass: "PROJECT_EXISTING_SOURCE",
    sourceReferences: [source],
    introducedIn: "PHASE3"
  },
  limitations
};
export const SEMANTIC_CORE_METRIC_DEFINITIONS: CanonicalMetricDefinition[] =
  SEMANTIC_CORE_METRICS.map((identity, i) => {
    const proportion = i >= 2;
    return {
      identity,
      versionScope: "METRIC",
      displayName: identity.metricId,
      description: proportion
        ? "Passed / eligible evaluated cases within the bound dimension; excluded states counted separately."
        : i === 0
          ? "Count of PASSED and INCORRECT cases across all dimensions."
          : "Count of PASSED cases across all dimensions.",
      scope: proportion ? "BENCHMARK_BOUND" : "BENCHMARK_INDEPENDENT",
      ...(proportion
        ? {
            benchmarkBinding: {
              benchmark: SEMANTIC_CORE_BENCHMARK,
              constructId: SEMANTIC_CORE_CONSTRUCTS[i - 2]!
            }
          }
        : {}),
      measurementKind: "ENGINEERING_METRIC",
      scale: {
        type: proportion ? "RATIO" : "COUNT",
        unit: proportion ? "PROPORTION" : "COUNT",
        domain: {
          valueType: "NUMBER",
          minimum: 0,
          ...(proportion ? { maximum: 1, maximumInclusive: true } : { integerOnly: true }),
          minimumInclusive: true,
          finiteOnly: true,
          normalized: proportion
        }
      },
      direction: {
        direction: i === 0 ? "NON_DIRECTIONAL" : "HIGHER_IS_BETTER",
        interpretation:
          "Descriptive criterion coverage within this fixed pilot; no qualification threshold."
      },
      missingness: {
        allowedReasons: [
          "NOT_OBSERVED",
          "INVALID_INPUT",
          "EVALUATOR_FAILURE",
          "INSUFFICIENT_EVIDENCE"
        ],
        aggregationBehavior: "EXCLUDE"
      },
      aggregation: { method: "NONE", minimumObserved: 1, weightsRequired: false },
      denominator: {
        applicability: proportion ? "REQUIRED" : "NOT_APPLICABLE",
        eligiblePopulationRequired: proportion,
        zeroDenominator: "RETURN_MISSING"
      },
      uncertainty: { allowedMethods: ["NONE"], required: false },
      calibration: {
        applicability: "REQUIRED",
        status: "REQUIRED_NOT_CALIBRATED",
        evidenceReferences: []
      },
      validity: { applicability: "REQUIRED", status: "REQUIRED_NOT_VALIDATED", evidence: [] },
      reliability: { applicability: "APPLICABLE", evidenceReferences: [] },
      evaluator: {
        evaluatorId: implementation,
        evaluatorVersion: "0.1.0",
        mechanism: "RULE_BASED",
        implementationReference: source
      },
      evidenceReferences: [source, tests],
      provenance: {
        origin: "Phase 3 declared oracle pass accounting",
        sourceReferences: [source],
        introducedIn: "PHASE3"
      },
      limitations
    };
  });
