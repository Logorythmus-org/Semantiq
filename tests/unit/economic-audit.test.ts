import { describe, it, expect } from "vitest";
import { SandboxEconomicAuditEngine } from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Final Economic Audit and Sustainability Architecture", () => {
  const engine = new SandboxEconomicAuditEngine();

  it("executes full 8-pillar economic audit and certifies release approval with zero vendor lock-in", () => {
    const report = engine.executeEconomicAudit("1.0.0");

    expect(report.phase).toBe("SANDBOX_PHASE");
    expect(report.auditedVersion).toBe("1.0.0");
    expect(report.verdict).toBe("APPROVED_RELEASE_CANDIDATE");
    expect(report.dimensionsAudited).toBe(8);
    expect(report.sustainableDimensionsCount).toBe(8);
    expect(report.lockInRiskScore).toBe(0.0);
    expect(report.localExecutionViabilityScore).toBe(1.0);
    expect(report.commercialExtensibilityScore).toBe(1.0);
    expect(report.releaseAuthoritySignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it("formats comprehensive Markdown economic audit report", () => {
    const report = engine.executeEconomicAudit("1.0.0");
    const markdown = engine.formatEconomicAuditMarkdown(report);

    expect(markdown).toContain("# SemantIQ Sandbox Phase Final Economic Audit & Release Decision");
    expect(markdown).toContain("APPROVED_RELEASE_CANDIDATE");
    expect(markdown).toContain("0.0%");
    expect(markdown).toContain("LOCAL_FIRST_ZERO_COST_PATH");
    expect(markdown).toContain("OPEN_SOURCE_SELF_HOSTING");
    expect(markdown).toContain("COMMERCIAL_PROVIDER_NEUTRALITY");
    expect(markdown).toContain("SEMANTIQ_CORE_INFRASTRUCTURE_BURDEN");
    expect(markdown).toContain("COST_TRANSPARENCY_AND_ACCOUNTING");
    expect(markdown).toContain("MARKETPLACE_AND_GRANT_FAIRNESS");
    expect(markdown).toContain("CROSS_PROVIDER_VARIANCE_NORMALIZATION");
    expect(markdown).toContain("AIR_GAPPED_ENTERPRISE_DEPLOYMENT");
    expect(markdown).toContain("Release Authority Cryptographic Signature");
  });
});
