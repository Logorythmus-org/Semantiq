import { describe, expect, it } from "vitest";
import {
  BenchmarkRegistry,
  CANONICAL_BENCHMARK_REGISTRY,
  CANONICAL_EVALUATOR_REGISTRY,
  CANONICAL_HUMAN_RATER_REGISTRY,
  CANONICAL_METRIC_REGISTRY,
  CANONICAL_RELIABILITY_REGISTRY,
  EvaluatorRegistry,
  HUMAN_EVALUATOR_IDENTITY,
  HumanRaterRecordValidationError,
  HumanRaterRegistryValidationError,
  HumanRaterSystem,
  MetricRegistry,
  ReliabilityRegistry,
  validateHumanRaterRegistry,
  type CanonicalHumanRaterRegistrySnapshot,
  type HumanPresentation,
  type HumanPresentationCandidateInput,
  type HumanRater,
  type HumanRating,
  type HumanRatingAssignment,
  type HumanRatingStudyDefinition,
  type MetricResult,
  type ReliabilityStudyDefinition
} from "../../packages/benchmark/src/index.js";

const benchmarks = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
const metrics = new MetricRegistry(CANONICAL_METRIC_REGISTRY, benchmarks);
const evaluators = new EvaluatorRegistry(CANONICAL_EVALUATOR_REGISTRY, benchmarks, metrics);
const canonicalStudy = CANONICAL_HUMAN_RATER_REGISTRY.studies[0]!;

function rater(raterId: string, status: HumanRater["status"] = "QUALIFIED"): HumanRater {
  return {
    identity: { raterId },
    status,
    qualificationReferences: ["qualification:procedure-completed"],
    trainingReferences: ["training:human-judge-foundation"],
    rubricFamiliarizationReferences: ["rubric-familiarization:long-horizon-0.1.0"],
    participationPolicyReference: "participation-policy:architecture-placeholder",
    acknowledgementReference: `acknowledgement:${raterId}`,
    provenanceReferences: [`rater-provenance:${raterId}`],
    limitations: [
      "Procedure completion is not expertise, certification, or rater-quality evidence."
    ]
  };
}

function snapshot(
  studies: readonly HumanRatingStudyDefinition[] = [canonicalStudy],
  raters: readonly HumanRater[] = [rater("rater-alpha"), rater("rater-beta")]
): CanonicalHumanRaterRegistrySnapshot {
  return { ...CANONICAL_HUMAN_RATER_REGISTRY, raters, studies };
}

function system(
  studies: readonly HumanRatingStudyDefinition[] = [canonicalStudy],
  raters: readonly HumanRater[] = [rater("rater-alpha"), rater("rater-beta")]
): HumanRaterSystem {
  return new HumanRaterSystem(snapshot(studies, raters), benchmarks, metrics, evaluators);
}

function target(study: HumanRatingStudyDefinition = canonicalStudy) {
  return {
    subjectId: "trajectory-1",
    subjectKind: study.subjectKind,
    evaluationTarget: study.evaluationTarget,
    inputKind: study.inputKind,
    inputReferences: ["evidence-bundle:trajectory-1"],
    ...(study.benchmarkBinding ? { benchmarkBinding: study.benchmarkBinding } : {})
  };
}

function openedAssignment(
  lab: HumanRaterSystem,
  raterId = "rater-alpha",
  study: HumanRatingStudyDefinition = canonicalStudy,
  assignmentId = `assignment-${raterId}`
): HumanRatingAssignment {
  return lab.openAssignment(
    lab.createAssignment({
      assignmentId,
      studyIdentity: study.identity,
      raterId,
      target: target(study),
      createdAt: "2026-09-13T00:00:00Z"
    }),
    "2026-09-13T00:01:00Z"
  );
}

