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
  | "R"
  | "S"
  | "T"
  | "U"
  | "V";

interface Candidate {
  id: string;
  class: string;
  complexityLevel: string;
  controls: string[];
  scores?: Record<ScoreKey, number>;
  migrationValue?: number;
  migrationRisk?: number;
  migrationReadiness?: number;
  thirdMigrationSuitability?: number;
  hardGates?: Record<string, boolean>;
  disposition: string;
}

const root = resolve(import.meta.dirname, "../..");
const readJson = <T>(path: string): { raw: string; value: T } => {
  const raw = readFileSync(resolve(root, path), "utf8");
  return { raw, value: JSON.parse(raw) as T };
};

const selectionDocument = readJson<{
  planningOnly: boolean;
  baseline: { implementedMigrations: string[] };
  hardGateVocabulary: string[];
  candidateVocabulary: {
    classes: string[];
    dispositions: string[];
    complexityLevels: string[];
    controls: string[];
  };
  securityControlModel: { control: string; rule: string }[];
  remainingCandidates: Candidate[];
  selectedThirdMigration: string;
  implementationAuthorized: boolean;
  historicalRehashAuthorized: boolean;
  fourthMigrationAuthorized: boolean;
  externalOutreachAuthorized: boolean;
  productionMigrationComplete: boolean;
}>("Docs/evidence/third-canonicalization-migration-selection.json");

const matrixDocument = readJson<{
  selectedFirstMigrationId: string;
  selectedSecondMigrationId: string;
  selectedThirdMigrationId: string;
  thirdMigrationImplementationAuthorized: boolean;
  productionMigrationComplete: boolean;
  rows: { id: string; class: string; migrationStrategy: string }[];
}>("Docs/evidence/canonicalization-migration-matrix.json");

const graphDocument = readJson<{
  nodes: { id: string; state: string }[];
  edges: { from: string; to: string; relation: string }[];
  thirdSelectedBoundary: {
    selectedNode: string;
    complexityLevel: string;
    parentFramingMigrates: boolean;
    dynamicPathBindingRequired: boolean;
  };
}>("Docs/evidence/canonicalization-migration-dependencies.json");

const selection = selectionDocument.value;
const matrix = matrixDocument.value;
const graph = graphDocument.value;

