import type {
  BenchmarkEvidenceReferences,
  BenchmarkIdentity,
  CanonicalBenchmarkDefinition,
  CanonicalBenchmarkRegistrySnapshot
} from "./registry-types.js";
import { HIB_RESEARCH_CANDIDATE_IDENTITY } from "./human-benchmark-definitions.js";

const noEvidence: BenchmarkEvidenceReferences = {
  implementation: [],
  tests: [],
  reproducibility: [],
  calibration: [],
  validation: [],
  promotion: []
};

const currentHacsIdentity: BenchmarkIdentity = {
  benchmarkId: "bmk_hacs_agent_resilience",
  benchmarkVersion: "1.0.0"
};

const historicalHacsIdentity: BenchmarkIdentity = {
  benchmarkId: "historical_hacs_human_ai_comparative",
  benchmarkVersion: "0.1.0"
};

const providerTck: CanonicalBenchmarkDefinition = {
  identity: { benchmarkId: "provider_tck", benchmarkVersion: "0.1.0" },
  versionScope: "BENCHMARK",
  familyId: "provider_conformance",
  name: "Sandbox provider technology compatibility kit",
  description:
    "Engineering conformance checks for provider capabilities, health, environment specifications, execution, state capture, and teardown.",
  constructIds: ["provider_contract_conformance"],
  provenance: {
    origin: "Current public repository implementation",
    sourceType: "CURRENT_IMPLEMENTATION",
    temporalStatus: "CURRENT",
    provenanceClass: "PROJECT_EXISTING_SOURCE",
    sourceReferences: ["packages/sandbox-tck/src/tck-suite.ts"],
    datasetCaseProvenance: { status: "NOT_APPLICABLE", references: [] },
    rightsClass: "FIRST_PARTY_OR_PROJECT",
    introducedIn: "S02"
  },
  implementationState: "EXECUTABLE",
  scientificMaturity: "UNVALIDATED_PROXY",
  lifecycleState: "ACTIVE",
  evaluatorRequirements: [
    {
      mechanism: "DETERMINISTIC",
      bindingStatus: "IMPLEMENTED_AND_BOUND",
      evaluatorId: "SandboxTCK.runSuite",
      evidenceReferences: ["packages/sandbox-tck/src/tck-suite.ts"]
    }
  ],
  humanRoles: [],
  evidence: {
    ...noEvidence,
    implementation: ["packages/sandbox-tck/src/tck-suite.ts"],
    tests: ["tests/unit/sandbox-evidence-tck.test.ts"]
  },
  aliases: [{ value: "provider-tck", kind: "LEGACY_ID", collidesWith: [] }],
  supersedes: [],
  corePromotion: "NOT_PROMOTED",
  limitations: [
    "The benchmark version is introduced by S-02 and is distinct from the environment-spec version used by the suite.",
    "Passing provider checks establishes engineering conformance only, not scientific validity or Core promotion."
  ]
};

const longHorizon: CanonicalBenchmarkDefinition = {
  identity: { benchmarkId: "long_horizon", benchmarkVersion: "0.1.0" },
  versionScope: "BENCHMARK",
  familyId: "agent_behavior",
  name: "Long-horizon trajectory evaluator",
  description:
    "Computes milestone and trajectory heuristics from supplied trace events without running a subject or establishing construct validity.",
  constructIds: ["long_horizon_resilience"],
  provenance: {
    origin: "Current public repository implementation",
    sourceType: "CURRENT_IMPLEMENTATION",
    temporalStatus: "CURRENT",
    provenanceClass: "PROJECT_EXISTING_SOURCE",
    sourceReferences: ["packages/sandbox-contracts/src/long-horizon.ts"],
    datasetCaseProvenance: { status: "UNKNOWN", references: [] },
    rightsClass: "FIRST_PARTY_OR_PROJECT",
    introducedIn: "S02"
  },
  implementationState: "EXECUTABLE",
  scientificMaturity: "UNVALIDATED_PROXY",
  lifecycleState: "ACTIVE",
  evaluatorRequirements: [
    {
      mechanism: "RULE_BASED",
      bindingStatus: "IMPLEMENTED_AND_BOUND",
      evaluatorId: "LongHorizonTestingEngine.evaluateLongHorizonTrajectory",
      evidenceReferences: ["packages/sandbox-contracts/src/long-horizon.ts"]
    }
  ],
  humanRoles: [],
  evidence: {
    ...noEvidence,
    implementation: ["packages/sandbox-contracts/src/long-horizon.ts"],
    tests: ["tests/unit/long-horizon.test.ts"]
  },
  aliases: [{ value: "long-horizon", kind: "LEGACY_ID", collidesWith: [] }],
  supersedes: [],
  corePromotion: "NOT_PROMOTED",
  limitations: [
    "Scores supplied traces using proxies; no end-to-end task runner, calibration, or validation evidence is registered."
  ]
};

