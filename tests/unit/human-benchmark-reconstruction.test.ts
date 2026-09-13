import { describe, expect, it } from "vitest";
import {
  BenchmarkRegistry,
  CANONICAL_BENCHMARK_REGISTRY,
  CANONICAL_EVALUATOR_REGISTRY,
  CANONICAL_METRIC_REGISTRY,
  EvaluatorRegistry,
  HISTORICAL_HIB_ITEM_AUDIT,
  HIB_PILOT_STUDY_PROTOCOL,
  HUMAN_BENCHMARK_CONSTRUCTS,
  HUMAN_BENCHMARK_ITEMS,
  HUMAN_EVALUATOR_IDENTITY,
  HumanBenchmarkRecordValidationError,
  HumanBenchmarkSystem,
  MetricRegistry,
  validateHumanBenchmarkDefinitions,
  type HumanRaterIdentity,
  type HumanSubjectIdentity
} from "../../packages/benchmark/src/index.js";

const registry = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
const metricRegistry = new MetricRegistry(CANONICAL_METRIC_REGISTRY, registry);
const evaluatorRegistry = new EvaluatorRegistry(
  CANONICAL_EVALUATOR_REGISTRY,
  registry,
  metricRegistry
);

function system(): HumanBenchmarkSystem {
  return new HumanBenchmarkSystem(
    HUMAN_BENCHMARK_CONSTRUCTS,
    HUMAN_BENCHMARK_ITEMS,
    HIB_PILOT_STUDY_PROTOCOL,
    HISTORICAL_HIB_ITEM_AUDIT,
    registry
  );
}

function workflow(
  itemId = "hib_context_reference_resolution",
  status: "SUBMITTED" | "SKIPPED" | "ABSTAINED" = "SUBMITTED"
) {
  const lab = system();
  const item = HUMAN_BENCHMARK_ITEMS.find((entry) => entry.itemId === itemId)!;
  const session = lab.createSession({
    sessionId: "session-alpha",
    subject: { subjectId: "subject-pseudonym-17" },
    startedAt: "2026-09-13T10:00:00Z",
    randomizationSeed: 7301
  });
  const presentation = lab.createPresentation({
    presentationId: `presentation-${itemId}`,
    session,
    itemId,
    itemVersion: item.itemVersion,
    presentedAt: "2026-09-13T10:01:00Z"
  });
  const response = lab.submitResponse({
    responseId: `response-${itemId}-${status.toLowerCase()}`,
    session,
    presentation,
    status,
    ...(status === "SUBMITTED"
      ? { response: itemId.includes("context") ? "C" : "Bounded participant response." }
      : { reason: `Participant ${status.toLowerCase()}.` }),
    provenanceReference: "session-record:local-synthetic-test",
    submittedAt: "2026-09-13T10:02:00Z"
  });
  return { lab, item, session, presentation, response };
}

