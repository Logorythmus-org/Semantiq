import { describe, it, expect } from "vitest";
import { SandboxPhaseSecurityAuditEngine } from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Full Red-Team Security Audit Architecture", () => {
  const engine = new SandboxPhaseSecurityAuditEngine();

  it("executes full 10-vector red-team penetration audit and certifies hardened posture", () => {
    const report = engine.executePhaseAudit("1.0.0");

    expect(report.phase).toBe("SANDBOX_PHASE");
    expect(report.auditedVersion).toBe("1.0.0");
    expect(report.overallStatus).toBe("AUDIT_PASSED_HARDENED");
    expect(report.threatVectorsTested).toBe(10);
    expect(report.threatsBlocked).toBe(10);
    expect(report.zeroDaysFound).toBe(0);
    expect(report.ecosystemHardeningScore).toBe(1.0);
    expect(report.securityAuditorSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it("formats comprehensive Markdown security audit certificate", () => {
    const report = engine.executePhaseAudit("1.0.0");
    const markdown = engine.formatPhaseAuditMarkdown(report);

    expect(markdown).toContain("# SemantIQ Sandbox Phase Comprehensive Security Audit Certificate");
    expect(markdown).toContain("AUDIT_PASSED_HARDENED");
    expect(markdown).toContain("100.0%");
    expect(markdown).toContain("Full Red-Team Threat Assault Matrix");
    expect(markdown).toContain("FILESYSTEM_ISOLATION");
    expect(markdown).toContain("NETWORK_EGRESS");
    expect(markdown).toContain("CREDENTIAL_CONTAINMENT");
    expect(markdown).toContain("BENCHMARK_INTEGRITY");
    expect(markdown).toContain("ANTI_GAMING");
    expect(markdown).toContain("TELEMETRY_FORGERY");
    expect(markdown).toContain("RESOURCE_EXHAUSTION");
    expect(markdown).toContain("TRACE_TAMPERING");
    expect(markdown).toContain("PROVIDER_SUPPLY_CHAIN");
    expect(markdown).toContain("EPHEMERALITY_LEAK");
    expect(markdown).toContain("Lead Security Auditor Signature");
  });
});
