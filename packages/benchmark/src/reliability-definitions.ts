import type {
  CanonicalReliabilityRegistrySnapshot,
  ReliabilityMethodDefinition
} from "./reliability-types.js";

const method = (
  method: ReliabilityMethodDefinition["method"],
  implementationStatus: ReliabilityMethodDefinition["implementationStatus"],
  requiredInput: ReliabilityMethodDefinition["requiredInput"],
  minimumEvidence: number,
  applicability: string,
  computation: string,
  outputContract: string,
  assumptions: readonly string[],
  degenerateCases: readonly string[],
  limitations: readonly string[]
): ReliabilityMethodDefinition => ({
  method,
  implementationStatus,
  requiredInput,
  minimumEvidence,
  assumptions,
  applicability,
  computation,
  outputContract,
  degenerateCases,
  missingnessHandling:
    "Failed, abstained, not-applicable, missing, and unusable partial executions are excluded with explicit counts and reasons; they are never converted to zero.",
  limitations
});

export const CANONICAL_RELIABILITY_REGISTRY: CanonicalReliabilityRegistrySnapshot = {
  reliabilityRegistrySchemaVersion: "0.1.0",
  methods: [
    method(
      "EXACT_REPEATABILITY",
      "IMPLEMENTED",
      "EVALUATOR_EXECUTION",
      2,
      "Repeated executions of one exact evaluator configuration, subject, target, and input condition.",
      "Pairwise byte-exact equality of canonical semantic outputs after non-material audit fields are removed.",
      "Exact matches, comparable pair count, and exact-match rate.",
      [
        "All declared constant dimensions are identical.",
        "No tolerance or near-equality rule is applied."
      ],
      ["Fewer than two eligible outputs.", "A zero-pair sample."],
      ["A deterministic repeat only establishes reproducibility for the tested condition."]
    ),
    method(
      "NUMERIC_RUN_TO_RUN_STABILITY",
      "IMPLEMENTED",
      "NUMERIC_METRIC_RESULT",
      2,
      "Repeated numeric S-03 MetricResults with the exact metric version, unit, scale, target, and condition.",
      "Finite-value n, arithmetic mean, sample standard deviation, minimum, maximum, and range.",
      "Descriptive numeric stability statistics with complete sample accounting.",
      [
        "Values share one exact S-03 measurement contract.",
        "Observations are suitable for descriptive arithmetic."
      ],
      ["Fewer than two eligible values.", "Ordinal or categorical values.", "Non-finite values."],
      ["Descriptive dispersion is not validity, calibration, or a universal quality score."]
    ),
    method(
      "CATEGORICAL_AGREEMENT",
      "IMPLEMENTED",
      "CATEGORICAL_DECISION",
      2,
      "Categorical decisions for the same subject/input condition from preserved evaluator executions.",
      "Raw pairwise agreement across comparable decisions; every judge pair remains addressable.",
      "Agreements, eligible/used pair counts, and raw agreement.",
      [
        "Categories have identical meaning across judges.",
        "Judge identity and configuration provenance are preserved."
      ],
      ["Fewer than two eligible judgments.", "No comparable judge pair."],
      ["Raw agreement is not chance-corrected and does not establish construct validity."]
    ),
    method(
      "ORDINAL_AGREEMENT",
      "SUPPORTED_BY_SCHEMA",
      "CATEGORICAL_DECISION",
      2,
      "Future ordered-category agreement studies.",
      "No estimator is implemented in S-05.",
      "Schema-only estimate contract.",
      ["Order and weighting must be prespecified."],
      ["Unknown order or sparse categories."],
      ["Ordinal labels must never be averaged as numeric values."]
    ),
    method(
      "TEST_RETEST",
      "SUPPORTED_BY_SCHEMA",
      "EVALUATOR_EXECUTION",
      2,
      "Future repeated observations across declared time windows.",
      "No estimator is implemented in S-05.",
      "Schema-only estimate contract.",
      ["Retest interval and stable/changed dimensions are prespecified."],
      ["Unknown retest interval."],
      ["Time-related drift and learning require a later study design."]
    ),
    method(
      "JUDGE_TO_JUDGE_AGREEMENT",
      "SUPPORTED_BY_SCHEMA",
      "CATEGORICAL_DECISION",
      2,
      "Future judge-comparison designs built on preserved S-04 executions.",
      "No estimator beyond raw categorical agreement is implemented.",
      "Schema-only estimate contract.",
      ["Judge dependence is declared."],
      ["Unknown judge provenance."],
      ["Shared model families and prompts can violate independence assumptions."]
    ),
    method(
      "INTER_RATER_AGREEMENT",
      "SUPPORTED_BY_SCHEMA",
      "CATEGORICAL_DECISION",
      2,
      "Future governed human-rater studies.",
      "No estimator is implemented in S-05.",
      "Schema-only estimate contract.",
      ["Raters and assignments are governed by S-06."],
      ["No rater assignment evidence."],
      ["S-05 contains no human-subject workflow."]
    ),
    method(
      "INTRA_RATER_AGREEMENT",
      "SUPPORTED_BY_SCHEMA",
      "CATEGORICAL_DECISION",
      2,
      "Future repeated judgments from one governed rater.",
      "No estimator is implemented in S-05.",
      "Schema-only estimate contract.",
      ["Rater identity and repeat interval are governed."],
      ["No repeated rater evidence."],
      ["S-05 contains no human-subject workflow."]
    ),
    method(
      "STOCHASTIC_STABILITY",
      "IMPLEMENTED",
      "EVALUATOR_EXECUTION",
      2,
      "Repeated executions of a stochastic or seeded-stochastic evaluator with seed as an explicit varied dimension.",
      "Pairwise exact agreement of canonical outputs while preserving seed, model, sampling, and configuration provenance.",
      "Exact matches, pair count, and exact-match rate under the declared stochastic condition.",
      [
        "Non-seed material configuration is constant.",
        "Seeds or stochastic attempts are independently addressable."
      ],
      ["Fewer than two eligible outputs.", "A deterministic evaluator is supplied."],
      [
        "Exact stochastic stability is condition-specific and does not imply validity or distributional calibration."
      ]
    )
  ],
  studies: []
};