describe("third canonicalization migration selection", () => {
  it("keeps both earlier migrations implemented and excludes them from selection", () => {
    expect(selection.baseline.implementedMigrations).toEqual([
      "sandbox-execution-receipt-digest",
      "research-bundle-core-workspace-snapshot-component"
    ]);
    for (const id of selection.baseline.implementedMigrations) {
      expect(matrix.rows.find((row) => row.id === id)?.migrationStrategy).toBe(
        "IMPLEMENTED_V1_NEW_ARTIFACTS_WITH_LEGACY_VERIFICATION"
      );
      expect(id).not.toBe(selection.selectedThirdMigration);
    }
  });

  it("selects exactly one known identity-critical Level-2 candidate that passes every gate", () => {
    const selected = selection.remainingCandidates.filter(
      (entry) => entry.disposition === "SELECTED"
    );
    expect(selected).toHaveLength(1);
    expect(selected[0]?.id).toBe("research-bundle-core-run-components");
    expect(selected[0]?.id).toBe(selection.selectedThirdMigration);
    expect(selected[0]?.class).toBe("IDENTITY_CRITICAL");
    expect(selected[0]?.class).not.toBe("UNKNOWN_REQUIRES_REVIEW");
    expect(selected[0]?.complexityLevel).toBe("LEVEL_2_COMPONENT_IDENTITY");
    expect(Object.keys(selected[0]?.hardGates ?? {}).sort()).toEqual(
      [...selection.hardGateVocabulary].sort()
    );
    expect(Object.values(selected[0]?.hardGates ?? {})).not.toContain(false);
    expect(matrix.selectedThirdMigrationId).toBe(selection.selectedThirdMigration);
    expect(
      matrix.rows.find((row) => row.id === selection.selectedThirdMigration)?.migrationStrategy
    ).toBe("SELECTED_THIRD_MIGRATION");
  });

  it("keeps independent value, risk, and readiness dimensions and exact formulas", () => {
    const keys = "ABCDEFGHIJKLMNOPQRSTUV".split("");
    for (const candidate of selection.remainingCandidates.filter(
      (entry) => entry.disposition !== "UNKNOWN"
    )) {
      expect(Object.keys(candidate.scores ?? {}).sort(), candidate.id).toEqual(keys);
      for (const score of Object.values(candidate.scores ?? {})) {
        expect(score, candidate.id).toBeGreaterThanOrEqual(1);
        expect(score, candidate.id).toBeLessThanOrEqual(5);
      }
      const s = candidate.scores!;
      const value = s.A + s.B + s.C + s.D + s.E + s.F;
      const risk = s.G + s.H + s.I + s.J + s.K + s.L + s.M + s.N;
      const readiness = s.O + s.P + s.Q + s.R + s.S + s.T + s.U + s.V;
      expect(candidate.migrationValue, candidate.id).toBe(value);
      expect(candidate.migrationRisk, candidate.id).toBe(risk);
      expect(candidate.migrationReadiness, candidate.id).toBe(readiness);
      expect(candidate.thirdMigrationSuitability, candidate.id).toBe(2 * value + readiness - risk);
    }
  });

  it("uses finite complexity, disposition, class, and control vocabularies", () => {
    for (const candidate of selection.remainingCandidates) {
      expect(selection.candidateVocabulary.classes).toContain(candidate.class);
      expect(selection.candidateVocabulary.dispositions).toContain(candidate.disposition);
      expect(selection.candidateVocabulary.complexityLevels).toContain(candidate.complexityLevel);
      for (const control of candidate.controls)
        expect(selection.candidateVocabulary.controls).toContain(control);
    }
    expect(selection.securityControlModel.map((entry) => entry.control).sort()).toEqual(
      [...selection.candidateVocabulary.controls].sort()
    );
    for (const entry of selection.securityControlModel)
      expect(entry.rule.length).toBeGreaterThan(20);
  });

  it("keeps every dependency reference valid and records the selected child boundary", () => {
    const ids = new Set(graph.nodes.map((node) => node.id));
    expect(ids.size).toBe(graph.nodes.length);
    for (const edge of graph.edges) {
      expect(ids.has(edge.from), edge.from).toBe(true);
      expect(ids.has(edge.to), edge.to).toBe(true);
      expect(edge.relation.length).toBeGreaterThan(0);
    }
    expect(graph.thirdSelectedBoundary.selectedNode).toBe(selection.selectedThirdMigration);
    expect(graph.thirdSelectedBoundary.complexityLevel).toBe("LEVEL_2_COMPONENT_IDENTITY");
    expect(graph.thirdSelectedBoundary.parentFramingMigrates).toBe(false);
    expect(graph.thirdSelectedBoundary.dynamicPathBindingRequired).toBe(true);
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        from: selection.selectedThirdMigration,
        to: "research-bundle-core-root"
      })
    );
  });

  it("authorizes planning only and remains machine-independent", () => {
    expect(selection.planningOnly).toBe(true);
    expect(selection.implementationAuthorized).toBe(false);
    expect(selection.historicalRehashAuthorized).toBe(false);
    expect(selection.fourthMigrationAuthorized).toBe(false);
    expect(selection.externalOutreachAuthorized).toBe(false);
    expect(selection.productionMigrationComplete).toBe(false);
    expect(matrix.thirdMigrationImplementationAuthorized).toBe(false);
    expect(matrix.productionMigrationComplete).toBe(false);

    const raw = `${selectionDocument.raw}\n${matrixDocument.raw}\n${graphDocument.raw}`;
    expect(raw).not.toMatch(/[A-Za-z]:\\|\/Users\/|\/home\//);
    expect(raw).not.toMatch(/"(?:createdAt|updatedAt|generatedAt|timestamp)"\s*:/);
  });
});
