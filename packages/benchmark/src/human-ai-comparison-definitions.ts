import type {
  DifferentialItemBehaviorResearchContract,
  HistoricalHacsCapabilityAudit,
  HumanAIComparisonDefinition,
  HumanAIMeasurementInvarianceResearchContract,
  HumanAIRepresentativeCase
} from "./human-ai-comparison-types.js";

export const HISTORICAL_HACS_HUMAN_AI_IDENTITY = {
  benchmarkId: "historical_hacs_human_ai_comparative",
  benchmarkVersion: "0.1.0"
} as const;

export const CURRENT_HACS_AGENT_RESILIENCE_IDENTITY = {
  benchmarkId: "bmk_hacs_agent_resilience",
  benchmarkVersion: "1.0.0"
} as const;

export const S08_ITEM_CATEGORICAL_COMPARISON_DEFINITION: HumanAIComparisonDefinition = {
  comparisonDefinitionId: "human_ai_item_categorical_comparison",
  comparisonDefinitionVersion: "0.1.0",
  versionScope: "HUMAN_AI_COMPARISON_DEFINITION",
  relationship: "HUMAN_AI_COMPARISON",
  purpose: "CATEGORICAL_OUTCOME_RELATIONSHIP",
  level: "INDIVIDUAL_HUMAN_TO_INDIVIDUAL_AI",
  pairing: "PAIRED_BY_ITEM",
  criticalDimensions: [
    "CONSTRUCT_COMPATIBILITY",
    "TASK_COMPATIBILITY",
    "PRESENTATION_COMPATIBILITY",
    "RESPONSE_MODE_COMPATIBILITY",
    "TOOL_ASSISTANCE_COMPATIBILITY",
    "LANGUAGE_COMPATIBILITY",
    "SCORING_COMPATIBILITY",
    "EVALUATOR_COMPATIBILITY"
  ],
  requiredEvidenceReferences: ["S08:declared-purpose:item-categorical"],
  provenanceReferences: ["Docs/research/core/S08_HUMAN_AI_COMPARATIVE_MEASUREMENT_GATE.md"],
  scientificAuthority: "NONE",
  limitations: [
    "A bounded categorical relationship does not establish a shared construct scale or population comparison.",
    "The comparison cannot produce a rank, winner, human-level claim, or superhuman claim."
  ]
};

export const HUMAN_AI_MEASUREMENT_INVARIANCE_RESEARCH_CONTRACT: HumanAIMeasurementInvarianceResearchContract =
  {
    contractId: "human_ai_measurement_invariance_research",
    contractVersion: "0.1.0",
    versionScope: "RESEARCH_CONTRACT",
    status: "RESEARCH_CONTRACT",
    questions: [
      "Does the item elicit behavior that supports compatible construct interpretations?",
      "Does the scoring function behave compatibly for human and AI responses?",
      "Are systematic population-specific effects visible?",
      "Does item difficulty or ordering differ materially?",
      "Does evaluator behavior differ by subject type?",
      "Can a common scale interpretation be defended for the declared purpose?"
    ],
    requiredEvidenceKinds: [
      "PRESPECIFIED_STUDY_PROTOCOL",
      "POPULATION_SPECIFIC_VALIDITY_EVIDENCE",
      "POPULATION_SPECIFIC_RELIABILITY_EVIDENCE",
      "ITEM_LEVEL_RESPONSE_EVIDENCE",
      "SCORING_BEHAVIOR_EVIDENCE",
      "COMMON_SCALE_JUSTIFICATION"
    ],
    implementedMethods: [],
    scientificAuthority: "NONE",
    limitations: [
      "This contract does not implement or establish configural, metric, scalar, or strict invariance.",
      "Synthetic fixtures cannot satisfy the empirical evidence requirements."
    ]
  };

export const DIFFERENTIAL_ITEM_BEHAVIOR_RESEARCH_CONTRACT: DifferentialItemBehaviorResearchContract =
  {
    contractId: "human_ai_differential_item_behavior_research",
    contractVersion: "0.1.0",
    versionScope: "RESEARCH_CONTRACT",
    status: "RESEARCH_CONTRACT",
    terminology: "DIFFERENTIAL_ITEM_BEHAVIOR",
    requiredFields: [
      "ITEM_IDENTITY_AND_VERSION",
      "HUMAN_OBSERVATION_REFERENCES",
      "AI_OBSERVATION_REFERENCES",
      "MATCHED_OR_DECLARED_CONDITION",
      "METRIC_OR_EVALUATOR_IDENTITY",
      "OBSERVED_DIFFERENCE",
      "AVAILABLE_UNCERTAINTY",
      "ALTERNATIVE_EXPLANATIONS",
      "EVIDENCE_STATUS"
    ],
    formalDifMethodsImplemented: [],
    causalAuthority: "NONE",
    scientificAuthority: "NONE",
    limitations: [
      "No Mantel-Haenszel, IRT, or logistic-regression DIF estimator is implemented.",
      "An observed difference does not establish a causal population effect."
    ]
  };

