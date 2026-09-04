import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const artifactPath = "Docs/ecosystem/upstream-engagement-priorities.json";
const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as {
  version: string;
  generatedFrom: { repository: string; revision: string };
  principles: {
    giveFirst: boolean;
    noOutreachPerformed: boolean;
    externalEngagementAuthorized: boolean;
  };
  candidates: Candidate[];
  doNotContactYet: Array<{ target: string; reason: string }>;
};
const graph = JSON.parse(readFileSync("Docs/ecosystem/integration-graph.json", "utf8")) as {
  nodes: Array<{ id: string }>;
  edges: Array<{ target: string; implementationStatus: string }>;
};

const candidateTypes = new Set([
  "UPSTREAM_TECHNICAL_CONTRIBUTION",
  "INTEROPERABILITY_VALIDATION",
  "EXTERNAL_CONSUMER_VALIDATION",
  "RESEARCH_REPRODUCTION",
  "FORMAT_CONFORMANCE",
  "INTERNAL_EVIDENCE_FIRST",
  "DEPENDENCY_ONLY",
  "NOT_APPROPRIATE"
]);
const readinessStates = new Set([
  "READY_FOR_TECHNICAL_ENGAGEMENT",
  "NEAR_READY_ONE_EVIDENCE_GAP",
  "LATER_NEEDS_MORE_EVIDENCE",
  "INTERNAL_EVIDENCE_FIRST",
  "DEPENDENCY_ONLY_NO_OUTREACH",
  "NOT_CURRENTLY_APPROPRIATE"
]);
const scoreKeys = [
  "strategicRelevance",
  "implementationDepth",
  "evidenceQuality",
  "externalUserRelevance",
  "communityRelevance",
  "contributionOpportunity",
  "naturalnessOfEngagement",
  "giveFirstValue",
  "maintainerBurdenSuitability",
  "claimSafety",
  "promotionalRisk",
  "evidenceGapSeverity"
] as const;

interface Candidate {
  target: string;
  graphNode: string | null;
  candidateType: string;
  readiness: string;
  scores: Record<(typeof scoreKeys)[number], number>;
  engagementScore: number;
  existingEvidence: string[];
  missingEvidence: string[];
  giveFirstArtifact: string;
  upstreamBenefit: string;
  nextInternalAction: string;
  allowedNextAction: string;
  forbiddenClaims: string[];
}

