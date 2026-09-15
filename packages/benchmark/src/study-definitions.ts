export const S11_01_AUTHORITY = "ORCHESTRATION_AND_INTEGRATION_ONLY" as const;
export const S11_01_SCIENTIFIC_AUTHORITY = "NONE" as const;

export const S11_01_ANTI_OVERCLAIM_INVARIANTS = [
  "SUCCESSFUL_EXECUTION_DOES_NOT_IMPLY_SCIENTIFIC_VALIDITY",
  "REPEATABLE_EXECUTION_DOES_NOT_IMPLY_CONSTRUCT_VALIDITY",
  "VERIFIED_EVIDENCE_PACKAGE_DOES_NOT_IMPLY_SCIENTIFIC_TRUTH",
  "SYNTHETIC_TRACE_DOES_NOT_IMPLY_EMPIRICAL_EVIDENCE",
  "MATCHING_CONSTRUCT_ID_DOES_NOT_IMPLY_MATCHING_CONSTRUCT_VERSION",
  "EVIDENCE_PRESENCE_DOES_NOT_IMPLY_EVIDENCE_SUFFICIENCY",
  "STUDY_COMPLETION_DOES_NOT_IMPLY_CORE_ELIGIBILITY"
] as const;

export const S11_01_STUDY_PROTOCOL_RECONCILIATION = [
  {
    abstraction: "ControlledStudyDefinition",
    classification: "CANONICAL_CURRENT",
    purpose: "Exact non-human S-02 through S-10 orchestration identity and bindings.",
    authority: "ORCHESTRATION_AND_INTEGRATION_ONLY"
  },
  {
    abstraction: "packages/evidence StudyProtocol",
    classification: "COMPATIBLE_LEGACY",
    purpose: "Pre-registration, analysis planning, deviations, and partner-study policy.",
    authority: "ENGINEERING_PROTOCOL_ONLY"
  },
  {
    abstraction: "HumanBenchmarkStudyProtocol",
    classification: "CANONICAL_ROLE_SPECIFIC",
    purpose: "S-07 Human-as-Subject presentation and participation contract.",
    authority: "HUMAN_SUBJECT_RECORD_ONLY"
  },
  {
    abstraction: "HumanRatingStudyDefinition",
    classification: "CANONICAL_ROLE_SPECIFIC",
    purpose: "S-06 Human-as-Judge assignment and rating contract.",
    authority: "HUMAN_JUDGMENT_RECORD_ONLY"
  }
] as const;

export const S11_01_EXECUTION_MANIFEST_RECONCILIATION = [
  {
    abstraction: "S-09 ExecutionManifest",
    classification: "CANONICAL_CURRENT",
    treatment: "REUSE_WITHOUT_AUTHORITY_CHANGE"
  },
  {
    abstraction: "packages/evidence StudyExecutionManifest",
    classification: "COMPATIBLE_LEGACY",
    treatment: "FAIL_CLOSED_EXPLICIT_ADAPTATION_REQUIRED"
  },
  {
    fieldGroup: "study/protocol identity and preregistration fingerprint",
    disposition: "REQUIRED_TO_ADAPT",
    target: "S-11 study reference plus S-09 evidence records/artifacts"
  },
  {
    fieldGroup: "environment/model/dataset/trace fingerprints and software version",
    disposition: "REQUIRED_TO_ADAPT",
    target: "S-09 EnvironmentManifest, ExecutionManifest, artifacts, and source revision"
  },
  {
    fieldGroup: "missing-data report, negative controls, and analysis parameters",
    disposition: "REQUIRED_TO_ADAPT",
    target: "S-09 records/artifacts; no inferred gate status"
  },
  {
    fieldGroup: "timestamps and evaluation references",
    disposition: "REDUNDANT_WHEN_EXACT_S09_RECORDS_EXIST",
    target: "S-09 execution and evidence chain"
  },
  {
    fieldGroup: "partner attestation and adherence score",
    disposition: "LEGACY_ONLY",
    target: "Referenced evidence; never scientific or governance authority"
  }
] as const;

export const S11_01_EXECUTION_SOURCE_RECONCILIATION = [
  {
    abstraction: "EvaluatorRegistry.recordExecution",
    classification: "CANONICAL_CURRENT",
    treatment: "VALIDATE_AND_BIND_EXACT_S03_S04_IDENTITIES"
  },
  {
    abstraction: "BenchmarkProducerEngine",
    classification: "COMPATIBLE_LEGACY",
    treatment: "LEGACY_ENGINEERING_ONLY_NO_SCIENTIFIC_EVIDENCE_ROUTING"
  },
  {
    abstraction: "BenchmarkContractAdapter",
    classification: "COMPATIBLE_LEGACY",
    treatment: "LEGACY_ENGINEERING_ONLY_NO_AUTOMATIC_S09_ADAPTATION"
  },
  {
    abstraction: "provider/model adapters",
    classification: "PARTIAL",
    treatment: "DEFERRED_TO_CONTROLLED_EXECUTION_ADAPTER"
  }
] as const;

export const S11_01_GOVERNED_MUTATION_REQUIREMENT = {
  requiredInputs: [
    "VALID_S10_ASSESSMENT",
    "EXPLICIT_HUMAN_GOVERNANCE_DECISION",
    "EXACT_BENCHMARK_IDENTITY",
    "EXACT_DECISION_ASSESSMENT_LINEAGE",
    "SEPARATE_S02_MUTATION_AUTHORIZATION"
  ],
  implementationStatus: "DEFERRED_TO_LATER_S11",
  registryMutationPerformed: false,
  coreAdmissionPerformed: false
} as const;
