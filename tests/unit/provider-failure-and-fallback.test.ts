import { describe, it, expect } from "vitest";
import { FallbackRoutingEngine } from "../../packages/sandbox-contracts/src/fallback.js";
import type { FallbackPolicy } from "../../packages/sandbox-contracts/src/fallback.js";

describe("SemantIQ Sandbox Phase — Provider Failure and Fallback", () => {
  const engine = new FallbackRoutingEngine();

  const policy: FallbackPolicy = {
    primaryProviderId: "opensandbox",
    fallbackProviderIds: ["docker-oci", "replay-adapter"],
    maxRetriesPerProvider: 2,
    backoffBaseMs: 100,
    preservePartialEvidence: true
  };

  it("retries same provider with exponential backoff on transient infrastructure error", () => {
    const decision1 = engine.evaluateFailure("opensandbox", "INFRASTRUCTURE_TRANSIENT", policy);
    expect(decision1.action).toBe("RETRY_SAME_PROVIDER");
    expect(decision1.targetProviderId).toBe("opensandbox");
    expect(decision1.retryCount).toBe(1);
    expect(decision1.delayMs).toBe(100);

    const decision2 = engine.evaluateFailure("opensandbox", "INFRASTRUCTURE_TRANSIENT", policy);
    expect(decision2.action).toBe("RETRY_SAME_PROVIDER");
    expect(decision2.retryCount).toBe(2);
    expect(decision2.delayMs).toBe(200);

    // Retries exhausted: should fall back to next provider
    const decision3 = engine.evaluateFailure("opensandbox", "INFRASTRUCTURE_TRANSIENT", policy);
    expect(decision3.action).toBe("FALLBACK_NEXT_PROVIDER");
    expect(decision3.targetProviderId).toBe("docker-oci");
  });

  it("immediately halts and seals partial evidence on agent behavioral fault without blaming infrastructure", () => {
    const decision = engine.evaluateFailure("opensandbox", "AGENT_BEHAVIORAL_FAULT", policy);
    expect(decision.action).toBe("HALT_WITH_PARTIAL_EVIDENCE");
    expect(decision.reason).toContain("Agent-induced error");

    const partialRecord = engine.sealPartialEvidence(
      "inst-001",
      "opensandbox",
      "AGENT_BEHAVIORAL_FAULT",
      "Command executed partially",
      "SyntaxError: unexpected token",
      2,
      "act-step-2"
    );

    expect(partialRecord.isPreserved).toBe(true);
    expect(partialRecord.failureCategory).toBe("AGENT_BEHAVIORAL_FAULT");
    expect(partialRecord.capturedCheckpointsCount).toBe(2);
    expect(partialRecord.lastCompletedActionId).toBe("act-step-2");
  });

  it("immediately quarantines instance upon security violation", () => {
    const decision = engine.evaluateFailure("opensandbox", "SECURITY_VIOLATION", policy);
    expect(decision.action).toBe("QUARANTINE");
  });
});
