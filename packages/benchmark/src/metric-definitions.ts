import type {
  CanonicalMetricDefinition,
  CanonicalMetricRegistrySnapshot,
  MetricMissingReason
} from "./metric-types.js";

const missingReasons: readonly MetricMissingReason[] = [
  "NOT_OBSERVED",
  "NOT_APPLICABLE",
  "INVALID_INPUT",
  "EVALUATOR_FAILURE",
  "INSUFFICIENT_EVIDENCE"
];

const providerBinding = {
  benchmark: { benchmarkId: "provider_tck", benchmarkVersion: "0.1.0" },
  constructId: "provider_contract_conformance"
} as const;

const longHorizonBinding = {
  benchmark: { benchmarkId: "long_horizon", benchmarkVersion: "0.1.0" },
  constructId: "long_horizon_resilience"
} as const;

const providerPassedTests: CanonicalMetricDefinition = {
  identity: { metricId: "provider_tck_passed_tests", metricVersion: "0.1.0" },
  versionScope: "METRIC",
  displayName: "Provider TCK passed tests",
  description: "Count of deterministic provider TCK checks that completed successfully.",
  scope: "BENCHMARK_BOUND",
  benchmarkBinding: providerBinding,
  measurementKind: "ENGINEERING_METRIC",
  scale: {
    type: "COUNT",
    unit: "COUNT",
    domain: {
      valueType: "NUMBER",
      minimum: 0,
      minimumInclusive: true,
      integerOnly: true,
      finiteOnly: true,
      normalized: false
    }
  },
  direction: {
    direction: "HIGHER_IS_BETTER",
    interpretation: "More passing checks indicates broader conformance within the same TCK version."
  },
  missingness: { allowedReasons: missingReasons, aggregationBehavior: "REJECT" },
  aggregation: { method: "NONE", minimumObserved: 1, weightsRequired: false },
  denominator: {
    applicability: "NOT_APPLICABLE",
    eligiblePopulationRequired: false,
    zeroDenominator: "REJECT"
  },
  uncertainty: { allowedMethods: ["NONE"], required: false },
  calibration: {
    applicability: "NOT_APPLICABLE",
    status: "NOT_APPLICABLE",
    evidenceReferences: []
  },
  validity: { applicability: "NOT_APPLICABLE", status: "NOT_APPLICABLE", evidence: [] },
  reliability: { applicability: "NOT_APPLICABLE", evidenceReferences: [] },
  evaluator: {
    evaluatorId: "SandboxTCK.runSuite",
    mechanism: "DETERMINISTIC",
    implementationReference: "packages/sandbox-tck/src/tck-suite.ts"
  },
  evidenceReferences: [
    "packages/sandbox-tck/src/tck-suite.ts",
    "tests/unit/sandbox-evidence-tck.test.ts"
  ],
  provenance: {
    origin: "Existing TckReport.passedTests output",
    sourceReferences: ["packages/sandbox-tck/src/tck-suite.ts"],
    introducedIn: "S03"
  },
  limitations: [
    "The count is comparable only for the same metric and TCK definitions.",
    "A passing count establishes operational conformance, not empirical construct validity."
  ]
};

const providerPassRate: CanonicalMetricDefinition = {
  identity: { metricId: "provider_tck_pass_rate", metricVersion: "0.1.0" },
  versionScope: "METRIC",
  displayName: "Provider TCK pass rate",
  description: "Proportion of eligible TCK checks that completed successfully.",
  scope: "BENCHMARK_BOUND",
  benchmarkBinding: providerBinding,
  measurementKind: "ENGINEERING_METRIC",
  scale: {
    type: "PROBABILITY",
    unit: "PROPORTION",
    domain: {
      valueType: "NUMBER",
      minimum: 0,
      maximum: 1,
      minimumInclusive: true,
      maximumInclusive: true,
      finiteOnly: true,
      normalized: true
    }
  },
  direction: {
    direction: "HIGHER_IS_BETTER",
    interpretation:
      "A larger proportion means more eligible checks passed for the same TCK version."
  },
  missingness: { allowedReasons: missingReasons, aggregationBehavior: "REJECT" },
  aggregation: { method: "NONE", minimumObserved: 1, weightsRequired: false },
  denominator: {
    applicability: "REQUIRED",
    eligiblePopulationRequired: true,
    zeroDenominator: "REJECT"
  },
  uncertainty: { allowedMethods: ["NONE"], required: false },
  calibration: {
    applicability: "NOT_APPLICABLE",
    status: "NOT_APPLICABLE",
    evidenceReferences: []
  },
  validity: { applicability: "NOT_APPLICABLE", status: "NOT_APPLICABLE", evidence: [] },
  reliability: { applicability: "NOT_APPLICABLE", evidenceReferences: [] },
  evaluator: {
    evaluatorId: "SandboxTCK.runSuite",
    mechanism: "DETERMINISTIC",
    implementationReference: "packages/sandbox-tck/src/tck-suite.ts"
  },
  evidenceReferences: [
    "packages/sandbox-tck/src/tck-suite.ts",
    "tests/unit/sandbox-evidence-tck.test.ts"
  ],
  provenance: {
    origin: "Derived from existing TckReport.passedTests and totalTests outputs",
    sourceReferences: ["packages/sandbox-tck/src/tck-suite.ts"],
    introducedIn: "S03"
  },
  limitations: [
    "The eligible population is the checks declared by the same TCK version.",
    "The proportion is an engineering result and carries no statistical uncertainty by default."
  ]
};