const currentHacs: CanonicalBenchmarkDefinition = {
  identity: currentHacsIdentity,
  versionScope: "BENCHMARK",
  familyId: "agent_behavior",
  name: "HACS agent-resilience fixed-output producer",
  description:
    "Current producer path returning fixed resilience, consequence-attribution, and anti-gaming dimension values.",
  constructIds: ["long_horizon_resilience", "consequence_attribution", "anti_gaming_authenticity"],
  provenance: {
    origin: "Current public repository implementation and representative fixture",
    sourceType: "CURRENT_FIXTURE",
    temporalStatus: "CURRENT",
    provenanceClass: "PROJECT_EXISTING_SOURCE",
    sourceReferences: [
      "packages/benchmark/src/engine.ts",
      "fixtures/benchmarks/hacs_representative_run.json"
    ],
    datasetCaseProvenance: { status: "UNKNOWN", references: [] },
    rightsClass: "FIRST_PARTY_OR_PROJECT",
    introducedIn: "S02"
  },
  implementationState: "SCAFFOLDED",
  scientificMaturity: "SYNTHETIC_ONLY",
  lifecycleState: "ACTIVE",
  evaluatorRequirements: [
    {
      mechanism: "DETERMINISTIC",
      bindingStatus: "IMPLEMENTED_AND_BOUND",
      evaluatorId: "BenchmarkProducerEngine.executeBenchmark",
      evidenceReferences: ["packages/benchmark/src/engine.ts"]
    }
  ],
  humanRoles: [],
  evidence: {
    ...noEvidence,
    implementation: ["packages/benchmark/src/engine.ts"],
    tests: ["tests/unit/benchmark-engine-producer.test.ts"]
  },
  aliases: [
    { value: "bmk_hacs_evaluation_v1", kind: "LEGACY_ID", collidesWith: [] },
    { value: "bmk_hacs_agent_resilience_v1", kind: "LEGACY_ID", collidesWith: [] },
    { value: "HACS", kind: "HISTORICAL_NAME_COLLISION", collidesWith: [historicalHacsIdentity] }
  ],
  supersedes: [],
  corePromotion: "NOT_PROMOTED",
  limitations: [
    "Fixed scores and generated provenance do not represent observed subject performance or scientific validation."
  ]
};

