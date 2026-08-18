import type { CollectiveReplayBundle } from "./multi-agent-model.js";
import type { InteractionSchema } from "./interaction-schema.js";

export type ReplayFailureClass =
  | "missing_or_altered_messages"
  | "changed_delegation"
  | "changed_authority"
  | "missing_context_versions"
  | "reordered_events"
  | "evidence_checksum_mismatch"
  | "altered_responsibility_edges"
  | "incomplete_recovery"
  | "nondeterministic_inputs";

export interface ReplayViolationReport {
  readonly violationId: string;
  readonly failureClass: ReplayFailureClass;
  readonly description: string;
  readonly timestamp: string;
}

export class CollectiveReplayValidator {
  validateReplay(
    bundle: CollectiveReplayBundle,
    replayedInteractions: readonly InteractionSchema[]
  ): { valid: boolean; violations: readonly ReplayViolationReport[] } {
    const violations: ReplayViolationReport[] = [];

    // 1. Reordered Events Check
    let lastMonotonic = 0;
    for (const ix of replayedInteractions) {
      if (ix.monotonicIndex <= lastMonotonic) {
        violations.push({
          violationId: `viol_order_${ix.interactionId}`,
          failureClass: "reordered_events",
          description: `Interaction '${ix.interactionId}' monotonic index ${ix.monotonicIndex} <= previous ${lastMonotonic}.`,
          timestamp: ix.timestamp
        });
      }
      lastMonotonic = ix.monotonicIndex;
    }

    // 2. Missing or Altered Messages Check
    if (
      bundle.events &&
      bundle.events.length > 0 &&
      replayedInteractions.length !== bundle.events.length
    ) {
      violations.push({
        violationId: `viol_count_${bundle.replayBundleId}`,
        failureClass: "missing_or_altered_messages",
        description: `Replayed interaction count (${replayedInteractions.length}) differs from original bundle event count (${bundle.events.length}).`,
        timestamp: new Date().toISOString()
      });
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }
}
