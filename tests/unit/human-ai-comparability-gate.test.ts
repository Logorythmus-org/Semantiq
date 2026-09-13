import { describe, expect, it } from "vitest";
import {
  BenchmarkRegistry,
  CANONICAL_BENCHMARK_REGISTRY,
  CANONICAL_METRIC_REGISTRY,
  CURRENT_HACS_AGENT_RESILIENCE_IDENTITY,
  DIFFERENTIAL_ITEM_BEHAVIOR_RESEARCH_CONTRACT,
  HISTORICAL_HACS_CAPABILITY_AUDIT,
  HISTORICAL_HACS_HUMAN_AI_IDENTITY,
  HIB_HUMAN_AI_COMPARABILITY_STATUS,
  HUMAN_AI_COMPARABILITY_DIMENSIONS,
  HUMAN_AI_MEASUREMENT_INVARIANCE_RESEARCH_CONTRACT,
  HumanAIComparabilityGate,
  HumanAIComparisonValidationError,
  MetricRegistry,
  S08_ITEM_CATEGORICAL_COMPARISON_DEFINITION,
  S08_REPRESENTATIVE_CASES,
  type HumanAIComparabilityDimension,
  type HumanAIComparisonDefinition,
  type HumanAIComparisonObservation,
  type HumanAIComparisonUnit,
  type HumanAIDimensionAssessment,
  type MetricIdentity,
  type MetricResult
} from "../../packages/benchmark/src/index.js";

const benchmarkRegistry = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
const metricRegistry = new MetricRegistry(CANONICAL_METRIC_REGISTRY, benchmarkRegistry);
const gate = new HumanAIComparabilityGate(benchmarkRegistry, metricRegistry);

const baseConditions = {
  instructionsDigest: "sha256:instructions",
  stimulusDigest: "sha256:stimulus",
  presentationDigest: "sha256:presentation-semantics",
  responseMode: "SINGLE_CHOICE",
  toolPolicy: "NO_EXTERNAL_TOOLS",
  language: "en",
  scoringProtocolReference: "rule:exact-normalized-option-c",
  evaluatorIdentity: { evaluatorId: "hib_objective_rule", evaluatorVersion: "0.1.0" },
  environmentReference: "environment:controlled-synthetic",
  timePolicy: "RECORDED_NOT_SCORED"
} as const;

function definition(
  overrides: Partial<HumanAIComparisonDefinition> = {}
): HumanAIComparisonDefinition {
  return { ...S08_ITEM_CATEGORICAL_COMPARISON_DEFINITION, ...overrides };
}

function unit(
  comparedDefinition = definition(),
  overrides: Record<string, unknown> = {}
): HumanAIComparisonUnit {
  return gate.createUnit(comparedDefinition, {
    comparisonUnitId: "comparison-unit-synthetic-1",
    humanEvidence: {
      role: "HUMAN_AS_SUBJECT",
      responseId: "human-response-1",
      responseDigest: "sha256:human-response-1",
      studyReference: "human-study:synthetic",
      sessionReference: "human-session:synthetic",
      presentationReference: "human-presentation:synthetic",
      provenanceReference: "synthetic-fixture:human"
    },
    aiEvidence: {
      role: "AI_AS_SUBJECT",
      executionId: "ai-execution-1",
      resultReference: "ai-result:synthetic",
      presentationReference: "ai-presentation:synthetic",
      model: {
        providerId: "synthetic-provider",
        modelId: "synthetic-model",
        snapshotStatus: "DECLARED_IMMUTABLE",
        modelVersion: "snapshot-synthetic-1",
        configurationReference: "ai-config:synthetic",
        samplingParametersReference: "ai-sampling:synthetic",
        toolAccessReferences: [],
        systemContextReference: "ai-context:synthetic",
        executionProvenanceReference: "ai-execution-provenance:synthetic"
      },
      provenanceReference: "synthetic-fixture:ai"
    },
    benchmarkIdentity: { benchmarkId: "hib_research_candidate", benchmarkVersion: "0.1.0" },
    itemIdentity: { itemId: "hib_context_reference_resolution", itemVersion: "0.1.0" },
    constructId: "meaning_context_behavior",
    humanConditions: baseConditions,
    aiConditions: baseConditions,
    metricResultReferences: [],
    evaluatorExecutionReferences: ["evaluation:human", "evaluation:ai"],
    reliabilityEvidenceReferences: [],
    validityEvidenceReferences: [],
    provenanceReferences: ["synthetic-fixture:S08"],
    ...overrides
  } as never);
}

