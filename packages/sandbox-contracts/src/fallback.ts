/**
 * @package @tech-club/sandbox-contracts
 * Provider Failure, Fallback Routing, and Partial-Run Semantics
 */

export type FailureCategory =
  | "INFRASTRUCTURE_TRANSIENT"
  | "INFRASTRUCTURE_FATAL"
  | "AGENT_BEHAVIORAL_FAULT"
  | "SECURITY_VIOLATION"
  | "TIMEOUT_EXCEEDED";

export type FallbackStrategy =
  "RETRY_SAME_PROVIDER" | "FALLBACK_NEXT_PROVIDER" | "HALT_WITH_PARTIAL_EVIDENCE" | "QUARANTINE";

export interface FallbackPolicy {
  readonly primaryProviderId: string;
  readonly fallbackProviderIds: readonly string[];
  readonly maxRetriesPerProvider: number;
  readonly backoffBaseMs: number;
  readonly preservePartialEvidence: boolean;
}

export interface PartialRunEvidenceRecord {
  readonly instanceId: string;
  readonly providerId: string;
  readonly failureCategory: FailureCategory;
  readonly partialStdout: string;
  readonly partialStderr: string;
  readonly capturedCheckpointsCount: number;
  readonly lastCompletedActionId?: string | undefined;
  readonly sealedAt: string;
  readonly isPreserved: boolean;
}

export interface FallbackDecision {
  readonly action: FallbackStrategy;
  readonly targetProviderId?: string | undefined;
  readonly retryCount: number;
  readonly delayMs: number;
  readonly reason: string;
}

/**
 * Fallback Routing Engine.
 * Evaluates provider failure classifications, orchestrates fallback routing
 * and ensures partial-run evidence preservation.
 */
export class FallbackRoutingEngine {
  private readonly retryState: Map<string, number> = new Map();

  evaluateFailure(
    providerId: string,
    category: FailureCategory,
    policy: FallbackPolicy
  ): FallbackDecision {
    const currentRetries = this.retryState.get(providerId) ?? 0;

    // 1. Security violations must always quarantine immediately
    if (category === "SECURITY_VIOLATION") {
      return {
        action: "QUARANTINE",
        retryCount: currentRetries,
        delayMs: 0,
        reason: "Security isolation violation detected; instance quarantined."
      };
    }

    // 2. Agent behavioral faults belong to the agent's evaluation score (no infra fallback)
    if (category === "AGENT_BEHAVIORAL_FAULT") {
      return {
        action: "HALT_WITH_PARTIAL_EVIDENCE",
        retryCount: currentRetries,
        delayMs: 0,
        reason: "Agent-induced error or syntax failure; sealed for behavioral scoring."
      };
    }

    // 3. Transient infrastructure error: retry same provider if attempts remain
    if (category === "INFRASTRUCTURE_TRANSIENT" && currentRetries < policy.maxRetriesPerProvider) {
      const nextRetry = currentRetries + 1;
      this.retryState.set(providerId, nextRetry);
      const delayMs = policy.backoffBaseMs * Math.pow(2, currentRetries);

      return {
        action: "RETRY_SAME_PROVIDER",
        targetProviderId: providerId,
        retryCount: nextRetry,
        delayMs,
        reason: `Transient provider error; retry attempt ${nextRetry} of ${policy.maxRetriesPerProvider}.`
      };
    }

    // 4. Fatal infrastructure error or retries exhausted: route to next fallback provider
    const nextFallback = policy.fallbackProviderIds.find(
      (id) => id !== providerId && (this.retryState.get(id) ?? 0) === 0
    );
    if (nextFallback) {
      return {
        action: "FALLBACK_NEXT_PROVIDER",
        targetProviderId: nextFallback,
        retryCount: 0,
        delayMs: policy.backoffBaseMs,
        reason: `Primary provider ${providerId} failed (${category}); falling back to ${nextFallback}.`
      };
    }

    // 5. All fallbacks exhausted: halt and preserve partial evidence
    return {
      action: "HALT_WITH_PARTIAL_EVIDENCE",
      retryCount: currentRetries,
      delayMs: 0,
      reason: "All configured providers and retry quotas exhausted."
    };
  }

  sealPartialEvidence(
    instanceId: string,
    providerId: string,
    category: FailureCategory,
    stdout: string,
    stderr: string,
    checkpointsCount = 0,
    lastActionId?: string | undefined
  ): PartialRunEvidenceRecord {
    return {
      instanceId,
      providerId,
      failureCategory: category,
      partialStdout: stdout,
      partialStderr: stderr,
      capturedCheckpointsCount: checkpointsCount,
      lastCompletedActionId: lastActionId,
      sealedAt: new Date().toISOString(),
      isPreserved: true
    };
  }
}