const historicalHacs: CanonicalBenchmarkDefinition = {
  identity: historicalHacsIdentity,
  versionScope: "BENCHMARK",
  familyId: "historical_research",
  name: "Historical Human-AI Comparative Semantic Benchmark Standard",
  description:
    "Historical research concept for human-AI comparison, preserved as a distinct identity without current implementation claims.",
  constructIds: ["human_ai_comparative_semantics"],
  provenance: {
    origin: "Historical SemantIQ benchmark design",
    sourceType: "HISTORICAL_RESEARCH",
    temporalStatus: "HISTORICAL",
    provenanceClass: "PROJECT_EXISTING_SOURCE",
    sourceReferences: [
      "Docs/SemantIQ-Benchmarks.pdf",
      "Docs/research/core/S01_CORE_STATE_RECONCILIATION.md"
    ],
    datasetCaseProvenance: { status: "UNKNOWN", references: [] },
    rightsClass: "UNKNOWN_RIGHTS",
    introducedIn: "S02"
  },
  implementationState: "CONCEPT_ONLY",
  scientificMaturity: "NOT_ESTABLISHED",
  lifecycleState: "DRAFT",
  evaluatorRequirements: [
    {
      mechanism: "HUMAN_JUDGE",
      bindingStatus: "SUPPORTED_BY_SCHEMA",
      evidenceReferences: []
    },
    {
      mechanism: "HYBRID",
      bindingStatus: "SUPPORTED_BY_SCHEMA",
      evidenceReferences: []
    }
  ],
  humanRoles: [
    { role: "HUMAN_AS_SUBJECT", status: "INTENDED", evidenceReferences: [] },
    { role: "HUMAN_AI_COMPARISON", status: "INTENDED", evidenceReferences: [] }
  ],
  evidence: noEvidence,
  aliases: [
    { value: "HACS-HIST", kind: "LEGACY_ID", collidesWith: [] },
    { value: "HACS", kind: "HISTORICAL_NAME_COLLISION", collidesWith: [currentHacsIdentity] }
  ],
  supersedes: [],
  corePromotion: "NOT_PROMOTED",
  limitations: [
    "Historical concept only; no current executable human-subject or human-AI comparison benchmark is registered."
  ]
};

const hibResearchCandidate: CanonicalBenchmarkDefinition = {
  identity: HIB_RESEARCH_CANDIDATE_IDENTITY,
  versionScope: "BENCHMARK",
  familyId: "human_benchmark_research",
  name: "HIB human-subject research candidate",
  description:
    "A small synthetic Human-as-Subject architecture candidate reconstructed after item-level audit of the historical HIB material.",
  constructIds: [
    "meaning_context_behavior",
    "bias_mechanism_reasoning",
    "uncertainty_evidence_boundary",
    "response_revision_behavior",
    "long_form_constraint_retention"
  ],
  provenance: {
    origin: "S-07 reconstruction with historical source audit and new synthetic candidate items",
    sourceType: "CURRENT_IMPLEMENTATION",
    temporalStatus: "CURRENT",
    provenanceClass: "MIXED",
    sourceReferences: [
      "packages/benchmark/src/human-benchmark-definitions.ts",
      "Docs/research/core/S07_HIB_HUMAN_BENCHMARK_RECONSTRUCTION.md",
      "Docs/SemantIQ-Benchmarks.pdf"
    ],
    datasetCaseProvenance: {
      status: "REPOSITORY_REFERENCED",
      references: ["packages/benchmark/src/human-benchmark-definitions.ts"]
    },
    rightsClass: "FIRST_PARTY_OR_PROJECT",
    introducedIn: "S07"
  },
  implementationState: "SCAFFOLDED",
  scientificMaturity: "CALIBRATION_REQUIRED",
  lifecycleState: "DRAFT",
  evaluatorRequirements: [
    {
      mechanism: "RULE_BASED",
      bindingStatus: "IMPLEMENTED_AND_BOUND",
      evaluatorId: "HumanBenchmarkSystem.scoreObjectiveResponse",
      evidenceReferences: ["packages/benchmark/src/human-benchmark.ts"]
    },
    {
      mechanism: "HUMAN_JUDGE",
      bindingStatus: "SUPPORTED_BY_SCHEMA",
      evidenceReferences: [
        "packages/benchmark/src/human-benchmark.ts",
        "packages/benchmark/src/human-rater.ts"
      ]
    }
  ],
  humanRoles: [
    {
      role: "HUMAN_AS_SUBJECT",
      status: "IMPLEMENTED",
      evidenceReferences: ["packages/benchmark/src/human-benchmark.ts"]
    }
  ],
  evidence: {
    ...noEvidence,
    implementation: [
      "packages/benchmark/src/human-benchmark.ts",
      "packages/benchmark/src/human-benchmark-definitions.ts"
    ],
    tests: ["tests/unit/human-benchmark-reconstruction.test.ts"]
  },
  aliases: [
    { value: "HIB", kind: "LEGACY_ID", collidesWith: [] },
    { value: "HIB 1.0", kind: "LEGACY_ID", collidesWith: [] }
  ],
  supersedes: [],
  corePromotion: "NOT_PROMOTED",
  limitations: [
    "Candidate items are synthetic and do not reproduce the historical prompts as an executable test.",
    "No calibration, reliability, validity, norm, diagnostic use, or Human-AI comparability is established."
  ]
};

