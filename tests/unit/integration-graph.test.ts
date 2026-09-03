import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type NodeLayer = "central" | "primary" | "supporting" | "evidence-gap" | "historical";
type ImplementationStatus =
  | "VERIFIED_IMPLEMENTATION"
  | "IMPLEMENTED_PARTIAL"
  | "CONTRACT_ONLY"
  | "SIMULATED"
  | "DOCS_ONLY"
  | "SCAFFOLD"
  | "HISTORICAL";

interface GraphNode {
  id: string;
  label: string;
  kind: string;
  layer: NodeLayer;
}

interface GraphEdge {
  source: string;
  target: string;
  relation: string;
  domain: string;
  implementationStatus: ImplementationStatus;
  depth: "DEEP" | "MODERATE" | "SHALLOW";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  scope: string;
  implementationEvidence: string[];
  testEvidence: string[];
  documentationEvidence: string[];
  missingEvidence: string[];
  externalUserRelevance: "HIGH" | "MEDIUM" | "LOW";
  contributionOpportunity: string;
  outreachReadiness:
    | "READY_FOR_TECHNICAL_ENGAGEMENT"
    | "LATER_NEEDS_MORE_EVIDENCE"
    | "DEPENDENCY_ONLY_NO_OUTREACH"
    | "NOT_CURRENTLY_APPROPRIATE";
  notes: string;
}

interface IntegrationGraph {
  graphVersion: string;
  generatedFrom: { repository: string; revision: string };
  evidenceBoundary: { externalReplicationStatus: string; packagePublicationStatus: string };
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const graphPath = "Docs/ecosystem/integration-graph.json";
const graph = JSON.parse(readFileSync(graphPath, "utf8")) as IntegrationGraph;

const statuses = new Set<ImplementationStatus>([
  "VERIFIED_IMPLEMENTATION",
  "IMPLEMENTED_PARTIAL",
  "CONTRACT_ONLY",
  "SIMULATED",
  "DOCS_ONLY",
  "SCAFFOLD",
  "HISTORICAL"
]);
const relations = new Set([
  "runs-on",
  "stores-in",
  "executes-through",
  "exposes",
  "provides-sdk-for",
  "serializes-as",
  "validates-with",
  "imports-from",
  "exports-to",
  "normalizes",
  "exchanges-evidence-through",
  "reproduces-with",
  "depends-on",
  "builds-with",
  "configured-for",
  "documents",
  "historically-referenced"
]);
const outreachStates = new Set([
  "READY_FOR_TECHNICAL_ENGAGEMENT",
  "LATER_NEEDS_MORE_EVIDENCE",
  "DEPENDENCY_ONLY_NO_OUTREACH",
  "NOT_CURRENTLY_APPROPRIATE"
]);

describe("SemantIQ Integration Graph v0.1", () => {
  it("uses stable provenance and canonical vocabularies", () => {
    expect(graph.graphVersion).toBe("0.1");
    expect(graph.generatedFrom).toEqual({
      repository: "https://github.com/Logorythmus-org/Semantiq",
      revision: "302927cfd071285bbbe38961a08a0c58d77aa923"
    });
    expect(graph.evidenceBoundary.externalReplicationStatus).toBe("NOT_YET_VERIFIED");
    expect(graph.evidenceBoundary.packagePublicationStatus).toBe("UNPUBLISHED");
  });

  it("keeps every edge structurally valid and evidence paths reviewable", () => {
    const nodeIds = new Set(graph.nodes.map((node) => node.id));
    expect(nodeIds.size).toBe(graph.nodes.length);

    for (const edge of graph.edges) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
      expect(relations.has(edge.relation)).toBe(true);
      expect(statuses.has(edge.implementationStatus)).toBe(true);
      expect(["DEEP", "MODERATE", "SHALLOW"]).toContain(edge.depth);
      expect(["HIGH", "MEDIUM", "LOW"]).toContain(edge.confidence);
      expect(["HIGH", "MEDIUM", "LOW"]).toContain(edge.externalUserRelevance);
      expect(outreachStates.has(edge.outreachReadiness)).toBe(true);
      expect(edge.scope.trim()).not.toBe("");
      expect(edge.contributionOpportunity.trim()).not.toBe("");
      expect(edge.notes.trim()).not.toBe("");
      expect(Array.isArray(edge.missingEvidence)).toBe(true);
      expect(
        edge.implementationEvidence.length +
          edge.testEvidence.length +
          edge.documentationEvidence.length
      ).toBeGreaterThan(0);

      for (const evidencePath of [
        ...edge.implementationEvidence,
        ...edge.testEvidence,
        ...edge.documentationEvidence
      ]) {
        expect(existsSync(evidencePath), `${edge.target}: missing ${evidencePath}`).toBe(true);
      }
    }
  });

  it("prevents evidence-gap, simulated, and historical promotion", () => {
    const nodes = new Map(graph.nodes.map((node) => [node.id, node]));

    for (const edge of graph.edges) {
      const target = nodes.get(edge.target)!;
      if (
        ["DOCS_ONLY", "SIMULATED", "SCAFFOLD", "HISTORICAL"].includes(edge.implementationStatus)
      ) {
        expect(edge.implementationStatus).not.toBe("VERIFIED_IMPLEMENTATION");
      }
      if (target.layer === "historical") {
        expect(edge.implementationStatus).toBe("HISTORICAL");
      }
      if (target.layer === "evidence-gap") {
        expect(edge.implementationStatus).not.toBe("VERIFIED_IMPLEMENTATION");
      }
    }

    expect(graph.edges.find((edge) => edge.target === "e2b")?.implementationStatus).toBe(
      "SIMULATED"
    );
    for (const provider of ["openai", "anthropic", "google-genai"]) {
      expect(graph.edges.find((edge) => edge.target === provider)?.implementationStatus).toBe(
        "DOCS_ONLY"
      );
    }
  });

  it("preserves replication and publication truth boundaries", () => {
    const document = readFileSync("Docs/ecosystem/INTEGRATION_GRAPH.md", "utf8");
    const replication = graph.edges.find((edge) => edge.target === "replication-interface")!;
    const npm = graph.edges.find((edge) => edge.target === "npm")!;
    const pypi = graph.edges.find((edge) => edge.target === "pypi")!;

    expect(replication.notes).toContain("not VERIFIED_EXTERNAL_REPLICATION");
    expect(document).toContain("is not automatically");
    expect(npm.notes).toContain("not published");
    expect(pypi.notes).toContain("not published");
    expect([npm.implementationStatus, pypi.implementationStatus]).toEqual(["SCAFFOLD", "SCAFFOLD"]);
  });

  it("is linked from concise public navigation surfaces", () => {
    for (const path of ["README.md", "Docs/DOCUMENTATION_INDEX.md", "Docs/research/README.md"]) {
      expect(readFileSync(path, "utf8")).toContain("INTEGRATION_GRAPH.md");
    }
  });
});