function presentation(
  lab: HumanRaterSystem,
  assignment: HumanRatingAssignment,
  candidates: readonly HumanPresentationCandidateInput[] = [
    {
      candidateId: "candidate-a",
      contentReference: "artifact:trajectory-output-a",
      semanticContentDigest: "a".repeat(64),
      metadata: {
        subjectIdentity: "agent-17",
        modelIdentity: "model-opaque",
        providerIdentity: "provider-opaque",
        sourceLabel: "candidate source",
        visibleLabels: ["trajectory"]
      }
    }
  ],
  randomizationSeed?: number
): HumanPresentation {
  return lab.createPresentation({
    presentationId: `presentation-${assignment.assignmentId}-${randomizationSeed ?? "fixed"}`,
    assignment,
    candidates,
    ...(randomizationSeed === undefined ? {} : { randomizationSeed }),
    openedAt: "2026-09-13T00:01:00Z"
  });
}

function submittedRating(
  lab: HumanRaterSystem,
  assignment: HumanRatingAssignment,
  shown: HumanPresentation,
  category = "MEETS_CRITERIA"
): HumanRating {
  return lab.submitRating({
    ratingId: `rating-${assignment.assignmentId}`,
    assignment,
    presentation: shown,
    status: "SUBMITTED",
    output: { kind: "CATEGORICAL", category, rationale: "Bounded reviewer rationale." },
    evidenceReferences: ["evidence:human-rating"],
    provenanceReference: `human-rating-provenance:${assignment.raterId}`,
    submittedAt: "2026-09-13T00:02:00Z"
  }).rating;
}