function dimensions(
  overrides: Partial<
    Record<HumanAIComparabilityDimension, HumanAIDimensionAssessment["status"]>
  > = {},
  limitations: Partial<Record<HumanAIComparabilityDimension, readonly string[]>> = {}
): HumanAIDimensionAssessment[] {
  return HUMAN_AI_COMPARABILITY_DIMENSIONS.map((dimension) => {
    const defaultStatus = (
      [
        "METRIC_COMPATIBILITY",
        "SCALE_INTERPRETATION_COMPATIBILITY",
        "RELIABILITY_EVIDENCE",
        "VALIDITY_EVIDENCE",
        "SAMPLING_COMPATIBILITY"
      ] as readonly HumanAIComparabilityDimension[]
    ).includes(dimension)
      ? "NOT_APPLICABLE"
      : "MATCHED";
    const status = overrides[dimension] ?? defaultStatus;
    return {
      dimension,
      status,
      evidenceRefs:
        status === "UNKNOWN" || status === "NOT_APPLICABLE"
          ? []
          : [`synthetic-evidence:${dimension.toLowerCase()}`],
      rationale:
        status === "UNKNOWN"
          ? "Available synthetic evidence does not establish this dimension."
          : `Synthetic architecture evidence records ${status.toLowerCase()} status.`,
      limitations:
        limitations[dimension] ??
        (status === "ACCEPTABLE_WITH_LIMITATIONS" ? ["Bounded synthetic limitation."] : [])
    };
  });
}

function assessment(
  comparedDefinition = definition(),
  comparedUnit = unit(comparedDefinition),
  assessedDimensions = dimensions()
) {
  return gate.assess({
    assessmentId: "assessment-synthetic-1",
    definition: comparedDefinition,
    unit: comparedUnit,
    dimensions: assessedDimensions,
    limitations: ["Synthetic architecture evidence only."],
    provenanceReferences: ["synthetic-fixture:S08"],
    assessmentAuthority: "AUTOMATED_EVIDENCE_GATE"
  });
}

function categoricalObservation(): HumanAIComparisonObservation {
  return {
    observationId: "observation-synthetic-1",
    kind: "CATEGORICAL",
    humanOutcome: { kind: "VALUE", value: "CORRECT" },
    aiOutcome: { kind: "VALUE", value: "CORRECT" },
    humanEvidenceReference: "human-response-1",
    aiEvidenceReference: "ai-execution-1",
    provenanceReferences: ["synthetic-fixture:S08"]
  };
}

function resultFor(identity: MetricIdentity, value: number, resultId: string): MetricResult {
  const metric = metricRegistry.get(identity)!;
  return {
    resultId,
    metricIdentity: identity,
    ...(metric.benchmarkBinding ? { benchmarkBinding: metric.benchmarkBinding } : {}),
    outcome: { kind: "VALUE", value },
    aggregation: { method: metric.aggregation.method, observedCount: 1, missingCount: 0 },
    uncertainty: { method: "NONE" },
    computation: {
      computationId: `computation:${resultId}`,
      evaluatorId: metric.evaluator.evaluatorId,
      inputReferences: [`trace:${resultId}`],
      parameters: {}
    },
    evidenceReferences: [],
    provenanceReference: `run:${resultId}`
  };
}