export const HISTORICAL_HACS_CAPABILITY_AUDIT: readonly HistoricalHacsCapabilityAudit[] = [
  {
    capabilityId: "historical-human-scorecard",
    sourceReference: "Docs/SemantIQ-Benchmarks.pdf#pages=205-208",
    classification: "HISTORICAL_ONLY",
    currentAuthority: "NONE",
    disposition: "PRESERVE_AS_PROVENANCE",
    rationale:
      "The historical scorecard has no current human sample, norm, validated metric, or common-scale evidence."
  },
  {
    capabilityId: "historical-ai-scorecard",
    sourceReference: "Docs/SemantIQ-Benchmarks.pdf#pages=205-208",
    classification: "HISTORICAL_ONLY",
    currentAuthority: "NONE",
    disposition: "PRESERVE_AS_PROVENANCE",
    rationale: "Illustrative AI scores are not current executions and have no S-03 result lineage."
  },
  {
    capabilityId: "historical-comparative-table",
    sourceReference: "Docs/SemantIQ-Benchmarks.pdf#pages=205-208",
    classification: "HISTORICAL_ONLY",
    currentAuthority: "NONE",
    disposition: "BLOCK_SCIENTIFIC_CLAIM",
    rationale:
      "The table does not establish construct, condition, scoring, population, or scale compatibility."
  },
  {
    capabilityId: "historical-bias-stability-map",
    sourceReference: "Docs/SemantIQ-Benchmarks.pdf#pages=205-208",
    classification: "HISTORICAL_ONLY",
    currentAuthority: "NONE",
    disposition: "BLOCK_SCIENTIFIC_CLAIM",
    rationale:
      "No operational metric, uncertainty model, or population-applicable validity evidence is supplied."
  },
  {
    capabilityId: "historical-semantic-maturity-profile",
    sourceReference: "Docs/SemantIQ-Benchmarks.pdf#pages=205-208",
    classification: "CONFLICTING",
    currentAuthority: "NONE",
    disposition: "BLOCK_SCIENTIFIC_CLAIM",
    rationale:
      "Historical semantic-maturity interpretation conflicts with current evidence-separated maturity governance."
  },
  {
    capabilityId: "sandbox-cross-comparison-engine",
    sourceReference: "packages/sandbox-contracts/src/cross-comparison.ts",
    classification: "CURRENT_ENGINEERING_MECHANISM",
    currentAuthority: "ENGINEERING_ONLY",
    disposition: "REUSE_WITH_LIMITS",
    rationale:
      "The engine is a synthetic model/provider mechanism; its fixed margins and rankings do not authorize Human-AI interpretation."
  },
  {
    capabilityId: "legacy-fixed-confidence-margin",
    sourceReference: "packages/sandbox-contracts/src/cross-comparison.ts#confidenceInterval",
    classification: "CONFLICTING",
    currentAuthority: "ENGINEERING_ONLY",
    disposition: "BLOCK_SCIENTIFIC_CLAIM",
    rationale:
      "A fixed plus-or-minus margin is not an S-03 uncertainty estimate and cannot support comparative significance."
  }
] as const;

export const S08_REPRESENTATIVE_CASES: readonly HumanAIRepresentativeCase[] = [
  {
    caseId: "A",
    description: "Same item and outcome with unknown construct compatibility.",
    expectedDecision: "INSUFFICIENT_EVIDENCE",
    expectedLimitation: "Construct compatibility is unknown.",
    empiricalEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "B",
    description: "Different languages without adaptation-equivalence evidence.",
    expectedDecision: "NOT_COMPARABLE",
    expectedLimitation: "Language conditions are mismatched.",
    empiricalEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "C",
    description: "Human no-tools condition paired with a tool-assisted AI execution.",
    expectedDecision: "NOT_COMPARABLE",
    expectedLimitation: "Tool-assistance conditions are mismatched.",
    empiricalEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "D",
    description: "Matched categorical task with bounded evidence and declared limitations.",
    expectedDecision: "CONDITIONALLY_COMPARABLE",
    expectedLimitation: "Interpretation is limited to the paired item outcome.",
    empiricalEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "E",
    description: "Same numeric value without common scale-interpretation evidence.",
    expectedDecision: "INSUFFICIENT_EVIDENCE",
    expectedLimitation: "A common cross-population scale is not established.",
    empiricalEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "F",
    description: "Aggregate results use different denominator semantics.",
    expectedDecision: "NOT_COMPARABLE",
    expectedLimitation: "Aggregate denominators are mismatched.",
    empiricalEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "G",
    description: "Human abstention paired with an observed AI result.",
    expectedDecision: "CONDITIONALLY_COMPARABLE",
    expectedLimitation: "The human observation remains missing and cannot be coerced to zero.",
    empiricalEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "H",
    description: "Human Judge can see subject source in the comparison presentation.",
    expectedDecision: "CONDITIONALLY_COMPARABLE",
    expectedLimitation: "Possible judge-source effect remains visible.",
    empiricalEvidence: "NONE_SYNTHETIC_FIXTURE"
  }
] as const;

export const HIB_HUMAN_AI_COMPARABILITY_STATUS = {
  benchmarkIdentity: { benchmarkId: "hib_research_candidate", benchmarkVersion: "0.1.0" },
  aiSuitability: "UNASSESSED",
  comparability: "UNESTABLISHED",
  scientificAuthority: "NONE",
  blockers: [
    "CONSTRUCT_COMPATIBILITY_UNKNOWN",
    "AI_VALIDITY_EVIDENCE_ABSENT",
    "COMMON_SCALE_INTERPRETATION_ABSENT",
    "MEASUREMENT_INVARIANCE_NOT_STUDIED"
  ]
} as const;