describe("S-07 role and scientific invariants", () => {
  it("INVARIANT 1: Human-as-Subject is not Human-as-Judge", () => {
    expect(HIB_PILOT_STUDY_PROTOCOL.role).toBe("HUMAN_AS_SUBJECT");
    expect(HIB_PILOT_STUDY_PROTOCOL.role).not.toBe("HUMAN_AS_JUDGE");
  });

  it("INVARIANT 2: Human-as-Subject is not Human-AI Comparison", () => {
    const benchmark = registry.get(HIB_PILOT_STUDY_PROTOCOL.benchmarkIdentity)!;
    expect(benchmark.humanRoles.map((entry) => entry.role)).toEqual(["HUMAN_AS_SUBJECT"]);
  });

  it("INVARIANT 3: HumanSubjectIdentity is distinct from HumanRaterIdentity", () => {
    const subject: HumanSubjectIdentity = { subjectId: "subject-1" };
    const rater: HumanRaterIdentity = { raterId: "rater-1" };
    expect(subject).not.toEqual(rater);
  });

  it("INVARIANT 4: a historical item is not automatically a canonical current item", () => {
    expect(HISTORICAL_HIB_ITEM_AUDIT[0]!.canonicalCandidateId).toBeNull();
    expect(HUMAN_BENCHMARK_ITEMS.some((item) => item.itemId === "HIB-001")).toBe(false);
  });

  it("INVARIANT 5: the historical count is not a current requirement", () => {
    expect(HISTORICAL_HIB_ITEM_AUDIT).toHaveLength(70);
    expect(HUMAN_BENCHMARK_ITEMS).toHaveLength(4);
  });

  it("INVARIANT 6: the same task does not establish Human-AI comparability", () => {
    const benchmark = registry.get(HIB_PILOT_STUDY_PROTOCOL.benchmarkIdentity)!;
    expect(benchmark.humanRoles.some((entry) => entry.role === "HUMAN_AI_COMPARISON")).toBe(false);
  });

  it("INVARIANT 7: no numeric score is interpreted across humans and AI", () => {
    expect(
      HUMAN_BENCHMARK_ITEMS.every((item) => !item.scoringProtocolReference.includes("human-ai"))
    ).toBe(true);
    expect(
      workflow().lab.scoreObjectiveResponse(workflow().response, evaluatorRegistry)?.numericScore
    ).toBe("NOT_EMITTED");
  });

  it("INVARIANT 8: skipped is not incorrect by default", () => {
    const { lab, response } = workflow("hib_context_reference_resolution", "SKIPPED");
    expect(lab.scoreObjectiveResponse(response, evaluatorRegistry)).toBeUndefined();
  });

  it("INVARIANT 9: abstained is not incorrect by default", () => {
    const { lab, response } = workflow("hib_context_reference_resolution", "ABSTAINED");
    expect(lab.scoreObjectiveResponse(response, evaluatorRegistry)).toBeUndefined();
  });

  it("INVARIANT 10: missing is not zero", () => {
    expect(workflow("hib_context_reference_resolution", "SKIPPED").response).not.toHaveProperty(
      "response"
    );
  });

  it("INVARIANT 11: translation does not establish measurement equivalence", () => {
    expect(HUMAN_BENCHMARK_ITEMS.every((item) => item.adaptation.status === "ORIGINAL")).toBe(true);
    expect(
      HUMAN_BENCHMARK_CONSTRUCTS.every((construct) => construct.aiSuitability === "UNASSESSED")
    ).toBe(true);
  });

  it("INVARIANT 12: response time is not intelligence", () => {
    expect(HIB_PILOT_STUDY_PROTOCOL.timePolicy).toBe("RECORDED_NOT_SCORED");
  });

  it("INVARIANT 13: human consensus is not truth", () => {
    expect(HIB_PILOT_STUDY_PROTOCOL.scientificAuthority).toBe("NONE");
    expect(workflow().response.groundTruthClaim).toBe("NONE");
  });

  it("INVARIANT 14: tests do not create scientific validation", () => {
    expect(registry.get(HIB_PILOT_STUDY_PROTOCOL.benchmarkIdentity)?.scientificMaturity).toBe(
      "CALIBRATION_REQUIRED"
    );
  });

  it("INVARIANT 15: research candidate is not a validated benchmark", () => {
    const benchmark = registry.get(HIB_PILOT_STUDY_PROTOCOL.benchmarkIdentity)!;
    expect(benchmark.lifecycleState).toBe("DRAFT");
    expect(benchmark.corePromotion).toBe("NOT_PROMOTED");
  });
});

describe("S-07 historical provenance and item audit", () => {
  it("accounts for every historical source item in contiguous order", () => {
    expect(HISTORICAL_HIB_ITEM_AUDIT.map((entry) => entry.historicalItemId)).toEqual(
      Array.from({ length: 70 }, (_, index) => `HIB-${String(index + 1).padStart(3, "0")}`)
    );
  });

  it("preserves source, page, status, rationale, and disposition for every item", () => {
    for (const item of HISTORICAL_HIB_ITEM_AUDIT) {
      expect(item.sourceReference).toBe("Docs/SemantIQ-Benchmarks.pdf");
      expect(item.sourcePage).toBeGreaterThanOrEqual(199);
      expect(item.sourcePage).toBeLessThanOrEqual(203);
      expect(item.scientificStatus).toBe("HISTORICAL_UNVALIDATED");
      expect(item.rationale.length).toBeGreaterThan(20);
      expect(item.disposition.length).toBeGreaterThan(0);
    }
  });

  it("records the reviewed disposition totals without silent deletion", () => {
    const count = (value: string) =>
      HISTORICAL_HIB_ITEM_AUDIT.filter((entry) => entry.disposition === value).length;
    expect({
      retained: count("HISTORICAL_RETAIN"),
      revised: count("HISTORICAL_REVISE"),
      merge: count("HISTORICAL_MERGE_CANDIDATE"),
      rejected: count("HISTORICAL_REJECT")
    }).toEqual({ retained: 15, revised: 40, merge: 8, rejected: 7 });
  });

  it("keeps rejected items auditable and direct migrations sparse", () => {
    expect(
      HISTORICAL_HIB_ITEM_AUDIT.filter((entry) => entry.disposition === "HISTORICAL_REJECT")
    ).toHaveLength(7);
    expect(
      HISTORICAL_HIB_ITEM_AUDIT.filter((entry) => entry.canonicalCandidateId !== null)
    ).toHaveLength(4);
  });

  it("rejects a silent historical omission", () => {
    expect(
      validateHumanBenchmarkDefinitions(
        HUMAN_BENCHMARK_CONSTRUCTS,
        HUMAN_BENCHMARK_ITEMS,
        HIB_PILOT_STUDY_PROTOCOL,
        HISTORICAL_HIB_ITEM_AUDIT.slice(1),
        registry
      ).map((entry) => entry.code)
    ).toContain("HISTORICAL_ITEM_COUNT");
  });
});

