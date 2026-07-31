import { describe, expect, it } from "vitest";
import { LocalAlphaRuntime } from "../../packages/alpha-runtime/src/index.js";

describe("Quality Pass Audit Tests", () => {
  const runtime = new LocalAlphaRuntime();

  it("verifies security audit rules", () => {
    const findings = runtime.runSecurityAudit();
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some((f) => f.includes("Safe defaults"))).toBe(true);
  });

  it("verifies privacy audit rules", () => {
    const findings = runtime.runPrivacyAudit();
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some((f) => f.includes("Telemetry disabled"))).toBe(true);
  });

  it("verifies performance targets", () => {
    const profile = runtime.profilePerformance();
    expect(profile.startupMs).toBeLessThan(2000);
    expect(profile.semantiqMs).toBeLessThan(100);
  });

  it("verifies accessibility audit checks", () => {
    const checks = runtime.auditAccessibility();
    expect(checks.length).toBeGreaterThan(0);
    expect(checks).toContain("keyboard navigation review");
  });

  it("verifies compliance dashboard status", () => {
    const dash = runtime.getComplianceDashboard();
    expect(dash.aiFeatures.length).toBeGreaterThan(0);
    expect(dash.telemetryStatus).toBe("disabled");
  });
});
