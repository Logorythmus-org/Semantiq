import { describe, expect, it } from "vitest";
import {
  LocalSprint2Runtime,
  sprint2ApiContracts,
  sprint2PromptRegistry,
  sprint2Screens
} from "../src/index.js";

describe("Sprint 2 intelligence and research runtime", () => {
  it("runs the critical local question-to-research journey end to end", async () => {
    const runtime = new LocalSprint2Runtime();
    const result = await runtime.runCriticalJourney({
      identityId: "identity:sprint2",
      displayName: "Sprint Two",
      workspaceName: "Research Lab",
      rawQuestion: "How can AI improve learning in the future?",
      evidenceTitle: "Local evidence seed",
      evidenceSource: "https://example.test/evidence"
    });

    expect(result.analysis.intents.map((intent) => intent.type)).toContain("Learning");
    expect(result.analysis.ambiguities.length).toBeGreaterThan(0);
    expect(result.analysis.assumptions.length).toBeGreaterThan(0);
    expect(result.analysis.refinements).toHaveLength(8);
    expect(result.approval.state).toBe("Accepted");
    expect(result.question.text).toContain("evidence");
    expect(result.semantiqReport.scores).toHaveLength(12);
    expect(result.semantiqReport.scores.every((score) => score.explanation.length > 0)).toBe(true);
    expect(result.researchProject.status).toBe("Planned");
    expect(result.evidence.provenance).toBe("identity:sprint2");
    expect(result.evidenceQuality.overallQuality).toBeGreaterThan(0);
    expect(result.hypothesis.status).toBe("Proposed");
    expect(result.tasks).toHaveLength(8);
    expect(result.dashboard.evidenceCount).toBe(1);
    expect(result.dashboard.hypotheses).toHaveLength(1);
    expect(result.dashboard.tasks).toHaveLength(8);
    expect(result.dashboard.knowledgeGraph.nodes).toBeGreaterThan(1);
    expect(result.exportPackage.originalQuestion).toBe(
      "How can AI improve learning in the future?"
    );
    expect(result.exportPackage.approvedRefinedQuestion).toContain("evidence");
    expect(result.exportPackage.promptAndEvaluatorVersions).toContain("semantiq-question.v1");
  });

  it("emits the required observable Sprint 2 events", async () => {
    const runtime = new LocalSprint2Runtime();
    const result = await runtime.runCriticalJourney({
      identityId: "identity:events",
      displayName: "Event User",
      workspaceName: "Event Workspace",
      rawQuestion: "What evidence can improve community learning?",
      evidenceTitle: "Evidence seed",
      evidenceSource: "local://evidence"
    });
    const eventTypes = result.events.map((event) => event.type);

    for (const required of [
      "QuestionAnalysisRequested",
      "QuestionAnalysisCompleted",
      "QuestionIntentDetected",
      "QuestionAmbiguityDetected",
      "QuestionAssumptionDetected",
      "QuestionRefinementSuggested",
      "QuestionRefinementApproved",
      "QuestionTagsSuggested",
      "QuestionRelationSuggested",
      "QuestionDuplicateCandidateFound",
      "SemantiqEvaluationStarted",
      "SemantiqEvaluationCompleted",
      "ResearchProjectDrafted",
      "ResearchProjectCreated",
      "EvidenceAdded",
      "EvidenceEvaluated",
      "HypothesisCreated",
      "ResearchTaskCreated",
      "ResearchGraphUpdated"
    ] as const) {
      expect(eventTypes).toContain(required);
    }
    expect(
      result.events.every(
        (event) =>
          event.version === 1 &&
          event.actorId &&
          event.workspaceId &&
          event.correlationId &&
          event.audit.localFirst === true
      )
    ).toBe(true);
  });

  it("supports rejection audit, Semantiq history, comparison, explanation, search, and contracts", async () => {
    const runtime = new LocalSprint2Runtime();
    const result = await runtime.runCriticalJourney({
      identityId: "identity:contracts",
      displayName: "Contract User",
      workspaceName: "Contract Workspace",
      rawQuestion: "How should evidence guide research tasks?",
      evidenceTitle: "Task evidence",
      evidenceSource: "local://task-evidence"
    });
    const rejected = await runtime.rejectSuggestion(
      result.workspaceId,
      result.identityId,
      result.analysis.refinements[0]!.id,
      "Need a research-ready version instead."
    );
    const secondReport = await runtime.evaluateQuestion(
      result.workspaceId,
      result.identityId,
      result.question,
      result.analysis
    );
    const comparison = runtime.compareEvaluations(result.semantiqReport.id, secondReport.id);
    const search = runtime.search(result.workspaceId, "evidence research");

    expect(rejected.state).toBe("Rejected");
    expect(runtime.getEvaluationHistory(result.question.id).length).toBe(2);
    expect(comparison.explanation).toContain("Compared");
    expect(runtime.explainScore(secondReport.id)).toContain("clarity");
    expect(search.map((item) => item.type)).toEqual(
      expect.arrayContaining([
        "research-project",
        "evidence",
        "hypothesis",
        "semantiq-report",
        "semantic-tag"
      ])
    );
    expect(runtime.providerContracts()[0]?.id).toBe("deterministic-local-rules");
    expect(runtime.promptRegistry()).toHaveLength(10);
    expect(sprint2PromptRegistry.map((prompt) => prompt.id)).toContain("question-refinement.v1");
    expect(sprint2Screens).toContain("Research Dashboard");
    expect(sprint2ApiContracts.research).toContain("getResearchDashboard()");
  });
});