describe("S-06 human-evaluation invariants", () => {
  it("INVARIANT 1: Human-as-Judge is not Human-as-Subject", () => {
    const invalid = structuredClone(canonicalStudy) as any;
    invalid.role = "HUMAN_AS_SUBJECT";
    expect(
      validateHumanRaterRegistry(
        snapshot([invalid]),
        benchmarks,
        metrics,
        evaluators
      ).violations.map((item) => item.code)
    ).toContain("HUMAN_ROLE_SUBSTITUTION");
  });

  it("INVARIANT 2: Human-as-Judge is not Human-AI comparison", () => {
    const invalid = structuredClone(canonicalStudy) as any;
    invalid.role = "HUMAN_AI_COMPARISON";
    expect(
      validateHumanRaterRegistry(
        snapshot([invalid]),
        benchmarks,
        metrics,
        evaluators
      ).violations.map((item) => item.code)
    ).toContain("HUMAN_ROLE_SUBSTITUTION");
  });

  it("INVARIANT 3: rater identity is distinct from evaluator identity", () => {
    expect(rater("rater-alpha").identity).not.toEqual(HUMAN_EVALUATOR_IDENTITY);
    expect(HUMAN_EVALUATOR_IDENTITY).toEqual({
      evaluatorId: "human_judge_contract",
      evaluatorVersion: "0.1.0"
    });
  });

  it("INVARIANT 4: different raters use the same Human Judge configuration", () => {
    const lab = system();
    const firstAssignment = openedAssignment(lab, "rater-alpha");
    const secondAssignment = openedAssignment(lab, "rater-beta");
    const first = lab.toEvaluatorExecution(
      submittedRating(lab, firstAssignment, presentation(lab, firstAssignment))
    );
    const second = lab.toEvaluatorExecution(
      submittedRating(lab, secondAssignment, presentation(lab, secondAssignment))
    );
    expect(first.configuration.configurationDigest).toBe(second.configuration.configurationDigest);
    expect(first.execution.evaluatorIdentity).toEqual(second.execution.evaluatorIdentity);
    expect(first.execution.provenanceReference).not.toBe(second.execution.provenanceReference);
  });

  it("INVARIANT 5: human disagreement remains as independent S-04 and S-05 evidence", () => {
    const lab = system();
    const a = openedAssignment(lab, "rater-alpha");
    const b = openedAssignment(lab, "rater-beta");
    const ratingA = submittedRating(lab, a, presentation(lab, a), "MEETS_CRITERIA");
    const ratingB = submittedRating(lab, b, presentation(lab, b), "DOES_NOT_MEET_CRITERIA");
    const converted = [lab.toEvaluatorExecution(ratingA), lab.toEvaluatorExecution(ratingB)];
    const raterSet = lab.createHumanRaterSet([ratingA, ratingB]);
    const reliabilityStudy: ReliabilityStudyDefinition = {
      identity: {
        reliabilityStudyId: "human_judge_raw_agreement",
        reliabilityStudyVersion: "0.1.0"
      },
      versionScope: "RELIABILITY_STUDY",
      name: "Human judge raw agreement",
      question: "Do categorical human judgments agree under one instrument?",
      target: raterSet.target,
      method: "CATEGORICAL_AGREEMENT",
      constantDimensions: [
        "BENCHMARK_VERSION",
        "BENCHMARK_INPUT",
        "EVALUATOR_VERSION",
        "EVALUATOR_CONFIGURATION",
        "RUBRIC_VERSION",
        "SUBJECT"
      ],
      variedDimensions: ["RATER"],
      evidenceReferences: raterSet.raterReferences,
      provenanceReferences: ["Docs/research/core/S06_HUMAN_RATER_SYSTEM.md"],
      scientificAuthority: "NONE",
      limitations: ["Raw agreement does not establish correctness or validity."]
    };
    const reliability = new ReliabilityRegistry(
      { ...CANONICAL_RELIABILITY_REGISTRY, studies: [reliabilityStudy] },
      evaluators,
      metrics
    );
    const result = reliability.execute({
      executionId: "reliability-human-1",
      studyIdentity: reliabilityStudy.identity,
      definitionDigest: reliability.definitionDigest(reliabilityStudy),
      executionReferences: converted.map((item) => item.execution.executionId),
      evaluatorExecutions: converted.map((item) => item.execution),
      configurations: [converted[0]!.configuration],
      evidenceReferences: raterSet.raterReferences,
      provenanceReference: "human-rating-study:raw-agreement",
      executedAt: "2026-09-13T01:00:00Z"
    });
    expect(result.estimate.value).toMatchObject({
      kind: "CATEGORICAL_AGREEMENT",
      agreements: 0,
      rawAgreement: 0
    });
    expect(result.estimate.executionReferences).toHaveLength(2);
  });

  it("INVARIANT 6: consensus is never represented as ground truth", () => {
    const lab = system();
    const assignment = openedAssignment(lab);
    const rating = submittedRating(lab, assignment, presentation(lab, assignment));
    expect(rating.groundTruthClaim).toBe("NONE");
  });

  it("INVARIANT 7: abstention is neither zero nor failure", () => {
    const lab = system();
    const assignment = openedAssignment(lab);
    const shown = presentation(lab, assignment);
    const rating = lab.submitRating({
      ratingId: "rating-abstain",
      assignment,
      presentation: shown,
      status: "ABSTAINED",
      abstention: {
        reason: "INSUFFICIENT_EVIDENCE",
        detail: "The presented artifact is insufficient."
      },
      evidenceReferences: ["evidence:insufficient"],
      provenanceReference: "human-rating:abstain",
      submittedAt: "2026-09-13T00:02:00Z"
    }).rating;
    const execution = lab.toEvaluatorExecution(rating).execution;
    expect(execution.status).toBe("ABSTAINED");
    expect(execution.output).toBeUndefined();
    expect(execution.failure).toBeUndefined();
  });

  it("INVARIANT 8: incomplete submission cannot become a judgment", () => {
    const lab = system();
    const assignment = openedAssignment(lab);
    const shown = presentation(lab, assignment);
    const rating = lab.submitRating({
      ratingId: "rating-incomplete",
      assignment,
      presentation: shown,
      status: "INCOMPLETE",
      evidenceReferences: ["evidence:incomplete"],
      provenanceReference: "human-rating:incomplete",
      submittedAt: "2026-09-13T00:02:00Z"
    }).rating;
    expect(() => lab.toEvaluatorExecution(rating)).toThrow(/NON_JUDGMENT_SUBMISSION/);
  });

  it("INVARIANT 9: declared blinding records controls without claiming anonymity", () => {
    const lab = system();
    const assignment = openedAssignment(lab);
    const shown = presentation(lab, assignment);
    expect(shown.declaredBlindingPolicy).toBe("FULL_SOURCE_BLINDED");
    expect(shown.effectiveVisibility).toEqual({
      subjectIdentity: false,
      modelIdentity: false,
      providerIdentity: false,
      sourceLabel: false
    });
    expect(shown.candidates[0]!.visibleMetadata).toEqual({ visibleLabels: ["trajectory"] });
    expect(shown.sourceAnonymityGuarantee).toBe("NOT_CLAIMED");
  });

  it("INVARIANT 10: randomization is reproducible and preserves candidates and semantic content", () => {
    const pairStudy: HumanRatingStudyDefinition = {
      ...canonicalStudy,
      identity: { humanRatingStudyId: "pairwise_human_judgment", humanRatingStudyVersion: "0.1.0" },
      presentationMode: "PAIRWISE",
      randomizationPolicy: { method: "SEEDED_FISHER_YATES", seedRequired: true },
      comparisonPolicy: "ORDERED_CANDIDATE_COMPARISON"
    };
    const lab = system([pairStudy]);
    const assignment = openedAssignment(lab, "rater-alpha", pairStudy);
    const candidates = [
      {
        candidateId: "a",
        contentReference: "artifact:a",
        semanticContentDigest: "a".repeat(64),
        metadata: {}
      },
      {
        candidateId: "b",
        contentReference: "artifact:b",
        semanticContentDigest: "b".repeat(64),
        metadata: {}
      }
    ];
    const first = presentation(lab, assignment, candidates, 42);
    const second = presentation(lab, assignment, candidates, 42);
    const alternativeOrders = Array.from(
      { length: 100 },
      (_, seed) => presentation(lab, assignment, candidates, seed).randomization.resultingOrder
    );
    expect(first.randomization.resultingOrder).toEqual(second.randomization.resultingOrder);
    expect(
      alternativeOrders.some(
        (order) => JSON.stringify(order) !== JSON.stringify(first.randomization.resultingOrder)
      )
    ).toBe(true);
    expect(new Set(first.randomization.resultingOrder)).toEqual(new Set(["a", "b"]));
    expect(first.candidates.map((item) => item.semanticContentDigest).sort()).toEqual([
      "a".repeat(64),
      "b".repeat(64)
    ]);
    expect(first.randomization).toMatchObject({ method: "SEEDED_FISHER_YATES", seed: 42 });
  });

  it("INVARIANT 11: rating binds the exact presentation shown", () => {
    const lab = system();
    const assignment = openedAssignment(lab);
    const shown = presentation(lab, assignment);
    const rating = submittedRating(lab, assignment, shown);
    expect(rating.presentationId).toBe(shown.presentationId);
    expect(rating.presentationDigest).toBe(shown.presentationDigest);
  });

  it("INVARIANT 12: rubric version substitution is rejected", () => {
    const lab = system();
    const assignment = openedAssignment(lab);
    const substituted = {
      ...assignment,
      rubricIdentity: { rubricId: assignment.rubricIdentity.rubricId, rubricVersion: "9.9.9" }
    };
    expect(() => presentation(lab, substituted)).toThrow(/RUBRIC_OR_STUDY_SUBSTITUTION/);
  });

  it("INVARIANT 13: human ratings cannot promote S-02 maturity", () => {
    const lab = system();
    const assignment = openedAssignment(lab);
    const rating = submittedRating(lab, assignment, presentation(lab, assignment));
    expect(rating.benchmarkMaturityEffect).toBe("NONE");
  });

  it("INVARIANT 14: human ratings cannot establish S-03 validity or calibration", () => {
    const lab = system();
    const assignment = openedAssignment(lab);
    const rating = submittedRating(lab, assignment, presentation(lab, assignment));
    expect(rating.metricValidityEffect).toBe("NONE");
    expect(rating.scientificAuthority).toBe("NONE");
  });

  it("INVARIANT 15: multiple ratings are not automatically averaged or adjudicated", () => {
    const lab = system();
    const a = openedAssignment(lab, "rater-alpha");
    const b = openedAssignment(lab, "rater-beta");
    const ratings = [
      submittedRating(lab, a, presentation(lab, a)),
      submittedRating(lab, b, presentation(lab, b), "DOES_NOT_MEET_CRITERIA")
    ];
    expect(ratings).toHaveLength(2);
    expect(JSON.stringify(ratings)).not.toMatch(/average|majorityWinner|adjudicatedTruth/);
  });

  it("INVARIANT 16: no universal Rater Quality Score is fabricated", () => {
    expect(JSON.stringify(CANONICAL_HUMAN_RATER_REGISTRY)).not.toMatch(
      /raterQualityScore|GOOD|POOR/
    );
  });

  it("INVARIANT 17: canonical lineage needs only a pseudonymous rater ID", () => {
    const record = rater("rater-pseudonym");
    expect(record.identity).toEqual({ raterId: "rater-pseudonym" });
    expect(JSON.stringify(record)).not.toMatch(/realName|email|phone|address|ipAddress|username/);
  });
});

