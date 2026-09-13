import type { EvidenceRepresentativeCase } from "./evidence-types.js";

export const S09_SCIENTIFIC_AUTHORITY = "NONE" as const;
export const S09_VERIFIER_AUTHORITY = "INTERNAL_CONSISTENCY_ONLY" as const;
export const S09_SIGNATURE_STATUS = "NOT_IMPLEMENTED" as const;

export const S09_ANTI_OVERCLAIM_INVARIANTS = [
  "RESULT != EVIDENCE",
  "EVIDENCE != PROOF",
  "HASH != SIGNATURE",
  "HASH MATCH != AUTHENTICITY",
  "HASH MATCH != SCIENTIFIC VALIDITY",
  "VERIFICATION != SCIENTIFIC VALIDATION",
  "REPLAY != REPRODUCTION",
  "REPRODUCTION != REPLICATION",
  "REPRODUCIBILITY != RELIABILITY",
  "REPRODUCIBILITY != VALIDITY",
  "REPRODUCIBILITY != CALIBRATION",
  "REPRODUCIBILITY != BENCHMARK PROMOTION",
  "DETERMINISM != VALIDITY",
  "SAME SOURCE REVISION != SAME ENVIRONMENT",
  "SAME SEED != GUARANTEED SAME OUTPUT",
  "TEMPERATURE ZERO != GUARANTEED DETERMINISM",
  "ACCESSIBLE MANIFEST != ACCESSIBLE ARTIFACTS",
  "ARTIFACT REFERENCE != REDISTRIBUTION RIGHT",
  "HUMAN EVIDENCE != REPLAYABLE COGNITION",
  "HUMAN JUDGE EVIDENCE != DETERMINISTIC JUDGMENT",
  "REPRODUCED COMPARISON COMPUTATION != ESTABLISHED HUMAN-AI COMPARABILITY",
  "MISSING != ZERO",
  "UNAVAILABLE != NONEXISTENT",
  "RESTRICTED != MISSING",
  "TEST PASS != REPRODUCIBILITY",
  "SYNTHETIC FIXTURE != EMPIRICAL REPRODUCTION EVIDENCE",
  "EVIDENCE CLOSURE != SCIENTIFIC COMPLETENESS",
  "SELF-CONTAINED CLAIM WITHOUT ACTUAL ARTIFACT AVAILABILITY != VALID",
  "PROVIDER MODEL ID != KNOWN IMMUTABLE MODEL SNAPSHOT",
  "S-09 IMPLEMENTATION != SCIENTIFIC VALIDATION"
] as const;

export const S09_DISCOVERED_MECHANISMS = [
  { mechanism: "S02-S08 canonical Core records", classification: "CANONICAL_CURRENT" },
  {
    mechanism: "sandbox-contracts canonicalJson/computeSha256",
    classification: "CANONICAL_CURRENT"
  },
  { mechanism: "sandbox portable evidence package", classification: "ENGINEERING_ONLY" },
  { mechanism: "evidence research bundles", classification: "PARTIAL" },
  { mechanism: "evidence execution manifests", classification: "PARTIAL" },
  { mechanism: "adapter and collective replay", classification: "ENGINEERING_ONLY" },
  { mechanism: "release reproducibility auditor", classification: "ENGINEERING_ONLY" },
  { mechanism: "legacy digest-shaped package signature", classification: "CONFLICTING" },
  { mechanism: "legacy boolean isReproducible", classification: "CONFLICTING" }
] as const;

export const S09_REPRESENTATIVE_CASES: readonly EvidenceRepresentativeCase[] = [
  {
    caseId: "A",
    description: "Fully local deterministic engineering run.",
    verificationOutcome: "VERIFIED_INTERNAL_CONSISTENCY",
    replayOutcome: "READY_FOR_REPLAY",
    scientificEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "B",
    description: "Dependency lock differs despite matching source and input.",
    verificationOutcome: "PARTIALLY_VERIFIED",
    replayOutcome: "LIMITED_REPLAY_POSSIBLE",
    scientificEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "C",
    description: "External model snapshot is unknown.",
    verificationOutcome: "PARTIALLY_VERIFIED",
    replayOutcome: "REPLAY_BLOCKED",
    scientificEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "D",
    description: "Artifact digest does not match observed content.",
    verificationOutcome: "VERIFICATION_FAILED",
    replayOutcome: "REPLAY_BLOCKED",
    scientificEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "E",
    description: "Required artifact is restricted by rights.",
    verificationOutcome: "PARTIALLY_VERIFIED",
    replayOutcome: "LIMITED_REPLAY_POSSIBLE",
    scientificEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "F",
    description: "Human subject response is verifiable but cognition is not replayable.",
    verificationOutcome: "VERIFIED_INTERNAL_CONSISTENCY",
    replayOutcome: "REPLAY_BLOCKED",
    scientificEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "G",
    description: "Human judge protocol is verifiable but judgment is not deterministic replay.",
    verificationOutcome: "VERIFIED_INTERNAL_CONSISTENCY",
    replayOutcome: "REPLAY_BLOCKED",
    scientificEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "H",
    description: "Comparison computation reproduces while comparability remains insufficient.",
    verificationOutcome: "VERIFIED_INTERNAL_CONSISTENCY",
    replayOutcome: "READY_FOR_REPLAY",
    scientificEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "I",
    description: "Same result came from materially different configuration.",
    verificationOutcome: "PARTIALLY_VERIFIED",
    replayOutcome: "LIMITED_REPLAY_POSSIBLE",
    scientificEvidence: "NONE_SYNTHETIC_FIXTURE"
  },
  {
    caseId: "J",
    description: "Failed execution retains complete provenance.",
    verificationOutcome: "VERIFIED_INTERNAL_CONSISTENCY",
    replayOutcome: "READY_FOR_REPLAY",
    scientificEvidence: "NONE_SYNTHETIC_FIXTURE"
  }
] as const;
