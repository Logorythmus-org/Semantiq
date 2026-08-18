import { describe, it, expect } from "vitest";
import {
  ProviderSecurityTestSuite,
  MockReferenceProviderAdapter
} from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Provider Security Test Suite Architecture", () => {
  const suite = new ProviderSecurityTestSuite();
  const adapter = new MockReferenceProviderAdapter();

  it("executes full 7-probe security attack battery on reference adapter", async () => {
    const report = await suite.runSecurityAudit(adapter);

    expect(report.totalProbes).toBe(7);
    expect(report.passedProbes).toBe(7);
    expect(report.criticalVulnerabilitiesCount).toBe(0);
    expect(report.securityPostureGrade).toBe("GRADE_A_HARDENED_ISOLATED");
    expect(report.auditSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);

    const probeIds = report.probes.map((p) => p.probeId);
    expect(probeIds).toContain("SEC-PROBE-01-PATH-TRAVERSAL");
    expect(probeIds).toContain("SEC-PROBE-02-EGRESS-LEAK");
    expect(probeIds).toContain("SEC-PROBE-03-ENV-SECRET-LEAK");
    expect(probeIds).toContain("SEC-PROBE-04-FORK-BOMB-THROTTLE");
    expect(probeIds).toContain("SEC-PROBE-05-PRIVILEGE-ESCALATION");
    expect(probeIds).toContain("SEC-PROBE-06-CLEANUP-EPHEMERALITY");
    expect(probeIds).toContain("SEC-PROBE-07-EVIDENCE-INTEGRITY");
  });

  it("formats comprehensive Markdown security audit report", async () => {
    const report = await suite.runSecurityAudit(adapter);
    const markdown = suite.formatSecurityAuditMarkdown(report);

    expect(markdown).toContain("# SemantIQ Provider Security Audit Report");
    expect(markdown).toContain("GRADE_A_HARDENED_ISOLATED");
    expect(markdown).toContain("Security Probe Results Matrix");
    expect(markdown).toContain("NETWORK_EGRESS_POLICY");
    expect(markdown).toContain("Auditor Cryptographic Signature");
  });
});
