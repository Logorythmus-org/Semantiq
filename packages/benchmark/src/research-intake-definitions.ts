import type {
  PromotionGateId,
  PromotionStage,
  ResearchPromotionRepresentativeCase
} from "./research-intake-types.js";

export const S10_SCIENTIFIC_AUTHORITY = "NONE" as const;
export const S10_DECISION_AUTHORITY = "ASSESSMENT_RECOMMENDATION_ONLY" as const;

export const S10_DISCOVERED_MECHANISMS = [
  {
    mechanism: "S-02 benchmark lifecycle and Core promotion",
    classification: "CANONICAL_CURRENT",
    treatment: "Retained as sole registry mutation authority."
  },
  {
    mechanism: "S-03 metric calibration and validity contracts",
    classification: "CANONICAL_CURRENT",
    treatment: "Referenced without inferring evidence."
  },
  {
    mechanism: "S-04 evaluator identity and determinism",
    classification: "CANONICAL_CURRENT",
    treatment: "Referenced as evaluator evidence."
  },
  {
    mechanism: "S-05 reliability studies",
    classification: "CANONICAL_CURRENT",
    treatment: "Reliability remains distinct from validity."
  },
  {
    mechanism: "S-06 Human-as-Judge",
    classification: "CANONICAL_CURRENT",
    treatment: "Human protocol gate only; no deterministic replay."
  },
  {
    mechanism: "S-07 HIB research candidate",
    classification: "CANONICAL_CURRENT",
    treatment: "Remains draft, unpromoted, and calibration-required."
  },
  {
    mechanism: "S-08 Human-AI comparability assessment",
    classification: "CANONICAL_CURRENT",
    treatment: "Required for comparative candidates; never inferred."
  },
  {
    mechanism: "S-09 EvidencePackage and verifier",
    classification: "CANONICAL_CURRENT",
    treatment: "Consumed without increasing verifier authority."
  },
  {
    mechanism: "legacy claim/promotion governance helpers",
    classification: "PARTIAL",
    treatment: "Preserved within their current domains."
  },
  {
    mechanism: "release and test evidence",
    classification: "ENGINEERING_ONLY",
    treatment: "Cannot establish scientific promotion gates."
  },
  {
    mechanism: "historical HACS and research vision",
    classification: "HISTORICAL_ONLY",
    treatment: "Never promoted to current Core truth."
  },
  {
    mechanism: "count-based confidence or automatic Core admission",
    classification: "CONFLICTING",
    treatment: "Rejected by fail-closed typed gates."
  }
] as const;

export const S10_ANTI_OVERCLAIM_INVARIANTS = [
  "DISCOVERY_DOES_NOT_IMPLY_EVIDENCE",
  "IDEA_DOES_NOT_IMPLY_CONSTRUCT",
  "CONSTRUCT_DOES_NOT_IMPLY_OPERATIONALIZATION",
  "OPERATIONALIZATION_DOES_NOT_IMPLY_METRIC",
  "METRIC_DOES_NOT_IMPLY_VALID_MEASURE",
  "IMPLEMENTED_DOES_NOT_IMPLY_SCIENTIFICALLY_SUPPORTED",
  "TESTED_DOES_NOT_IMPLY_CALIBRATED",
  "RELIABLE_DOES_NOT_IMPLY_VALID",
  "REPRODUCIBLE_DOES_NOT_IMPLY_VALID",
  "COMPARABLE_DOES_NOT_IMPLY_EQUIVALENT",
  "EVIDENCE_DOES_NOT_IMPLY_PROOF",
  "PROMOTION_DOES_NOT_IMPLY_PUBLICATION",
  "PUBLICATION_DOES_NOT_IMPLY_CORE_ADMISSION",
  "CORE_ADMISSION_DOES_NOT_IMPLY_PERMANENCE",
  "RETRACTION_DOES_NOT_IMPLY_DELETION",
  "CITATION_COUNT_DOES_NOT_IMPLY_STRENGTH",
  "EVIDENCE_COUNT_DOES_NOT_IMPLY_PROMOTION",
  "REPRODUCTION_DOES_NOT_IMPLY_REPLICATION",
  "SAME_METRIC_DOES_NOT_IMPLY_HUMAN_AI_COMPARABILITY",
  "SAME_SCORE_DOES_NOT_IMPLY_HUMAN_AI_EQUIVALENCE",
  "UNKNOWN_CRITICAL_EVIDENCE_BLOCKS_PROMOTION",
  "MISSING_GOVERNANCE_BLOCKS_CORE",
  "UNKNOWN_RIGHTS_BLOCK_PUBLIC_PROMOTION",
  "HASH_MATCH_DOES_NOT_IMPLY_AUTHENTICITY",
  "SYNTHETIC_FIXTURE_DOES_NOT_IMPLY_EMPIRICAL_EVIDENCE"
] as const;

