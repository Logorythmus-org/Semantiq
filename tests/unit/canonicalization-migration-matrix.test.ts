import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface MatrixRow {
  id: string;
  sourceInventoryId: string;
  surface: string;
  class: string;
  producer: string[];
  consumer: string[];
  currentProfile: string;
  hashAlgorithm: string;
  historicalArtifacts: string;
  profileMetadata: string;
  crossLanguage: boolean;
  migrationStrategy: string;
  migrationValue: number;
  migrationRisk: number;
  firstMigrationSuitability: number;
  firstMigrationCandidate: boolean;
  requiredEvidence: string[];
  compatibilityRisks: string[];
  testRequirements: string[];
  notes: string;
  scores?: Record<"A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J", number>;
}

interface Matrix {
  planningOnly: boolean;
  historicalRehashAuthorized: boolean;
  outreachAuthorized: boolean;
  productionMigrationComplete: boolean;
  classVocabulary: string[];
  strategyVocabulary: string[];
  historicalArtifactVocabulary: string[];
  inventoryReconciliation: {
    removedNonSurfaces: { id: string; reason: string }[];
    remainingUnknowns: string[];
  };
  selectedFirstMigrationId: string;
  rows: MatrixRow[];
}

const repositoryRoot = resolve(import.meta.dirname, "../..");
const matrixPath = resolve(repositoryRoot, "Docs/evidence/canonicalization-migration-matrix.json");
const inventoryPath = resolve(
  repositoryRoot,
  "Docs/evidence/canonicalization-hash-surface-inventory.json"
);
const rawMatrix = readFileSync(matrixPath, "utf8");
const matrix = JSON.parse(rawMatrix) as Matrix;
const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as {
  surfaces: { id: string }[];
};

describe("canonicalization migration decision matrix", () => {
  it("represents every active Prompt-15B inventory family exactly through a row or an explained removal", () => {
    const represented = new Set(matrix.rows.map((row) => row.sourceInventoryId));
    const removed = new Map(
      matrix.inventoryReconciliation.removedNonSurfaces.map((entry) => [entry.id, entry.reason])
    );

    for (const surface of inventory.surfaces) {
      expect(represented.has(surface.id) || removed.has(surface.id), surface.id).toBe(true);
      if (removed.has(surface.id)) expect(removed.get(surface.id)?.length).toBeGreaterThan(20);
    }
  });

  it("uses unique IDs and only finite class, strategy, history, and algorithm vocabularies", () => {
    expect(new Set(matrix.rows.map((row) => row.id)).size).toBe(matrix.rows.length);
    for (const row of matrix.rows) {
      expect(matrix.classVocabulary).toContain(row.class);
      expect(matrix.strategyVocabulary).toContain(row.migrationStrategy);
      expect(matrix.historicalArtifactVocabulary).toContain(row.historicalArtifacts);
      expect(row.hashAlgorithm).toBe("sha256");
      expect(row.producer.length).toBeGreaterThan(0);
      expect(row.consumer.length).toBeGreaterThan(0);
      expect(row.notes.length).toBeGreaterThan(0);
    }
  });

  it("scores every identity-critical row with the documented deterministic formulas", () => {
    for (const row of matrix.rows.filter((entry) => entry.class === "IDENTITY_CRITICAL")) {
      expect(row.scores).toBeDefined();
      const score = row.scores!;
      for (const dimension of Object.values(score)) {
        expect(dimension).toBeGreaterThanOrEqual(1);
        expect(dimension).toBeLessThanOrEqual(5);
      }
      const value = score.A + score.C + score.D + score.J;
      const risk =
        score.B + (6 - score.E) + (6 - score.F) + (6 - score.G) + score.H + (6 - score.I);
      expect(row.migrationValue).toBe(value);
      expect(row.migrationRisk).toBe(risk);
      expect(row.firstMigrationSuitability).toBe(2 * value - risk);
      expect(row.migrationStrategy).not.toBe("NO_MIGRATION_REQUIRED");
    }
  });

  it("keeps every unknown explicit about the missing evidence", () => {
    const unknowns = matrix.rows.filter((row) => row.class === "UNKNOWN_REQUIRES_REVIEW");
    expect(unknowns.map((row) => row.id).sort()).toEqual(
      [...matrix.inventoryReconciliation.remainingUnknowns].sort()
    );
    for (const row of unknowns) {
      expect(row.migrationStrategy).toBe("UNKNOWN_REQUIRES_REVIEW");
      expect(row.requiredEvidence.length).toBeGreaterThanOrEqual(2);
      expect(row.compatibilityRisks.length).toBeGreaterThan(0);
    }
  });

  it("selects exactly one bounded first migration and keeps it gated", () => {
    const selected = matrix.rows.filter((row) => row.firstMigrationCandidate);
    expect(selected).toHaveLength(1);
    expect(selected[0]?.id).toBe(matrix.selectedFirstMigrationId);
    expect(selected[0]?.id).toBe("sandbox-execution-receipt-digest");
    expect(selected[0]?.class).toBe("IDENTITY_CRITICAL");
    expect(selected[0]?.migrationStrategy).toBe(
      "IMPLEMENTED_V1_NEW_ARTIFACTS_WITH_LEGACY_VERIFICATION"
    );
    expect(selected[0]?.profileMetadata).toContain("safely addable");
    expect(selected[0]?.historicalArtifacts).toBe("HISTORICAL_ARTIFACTS_NOT_FOUND");
    expect(selected[0]?.testRequirements).toEqual(
      expect.arrayContaining([
        "legacy verification",
        "V1 generation",
        "unknown/downgrade rejection"
      ])
    );
  });

  it("authorizes planning only, never history rewriting, outreach, or a completed migration", () => {
    expect(matrix.planningOnly).toBe(true);
    expect(matrix.historicalRehashAuthorized).toBe(false);
    expect(matrix.outreachAuthorized).toBe(false);
    expect(matrix.productionMigrationComplete).toBe(false);
  });

  it("is machine-independent, timestamp-free, and deterministically parseable", () => {
    expect(rawMatrix).not.toMatch(/[A-Za-z]:\\|\/Users\/|\/home\//);
    expect(rawMatrix).not.toMatch(/"(?:createdAt|updatedAt|generatedAt|timestamp)"\s*:/);
    expect(JSON.parse(rawMatrix)).toEqual(JSON.parse(rawMatrix));
  });
});