describe("S-07 privacy, presentation, and scoring", () => {
  it("uses pseudonymous subject identity without PII fields", () => {
    expect(workflow().session.subject).toEqual({ subjectId: "subject-pseudonym-17" });
  });

  it.each([
    ["realName", "Person Name", "DIRECT_IDENTITY_FORBIDDEN"],
    ["email", "person@example.test", "DIRECT_IDENTITY_FORBIDDEN"],
    ["raterId", "rater-confusion", "DIRECT_IDENTITY_FORBIDDEN"],
    ["religion", "not-collected", "DIRECT_IDENTITY_FORBIDDEN"],
    ["token", "redacted-test-value", "DIRECT_IDENTITY_FORBIDDEN"],
    ["note", "C:\\Users\\private-person\\artifact.txt", "PRIVATE_PATH_FORBIDDEN"]
  ])("rejects private subject material in %s", (key, value, code) => {
    const lab = system();
    expect(() =>
      lab.createSession({
        sessionId: "private",
        subject: { subjectId: "pseudonym", [key]: value } as any,
        startedAt: "2026-09-13T00:00:00Z",
        randomizationSeed: 1
      })
    ).toThrowError(
      expect.objectContaining({
        violations: expect.arrayContaining([expect.objectContaining({ code })])
      })
    );
  });

  it("reproduces item order and records both canonical and presented order", () => {
    const first = workflow().session;
    const second = workflow().session;
    expect(first.randomization.presentedOrder).toEqual(second.randomization.presentedOrder);
    expect(first.randomization.canonicalInputOrder).toEqual(
      HIB_PILOT_STUDY_PROTOCOL.itemIdentities.map((item) => `${item.itemId}@${item.itemVersion}`)
    );
  });

  it("preserves the exact item version, instructions, stimulus, language, and tool policy", () => {
    const { item, presentation } = workflow();
    expect(presentation.itemIdentity).toEqual({
      itemId: item.itemId,
      itemVersion: item.itemVersion
    });
    expect(presentation.instructions).toEqual(item.instructions);
    expect(presentation.stimulusReferences).toEqual(item.stimulusReferences);
    expect(presentation.language).toBe("en");
    expect(presentation.toolPolicy).toBe("NO_EXTERNAL_TOOLS");
    expect(presentation.transformations).toEqual([]);
  });

  it("binds a response to the exact presentation and subject", () => {
    const { response, presentation, session } = workflow();
    expect(response.presentationDigest).toBe(presentation.presentationDigest);
    expect(response.subject).toEqual(session.subject);
    expect(response.benchmarkIdentity).toEqual(HIB_PILOT_STUDY_PROTOCOL.benchmarkIdentity);
  });

  it("scores an objective item only through its declared categorical rule", () => {
    const { lab, response } = workflow();
    expect(lab.scoreObjectiveResponse(response, evaluatorRegistry)).toMatchObject({
      kind: "CATEGORICAL_CORRECTNESS",
      category: "CORRECT",
      ruleReference: "rule:exact-normalized-option-c",
      numericScore: "NOT_EMITTED",
      scientificAuthority: "NONE",
      execution: {
        evaluatorIdentity: { evaluatorId: "hib_objective_rule", evaluatorVersion: "0.1.0" },
        status: "SUCCEEDED",
        output: { kind: "CATEGORICAL_DECISION", category: "CORRECT" }
      }
    });
  });

  it("routes an open response to the S-06 Human Judge and S-04 evaluator lineage", () => {
    const { lab, response } = workflow("hib_uncertainty_evidence_boundary");
    const handoff = lab.createHumanJudgeTarget(response);
    expect(handoff.requiredSystem).toBe("S06_HUMAN_RATER_SYSTEM");
    expect(handoff.requiredEvaluatorMechanism).toBe("HUMAN_JUDGE");
    expect(handoff.target.benchmarkBinding?.constructId).toBe("uncertainty_evidence_boundary");
    expect(
      CANONICAL_EVALUATOR_REGISTRY.definitions.some(
        (entry) => entry.identity.evaluatorId === HUMAN_EVALUATOR_IDENTITY.evaluatorId
      )
    ).toBe(true);
  });

  it("prevents objective scoring from becoming Human Judge scoring", () => {
    const { lab, response } = workflow();
    expect(() => lab.createHumanJudgeTarget(response)).toThrowError(
      HumanBenchmarkRecordValidationError
    );
  });

  it("produces no fabricated result for unsupported historical scoring", () => {
    expect(
      HISTORICAL_HIB_ITEM_AUDIT.every(
        (entry) => entry.scoringMode === "UNSUPPORTED" && entry.metricAvailability === "NONE"
      )
    ).toBe(true);
  });
});