const longHorizonResilienceIndex: CanonicalMetricDefinition = {
  identity: { metricId: "long_horizon_resilience_index", metricVersion: "0.1.0" },
  versionScope: "METRIC",
  displayName: "Long-horizon resilience index",
  description:
    "Rule-based composite of milestone completion, goal convergence, memory-coherence proxy, and budget-efficiency proxy.",
  scope: "BENCHMARK_BOUND",
  benchmarkBinding: longHorizonBinding,
  measurementKind: "HEURISTIC_PROXY",
  scale: {
    type: "CONTINUOUS",
    unit: "DIMENSIONLESS",
    domain: {
      valueType: "NUMBER",
      minimum: 0,
      maximum: 1,
      minimumInclusive: true,
      maximumInclusive: true,
      finiteOnly: true,
      normalized: true
    }
  },
  direction: {
    direction: "HIGHER_IS_BETTER",
    interpretation: "Higher values satisfy more of the current rule-based trajectory criteria."
  },
  missingness: { allowedReasons: missingReasons, aggregationBehavior: "REJECT" },
  aggregation: { method: "NONE", minimumObserved: 1, weightsRequired: false },
  denominator: {
    applicability: "NOT_APPLICABLE",
    eligiblePopulationRequired: false,
    zeroDenominator: "REJECT"
  },
  uncertainty: { allowedMethods: ["NONE"], required: false },
  calibration: {
    applicability: "REQUIRED",
    status: "REQUIRED_NOT_CALIBRATED",
    evidenceReferences: []
  },
  validity: {
    applicability: "REQUIRED",
    status: "REQUIRED_NOT_VALIDATED",
    evidence: []
  },
  reliability: { applicability: "APPLICABLE", evidenceReferences: [] },
  evaluator: {
    evaluatorId: "LongHorizonTestingEngine.evaluateLongHorizonTrajectory",
    mechanism: "RULE_BASED",
    implementationReference: "packages/sandbox-contracts/src/long-horizon.ts"
  },
  evidenceReferences: [
    "packages/sandbox-contracts/src/long-horizon.ts",
    "tests/unit/long-horizon.test.ts"
  ],
  provenance: {
    origin: "Existing LongHorizonEvaluationReport.longHorizonResilienceIndex output",
    sourceReferences: ["packages/sandbox-contracts/src/long-horizon.ts"],
    introducedIn: "S03"
  },
  limitations: [
    "The score is a deterministic heuristic over supplied traces, not a calibrated or validated measure of resilience.",
    "The existing component weights and token estimates have no registered empirical calibration evidence."
  ]
};

const matchedPairMeanDelta: CanonicalMetricDefinition = {
  identity: { metricId: "matched_pair_mean_delta", metricVersion: "0.1.0" },
  versionScope: "METRIC",
  displayName: "Matched-pair mean delta",
  description: "Arithmetic mean of treatment-minus-control deltas for matched run pairs.",
  scope: "BENCHMARK_INDEPENDENT",
  measurementKind: "DERIVED_FEATURE",
  scale: {
    type: "CONTINUOUS",
    unit: "DIMENSIONLESS",
    domain: {
      valueType: "NUMBER",
      minimum: -1,
      maximum: 1,
      minimumInclusive: true,
      maximumInclusive: true,
      finiteOnly: true,
      normalized: false
    }
  },
  direction: {
    direction: "NON_DIRECTIONAL",
    interpretation: "The sign and magnitude describe the registered target metric contrast."
  },
  missingness: { allowedReasons: missingReasons, aggregationBehavior: "EXCLUDE" },
  aggregation: { method: "MEAN", minimumObserved: 1, weightsRequired: false },
  denominator: {
    applicability: "NOT_APPLICABLE",
    eligiblePopulationRequired: false,
    zeroDenominator: "REJECT"
  },
  uncertainty: { allowedMethods: ["NONE", "BOOTSTRAP_INTERVAL"], required: false },
  calibration: {
    applicability: "NOT_APPLICABLE",
    status: "NOT_APPLICABLE",
    evidenceReferences: []
  },
  validity: { applicability: "NOT_APPLICABLE", status: "NOT_APPLICABLE", evidence: [] },
  reliability: { applicability: "APPLICABLE", evidenceReferences: [] },
  evaluator: {
    evaluatorId: "StatisticalContrastEngine.evaluateContrast",
    mechanism: "STATISTICAL",
    implementationReference:
      "packages/evidence/src/statistical-contrast/statistical-contrast-engine.ts"
  },
  evidenceReferences: [
    "packages/evidence/src/statistical-contrast/statistical-contrast-engine.ts",
    "tests/unit/matched-statistical-contrast.test.ts"
  ],
  provenance: {
    origin: "Existing MatchedContrastReport.meanDelta output",
    sourceReferences: [
      "packages/evidence/src/statistical-contrast/types.ts",
      "packages/evidence/src/statistical-contrast/statistical-contrast-engine.ts"
    ],
    introducedIn: "S03"
  },
  limitations: [
    "The declared domain assumes an underlying target metric bounded to [0, 1].",
    "Matched association is not proof of causal effect.",
    "A bootstrap interval describes sampling uncertainty and does not validate the underlying target construct."
  ]
};

export const CANONICAL_METRIC_REGISTRY: CanonicalMetricRegistrySnapshot = {
  metricRegistrySchemaVersion: "0.1.0",
  definitions: [
    providerPassedTests,
    providerPassRate,
    longHorizonResilienceIndex,
    matchedPairMeanDelta
  ]
};
