/**
 * @package @tech-club/semantiq
 * Authoritative HTTP API Request Router
 *
 * Invariants:
 * 1. UI-independent server/API layer consuming application services.
 * 2. Can run with NO Web UI installed.
 * 3. Web UI static file serving is strictly optional.
 * 4. API does not scan raw reports directly; delegates to application services.
 * 5. API response contracts match canonical product schemas.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomUUID } from "node:crypto";
import { PRODUCT_CONTRACTS_SCHEMA_VERSION } from "@tech-club/sandbox-contracts";
import type { SemantiqApplicationService } from "../services/index.js";
import { SEMANTIQ_MATURITY, SEMANTIQ_RELEASE_VERSION } from "../version.js";
import type { ApiResponse } from "./types.js";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

export class SemantiqHttpRouter {
  constructor(
    private readonly service: SemantiqApplicationService,
    private readonly basePath: string = "/api/v1",
    private readonly staticDir?: string | undefined,
    private readonly enableCors: boolean = true
  ) {}

  public async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const correlationId = (req.headers["x-correlation-id"] as string) || randomUUID();
    res.setHeader("x-correlation-id", correlationId);

    if (this.enableCors) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, x-correlation-id"
      );
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }
    }

    const rawUrl = req.url ?? "/";
    const parsedUrl = new URL(rawUrl, "http://localhost");
    const pathname = parsedUrl.pathname;
    const method = (req.method ?? "GET").toUpperCase();

    // 1. Health and Discovery Top-Level Endpoints
    if (method === "GET" && (pathname === "/health" || pathname === `${this.basePath}/health`)) {
      this.sendJson(
        res,
        200,
        {
          status: "healthy",
          version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
          versionKind: "schema",
          releaseVersion: SEMANTIQ_RELEASE_VERSION,
          schemaVersion: PRODUCT_CONTRACTS_SCHEMA_VERSION,
          maturity: SEMANTIQ_MATURITY,
          offlineDeterministic: true,
          timestamp: new Date().toISOString()
        },
        correlationId
      );
      return;
    }

    if (method === "GET" && (pathname === "/info" || pathname === `${this.basePath}/info`)) {
      this.sendJson(
        res,
        200,
        {
          product: "SemantIQ",
          version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
          versionKind: "schema",
          releaseVersion: SEMANTIQ_RELEASE_VERSION,
          schemaVersion: PRODUCT_CONTRACTS_SCHEMA_VERSION,
          maturity: SEMANTIQ_MATURITY,
          services: [
            "runs",
            "evaluations",
            "patterns",
            "evidence",
            "comparisons",
            "claims",
            "reviews",
            "studies",
            "bundles"
          ],
          headless: true,
          staticServing: Boolean(this.staticDir)
        },
        correlationId
      );
      return;
    }

    // 2. API Routes
    if (pathname.startsWith(this.basePath)) {
      const subpath = pathname.slice(this.basePath.length);
      const handled = await this.routeApiRequest(method, subpath, req, res, correlationId);
      if (handled) {
        return;
      }
    }

    // 3. Optional Static File Serving
    if (this.staticDir && method === "GET") {
      const served = await this.serveStaticFile(pathname, res);
      if (served) {
        return;
      }
    }

    // 4. Fallthrough 404
    this.sendError(res, 404, "NOT_FOUND", `Route '${method} ${pathname}' not found`, correlationId);
  }

  private async routeApiRequest(
    method: string,
    subpath: string,
    req: IncomingMessage,
    res: ServerResponse,
    correlationId: string
  ): Promise<boolean> {
    const parts = subpath.split("/").filter(Boolean);
    const domain = parts[0];
    const resource = parts[1];
    const subresource = parts[2];

    try {
      // -------------------------------------------------------------
      // Patterns Service Routes
      // -------------------------------------------------------------
      if (domain === "patterns") {
        if (method === "GET" && !resource) {
          const patterns = await this.service.patterns.listPatterns();
          this.sendJson(res, 200, patterns, correlationId);
          return true;
        }
        if (method === "GET" && resource && resource !== "match" && resource !== "recommend") {
          const pattern = await this.service.patterns.getPattern(resource);
          if (!pattern) {
            this.sendError(
              res,
              404,
              "PATTERN_NOT_FOUND",
              `Pattern '${resource}' not found`,
              correlationId
            );
            return true;
          }
          this.sendJson(res, 200, pattern, correlationId);
          return true;
        }
        if (method === "POST" && resource === "match") {
          const body = await this.readJsonBody(req);
          const result = await this.service.patterns.matchSystem(body);
          this.sendJson(res, 200, result, correlationId);
          return true;
        }
        if (method === "POST" && resource === "recommend") {
          const body = await this.readJsonBody(req);
          const result = await this.service.patterns.recommendPatterns(body);
          this.sendJson(res, 200, result, correlationId);
          return true;
        }
      }

      // -------------------------------------------------------------
      // Governed Claims Service Routes
      // -------------------------------------------------------------
      if (domain === "claims") {
        if (method === "POST" && resource === "validate-language") {
          const body = await this.readJsonBody<{ statement: string }>(req);
          const validation = this.service.claims.validateControlledLanguage(body.statement || "");
          this.sendJson(res, 200, validation, correlationId);
          return true;
        }
        if (method === "POST" && resource === "draft") {
          const body = await this.readJsonBody(req);
          const claim = await this.service.claims.draftClaim(body);
          this.sendJson(res, 201, claim, correlationId);
          return true;
        }
        if (method === "GET" && !resource) {
          const claims = await this.service.claims.listClaims();
          this.sendJson(res, 200, claims, correlationId);
          return true;
        }
        if (method === "GET" && resource && !subresource) {
          const claim = await this.service.claims.getClaim(resource);
          if (!claim) {
            this.sendError(
              res,
              404,
              "CLAIM_NOT_FOUND",
              `Claim '${resource}' not found`,
              correlationId
            );
            return true;
          }
          this.sendJson(res, 200, claim, correlationId);
          return true;
        }
        if (method === "POST" && resource && subresource === "release") {
          const released = await this.service.claims.releaseClaim(resource);
          this.sendJson(res, 200, released, correlationId);
          return true;
        }
      }

      // -------------------------------------------------------------
      // Evidence & Behavioral Metrics Routes
      // -------------------------------------------------------------
      if (domain === "evidence") {
        if (method === "POST" && resource === "metrics") {
          const body = await this.readJsonBody<{
            evaluationTargetId: string;
            inputs: Record<string, Record<string, unknown>>;
          }>(req);
          const report = await this.service.evidence.computeBehavioralMetrics(
            body.evaluationTargetId || "eval_default",
            body.inputs || {}
          );
          this.sendJson(res, 200, report, correlationId);
          return true;
        }
        if (method === "POST" && resource === "extract-failures") {
          const body = await this.readJsonBody(req);
          const extracted = await this.service.evidence.extractFailureEvidence(body);
          this.sendJson(res, 200, extracted, correlationId);
          return true;
        }
        if (method === "POST" && resource === "query") {
          const body = await this.readJsonBody(req);
          const queryResult = await this.service.evidence.queryEvidenceGraph(body);
          this.sendJson(res, 200, queryResult, correlationId);
          return true;
        }
      }

      // -------------------------------------------------------------
      // Reviews & Workbench Routes
      // -------------------------------------------------------------
      if (domain === "reviews" || domain === "review") {
        if (method === "GET" && resource === "queue") {
          const queue = await this.service.reviews.listReviewQueue();
          this.sendJson(res, 200, queue, correlationId);
          return true;
        }
        if (method === "POST" && resource === "enqueue") {
          const body = await this.readJsonBody(req);
          const enqueued = await this.service.reviews.enqueueReviewItem(body);
          this.sendJson(res, 201, enqueued, correlationId);
          return true;
        }
        if (method === "GET" && resource === "audit" && subresource === "verify") {
          const audit = await this.service.reviews.verifyAuditTrail();
          this.sendJson(res, 200, audit, correlationId);
          return true;
        }
      }

      // -------------------------------------------------------------
      // Studies & Dataset Registry Routes
      // -------------------------------------------------------------
      if (domain === "studies") {
        if (method === "GET" && (resource === "snapshots" || resource === "sources")) {
          const snapshots = await this.service.studies.listDatasetSnapshots();
          this.sendJson(res, 200, snapshots, correlationId);
          return true;
        }
        if (method === "GET" && resource === "cases") {
          const cases = await this.service.studies.listCaseStudies();
          this.sendJson(res, 200, cases, correlationId);
          return true;
        }
        if (method === "POST" && resource === "snapshots") {
          const body = await this.readJsonBody(req);
          const snap = await this.service.studies.createDatasetSnapshot(body);
          this.sendJson(res, 201, snap, correlationId);
          return true;
        }
      }

      // -------------------------------------------------------------
      // Bundles Service Routes
      // -------------------------------------------------------------
      if (domain === "bundles") {
        if (method === "POST" && resource === "export") {
          const body = await this.readJsonBody(req);
          const bundle = await this.service.bundles.exportResearchBundle(body);
          this.sendJson(res, 201, bundle, correlationId);
          return true;
        }
        if (method === "POST" && resource === "verify") {
          const body = await this.readJsonBody(req);
          const isValid = await this.service.bundles.verifyBundle(body);
          this.sendJson(res, 200, { verified: isValid, bundleId: body.id }, correlationId);
          return true;
        }
        if (method === "POST" && resource === "import") {
          const body = await this.readJsonBody(req);
          const importResult = await this.service.bundles.importResearchBundle(body);
          this.sendJson(res, 200, importResult, correlationId);
          return true;
        }
      }

      // -------------------------------------------------------------
      // Comparisons & Statistical Governance Routes
      // -------------------------------------------------------------
      if (domain === "comparisons") {
        if (method === "POST" && resource === "match") {
          const body = await this.readJsonBody<{
            runs: any[];
            targetMetric: string;
            dimensions?: any[];
          }>(req);
          const matched = await this.service.comparisons.matchControls(
            body.runs,
            body.targetMetric,
            body.dimensions
          );
          this.sendJson(res, 200, matched, correlationId);
          return true;
        }
        if (method === "POST" && resource === "contrast") {
          const body = await this.readJsonBody<{ targetMetric: string; matchedData: any }>(req);
          const contrast = await this.service.comparisons.computeStatisticalContrast(
            body.targetMetric,
            body.matchedData
          );
          this.sendJson(res, 200, contrast, correlationId);
          return true;
        }
        if (method === "POST" && resource === "robustness") {
          const body = await this.readJsonBody<{
            runs: any[];
            targetMetric: string;
            options?: any;
          }>(req);
          const robustness = await this.service.comparisons.runRobustnessDiagnostics(
            body.runs,
            body.targetMetric,
            body.options
          );
          this.sendJson(res, 200, robustness, correlationId);
          return true;
        }
        if (method === "POST" && (resource === "policy" || resource === "governance-decision")) {
          const body = await this.readJsonBody(req);
          const decision = await this.service.comparisons.evaluateGovernanceDecision(body);
          this.sendJson(res, 200, decision, correlationId);
          return true;
        }
      }

      // -------------------------------------------------------------
      // Evaluations Ledger Routes
      // -------------------------------------------------------------
      if (domain === "evaluations") {
        if (method === "POST" && resource === "record") {
          const body = await this.readJsonBody(req);
          const entry = await this.service.evaluations.recordEvaluation(body);
          this.sendJson(res, 201, entry, correlationId);
          return true;
        }
        if (method === "GET" && !resource) {
          const history = await this.service.evaluations.listEvaluations();
          this.sendJson(res, 200, history, correlationId);
          return true;
        }
        if (method === "GET" && resource === "verify-ledger") {
          const audit = await this.service.evaluations.verifyLedgerIntegrity();
          this.sendJson(res, 200, audit, correlationId);
          return true;
        }
      }

      // -------------------------------------------------------------
      // Runs Service Routes
      // -------------------------------------------------------------
      if (domain === "runs") {
        if (method === "POST" && resource === "ingest") {
          const body = await this.readJsonBody(req);
          const ingestResult = await this.service.runs.ingestBenchmarkRun(body);
          this.sendJson(res, 201, ingestResult, correlationId);
          return true;
        }
        if (method === "GET" && !resource) {
          const runs = await this.service.runs.listRuns();
          this.sendJson(res, 200, runs, correlationId);
          return true;
        }
        if (method === "GET" && resource) {
          const run = await this.service.runs.getRun(resource);
          if (!run) {
            this.sendError(res, 404, "RUN_NOT_FOUND", `Run '${resource}' not found`, correlationId);
            return true;
          }
          this.sendJson(res, 200, run, correlationId);
          return true;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.sendError(res, 500, "SERVICE_ERROR", msg, correlationId);
      return true;
    }

    return false;
  }

  private async serveStaticFile(pathname: string, res: ServerResponse): Promise<boolean> {
    if (!this.staticDir) return false;
    try {
      const normalizedPath = pathname === "/" ? "/index.html" : pathname;
      const filePath = join(this.staticDir, normalizedPath);

      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        return false;
      }

      const content = await readFile(filePath);
      const ext = extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": content.length
      });
      res.end(content);
      return true;
    } catch {
      return false;
    }
  }

  private async readJsonBody<T = any>(req: IncomingMessage): Promise<T> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        try {
          const raw = Buffer.concat(chunks).toString("utf8").trim();
          if (!raw) {
            resolve({} as T);
            return;
          }
          resolve(JSON.parse(raw) as T);
        } catch (err) {
          reject(
            new Error(
              `Malformed JSON request body: ${err instanceof Error ? err.message : String(err)}`
            )
          );
        }
      });
      req.on("error", reject);
    });
  }

  private sendJson<T>(
    res: ServerResponse,
    statusCode: number,
    data: T,
    correlationId: string
  ): void {
    const payload: ApiResponse<T> = {
      success: statusCode >= 200 && statusCode < 300,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
        versionKind: "schema",
        releaseVersion: SEMANTIQ_RELEASE_VERSION,
        schemaVersion: PRODUCT_CONTRACTS_SCHEMA_VERSION,
        maturity: SEMANTIQ_MATURITY,
        correlationId
      }
    };
    const body = JSON.stringify(payload);
    res.writeHead(statusCode, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body)
    });
    res.end(body);
  }

  private sendError(
    res: ServerResponse,
    statusCode: number,
    code: string,
    message: string,
    correlationId: string,
    details?: unknown
  ): void {
    const payload: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        details
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
        versionKind: "schema",
        releaseVersion: SEMANTIQ_RELEASE_VERSION,
        schemaVersion: PRODUCT_CONTRACTS_SCHEMA_VERSION,
        maturity: SEMANTIQ_MATURITY,
        correlationId
      }
    };
    const body = JSON.stringify(payload);
    res.writeHead(statusCode, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body)
    });
    res.end(body);
  }
}
