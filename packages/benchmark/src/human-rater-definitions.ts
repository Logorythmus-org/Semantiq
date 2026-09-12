import type { CanonicalHumanRaterRegistrySnapshot } from "./human-rater-types.js";

export const CANONICAL_HUMAN_RATER_REGISTRY: CanonicalHumanRaterRegistrySnapshot = {
  humanRaterRegistrySchemaVersion: "0.1.0",
  raters: [],
  studies: [
    {
      identity: {
        humanRatingStudyId: "long_horizon_human_judgment",
        humanRatingStudyVersion: "0.1.0"
      },
      versionScope: "HUMAN_RATING_STUDY",
      role: "HUMAN_AS_JUDGE",
      name: "Long-horizon human judgment architecture fixture",
      description:
        "Collects a categorical human judgment over a presented long-horizon evaluation artifact.",
      benchmarkBinding: {
        benchmark: { benchmarkId: "long_horizon", benchmarkVersion: "0.1.0" },
        constructId: "long_horizon_resilience"
      },
      evaluationTarget: "long-horizon trajectory judgment",
      inputKind: "EVIDENCE_BUNDLE",
      subjectKind: "EVALUATION_SUBJECT",
      rubricIdentity: {
        rubricId: "long_horizon_heuristic_weights",
        rubricVersion: "0.1.0"
      },
      output: {
        kind: "CATEGORICAL",
        allowedValues: ["MEETS_CRITERIA", "DOES_NOT_MEET_CRITERIA", "INSUFFICIENT_EVIDENCE"]
      },
      assignmentPolicy: "INDEPENDENT_SINGLE",
      presentationMode: "SINGLE",
      blindingPolicy: "FULL_SOURCE_BLINDED",
      randomizationPolicy: { method: "NONE" },
      repeatPolicy: "ALLOWED",
      comparisonPolicy: "NONE",
      evidenceReferences: [
        "packages/sandbox-contracts/src/long-horizon.ts",
        "Docs/research/core/S06_HUMAN_RATER_SYSTEM.md"
      ],
      provenanceReferences: ["Docs/research/core/S06_HUMAN_RATER_SYSTEM.md"],
      scientificAuthority: "NONE",
      limitations: [
        "This architecture fixture is not an empirical human study, a validation result, or a benchmark-maturity claim."
      ]
    }
  ]
};
