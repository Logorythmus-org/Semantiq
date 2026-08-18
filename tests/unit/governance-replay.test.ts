import { describe, it, expect } from "vitest";
import type { GovernanceReplayBundle } from "../../packages/semantiq/src/governance-replay.js";
import { GovernanceReplayVerifier } from "../../packages/semantiq/src/governance-replay.js";

describe("Governance Replay Validation (Prompt 10.13)", () => {
  const verifier = new GovernanceReplayVerifier();

  const originalBundle: GovernanceReplayBundle = {
    bundleId: "grap_101",
    sessionTarget: "session_target_1",
    policyId: "pol_security_v1",
    policyVersion: "v1.0.0",
    approvalChecksum: { uri: "file:///tmp/app.json", algorithm: "sha256", hash: "apphash123" },
    decisionChecksum: { uri: "file:///tmp/dec.json", algorithm: "sha256", hash: "dechash123" },
    incidentChecksum: { uri: "file:///tmp/inc.json", algorithm: "sha256", hash: "inchash123" },
    recoveryCompleted: true,
    timestamp: "2026-08-01T14:00:00Z"
  };

  it("approves compliant governance replay verification", () => {
    const failure = verifier.verifyReplay(originalBundle, { ...originalBundle });
    expect(failure).toBeUndefined();
  });

  it("detects missing policy / bundle failure", () => {
    const failure = verifier.verifyReplay(originalBundle, undefined);
    expect(failure).toBeDefined();
    expect(failure?.failureClass).toBe("missing_policy");
  });

  it("detects changed policy version mismatch", () => {
    const changedVersion: GovernanceReplayBundle = {
      ...originalBundle,
      policyVersion: "v2.0.0" // Changed version
    };
    const failure = verifier.verifyReplay(originalBundle, changedVersion);
    expect(failure).toBeDefined();
    expect(failure?.failureClass).toBe("changed_policy_version");
  });

  it("detects altered approval checksum", () => {
    const alteredApp: GovernanceReplayBundle = {
      ...originalBundle,
      approvalChecksum: { ...originalBundle.approvalChecksum, hash: "tamperedhash" }
    };
    const failure = verifier.verifyReplay(originalBundle, alteredApp);
    expect(failure).toBeDefined();
    expect(failure?.failureClass).toBe("altered_approval");
  });

  it("detects changed decision evidence checksum", () => {
    const changedDec: GovernanceReplayBundle = {
      ...originalBundle,
      decisionChecksum: { ...originalBundle.decisionChecksum, hash: "tampereddechash" }
    };
    const failure = verifier.verifyReplay(originalBundle, changedDec);
    expect(failure).toBeDefined();
    expect(failure?.failureClass).toBe("changed_decision_evidence");
  });

  it("detects tampered incident checksum", () => {
    const tamperedInc: GovernanceReplayBundle = {
      ...originalBundle,
      incidentChecksum: { ...originalBundle.incidentChecksum, hash: "tamperedinchash" }
    };
    const failure = verifier.verifyReplay(originalBundle, tamperedInc);
    expect(failure).toBeDefined();
    expect(failure?.failureClass).toBe("tampered_incident");
  });

  it("detects incomplete recovery failure", () => {
    const incompRec: GovernanceReplayBundle = {
      ...originalBundle,
      recoveryCompleted: false
    };
    const failure = verifier.verifyReplay(originalBundle, incompRec);
    expect(failure).toBeDefined();
    expect(failure?.failureClass).toBe("incomplete_recovery");
  });
});
