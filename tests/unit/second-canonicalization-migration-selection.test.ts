import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type ScoreKey =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R";

interface Candidate {
  id: string;
  class: string;
  scores?: Record<ScoreKey, number>;
  migrationValue?: number;
  migrationRisk?: number;
  migrationReadiness?: number;
  secondMigrationSuitability?: number;
  hardGates?: Record<string, boolean>;
  disposition: string;
}

const repositoryRoot = resolve(import.meta.dirname, "../..");
const readJson = <T>(relativePath: string): { raw: string; value: T } => {
  const raw = readFileSync(resolve(repositoryRoot, relativePath), "utf8");
  return { raw, value: JSON.parse(raw) as T };
};

const selectionDocument = readJson<{
  planningOnly: boolean;
  baseline: { firstMigration: string };
  hardGateVocabulary: string[];
  candidateVocabulary: { classes: string[]; dispositions: string[] };
  remainingCandidates: Candidate[];
  selectedSecondMigration: string;
  implementationAuthorized: boolean;
  historicalRehashAuthorized: boolean;
  externalOutreachAuthorized: boolean;
  productionMigrationComplete: boolean;
}>("Docs/evidence/second-canonicalization-migration-selection.json");

const graphDocument = readJson<{
  nodes: { id: string; state: string }[];
  edges: { from: string; to: string; relation: string }[];
  selectedBoundary: {
    selectedNode: string;
    parentValueChangesForNewBundles: boolean;
    parentFramingMigrates: boolean;
    unresolvedChildrenMayMigrate: boolean;
  };
}>("Docs/evidence/canonicalization-migration-dependencies.json");

const matrixDocument = readJson<{
  selectedFirstMigrationId: string;
  selectedSecondMigrationId: string;
  secondMigrationImplementationAuthorized: boolean;
  productionMigrationComplete: boolean;
  rows: {
    id: string;
    class: string;
    migrationStrategy: string;
    firstMigrationCandidate: boolean;
  }[];
}>("Docs/evidence/canonicalization-migration-matrix.json");

const selection = selectionDocument.value;
const graph = graphDocument.value;
const matrix = matrixDocument.value;

describe("second canonicalization migration selection", () => {
  it("keeps the first migration implemented as a reference and excludes it from reselection", () => {
    const first = matrix.rows.find((row) => row.id === matrix.selectedFirstMigrationId);
    expect(selection.baseline.firstMigration).toBe("sandbox-execution-receipt-digest");
    expect(first?.migrationStrategy).toBe("IMPLEMENTED_V1_NEW_ARTIFACTS_WITH_LEGACY_VERIFICATION");
    expect(first?.firstMigrationCandidate).toBe(true);
    expect(selection.selectedSecondMigration).not.toBe(selection.baseline.firstMigration);
  });

  it("selects exactly one known identity-critical candidate that passes every hard gate", () => {
    const selected = selection.remainingCandidates.filter(
      (candidate) => candidate.disposition === "SELECTED"
    );
    expect(selected).toHaveLength(1);
    expect(selected[0]?.id).toBe(selection.selectedSecondMigration);
    expect(selected[0]?.class).toBe("IDENTITY_CRITICAL");
    expect(selected[0]?.class).not.toBe("UNKNOWN_REQUIRES_REVIEW");
    expect(Object.keys(selected[0]?.hardGates ?? {}).sort()).toEqual(
      [...selection.hardGateVocabulary].sort()
    );
    expect(Object.values(selected[0]?.hardGates ?? {})).not.toContain(false);

    const selectedMatrixRow = matrix.rows.find(
      (row) => row.id === selection.selectedSecondMigration
    );
    expect(matrix.selectedSecondMigrationId).toBe(selection.selectedSecondMigration);
    expect(selectedMatrixRow?.class).toBe("IDENTITY_CRITICAL");
    expect(selectedMatrixRow?.migrationStrategy).toBe("SELECTED_SECOND_MIGRATION");
  });

  it("retains separate A-R value, risk, and readiness scores and exact formulas", () => {
    const expectedScoreKeys = "ABCDEFGHIJKLMNOPQR".split("");
    for (const candidate of selection.remainingCandidates.filter(
      (entry) => entry.disposition !== "UNKNOWN"
    )) {
      expect(Object.keys(candidate.scores ?? {}).sort(), candidate.id).toEqual(expectedScoreKeys);
      for (const score of Object.values(candidate.scores ?? {})) {
        expect(score, candidate.id).toBeGreaterThanOrEqual(1);
        expect(score, candidate.id).toBeLessThanOrEqual(5);
      }

      const score = candidate.scores!;
      const value = score.A + score.B + score.C + score.D + score.E;
      const risk = score.F + score.G + score.H + score.I + score.J + score.K + score.L + score.M;
      const readiness = score.N + score.O + score.P + score.Q + score.R;
      expect(candidate.migrationValue, candidate.id).toBe(value);
      expect(candidate.migrationRisk, candidate.id).toBe(risk);
      expect(candidate.migrationReadiness, candidate.id).toBe(readiness);
      expect(candidate.secondMigrationSuitability, candidate.id).toBe(2 * value + readiness - risk);
    }
  });

  it("uses finite candidate vocabularies", () => {
    for (const candidate of selection.remainingCandidates) {
      expect(selection.candidateVocabulary.classes).toContain(candidate.class);
      expect(selection.candidateVocabulary.dispositions).toContain(candidate.disposition);
    }
  });

  it("models valid child-to-parent dependencies without migrating unresolved children", () => {
    const nodeIds = new Set(graph.nodes.map((node) => node.id));
    expect(nodeIds.size).toBe(graph.nodes.length);
    for (const edge of graph.edges) {
      expect(nodeIds.has(edge.from), edge.from).toBe(true);
      expect(nodeIds.has(edge.to), edge.to).toBe(true);
      expect(edge.relation.length).toBeGreaterThan(0);
    }

    expect(graph.selectedBoundary.selectedNode).toBe(selection.selectedSecondMigration);
    expect(graph.selectedBoundary.parentValueChangesForNewBundles).toBe(true);
    expect(graph.selectedBoundary.parentFramingMigrates).toBe(false);
    expect(graph.selectedBoundary.unresolvedChildrenMayMigrate).toBe(false);
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        from: selection.selectedSecondMigration,
        to: "research-bundle-core-root"
      })
    );
    expect(graph.nodes.find((node) => node.id === "research-bundle-core-root")?.state).toBe(
      "DEFERRED_FRAMING_UNCHANGED"
    );
  });

  it("authorizes planning only and contains no machine-local or temporal state", () => {
    expect(selection.planningOnly).toBe(true);
    expect(selection.implementationAuthorized).toBe(false);
    expect(selection.historicalRehashAuthorized).toBe(false);
    expect(selection.externalOutreachAuthorized).toBe(false);
    expect(selection.productionMigrationComplete).toBe(false);
    expect(matrix.secondMigrationImplementationAuthorized).toBe(false);
    expect(matrix.productionMigrationComplete).toBe(false);

    const deterministicText = `${selectionDocument.raw}\n${graphDocument.raw}`;
    expect(deterministicText).not.toMatch(/[A-Za-z]:\\|\/Users\/|\/home\//);
    expect(deterministicText).not.toMatch(/"(?:createdAt|updatedAt|generatedAt|timestamp)"\s*:/);
  });
});
