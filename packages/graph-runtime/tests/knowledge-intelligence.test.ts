import { describe, expect, it } from "vitest";
import { createKnowledgeObjectAggregate } from "../../core/src/index.js";
import { ExplainableSemantiqRuntime } from "../../semantiq/src/index.js";
import { LocalQuestionIntelligenceEngine } from "../../question-intelligence/src/index.js";
import {
  LocalKnowledgeGraphRuntime,
  createKnowledgeEdge,
  type KnowledgeNode
} from "../src/index.js";

const node = (id: string, type: KnowledgeNode["type"], title: string): KnowledgeNode => ({
  id,
  type,
  object: createKnowledgeObjectAggregate(id, "workspace:semantic", "identity:owner", type, title, {
    summary: title
  }),
  labels: [type, "semantic"],
  properties: { title },
  federationRefs: [],
  version: "1.0.0",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

describe("knowledge intelligence runtime", () => {
  it("creates nodes, edges, traversal results, timeline entries, and events", async () => {
    const runtime = new LocalKnowledgeGraphRuntime();
    await runtime.createNode(
      node("node:question", "question", "How can evidence improve learning?")
    );
    await runtime.createNode(
      node("node:evidence", "evidence", "Evidence improves learning through feedback.")
    );
    await runtime.createEdge(
      createKnowledgeEdge("edge:answers", "node:evidence", "node:question", "answers", [
        "evidence:1"
      ])
    );

    const neighborhood = await runtime.neighborhood("node:question", 1);
    const path = await runtime.shortestPath("node:question", "node:evidence");
    const timeline = await runtime.getTimeline("node:evidence");

    expect(neighborhood.map((item) => item.id)).toContain("node:evidence");
    expect(path).toEqual(["node:question", "node:evidence"]);
    expect(timeline.length).toBeGreaterThan(0);
    expect(runtime.events().map((event) => event.type)).toContain("GraphUpdated");
  });

  it("searches and recommends through semantic relationships", async () => {
    const runtime = new LocalKnowledgeGraphRuntime();
    await runtime.createNode(
      node("node:question", "question", "What makes a reusable knowledge graph?")
    );
    await runtime.createNode(
      node("node:research", "research", "Reusable graph research with explainable relations.")
    );
    await runtime.createEdge(
      createKnowledgeEdge("edge:references", "node:question", "node:research", "references", [
        "paper:1"
      ])
    );

    const search = await runtime.searchKnowledge("reusable graph");
    const recommendations = await runtime.recommendKnowledge("node:question");
    const comparison = await runtime.compareKnowledge("node:question", "node:research");

    expect(search[0]?.nodeId).toBe("node:question");
    expect(recommendations[0]?.targetId).toBe("node:research");
    expect(comparison.overlap).toBeGreaterThan(0);
  });

  it("runs explainable Semantiq and question intelligence", async () => {
    const semantiq = new ExplainableSemantiqRuntime();
    const questionIntelligence = new LocalQuestionIntelligenceEngine();
    const question = "How can transparent evidence improve scientific education?";

    const analysis = await questionIntelligence.analyzeQuestion(question);
    const result = await semantiq.runSemantiq(
      {
        id: "subject:question",
        kind: "question",
        version: "1.0.0",
        title: question,
        content: question,
        contextIds: [],
        evidenceIds: ["evidence:1"]
      },
      { id: "profile:default", version: "1.0.0", name: "Default", weights: {} }
    );
    const explanation = await semantiq.explainScore(result.report.id);

    expect(analysis.semantiqPreview.finalBenchmark).toBe(false);
    expect(result.report.scores.map((score) => score.dimensionId)).toContain("evidence");
    expect(explanation).toContain("evidence");
  });
});