describe("S-08 anti-overclaim invariants", () => {
  it("INVARIANT 1: same item is not the same construct", () => {
    expect(
      assessment(definition(), unit(), dimensions({ CONSTRUCT_COMPATIBILITY: "UNKNOWN" })).decision
    ).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("INVARIANT 2: same evaluator is not evaluator equivalence across populations", () => {
    expect(
      assessment(definition(), unit(), dimensions({ EVALUATOR_COMPATIBILITY: "UNKNOWN" })).decision
    ).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("INVARIANT 3: same metric is not a common scale interpretation", () => {
    const numeric = definition({
      purpose: "NUMERIC_DESCRIPTIVE_DIFFERENCE",
      criticalDimensions: [
        ...definition().criticalDimensions,
        "METRIC_COMPATIBILITY",
        "SCALE_INTERPRETATION_COMPATIBILITY"
      ]
    });
    expect(
      assessment(
        numeric,
        unit(numeric),
        dimensions({ SCALE_INTERPRETATION_COMPATIBILITY: "UNKNOWN" })
      ).decision
    ).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("INVARIANT 4: same numeric value is not the same construct level", () => {
    expect(S08_REPRESENTATIVE_CASES.find((entry) => entry.caseId === "E")?.expectedDecision).toBe(
      "INSUFFICIENT_EVIDENCE"
    );
  });

  it("INVARIANT 5: numeric difference is not superiority", () => {
    expect(categoricalResult().prohibitedClaims).toEqual(
      expect.arrayContaining(["HUMAN_SUPERIORITY", "AI_SUPERIORITY"])
    );
  });

  it("INVARIANT 6: a human sample is not a universal human baseline", () => {
    expect(categoricalResult().prohibitedClaims).toContain("UNIVERSAL_HUMAN_BASELINE");
  });

  it("INVARIANT 7: a single model is not an AI population", () => {
    expect(unit().aiEvidence.model.modelId).toBe("synthetic-model");
    expect(unit()).not.toHaveProperty("aiPopulation");
  });

  it("INVARIANT 8: translation is not measurement equivalence", () => {
    const changed = unit(definition(), { aiConditions: { ...baseConditions, language: "de" } });
    expect(() => assessment(definition(), changed, dimensions())).toThrowError(
      HumanAIComparisonValidationError
    );
  });

  it("INVARIANT 9: tool mismatch is not a matched condition", () => {
    const changed = unit(definition(), {
      aiConditions: { ...baseConditions, toolPolicy: "AI_RETRIEVAL" }
    });
    expect(() => assessment(definition(), changed, dimensions())).toThrowError(
      HumanAIComparisonValidationError
    );
  });

  it("INVARIANT 10: missing is not zero", () => {
    const observation = {
      ...categoricalObservation(),
      humanOutcome: { kind: "MISSING", reason: "ABSTAINED" }
    } as const;
    const output = categoricalResult(observation);
    expect(output.relationship).toBe("HUMAN_OBSERVATION_MISSING");
    expect(output).not.toHaveProperty("numericDifference");
  });

  it("INVARIANT 11: reliability is not validity", () => {
    expect(HUMAN_AI_COMPARABILITY_DIMENSIONS).toContain("RELIABILITY_EVIDENCE");
    expect(HUMAN_AI_COMPARABILITY_DIMENSIONS).toContain("VALIDITY_EVIDENCE");
  });

  it("INVARIANT 12: reliability is not comparability", () => {
    expect(
      assessment(
        definition(),
        unit(),
        dimensions({ CONSTRUCT_COMPATIBILITY: "UNKNOWN", RELIABILITY_EVIDENCE: "MATCHED" })
      ).decision
    ).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("INVARIANT 13: human validity is not AI validity", () => {
    expect(HUMAN_AI_MEASUREMENT_INVARIANCE_RESEARCH_CONTRACT.requiredEvidenceKinds).toContain(
      "POPULATION_SPECIFIC_VALIDITY_EVIDENCE"
    );
  });

  it("INVARIANT 14: AI validity is not human validity", () => {
    expect(HIB_HUMAN_AI_COMPARABILITY_STATUS.blockers).toContain("AI_VALIDITY_EVIDENCE_ABSENT");
  });

  it("INVARIANT 15: agreement is not correctness", () => {
    expect(categoricalResult().relationship).toBe("SAME_CATEGORICAL_OUTCOME");
    expect(categoricalResult()).not.toHaveProperty("correctness");
  });

  it("INVARIANT 16: consensus is not truth", () => {
    expect(categoricalResult().scientificAuthority).toBe("NONE");
  });

  it("INVARIANT 17: declared blinding is not guaranteed anonymity", () => {
    expect(
      S08_REPRESENTATIVE_CASES.find((entry) => entry.caseId === "H")?.expectedLimitation
    ).toMatch(/judge-source effect/);
  });

  it("INVARIANT 18: a synthetic fixture is not empirical evidence", () => {
    expect(
      S08_REPRESENTATIVE_CASES.every(
        (entry) => entry.empiricalEvidence === "NONE_SYNTHETIC_FIXTURE"
      )
    ).toBe(true);
  });

  it("INVARIANT 19: a comparability schema is not established comparability", () => {
    expect(HIB_HUMAN_AI_COMPARABILITY_STATUS.comparability).toBe("UNESTABLISHED");
  });

  it("INVARIANT 20: S-08 tests are not Human-AI scientific validation", () => {
    expect(HUMAN_AI_MEASUREMENT_INVARIANCE_RESEARCH_CONTRACT.scientificAuthority).toBe("NONE");
    expect(DIFFERENTIAL_ITEM_BEHAVIOR_RESEARCH_CONTRACT.formalDifMethodsImplemented).toEqual([]);
  });
});

function categoricalResult(observation = categoricalObservation()) {
  const comparedDefinition = definition();
  const comparedUnit = unit(comparedDefinition);
  const assessed = assessment(comparedDefinition, comparedUnit);
  return gate.createResult({
    resultId: "result-synthetic-1",
    definition: comparedDefinition,
    unit: comparedUnit,
    assessment: assessed,
    observation,
    limitations: ["Item-level synthetic output only."],
    provenanceReferences: ["synthetic-fixture:S08"]
  });
}

describe("S-08 fail-closed decisions and representative cases", () => {
  it("returns insufficient evidence for critical unknown and not comparable for critical mismatch", () => {
    expect(
      assessment(definition(), unit(), dimensions({ CONSTRUCT_COMPATIBILITY: "UNKNOWN" })).decision
    ).toBe("INSUFFICIENT_EVIDENCE");
    expect(
      assessment(definition(), unit(), dimensions({ LANGUAGE_COMPATIBILITY: "MISMATCHED" }))
        .decision
    ).toBe("NOT_COMPARABLE");
  });

  it("allows only bounded conditional interpretation", () => {
    const comparedDefinition = definition();
    const comparedUnit = unit(comparedDefinition);
    const assessed = assessment(
      comparedDefinition,
      comparedUnit,
      dimensions({ CONSTRUCT_COMPATIBILITY: "ACCEPTABLE_WITH_LIMITATIONS" })
    );
    expect(assessed.decision).toBe("CONDITIONALLY_COMPARABLE");
    const output = gate.createResult({
      resultId: "bounded",
      definition: comparedDefinition,
      unit: comparedUnit,
      assessment: assessed,
      observation: categoricalObservation(),
      limitations: ["Paired item only."],
      provenanceReferences: ["synthetic-fixture:S08"]
    });
    expect(output.interpretation).toBe("BOUNDED_INTERPRETATION_ALLOWED");
    expect(output).not.toHaveProperty("rank");
    expect(output).not.toHaveProperty("winner");
  });

  it("suppresses comparative observations when the gate blocks interpretation", () => {
    const comparedDefinition = definition();
    const comparedUnit = unit(comparedDefinition);
    const assessed = assessment(
      comparedDefinition,
      comparedUnit,
      dimensions({ CONSTRUCT_COMPATIBILITY: "UNKNOWN" })
    );
    const output = gate.createResult({
      resultId: "blocked",
      definition: comparedDefinition,
      unit: comparedUnit,
      assessment: assessed,
      observation: categoricalObservation(),
      limitations: ["Construct evidence absent."],
      provenanceReferences: ["synthetic-fixture:S08"]
    });
    expect(output.interpretation).toBe("NOT_INTERPRETABLE");
    expect(output).not.toHaveProperty("relationship");
  });

  it("records all eight deterministic architecture cases", () => {
    expect(S08_REPRESENTATIVE_CASES.map((entry) => entry.caseId)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H"
    ]);
  });
});

describe("S-08 negative validation", () => {
  it.each([
    [
      "unknown human evidence",
      { humanEvidence: { ...unit().humanEvidence, responseId: "" } },
      "UNKNOWN_HUMAN_EVIDENCE"
    ],
    [
      "unknown AI evidence",
      { aiEvidence: { ...unit().aiEvidence, executionId: "" } },
      "UNKNOWN_AI_EVIDENCE"
    ],
    [
      "benchmark version mismatch",
      { benchmarkIdentity: { benchmarkId: "hib_research_candidate", benchmarkVersion: "9.9.9" } },
      "UNKNOWN_BENCHMARK_EVIDENCE"
    ],
    [
      "item version missing",
      { itemIdentity: { itemId: "hib_context_reference_resolution", itemVersion: "" } },
      "ITEM_IDENTITY_REQUIRED"
    ],
    ["construct ambiguity", { constructId: "" }, "CONSTRUCT_AMBIGUITY"]
  ])("rejects %s", (_label, override, code) => {
    expect(() => unit(definition(), override)).toThrowError(
      expect.objectContaining({
        violations: expect.arrayContaining([expect.objectContaining({ code })])
      })
    );
  });

  it.each([
    ["TASK_COMPATIBILITY", { instructionsDigest: "different" }],
    ["PRESENTATION_COMPATIBILITY", { presentationDigest: "different" }],
    ["RESPONSE_MODE_COMPATIBILITY", { responseMode: "OPEN_TEXT" }],
    ["TOOL_ASSISTANCE_COMPATIBILITY", { toolPolicy: "AI_TOOL_USE" }],
    ["LANGUAGE_COMPATIBILITY", { language: "de" }],
    ["SCORING_COMPATIBILITY", { scoringProtocolReference: "different" }],
    [
      "EVALUATOR_COMPATIBILITY",
      { evaluatorIdentity: { evaluatorId: "different", evaluatorVersion: "0.1.0" } }
    ],
    ["ENVIRONMENT_COMPATIBILITY", { environmentReference: "different" }],
    ["TIME_POLICY_COMPATIBILITY", { timePolicy: "TIMED" }],
    ["SAMPLING_COMPATIBILITY", { denominatorDefinitionReference: "different" }]
  ] as const)("rejects a contradicted matched %s claim", (dimension, conditionOverride) => {
    const comparedUnit = unit(definition(), {
      aiConditions: { ...baseConditions, ...conditionOverride }
    });
    expect(() =>
      assessment(definition(), comparedUnit, dimensions({ [dimension]: "MATCHED" }))
    ).toThrowError(/CONTRADICTED_MATCH/);
    expect(
      dimensions({ [dimension]: "MISMATCHED" })[
        HUMAN_AI_COMPARABILITY_DIMENSIONS.indexOf(dimension)
      ]?.status
    ).toBe("MISMATCHED");
  });

  it("rejects missing critical dimensions and unsupported comparable claims", () => {
    expect(() => assessment(definition(), unit(), dimensions().slice(1))).toThrowError(
      /MISSING_DIMENSION/
    );
    const assessed = assessment(
      definition(),
      unit(),
      dimensions({ CONSTRUCT_COMPATIBILITY: "UNKNOWN" })
    );
    expect(assessed.decision).not.toBe("COMPARABLE_FOR_DECLARED_PURPOSE");
  });

  it("rejects invalid levels, pairings, statuses, and ranking claims at runtime", () => {
    expect(() => gate.definitionDigest(definition({ level: "UNIVERSAL" as never }))).toThrowError(
      /INVALID_COMPARISON_LEVEL/
    );
    expect(() => gate.definitionDigest(definition({ pairing: "ASSUMED" as never }))).toThrowError(
      /INVALID_PAIRING/
    );
    const invalidDimensions = dimensions();
    invalidDimensions[0] = { ...invalidDimensions[0]!, status: "EQUIVALENT" as never };
    expect(() => assessment(definition(), unit(), invalidDimensions)).toThrowError(
      /INVALID_DIMENSION_STATUS/
    );
    expect(() =>
      gate.createResult({
        resultId: "rank-forbidden",
        definition: definition(),
        unit: unit(),
        assessment: assessment(),
        observation: { ...categoricalObservation(), ranking: 1 } as never,
        limitations: [],
        provenanceReferences: ["synthetic"]
      })
    ).toThrowError(/PROHIBITED_COMPARATIVE_CLAIM/);
  });

  it("blocks scale, unit/metric, and denominator incompatibility", () => {
    const numeric = definition({
      purpose: "NUMERIC_DESCRIPTIVE_DIFFERENCE",
      criticalDimensions: [
        ...definition().criticalDimensions,
        "METRIC_COMPATIBILITY",
        "SCALE_INTERPRETATION_COMPATIBILITY",
        "SAMPLING_COMPATIBILITY"
      ]
    });
    expect(
      assessment(
        numeric,
        unit(numeric),
        dimensions({ SCALE_INTERPRETATION_COMPATIBILITY: "MISMATCHED" })
      ).decision
    ).toBe("NOT_COMPARABLE");
    expect(
      assessment(numeric, unit(numeric), dimensions({ METRIC_COMPATIBILITY: "MISMATCHED" }))
        .decision
    ).toBe("NOT_COMPARABLE");
    expect(
      assessment(numeric, unit(numeric), dimensions({ SAMPLING_COMPATIBILITY: "MISMATCHED" }))
        .decision
    ).toBe("NOT_COMPARABLE");
  });

  it("requires population provenance for sample or aggregate comparison", () => {
    const aggregate = definition({ level: "AGGREGATE_HUMAN_TO_AGGREGATE_AI", pairing: "UNPAIRED" });
    expect(() => unit(aggregate)).toThrowError(/MISSING_POPULATION_PROVENANCE/);
  });

  it("rejects ambiguous historical HACS aliases and preserves both canonical identities", () => {
    expect(CURRENT_HACS_AGENT_RESILIENCE_IDENTITY).not.toEqual(HISTORICAL_HACS_HUMAN_AI_IDENTITY);
    expect(() =>
      unit(definition(), { benchmarkIdentity: { benchmarkId: "HACS", benchmarkVersion: "0.1.0" } })
    ).toThrowError(/AMBIGUOUS_HACS_IDENTITY/);
  });

  it("does not auto-promote HIB or any benchmark maturity", () => {
    const hib = benchmarkRegistry.get({
      benchmarkId: "hib_research_candidate",
      benchmarkVersion: "0.1.0"
    })!;
    expect(hib.scientificMaturity).toBe("CALIBRATION_REQUIRED");
    expect(hib.corePromotion).toBe("NOT_PROMOTED");
    expect(HIB_HUMAN_AI_COMPARABILITY_STATUS.aiSuitability).toBe("UNASSESSED");
  });

  it("classifies legacy comparison and confidence mechanisms without transferring authority", () => {
    expect(HISTORICAL_HACS_CAPABILITY_AUDIT).toHaveLength(7);
    expect(
      HISTORICAL_HACS_CAPABILITY_AUDIT.find(
        (entry) => entry.capabilityId === "sandbox-cross-comparison-engine"
      )
    ).toMatchObject({
      classification: "CURRENT_ENGINEERING_MECHANISM",
      currentAuthority: "ENGINEERING_ONLY"
    });
    expect(
      HISTORICAL_HACS_CAPABILITY_AUDIT.find(
        (entry) => entry.capabilityId === "legacy-fixed-confidence-margin"
      )?.disposition
    ).toBe("BLOCK_SCIENTIFIC_CLAIM");
  });
});

describe("S-08 canonicalization and numeric gate", () => {
  it("canonicalizes set-like definition, unit, and assessment fields", () => {
    const original = definition();
    const reordered = definition({
      criticalDimensions: [...original.criticalDimensions].reverse(),
      requiredEvidenceReferences: [...original.requiredEvidenceReferences].reverse()
    });
    expect(gate.definitionDigest(original)).toBe(gate.definitionDigest(reordered));
    const first = unit(original);
    const second = unit(reordered, {
      evaluatorExecutionReferences: [...first.evaluatorExecutionReferences].reverse()
    });
    expect(first.comparisonUnitDigest).toBe(second.comparisonUnitDigest);
    expect(assessment(original, first, dimensions()).assessmentDigest).toBe(
      assessment(reordered, second, [...dimensions()].reverse()).assessmentDigest
    );
  });

  it("rejects metric-version mismatch, absent scale evidence, and missing values", () => {
    const numeric = definition({
      purpose: "NUMERIC_DESCRIPTIVE_DIFFERENCE",
      criticalDimensions: [
        ...definition().criticalDimensions,
        "METRIC_COMPATIBILITY",
        "SCALE_INTERPRETATION_COMPATIBILITY"
      ]
    });
    const comparedUnit = unit(numeric);
    const assessed = assessment(
      numeric,
      comparedUnit,
      dimensions({ SCALE_INTERPRETATION_COMPATIBILITY: "UNKNOWN" })
    );
    expect(assessed.decision).toBe("INSUFFICIENT_EVIDENCE");
    const human = resultFor(
      { metricId: "provider_tck_passed_tests", metricVersion: "0.1.0" },
      4,
      "human"
    );
    const ai = {
      ...resultFor({ metricId: "provider_tck_passed_tests", metricVersion: "0.1.0" }, 5, "ai"),
      metricIdentity: { metricId: "provider_tck_passed_tests", metricVersion: "9.9.9" }
    };
    expect(() =>
      gate.createResult({
        resultId: "invalid-numeric",
        definition: numeric,
        unit: comparedUnit,
        assessment: assessment(
          numeric,
          comparedUnit,
          dimensions({
            METRIC_COMPATIBILITY: "MATCHED",
            SCALE_INTERPRETATION_COMPATIBILITY: "MATCHED"
          })
        ),
        observation: {
          observationId: "numeric",
          kind: "NUMERIC_METRIC",
          humanMetricResult: human,
          aiMetricResult: ai,
          provenanceReferences: ["synthetic"]
        },
        limitations: [],
        provenanceReferences: ["synthetic"]
      })
    ).toThrowError();
  });

  it("emits only a descriptive difference when exact S-03 semantics and scale evidence match", () => {
    const metricIdentity = {
      metricId: "provider_tck_passed_tests",
      metricVersion: "0.1.0"
    } as const;
    const numeric = definition({
      purpose: "NUMERIC_DESCRIPTIVE_DIFFERENCE",
      criticalDimensions: [
        ...definition().criticalDimensions,
        "METRIC_COMPATIBILITY",
        "SCALE_INTERPRETATION_COMPATIBILITY"
      ]
    });
    const comparedUnit = unit(numeric, {
      benchmarkIdentity: { benchmarkId: "provider_tck", benchmarkVersion: "0.1.0" },
      constructId: "provider_contract_conformance",
      humanConditions: { ...baseConditions, metricIdentity },
      aiConditions: { ...baseConditions, metricIdentity },
      metricResultReferences: ["metric:human", "metric:ai"]
    });
    const assessed = assessment(
      numeric,
      comparedUnit,
      dimensions({
        METRIC_COMPATIBILITY: "MATCHED",
        SCALE_INTERPRETATION_COMPATIBILITY: "MATCHED"
      })
    );
    const output = gate.createResult({
      resultId: "numeric-result",
      definition: numeric,
      unit: comparedUnit,
      assessment: assessed,
      observation: {
        observationId: "numeric",
        kind: "NUMERIC_METRIC",
        humanMetricResult: resultFor(metricIdentity, 4, "human"),
        aiMetricResult: resultFor(metricIdentity, 5, "ai"),
        provenanceReferences: ["synthetic"]
      },
      limitations: ["Descriptive only."],
      provenanceReferences: ["synthetic"]
    });
    expect(output.relationship).toBe("DESCRIPTIVE_NUMERIC_DIFFERENCE");
    expect(output.numericDifference).toBe(1);
    expect(output.prohibitedClaims).toContain("AI_SUPERIORITY");
  });
});