describe("S-06 validation and privacy negatives", () => {
  it("rejects duplicate identity, invalid lifecycle, and illegal lifecycle transitions", () => {
    const invalid = rater("rater-alpha") as any;
    invalid.status = "ACTIVE";
    const codes = validateHumanRaterRegistry(
      snapshot([canonicalStudy], [invalid, rater("rater-alpha")]),
      benchmarks,
      metrics,
      evaluators
    ).violations.map((item) => item.code);
    expect(codes).toEqual(
      expect.arrayContaining(["DUPLICATE_RATER_IDENTITY", "INVALID_RATER_STATUS"])
    );
    expect(() => system().transitionRater(rater("retired-rater", "RETIRED"), "QUALIFIED")).toThrow(
      /INVALID_RATER_TRANSITION/
    );
  });

  it("preserves historical rater status snapshots after a lifecycle change", () => {
    const lab = system();
    const assignment = openedAssignment(lab);
    const retired = lab.transitionRater(rater("rater-alpha"), "RETIRED");
    expect(retired.status).toBe("RETIRED");
    expect(assignment.raterStatusAtAssignment).toBe("QUALIFIED");
  });

  it("rejects direct PII fields and values", () => {
    const withField = { ...rater("rater-private"), email: "person@example.test" } as any;
    const withValue = { ...rater("rater-value"), acknowledgementReference: "person@example.test" };
    expect(
      () =>
        new HumanRaterSystem(
          snapshot([canonicalStudy], [withField]),
          benchmarks,
          metrics,
          evaluators
        )
    ).toThrow(HumanRaterRegistryValidationError);
    for (const [field, value] of [
      ["realName", "Example Person"],
      ["phone", "+49 123 456789"],
      ["address", "Example address"],
      ["ipAddress", "192.0.2.10"],
      ["username", "account-name"],
      ["authToken", "opaque-value"]
    ] as const) {
      const record = { ...rater(`rater-${field.toLowerCase()}`), [field]: value } as any;
      expect(
        () =>
          new HumanRaterSystem(
            snapshot([canonicalStudy], [record]),
            benchmarks,
            metrics,
            evaluators
          )
      ).toThrow(HumanRaterRegistryValidationError);
    }
    expect(
      () =>
        new HumanRaterSystem(
          snapshot([canonicalStudy], [withValue]),
          benchmarks,
          metrics,
          evaluators
        )
    ).toThrow(HumanRaterRegistryValidationError);
  });

  it("rejects secrets, credentials, and private local paths", () => {
    const secret = {
      ...rater("rater-secret"),
      acknowledgementReference: "ghp_abcdefghijklmnopqrstuvwxyz123456"
    };
    const local = { ...rater("rater-local"), acknowledgementReference: "C:\\private\\ack.json" };
    expect(
      () =>
        new HumanRaterSystem(snapshot([canonicalStudy], [secret]), benchmarks, metrics, evaluators)
    ).toThrow(/SECRET_MATERIAL_FORBIDDEN/);
    expect(
      () =>
        new HumanRaterSystem(snapshot([canonicalStudy], [local]), benchmarks, metrics, evaluators)
    ).toThrow(/PRIVATE_PATH_FORBIDDEN/);
  });

  it("rejects unknown benchmark, construct, rubric, and metric targets", () => {
    const badBenchmark = {
      ...canonicalStudy,
      benchmarkBinding: {
        benchmark: { benchmarkId: "missing", benchmarkVersion: "0.1.0" },
        constructId: "missing"
      }
    };
    const badConstruct = {
      ...canonicalStudy,
      identity: { humanRatingStudyId: "bad_construct", humanRatingStudyVersion: "0.1.0" },
      benchmarkBinding: { ...canonicalStudy.benchmarkBinding!, constructId: "missing" }
    };
    const badRubric = {
      ...canonicalStudy,
      identity: { humanRatingStudyId: "bad_rubric", humanRatingStudyVersion: "0.1.0" },
      rubricIdentity: { rubricId: "missing", rubricVersion: "0.1.0" }
    };
    const badMetric = {
      ...canonicalStudy,
      identity: { humanRatingStudyId: "bad_metric", humanRatingStudyVersion: "0.1.0" },
      output: {
        kind: "NUMERIC" as const,
        metricIdentity: { metricId: "missing", metricVersion: "0.1.0" }
      }
    };
    const codes = validateHumanRaterRegistry(
      snapshot([badBenchmark, badConstruct, badRubric, badMetric]),
      benchmarks,
      metrics,
      evaluators
    ).violations.map((item) => item.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "UNKNOWN_BENCHMARK",
        "UNKNOWN_CONSTRUCT",
        "UNKNOWN_RUBRIC",
        "UNKNOWN_METRIC"
      ])
    );
  });

  it("rejects assignment/rater/target and prepopulated-answer substitution", () => {
    const lab = system();
    expect(() =>
      lab.createAssignment({
        assignmentId: "unknown-rater",
        studyIdentity: canonicalStudy.identity,
        raterId: "missing",
        target: target(),
        createdAt: "2026-09-13T00:00:00Z"
      })
    ).toThrow(/UNKNOWN_RATER/);
    expect(() =>
      lab.createAssignment({
        assignmentId: "wrong-target",
        studyIdentity: canonicalStudy.identity,
        raterId: "rater-alpha",
        target: { ...target(), evaluationTarget: "other" },
        createdAt: "2026-09-13T00:00:00Z"
      })
    ).toThrow(/ASSIGNMENT_TARGET_SUBSTITUTION/);
    const prefilled = {
      assignmentId: "prefilled",
      studyIdentity: canonicalStudy.identity,
      raterId: "rater-alpha",
      target: target(),
      createdAt: "2026-09-13T00:00:00Z",
      answer: "PASS"
    } as any;
    expect(() => lab.createAssignment(prefilled)).toThrow(/PREPOPULATED_JUDGMENT_FORBIDDEN/);
  });

  it("rejects invalid presentation counts, digests, and randomization records", () => {
    const pairStudy: HumanRatingStudyDefinition = {
      ...canonicalStudy,
      identity: { humanRatingStudyId: "pair_validation", humanRatingStudyVersion: "0.1.0" },
      presentationMode: "PAIRWISE",
      randomizationPolicy: { method: "SEEDED_FISHER_YATES", seedRequired: true },
      comparisonPolicy: "ORDERED_CANDIDATE_COMPARISON"
    };
    const lab = system([pairStudy]);
    const assignment = openedAssignment(lab, "rater-alpha", pairStudy);
    expect(() =>
      presentation(lab, assignment, [
        { candidateId: "a", contentReference: "a", semanticContentDigest: "bad", metadata: {} }
      ])
    ).toThrow(HumanRaterRecordValidationError);
  });

  it("rejects presentation, rating scale, abstention, and incomplete-output conflicts", () => {
    const lab = system();
    const assignment = openedAssignment(lab);
    const shown = presentation(lab, assignment);
    const base = {
      ratingId: "invalid",
      assignment,
      presentation: shown,
      evidenceReferences: ["e"],
      provenanceReference: "p",
      submittedAt: "2026-09-13T00:02:00Z"
    };
    expect(() =>
      lab.submitRating({
        ...base,
        status: "SUBMITTED",
        output: { kind: "CATEGORICAL", category: "UNKNOWN" }
      })
    ).toThrow(/INVALID_RATING_SCALE/);
    expect(() =>
      lab.submitRating({
        ...base,
        status: "ABSTAINED",
        output: { kind: "CATEGORICAL", category: "MEETS_CRITERIA" },
        abstention: { reason: "AMBIGUOUS" }
      })
    ).toThrow(/INVALID_SUBMISSION_OUTPUT/);
    expect(() =>
      lab.submitRating({
        ...base,
        status: "INCOMPLETE",
        output: { kind: "CATEGORICAL", category: "MEETS_CRITERIA" }
      })
    ).toThrow(/INVALID_SUBMISSION_OUTPUT/);
  });

  it("rejects rating/presentation and rubric substitution", () => {
    const lab = system();
    const a = openedAssignment(lab, "rater-alpha");
    const b = openedAssignment(lab, "rater-beta");
    const shownB = presentation(lab, b);
    expect(() =>
      lab.submitRating({
        ratingId: "substituted",
        assignment: a,
        presentation: shownB,
        status: "SUBMITTED",
        output: { kind: "CATEGORICAL", category: "MEETS_CRITERIA" },
        evidenceReferences: ["e"],
        provenanceReference: "p",
        submittedAt: "2026-09-13T00:02:00Z"
      })
    ).toThrow(/ASSIGNMENT_RATER_SUBSTITUTION|PRESENTATION_ASSIGNMENT_SUBSTITUTION/);
  });

  it("rejects mixed study conditions and non-judgments in Human Rater Sets", () => {
    const lab = system();
    const a = openedAssignment(lab, "rater-alpha");
    const b = openedAssignment(lab, "rater-beta");
    const submitted = submittedRating(lab, a, presentation(lab, a));
    const other = submittedRating(lab, b, presentation(lab, b));
    const mixed = {
      ...other,
      studyIdentity: {
        humanRatingStudyId: "different_study",
        humanRatingStudyVersion: "0.1.0"
      }
    };
    expect(() => lab.createHumanRaterSet([submitted, mixed])).toThrow(
      /MIXED_HUMAN_RATER_SET_CONDITION/
    );
    expect(() => lab.createHumanRaterSet([{ ...other, status: "INCOMPLETE" }])).toThrow(
      /INELIGIBLE_HUMAN_RATER_SET_RECORD/
    );
  });
});