const early: readonly PromotionGateId[] = ["CONSTRUCT_DEFINED"];
const specified: readonly PromotionGateId[] = [
  ...early,
  "OPERATIONALIZATION_DEFINED",
  "METRIC_SEMANTICS",
  "EVALUATOR_SEMANTICS"
];
const executable: readonly PromotionGateId[] = [
  ...specified,
  "STABLE_BENCHMARK_IDENTITY",
  "IMPLEMENTATION",
  "RIGHTS_CLEARANCE"
];
const empirical: readonly PromotionGateId[] = [
  ...executable,
  "EMPIRICAL_EVIDENCE",
  "S09_EVIDENCE_PACKAGE"
];
const calibrated: readonly PromotionGateId[] = [...empirical, "CALIBRATION"];
const validated: readonly PromotionGateId[] = [
  ...calibrated,
  "RELIABILITY",
  "VALIDITY",
  "ROBUSTNESS",
  "ANTI_GAMING",
  "REPRODUCIBILITY",
  "CONTRADICTIONS_RESOLVED"
];
const eligible: readonly PromotionGateId[] = [
  ...validated,
  "DOCUMENTATION",
  "VERSIONING_POLICY",
  "DEPRECATION_POLICY"
];

export const S10_STAGE_GATES: Readonly<Record<PromotionStage, readonly PromotionGateId[]>> = {
  CONCEPT: [],
  RESEARCH_CANDIDATE: early,
  SPECIFIED_CANDIDATE: specified,
  EXECUTABLE_CANDIDATE: executable,
  EMPIRICALLY_STUDIED: empirical,
  CALIBRATED: calibrated,
  VALIDATED: validated,
  CORE_ELIGIBLE: eligible,
  CORE: [...eligible, "GOVERNANCE_APPROVAL"]
};

export const S10_REPRESENTATIVE_CASES: readonly ResearchPromotionRepresentativeCase[] = [
  {
    caseId: "A",
    description: "Interesting paper without an operationalization.",
    expectedOutcome: "WATCH / NEEDS_OPERATIONALIZATION"
  },
  {
    caseId: "B",
    description: "Implemented and extensively tested benchmark without scientific evidence.",
    expectedOutcome: "EXECUTABLE; NOT SCIENTIFICALLY PROMOTABLE"
  },
  {
    caseId: "C",
    description: "Repeatable metric without construct-validity evidence.",
    expectedOutcome: "NOT VALIDATED"
  },
  {
    caseId: "D",
    description: "Calibration evidence with insufficient validity.",
    expectedOutcome: "BLOCKED BELOW VALIDATED"
  },
  {
    caseId: "E",
    description: "Supporting and material contradictory evidence.",
    expectedOutcome: "BLOCKED_BY_CONTRADICTION"
  },
  {
    caseId: "F",
    description: "Reproduced computation with failed independent replication.",
    expectedOutcome: "REPRODUCTION RETAINED; REPLICATION CONCERN OPEN"
  },
  {
    caseId: "G",
    description: "Human benchmark without cleared protocol, privacy, or sampling evidence.",
    expectedOutcome: "CORE ADMISSION BLOCKED"
  },
  {
    caseId: "H",
    description: "Human-AI candidate with insufficient S-08 comparability.",
    expectedOutcome: "COMPARISON PROMOTION BLOCKED"
  },
  {
    caseId: "I",
    description: "Third-party benchmark with unknown redistribution rights.",
    expectedOutcome: "REFERENCE POSSIBLE; PUBLIC EXECUTABLE PROMOTION BLOCKED"
  },
  {
    caseId: "J",
    description: "Mature candidate without governance approval.",
    expectedOutcome: "ELIGIBLE_FOR_REVIEW; NOT CORE"
  },
  {
    caseId: "K",
    description: "Admitted benchmark receives material contradictory evidence.",
    expectedOutcome: "REASSESSMENT OR DEMOTION; NO DELETION"
  },
  {
    caseId: "L",
    description: "Deprecated benchmark retains reproducible historical evidence.",
    expectedOutcome: "HISTORICAL REPRODUCIBILITY PRESERVED"
  }
] as const;
