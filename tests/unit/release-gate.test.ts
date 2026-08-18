import { describe, it, expect } from "vitest";
import { SandboxReleaseGateEngine } from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Final Release Gate Authorization", () => {
  const engine = new SandboxReleaseGateEngine();

  it("evaluates release gate and grants explicit PASS with zero blocking findings", () => {
    const record = engine.evaluateReleaseGate("v1.0.0-sandbox");

    expect(record.phase).toBe("SANDBOX_PHASE");
    expect(record.releaseTag).toBe("v1.0.0-sandbox");
    expect(record.verdict).toBe("PASS");
    expect(record.totalChecksEvaluated).toBe(30);
    expect(record.totalChecksPassed).toBe(30);
    expect(record.blockingFindingsCount).toBe(0);
    expect(record.securityPosture).toBe("HARDENED_ZERO_DAY_CLEAN");
    expect(record.economicBurdenScore).toBe(0.0);
    expect(record.releaseAuthoritySignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it("formats comprehensive Markdown release gate certificate", () => {
    const record = engine.evaluateReleaseGate("v1.0.0-sandbox");
    const markdown = engine.formatReleaseGateMarkdown(record);

    expect(markdown).toContain("# SemantIQ Sandbox Phase — Release Gate Authorization");
    expect(markdown).toContain("PASS");
    expect(markdown).toContain("v1.0.0-sandbox");
    expect(markdown).toContain("Mandatory Checks Evaluated");
    expect(markdown).toContain("30/30 (100% Passed)");
    expect(markdown).toContain("Zero Blockers");
    expect(markdown).toContain("Release Authority Cryptographic Signature");
  });
});
