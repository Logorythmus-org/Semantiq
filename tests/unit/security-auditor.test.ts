import { describe, it, expect } from "vitest";
import { SecurityAuditorEngine } from "../../packages/semantiq/src/security-auditor.js";

describe("Security, Privacy, and Repository Hygiene Audit (Prompt 11.13)", () => {
  const engine = new SecurityAuditorEngine();

  it("scans clean content with zero secrets or telemetry", () => {
    const res = engine.scanContent('export const version = "0.1.0-alpha.1";');
    expect(res.secretsFound).toBe(0);
    expect(res.telemetryFound).toBe(0);
  });

  it("detects GitHub token secret", () => {
    const res = engine.scanContent('const token = "ghp_123456789012345678901234567890123456";');
    expect(res.secretsFound).toBe(1);
  });

  it("detects telemetry keywords", () => {
    const res = engine.scanContent('analytics.track("event");');
    expect(res.telemetryFound).toBe(1);
  });

  it("detects forbidden file paths", () => {
    const res = engine.scanFilePaths([".git/config", "Tech-Club-Architect-Blueprint.md"]);
    expect(res.hiddenFileViolations).toBe(1);
    expect(res.repoContaminations).toBe(1);
  });

  it("runs full security audit and passes clean candidate", () => {
    const contents = ["export class SemantIQCliEngine {}", "const config = { offlineMode: true };"];
    const paths = [
      "packages/semantiq/src/index.ts",
      "LICENSE",
      "products/semantiq/extraction-manifest.json"
    ];
    const report = engine.runFullSecurityAudit(contents, paths);
    expect(report.isClean).toBe(true);
    expect(report.secretCount).toBe(0);
    expect(report.telemetryViolationCount).toBe(0);
    expect(report.hiddenFileViolationCount).toBe(0);
    expect(report.repoContaminationCount).toBe(0);
  });
});
