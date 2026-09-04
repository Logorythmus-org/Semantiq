import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface Claim {
  claimId: string;
  graphStatus: string;
  evidenceLevel: number;
  implementationEvidence: string[];
  testEvidence: string[];
  externalEvidence: string[];
  recommendedAction: string;
}

const matrix = JSON.parse(readFileSync("Docs/ecosystem/public-claim-matrix.json", "utf8")) as {
  claims: Claim[];
};
const graph = JSON.parse(readFileSync("Docs/ecosystem/integration-graph.json", "utf8")) as {
  edges: Array<{ target: string; implementationStatus: string }>;
};

const read = (path: string) => readFileSync(path, "utf8");

describe("ecosystem public-claim truth", () => {
  it("keeps the claim matrix complete and its evidence paths reviewable", () => {
    expect(matrix.claims).toHaveLength(22);
    expect(new Set(matrix.claims.map((claim) => claim.claimId)).size).toBe(22);
    for (const claim of matrix.claims) {
      expect(claim.evidenceLevel).toBeGreaterThanOrEqual(1);
      expect(claim.evidenceLevel).toBeLessThanOrEqual(5);
      for (const path of [...claim.implementationEvidence, ...claim.testEvidence]) {
        expect(existsSync(path), `${claim.claimId}: missing ${path}`).toBe(true);
      }
    }
  });

  it("does not promote documented model providers or simulated E2B", () => {
    const status = new Map(graph.edges.map((edge) => [edge.target, edge.implementationStatus]));
    expect(status.get("openai")).toBe("DOCS_ONLY");
    expect(status.get("anthropic")).toBe("DOCS_ONLY");
    expect(status.get("google-genai")).toBe("DOCS_ONLY");
    expect(status.get("ollama")).toBe("DOCS_ONLY");
    expect(status.get("e2b")).toBe("SIMULATED");
    expect(read("Docs/REMOTE_PROVIDER_GUIDE.md")).toMatch(/no verified (runtime )?connectors?/);
    expect(read("Docs/ADAPTER_GUIDE.md")).toContain("E2B behavior is simulated");
  });

  it("separates Docker implementation from Podman and platform verification", () => {
    const readme = read("README.md");
    const matrixDoc = read("Docs/INSTALLATION_MATRIX.md");
    expect(readme).toContain("Podman and named cloud-provider compatibility are not verified");
    expect(matrixDoc).toContain("VERIFIED_IN_REQUIRED_CI");
    expect(matrixDoc).toContain("BEST_EFFORT");
    expect(matrixDoc).toContain("UNVERIFIED");
  });

  it("separates generic benchmark mapping from compatibility and verification", () => {
    const benchmarkDoc = read("Docs/EXTERNAL_BENCHMARK_ECOSYSTEM.md");
    expect(benchmarkDoc).toContain("generic external benchmark-pack mapper");
    expect(benchmarkDoc).toMatch(/does\s+not establish format-specific schema compatibility/);
    expect(benchmarkDoc).toContain("is not legal validation");
    expect(benchmarkDoc).toContain("independent provenance verification");
  });

  it("keeps exports, packages, archives, and documentation visibly unpublished", () => {
    expect(read("Docs/HUGGINGFACE_GUIDE.md")).toContain("publication have not been established");
    expect(read("Docs/KAGGLE_GUIDE.md")).toContain("publication have not been established");
    expect(read("Docs/sdk/README.md").match(/Unpublished package/g)).toHaveLength(2);
    expect(read("Docs/ZENODO_DOI_WORKFLOW.md")).toMatch(/no verified\s+deposition/);
    expect(read("Docs/ecosystem/PUBLIC_CLAIM_STATUS.md")).toMatch(
      /GitHub Pages deployment are not\s+established/
    );
  });

  it("does not promote internal reproduction or historical identity", () => {
    const statusDoc = read("Docs/ecosystem/PUBLIC_CLAIM_STATUS.md");
    expect(statusDoc).toContain("distinct from verified external replication");
    expect(statusDoc).toContain("migration-bound");
    expect(matrix.claims.find((claim) => claim.claimId === "PC-022")?.recommendedAction).toBe(
      "DEFER_TO_MIGRATION"
    );
    expect(read("Docs/DOCUMENTATION_INDEX.md")).toContain("ecosystem/PUBLIC_CLAIM_STATUS.md");
  });
});
