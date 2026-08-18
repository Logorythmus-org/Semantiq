import { describe, it, expect } from "vitest";
import { SemantIQCliEngine } from "../../packages/semantiq/src/cli.js";

describe("SemantIQ CLI Application Service Integration", () => {
  const engine = new SemantIQCliEngine();

  describe("1. Legacy CLI Behavior Preservation", () => {
    it("returns version string independently", () => {
      const result = engine.executeCommand("version");
      expect(result.success).toBe(true);
      expect(result.output).toContain("SemantIQ Benchmarks v1.0.0");
    });

    it("returns help listing all commands independently", () => {
      const result = engine.executeCommand("help");
      expect(result.success).toBe(true);
      expect(result.output).toContain("doctor");
      expect(result.output).toContain("smoke");
      expect(result.output).toContain("benchmark");
      expect(result.output).toContain("patterns");
      expect(result.output).toContain("claims");
    });

    it("runs doctor command and confirms environment validity", () => {
      const result = engine.executeCommand("doctor");
      expect(result.success).toBe(true);
      expect(result.output).toContain("DOCTOR PASSED");
    });

    it("runs smoke command and confirms core evaluation primitives", () => {
      const result = engine.executeCommand("smoke");
      expect(result.success).toBe(true);
      expect(result.output).toContain("SMOKE PASSED");
    });

    it("returns offline mode active in config", () => {
      const config = engine.getConfig();
      expect(config.isOfflineMode).toBe(true);
    });

    it("runs validate command and confirms boundary validator clean", () => {
      const result = engine.executeCommand("validate");
      expect(result.success).toBe(true);
      expect(result.output).toContain("VALIDATION CLEAN");
    });
  });

  describe("2. Service-Backed Command Families (Async & Sync)", () => {
    it("executes 'patterns list' and 'patterns recommend' commands", async () => {
      const listRes = await engine.executeCommandAsync("patterns", ["list"]);
      expect(listRes.success).toBe(true);
      expect(listRes.output).toContain("[PATTERNS]");
      expect(Array.isArray(listRes.data)).toBe(true);

      const recRes = await engine.executeCommandAsync("patterns", ["recommend"]);
      expect(recRes.success).toBe(true);
      expect(recRes.output).toContain("[PATTERNS RECOMMENDATIONS]");
    });

    it("executes 'evidence metrics' and 'evidence extract-failures' commands", async () => {
      const metricsRes = await engine.executeCommandAsync("evidence", ["metrics"]);
      expect(metricsRes.success).toBe(true);
      expect(metricsRes.output).toContain("[EVIDENCE METRICS]");

      const failRes = await engine.executeCommandAsync("evidence", ["extract-failures"]);
      expect(failRes.success).toBe(true);
      expect(failRes.output).toContain("[EVIDENCE FAILURES]");
    });

    it("executes 'claims validate-language' and 'claims draft' commands", async () => {
      const validRes = await engine.executeCommandAsync("claims", [
        "validate-language",
        "Memory isolation is associated with reduced leakage."
      ]);
      expect(validRes.success).toBe(true);
      expect(validRes.output).toContain("[CLAIMS VALID]");

      const invalidRes = await engine.executeCommandAsync("claims", [
        "validate-language",
        "Heartbeat causes zero downtime."
      ]);
      expect(invalidRes.success).toBe(false);
      expect(invalidRes.output).toContain("[CLAIMS VIOLATION]");

      const draftRes = await engine.executeCommandAsync("claims", ["draft"]);
      expect(draftRes.success).toBe(true);
      expect(draftRes.output).toContain("[CLAIMS DRAFTED]");
    });

    it("executes 'reviews queue' and 'reviews audit-verify' commands", async () => {
      const queueRes = await engine.executeCommandAsync("reviews", ["queue"]);
      expect(queueRes.success).toBe(true);
      expect(queueRes.output).toContain("[REVIEWS QUEUE]");

      const auditRes = await engine.executeCommandAsync("reviews", ["audit-verify"]);
      expect(auditRes.success).toBe(true);
      expect(auditRes.output).toContain("[REVIEWS AUDIT]");
    });

    it("executes 'studies list-sources' and 'studies list-cases' commands", async () => {
      const sourcesRes = await engine.executeCommandAsync("studies", ["list-sources"]);
      expect(sourcesRes.success).toBe(true);
      expect(sourcesRes.output).toContain("[STUDIES SOURCES]");

      const casesRes = await engine.executeCommandAsync("studies", ["list-cases"]);
      expect(casesRes.success).toBe(true);
      expect(casesRes.output).toContain("[STUDIES CASES]");
    });

    it("executes 'bundles export' command", async () => {
      const bundleRes = await engine.executeCommandAsync("bundles", ["export"]);
      expect(bundleRes.success).toBe(true);
      expect(bundleRes.output).toContain("[BUNDLES EXPORTED]");
    });

    it("executes 'comparisons policy' command", async () => {
      const compRes = await engine.executeCommandAsync("comparisons", ["policy"]);
      expect(compRes.success).toBe(true);
      expect(compRes.output).toContain("[COMPARISONS POLICY]");
    });

    it("executes 'evaluations verify-ledger' command", async () => {
      const evalRes = await engine.executeCommandAsync("evaluations", ["verify-ledger"]);
      expect(evalRes.success).toBe(true);
      expect(evalRes.output).toContain("[EVALUATIONS LEDGER]");
    });

    it("executes 'runs ingest' command", async () => {
      const runRes = await engine.executeCommandAsync("runs", ["ingest"]);
      expect(runRes.success).toBe(true);
      expect(runRes.output).toContain("[RUNS INGESTED]");
    });
  });

  describe("3. Presentation Formatting & Non-Canonical Output", () => {
    it("formats output as JSON when --json argument is passed", async () => {
      const jsonRes = await engine.executeCommandAsync("patterns", ["list", "--json"]);
      expect(jsonRes.success).toBe(true);
      const parsed = JSON.parse(jsonRes.output);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it("verifies CLI engine consumes application service without owning domain logic", () => {
      const service = engine.getService();
      expect(service.patterns).toBeDefined();
      expect(service.claims).toBeDefined();
      expect(service.evidence).toBeDefined();
      expect(service.reviews).toBeDefined();
    });
  });
});