describe("upstream engagement priority map", () => {
  it("is deterministic, unique, and uses canonical vocabularies", () => {
    expect(artifact.version).toBe("0.1");
    expect(artifact.generatedFrom).toEqual({
      repository: "Logorythmus-org/Semantiq",
      revision: "a8fd8d6c11ae3469cc0f095d6cbaa10534b1f51d"
    });
    expect(artifact.candidates).toHaveLength(30);
    expect(new Set(artifact.candidates.map(({ target }) => target)).size).toBe(30);

    for (const candidate of artifact.candidates) {
      expect(candidateTypes.has(candidate.candidateType), candidate.target).toBe(true);
      expect(readinessStates.has(candidate.readiness), candidate.target).toBe(true);
    }
  });

  it("keeps every score bounded and calculates the published score", () => {
    for (const candidate of artifact.candidates) {
      for (const key of scoreKeys) {
        expect(Number.isInteger(candidate.scores[key]), `${candidate.target}: ${key}`).toBe(true);
        expect(candidate.scores[key]).toBeGreaterThanOrEqual(0);
        expect(candidate.scores[key]).toBeLessThanOrEqual(5);
      }
      const { promotionalRisk, evidenceGapSeverity, ...positiveScores } = candidate.scores;
      const expected =
        Object.values(positiveScores).reduce((total, value) => total + value, 0) -
        1.5 * promotionalRisk -
        1.5 * evidenceGapSeverity;
      expect(candidate.engagementScore, candidate.target).toBe(expected);
    }
  });

  it("references real graph nodes and reviewable repository evidence", () => {
    const nodeIds = new Set(graph.nodes.map(({ id }) => id));
    for (const candidate of artifact.candidates) {
      if (candidate.graphNode !== null) {
        expect(nodeIds.has(candidate.graphNode), candidate.target).toBe(true);
      }
      for (const path of candidate.existingEvidence) {
        expect(existsSync(path), `${candidate.target}: missing ${path}`).toBe(true);
      }
    }
  });

  it("enforces readiness and no-outreach gates", () => {
    const ready = artifact.candidates.filter(
      ({ readiness }) => readiness === "READY_FOR_TECHNICAL_ENGAGEMENT"
    );
    for (const candidate of ready) {
      expect(candidate.existingEvidence.length).toBeGreaterThan(0);
      expect(candidate.giveFirstArtifact.trim()).not.toBe("");
      expect(candidate.upstreamBenefit.trim()).not.toBe("");
      expect(candidate.allowedNextAction).not.toBe("NONE");
    }
    for (const candidate of artifact.candidates.filter(
      ({ readiness }) => readiness === "DEPENDENCY_ONLY_NO_OUTREACH"
    )) {
      expect(candidate.allowedNextAction, candidate.target).toBe("NONE");
    }
    expect(ready).toHaveLength(0);
    expect(artifact.principles).toEqual({
      giveFirst: true,
      noOutreachPerformed: true,
      externalEngagementAuthorized: false
    });
  });

  it("does not make no-contact targets ready or turn prohibited claims into findings", () => {
    const readyTargets = new Set(
      artifact.candidates
        .filter(({ readiness }) => readiness === "READY_FOR_TECHNICAL_ENGAGEMENT")
        .map(({ target }) => target)
    );
    for (const entry of artifact.doNotContactYet) {
      expect(readyTargets.has(entry.target), entry.target).toBe(false);
      expect(entry.reason.trim()).not.toBe("");
    }

    const assertedText = artifact.candidates
      .flatMap(({ giveFirstArtifact, upstreamBenefit, nextInternalAction }) => [
        giveFirstArtifact,
        upstreamBenefit,
        nextInternalAction
      ])
      .join("\n");
    expect(assertedText).not.toMatch(
      /SemantIQ (is|has|received) (an? )?(partner|partnership|adopted|adoption|endorsed|endorsement)/i
    );
  });

  it("preserves Prompt-12 provider and simulation boundaries", () => {
    const edgeStatus = new Map(
      graph.edges.map(({ target, implementationStatus }) => [target, implementationStatus])
    );
    const candidates = new Map(
      artifact.candidates.map((candidate) => [candidate.graphNode, candidate])
    );
    for (const provider of ["openai", "anthropic", "google-genai", "ollama"]) {
      expect(edgeStatus.get(provider)).toBe("DOCS_ONLY");
      expect(candidates.get(provider)?.readiness).not.toBe("READY_FOR_TECHNICAL_ENGAGEMENT");
    }
    expect(edgeStatus.get("e2b")).toBe("SIMULATED");
    expect(candidates.get("e2b")?.readiness).toBe("INTERNAL_EVIDENCE_FIRST");
  });

  it("keeps the human and machine-readable maps linked from ecosystem navigation", () => {
    const priorities = readFileSync("Docs/ecosystem/UPSTREAM_ENGAGEMENT_PRIORITIES.md", "utf8");
    const graphDoc = readFileSync("Docs/ecosystem/INTEGRATION_GRAPH.md", "utf8");
    const index = readFileSync("Docs/DOCUMENTATION_INDEX.md", "utf8");
    expect(priorities).toContain("NO EXTERNAL ENGAGEMENT IS JUSTIFIED YET");
    expect(priorities).toContain("upstream-engagement-priorities.json");
    expect(graphDoc).toContain("UPSTREAM_ENGAGEMENT_PRIORITIES.md");
    expect(index).toContain("ecosystem/UPSTREAM_ENGAGEMENT_PRIORITIES.md");
  });

  it("records JSON Schema conformance without auto-promoting outreach readiness", () => {
    const jsonSchema = artifact.candidates.find(({ target }) =>
      target.startsWith("JSON Schema Draft 2020-12")
    );
    expect(jsonSchema?.readiness).toBe("NEAR_READY_ONE_EVIDENCE_GAP");
    expect(jsonSchema?.existingEvidence).toContain("tools/conformance/json-schema/results.json");
    expect(jsonSchema?.missingEvidence).toEqual([
      "externally relevant minimized validator discrepancy",
      "demonstrated upstream need"
    ]);
    expect(jsonSchema?.allowedNextAction).toBe("INTERNAL_FINDING_REVIEW");
  });
});
