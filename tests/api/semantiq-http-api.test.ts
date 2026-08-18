import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createSemantiqHttpServer, type SemantiqHttpApplication } from "../../packages/semantiq/src/http/index.js";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("UI-Independent SemantIQ Headless HTTP API (Prompt 25)", () => {
  let app: SemantiqHttpApplication;
  let baseUrl: string;
  let tempStaticDir: string;

  beforeAll(async () => {
    tempStaticDir = join(tmpdir(), `semantiq-static-${Date.now()}`);
    await mkdir(tempStaticDir, { recursive: true });
    await writeFile(join(tempStaticDir, "index.html"), "<h1>SemantIQ Web UI Mock</h1>");

    app = createSemantiqHttpServer({
      port: 0,
      host: "127.0.0.1",
      staticDir: tempStaticDir,
      enableCors: true
    });
    const port = await app.start();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await app.stop();
    await rm(tempStaticDir, { recursive: true, force: true });
  });

  describe("1. Headless Runtime & Health Endpoints", () => {
    it("GET /health returns healthy status and metadata", async () => {
      const res = await fetch(`${baseUrl}/health`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("healthy");
      expect(json.data.offlineDeterministic).toBe(true);
      expect(json.meta.version).toBe("1.0.0");
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("GET /info returns registered application service catalog", async () => {
      const res = await fetch(`${baseUrl}/info`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.headless).toBe(true);
      expect(json.data.services).toContain("patterns");
      expect(json.data.services).toContain("claims");
      expect(json.data.services).toContain("reviews");
    });
  });

  describe("2. Governed Claims & Controlled Language API", () => {
    it("POST /api/v1/claims/validate-language detects prohibited causal claims", async () => {
      const res = await fetch(`${baseUrl}/api/v1/claims/validate-language`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement: "This pattern causes zero downtime." })
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.isValid).toBe(false);
      expect(json.data.violations.length).toBeGreaterThan(0);
      expect(json.data.violations[0].prohibitedPhrase).toBe("causes");
    });

    it("POST /api/v1/claims/validate-language passes compliant hedged statement", async () => {
      const res = await fetch(`${baseUrl}/api/v1/claims/validate-language`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement: "This pattern is associated with reduced downtime." })
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.isValid).toBe(true);
    });

    it("POST /api/v1/claims/draft and GET /api/v1/claims manages claim lifecycle", async () => {
      const draftRes = await fetch(`${baseUrl}/api/v1/claims/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimFamilyTopic: "recovery_speed",
          targetPatternOrRelationId: "DP-001",
          version: "1.0.0",
          statement: "Circuit breaker is associated with improved mean time to recovery.",
          governanceVerdict: "promote",
          evidenceReferences: {
            runIds: ["run_http_01"],
            observationIds: ["obs_01"],
            decisionReportIds: [],
            sourceIds: []
          }
        })
      });
      expect(draftRes.status).toBe(201);
      const draftJson = await draftRes.json();
      expect(draftJson.success).toBe(true);
      expect(draftJson.data.status).toBe("draft");
      expect(draftJson.data.epistemicDisclaimer).toContain("Release controls wording");

      const claimId = draftJson.data.id;
      const getRes = await fetch(`${baseUrl}/api/v1/claims/${claimId}`);
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.data.id).toBe(claimId);
    });
  });

  describe("3. Patterns & Governance API Endpoints", () => {
    it("GET /api/v1/patterns lists patterns without file scanning", async () => {
      const res = await fetch(`${baseUrl}/api/v1/patterns`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    it("POST /api/v1/comparisons/governance-decision evaluates deterministic policy", async () => {
      const res = await fetch(`${baseUrl}/api/v1/comparisons/governance-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: "target_http_01",
          statisticalGrade: "GRADE_A",
          pairCount: 12,
          robustnessGrade: "ROBUST_GRADE_A",
          specificationStability: 0.98,
          usableSpecifications: 6,
          lowPowerFraction: 0.0,
          negativeControlFailures: 0
        })
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.verdict).toBe("promote");
    });
  });

  describe("4. Research Bundles Merkle Verification API", () => {
    it("POST /api/v1/bundles/export and POST /api/v1/bundles/verify seal and verify bundle", async () => {
      const exportRes = await fetch(`${baseUrl}/api/v1/bundles/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: "bundle_http_001",
          title: "HTTP API Research Bundle",
          author: "http_client",
          runs: [],
          evaluations: [],
          claims: []
        })
      });
      expect(exportRes.status).toBe(201);
      const exportJson = await exportRes.json();
      expect(exportJson.success).toBe(true);
      expect(exportJson.data.merkleRootHash).toBeDefined();

      const verifyRes = await fetch(`${baseUrl}/api/v1/bundles/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportJson.data)
      });
      expect(verifyRes.status).toBe(200);
      const verifyJson = await verifyRes.json();
      expect(verifyJson.data.verified).toBe(true);
    });
  });

  describe("5. Optional Web UI Static Serving", () => {
    it("serves static HTML file when configured", async () => {
      const res = await fetch(`${baseUrl}/index.html`);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain("SemantIQ Web UI Mock");
    });

    it("runs 100% headless when staticDir is omitted", async () => {
      const headlessApp = createSemantiqHttpServer({ port: 0, host: "127.0.0.1" });
      const headlessPort = await headlessApp.start();
      try {
        const res = await fetch(`http://127.0.0.1:${headlessPort}/index.html`);
        expect(res.status).toBe(404);
      } finally {
        await headlessApp.stop();
      }
    });
  });
});
