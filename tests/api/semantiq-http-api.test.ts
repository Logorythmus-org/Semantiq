import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request as httpRequest } from "node:http";
import {
  createSemantiqHttpServer,
  type SemantiqHttpApplication
} from "../../packages/semantiq/src/http/index.js";
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
    await writeFile(
      join(tempStaticDir, "index.html"),
      '<link rel="stylesheet" href="/app.css"><h1>SemantIQ Web UI Mock</h1><script src="/app.js"></script>'
    );
    await writeFile(join(tempStaticDir, "app.js"), "globalThis.semantIQTest = true;");
    await writeFile(join(tempStaticDir, "app.css"), "h1 { color: black; }");

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

  describe("security headers across response paths", () => {
    it.each([
      {
        name: "health JSON",
        path: "/health",
        method: "GET",
        status: 200,
        csp: "default-src 'none'; frame-ancestors 'none'"
      },
      {
        name: "CORS preflight",
        path: "/api/v1/patterns",
        method: "OPTIONS",
        status: 204,
        csp: "frame-ancestors 'none'"
      },
      {
        name: "not-found error",
        path: "/missing-route",
        method: "POST",
        status: 404,
        csp: "default-src 'none'; frame-ancestors 'none'"
      },
      {
        name: "static HTML",
        path: "/",
        method: "GET",
        status: 200,
        csp: "frame-ancestors 'none'"
      },
      {
        name: "service error",
        path: "/api/v1/claims/validate-language",
        method: "POST",
        body: "{",
        status: 500,
        csp: "default-src 'none'; frame-ancestors 'none'"
      }
    ])("preserves headers on $name responses", async ({ path, method, body, status, csp }) => {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        ...(body ? { body, headers: { "Content-Type": "application/json" } } : {})
      });
      expect(res.status).toBe(status);
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("x-frame-options")).toBe("DENY");
      expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
      expect(res.headers.get("content-security-policy")).toBe(csp);
      await res.arrayBuffer();
    });
  });

  it("serves optional same-origin UI assets without the JSON-only default-src restriction", async () => {
    for (const asset of ["/index.html", "/app.js", "/app.css"]) {
      const response = await fetch(`${baseUrl}${asset}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-security-policy")).toBe("frame-ancestors 'none'");
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect((await response.text()).length).toBeGreaterThan(0);
    }
  });

  describe("1. Headless Runtime & Health Endpoints", () => {
    it("GET /health returns healthy status and metadata", async () => {
      const res = await fetch(`${baseUrl}/health`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("healthy");
      expect(json.data.offlineDeterministic).toBe(true);
      expect(json.data.versionKind).toBe("schema");
      expect(json.data.releaseVersion).toBe("0.1.0-alpha.2");
      expect(json.data.schemaVersion).toBe("1.0.0");
      expect(json.data.maturity).toBe("Public Alpha (Experimental)");
      expect(json.meta.version).toBe("1.0.0");
      expect(json.meta.versionKind).toBe("schema");
      expect(json.meta.releaseVersion).toBe("0.1.0-alpha.2");
      expect(json.meta.schemaVersion).toBe("1.0.0");
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("x-frame-options")).toBe("DENY");
      expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    });

    it("GET /info returns registered application service catalog", async () => {
      const res = await fetch(`${baseUrl}/info`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.headless).toBe(true);
      expect(json.data.releaseVersion).toBe("0.1.0-alpha.2");
      expect(json.data.schemaVersion).toBe("1.0.0");
      expect(json.data.services).toContain("patterns");
      expect(json.data.services).toContain("claims");
      expect(json.data.services).toContain("reviews");
    });
  });

  describe("2. Governed Claims & Controlled Language API", () => {
    it("rejects oversized JSON bodies with HTTP 413 instead of a service error", async () => {
      const response = await fetch(`${baseUrl}/api/v1/claims/validate-language`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement: "a".repeat(1024 * 1024) })
      });
      expect(response.status).toBe(413);
      const payload = await response.json();
      expect(payload.success).toBe(false);
      expect(payload.error.code).toBe("PAYLOAD_TOO_LARGE");
      expect(payload.error.message).not.toContain("a".repeat(100));
    });

    it("rejects chunked request bodies without a Content-Length header", async () => {
      const result = await new Promise<{ status: number | undefined; body: string }>(
        (resolve, reject) => {
          const req = httpRequest(
            `${baseUrl}/api/v1/claims/validate-language`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", "Transfer-Encoding": "chunked" }
            },
            (res) => {
              let body = "";
              res.setEncoding("utf8");
              res.on("data", (chunk: string) => {
                body += chunk;
              });
              res.on("end", () => resolve({ status: res.statusCode, body }));
            }
          );
          req.on("error", reject);
          req.write('{"statement":"');
          for (let i = 0; i < 17; i++) req.write("a".repeat(65536));
          req.end('"}');
        }
      );
      expect(result.status).toBe(413);
      expect(JSON.parse(result.body).error.code).toBe("PAYLOAD_TOO_LARGE");
    });

    it("counts UTF-8 bytes rather than JavaScript string characters", async () => {
      const response = await fetch(`${baseUrl}/api/v1/claims/validate-language`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement: "é".repeat(530000) })
      });
      expect(response.status).toBe(413);
      const payload = await response.json();
      expect(payload.error.code).toBe("PAYLOAD_TOO_LARGE");
    });

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

    it("blocks directory traversal attempts in static file requests", async () => {
      const res1 = await fetch(`${baseUrl}/../package.json`);
      expect(res1.status).toBe(404);

      const res2 = await fetch(`${baseUrl}/..%2F..%2Fpackage.json`);
      expect(res2.status).toBe(404);
    });

    it("runs 100% headless and executes core workflows when staticDir is omitted", async () => {
      const headlessApp = createSemantiqHttpServer({ port: 0, host: "127.0.0.1" });
      const headlessPort = await headlessApp.start();
      const headlessUrl = `http://127.0.0.1:${headlessPort}`;
      try {
        // Static UI request returns 404
        const uiRes = await fetch(`${headlessUrl}/index.html`);
        expect(uiRes.status).toBe(404);

        // Core API workflows execute with 100% functionality
        const healthRes = await fetch(`${headlessUrl}/health`);
        expect(healthRes.status).toBe(200);

        const validateRes = await fetch(`${headlessUrl}/api/v1/claims/validate-language`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            statement: "DP-008 is associated with reduced FP-002 context drift."
          })
        });
        expect(validateRes.status).toBe(200);
        const validateJson = await validateRes.json();
        expect(validateJson.data.isValid).toBe(true);

        const patternsRes = await fetch(`${headlessUrl}/api/v1/patterns`);
        expect(patternsRes.status).toBe(200);
        const patternsJson = await patternsRes.json();
        expect(Array.isArray(patternsJson.data)).toBe(true);
        expect(patternsJson.data.length).toBeGreaterThan(0);
      } finally {
        await headlessApp.stop();
      }
    });
  });
});