describe("S-06 Human Judge conversion", () => {
  it("promotes only the existing human_judge_contract to the implemented S-06 adapter", () => {
    const definition = evaluators.get(HUMAN_EVALUATOR_IDENTITY)!;
    expect(definition.kind).toBe("HUMAN_JUDGE");
    expect(definition.bindingStatus).toBe("IMPLEMENTED_AND_BOUND");
    expect(definition.implementationId).toBe("HumanRaterSystem.toEvaluatorExecution");
    expect(definition.judgeIndependence).toBe("HUMAN");
  });

  it("converts categorical ratings deterministically with rater, assignment, presentation, rubric, target, and evidence lineage", () => {
    const lab = system();
    const assignment = openedAssignment(lab);
    const shown = presentation(lab, assignment);
    const rating = submittedRating(lab, assignment, shown);
    const first = lab.toEvaluatorExecution(rating);
    const second = lab.toEvaluatorExecution(rating);
    expect(first).toEqual(second);
    expect(first.execution).toMatchObject({
      evaluatorIdentity: HUMAN_EVALUATOR_IDENTITY,
      status: "SUCCEEDED",
      subject: { subjectId: "trajectory-1", subjectKind: "EVALUATION_SUBJECT" },
      inputKind: "EVIDENCE_BUNDLE",
      output: { kind: "CATEGORICAL_DECISION", category: "MEETS_CRITERIA" }
    });
    expect(first.execution.evidenceReferences).toEqual(
      expect.arrayContaining([
        `rater:${rating.raterId}`,
        `assignment:${rating.assignmentId}`,
        `presentation:${rating.presentationId}`,
        `rating:${rating.ratingId}`,
        "rubric:long_horizon_heuristic_weights@0.1.0"
      ])
    );
  });

  it("requires S-03 MetricResult for numeric ratings and converts a study-declared metric", () => {
    const metricSnapshot = structuredClone(CANONICAL_METRIC_REGISTRY) as any;
    const numericDefinition = structuredClone(
      metricSnapshot.definitions.find(
        (item: any) => item.identity.metricId === "provider_tck_passed_tests"
      )
    );
    numericDefinition.identity = { metricId: "human_rating_value", metricVersion: "0.1.0" };
    numericDefinition.displayName = "Human rating value";
    numericDefinition.description = "Architecture-only numeric human rating fixture.";
    numericDefinition.scope = "BENCHMARK_INDEPENDENT";
    delete numericDefinition.benchmarkBinding;
    numericDefinition.evaluator = {
      evaluatorId: "HumanRaterSystem.toEvaluatorExecution",
      mechanism: "HUMAN_JUDGE",
      implementationReference: "packages/benchmark/src/human-rater.ts"
    };
    metricSnapshot.definitions.push(numericDefinition);
    const numericMetrics = new MetricRegistry(metricSnapshot, benchmarks);
    const numericEvaluators = new EvaluatorRegistry(
      CANONICAL_EVALUATOR_REGISTRY,
      benchmarks,
      numericMetrics
    );
    const numericStudy: HumanRatingStudyDefinition = {
      ...canonicalStudy,
      identity: { humanRatingStudyId: "numeric_human_judgment", humanRatingStudyVersion: "0.1.0" },
      benchmarkBinding: undefined,
      output: { kind: "NUMERIC", metricIdentity: numericDefinition.identity }
    };
    const lab = new HumanRaterSystem(
      snapshot([numericStudy]),
      benchmarks,
      numericMetrics,
      numericEvaluators
    );
    const assignment = openedAssignment(lab, "rater-alpha", numericStudy);
    const shown = presentation(lab, assignment);
    const metricResult: MetricResult = {
      resultId: "human-result-1",
      metricIdentity: numericDefinition.identity,
      outcome: { kind: "VALUE", value: 3 },
      aggregation: { method: "NONE", observedCount: 1, missingCount: 0 },
      uncertainty: { method: "NONE" },
      computation: {
        computationId: "human-rating-1",
        evaluatorId: "HumanRaterSystem.toEvaluatorExecution",
        evaluatorVersion: "0.1.0",
        inputReferences: [shown.presentationId],
        parameters: {}
      },
      evidenceReferences: [shown.presentationId],
      provenanceReference: "human-rating:numeric"
    };
    const rating = lab.submitRating({
      ratingId: "numeric-rating",
      assignment,
      presentation: shown,
      status: "SUBMITTED",
      output: { kind: "NUMERIC", metricResult },
      evidenceReferences: [shown.presentationId],
      provenanceReference: "human-rating:numeric",
      submittedAt: "2026-09-13T00:02:00Z"
    }).rating;
    expect(lab.toEvaluatorExecution(rating).execution.output).toEqual({
      kind: "METRIC_RESULT",
      metricResult
    });
  });
});