export const CANONICAL_BENCHMARK_REGISTRY: CanonicalBenchmarkRegistrySnapshot = {
  registrySchemaVersion: "0.1.0",
  families: [
    {
      familyId: "provider_conformance",
      name: "Provider conformance",
      description: "Engineering compatibility and lifecycle checks for execution providers."
    },
    {
      familyId: "agent_behavior",
      name: "Agent behavior",
      description: "Current behavioral evaluators and synthetic producer paths."
    },
    {
      familyId: "historical_research",
      name: "Historical research concepts",
      description: "Addressable research concepts that do not imply current implementation."
    },
    {
      familyId: "human_benchmark_research",
      name: "Human benchmark research",
      description:
        "Governed Human-as-Subject research candidates without diagnostic or comparative authority."
    }
  ],
  constructs: [
    {
      constructId: "provider_contract_conformance",
      name: "Provider contract conformance",
      description: "Observed compliance with the provider interface and lifecycle checks.",
      claimStrength: "ENGINEERING_PROXY"
    },
    {
      constructId: "long_horizon_resilience",
      name: "Long-horizon resilience",
      description:
        "Intended persistence across extended task trajectories, currently represented by supplied-trace heuristics.",
      claimStrength: "INTENDED"
    },
    {
      constructId: "consequence_attribution",
      name: "Consequence attribution",
      description:
        "Intended attribution of delayed effects, currently represented by fixed producer output.",
      claimStrength: "INTENDED"
    },
    {
      constructId: "anti_gaming_authenticity",
      name: "Anti-gaming authenticity",
      description:
        "Intended resistance to shortcut behavior, currently represented by fixed producer output.",
      claimStrength: "INTENDED"
    },
    {
      constructId: "human_ai_comparative_semantics",
      name: "Human-AI comparative semantics",
      description:
        "Historical intended comparison construct with no established current measurement model.",
      claimStrength: "INTENDED"
    },
    {
      constructId: "meaning_context_behavior",
      name: "Meaning and context behavior",
      description:
        "Intended observable preservation and disambiguation of supplied meaning and context.",
      claimStrength: "INTENDED"
    },
    {
      constructId: "bias_mechanism_reasoning",
      name: "Bias-mechanism reasoning",
      description:
        "Intended identification of reasoning mechanisms that can distort a supplied inference.",
      claimStrength: "INTENDED"
    },
    {
      constructId: "uncertainty_evidence_boundary",
      name: "Uncertainty and evidence boundary",
      description:
        "Intended separation of supported statements, uncertainty, and missing evidence.",
      claimStrength: "INTENDED"
    },
    {
      constructId: "response_revision_behavior",
      name: "Response revision behavior",
      description:
        "Intended observable revision after an error or missing constraint is disclosed.",
      claimStrength: "INTENDED"
    },
    {
      constructId: "long_form_constraint_retention",
      name: "Long-form constraint retention",
      description:
        "Intended retention of explicit semantic constraints across an extended response.",
      claimStrength: "INTENDED"
    }
  ],
  benchmarks: [providerTck, longHorizon, currentHacs, historicalHacs, hibResearchCandidate]
};