describe("S-07 negative definition and record checks", () => {
  it("rejects unknown benchmark, unknown construct, and unknown item/version", () => {
    const unknownProtocol = {
      ...HIB_PILOT_STUDY_PROTOCOL,
      benchmarkIdentity: { benchmarkId: "unknown", benchmarkVersion: "0.1.0" }
    };
    expect(
      validateHumanBenchmarkDefinitions(
        HUMAN_BENCHMARK_CONSTRUCTS,
        HUMAN_BENCHMARK_ITEMS,
        unknownProtocol,
        HISTORICAL_HIB_ITEM_AUDIT,
        registry
      ).map((entry) => entry.code)
    ).toContain("UNKNOWN_BENCHMARK");
    const invalidItem = { ...HUMAN_BENCHMARK_ITEMS[0]!, constructId: "unknown" };
    expect(
      validateHumanBenchmarkDefinitions(
        HUMAN_BENCHMARK_CONSTRUCTS,
        [invalidItem, ...HUMAN_BENCHMARK_ITEMS.slice(1)],
        HIB_PILOT_STUDY_PROTOCOL,
        HISTORICAL_HIB_ITEM_AUDIT,
        registry
      ).map((entry) => entry.code)
    ).toContain("UNKNOWN_CONSTRUCT");
    const { lab, session } = workflow();
    expect(() =>
      lab.createPresentation({
        presentationId: "unknown",
        session,
        itemId: "unknown",
        itemVersion: "9.9.9",
        presentedAt: "2026-09-13T00:00:00Z"
      })
    ).toThrowError(HumanBenchmarkRecordValidationError);
  });

  it("rejects invalid language, tool policy, and missing provenance", () => {
    const invalid = {
      ...HUMAN_BENCHMARK_ITEMS[0]!,
      language: "",
      toolPolicy: "ANYTHING",
      provenanceReferences: []
    } as any;
    const codes = validateHumanBenchmarkDefinitions(
      HUMAN_BENCHMARK_CONSTRUCTS,
      [invalid, ...HUMAN_BENCHMARK_ITEMS.slice(1)],
      HIB_PILOT_STUDY_PROTOCOL,
      HISTORICAL_HIB_ITEM_AUDIT,
      registry
    ).map((entry) => entry.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "INVALID_ITEM_LANGUAGE",
        "INVALID_TOOL_POLICY",
        "MISSING_ITEM_PROVENANCE"
      ])
    );
  });

  it("rejects untracked translation and item-set substitution", () => {
    const translated = {
      ...HUMAN_BENCHMARK_ITEMS[0]!,
      adaptation: {
        status: "TRANSLATED_OR_ADAPTED",
        sourceItemId: "",
        sourceItemVersion: "0.1.0",
        sourceLanguage: "",
        provenanceReference: ""
      }
    } as any;
    expect(
      validateHumanBenchmarkDefinitions(
        HUMAN_BENCHMARK_CONSTRUCTS,
        [translated, ...HUMAN_BENCHMARK_ITEMS.slice(1)],
        HIB_PILOT_STUDY_PROTOCOL,
        HISTORICAL_HIB_ITEM_AUDIT,
        registry
      ).map((entry) => entry.code)
    ).toContain("UNTRACKED_TRANSLATION");
    expect(
      validateHumanBenchmarkDefinitions(
        HUMAN_BENCHMARK_CONSTRUCTS,
        HUMAN_BENCHMARK_ITEMS,
        {
          ...HIB_PILOT_STUDY_PROTOCOL,
          itemIdentities: HIB_PILOT_STUDY_PROTOCOL.itemIdentities.slice(1)
        },
        HISTORICAL_HIB_ITEM_AUDIT,
        registry
      ).map((entry) => entry.code)
    ).toContain("ITEM_SET_MISMATCH");
  });

  it("rejects presentation and subject substitution", () => {
    const { lab, session, presentation } = workflow();
    expect(() =>
      lab.submitResponse({
        responseId: "substituted",
        session: { ...session, subject: { subjectId: "other" } },
        presentation,
        status: "SUBMITTED",
        response: "C",
        provenanceReference: "test",
        submittedAt: "2026-09-13T00:00:00Z"
      })
    ).toThrowError(HumanBenchmarkRecordValidationError);
  });

  it("rejects unsupported scoring and distinguishes every non-submission status", () => {
    const { lab, response } = workflow("hib_uncertainty_evidence_boundary");
    expect(() => lab.scoreObjectiveResponse(response, evaluatorRegistry)).toThrowError(
      HumanBenchmarkRecordValidationError
    );
    expect(["SKIPPED", "ABSTAINED", "INCOMPLETE", "INVALID", "SYSTEM_FAILURE"]).toHaveLength(5);
  });
});
