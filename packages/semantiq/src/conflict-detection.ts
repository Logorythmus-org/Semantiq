import type { EvidenceChecksum } from "./event-schema.js";

export type ConflictDomain =
  | "goal"
  | "role"
  | "authority"
  | "permission"
  | "resource"
  | "timing"
  | "context"
  | "evidence"
  | "decision"
  | "execution"
  | "recovery"
  | "policy";

export type ConflictDetectionState =
  | "explicit"
  | "implicit"
  | "resolved"
  | "suppressed"
  | "ignored"
  | "recurring"
  | "cascading"
  | "unresolved_without_accountable_resolver";

export interface ConflictRecord {
  readonly conflictId: string;
  readonly domain: ConflictDomain;
  readonly state: ConflictDetectionState;
  readonly involvedAgentIds: readonly string[];
  readonly originEventIds: readonly string[];
  readonly conflictingEvidence: readonly EvidenceChecksum[];
  readonly description: string;
  readonly resolverAgentId?: string | undefined;
  readonly parentConflictId?: string | undefined; // For cascading conflicts
  readonly recurrenceCount: number;
  readonly timestamp: string;
}

export interface ConflictViolationReport {
  readonly violationId: string;
  readonly conflictId: string;
  readonly issueType:
    | "unresolved_without_resolver"
    | "suppressed_dissent"
    | "cascading_conflict"
    | "recurring_conflict";
  readonly description: string;
  readonly timestamp: string;
}

/**
 * Conflict & Contradiction Detection Engine.
 * Preserves conflicting evidence, traces origins, and flags unresolved or cascading conflicts.
 */
export class ConflictDetectionEngine {
  private readonly conflicts = new Map<string, ConflictRecord>();

  registerConflict(conflict: ConflictRecord): ConflictViolationReport | undefined {
    // 1. Unresolved Conflict without Accountable Resolver
    if (conflict.state === "unresolved_without_accountable_resolver" && !conflict.resolverAgentId) {
      return {
        violationId: `viol_unres_${conflict.conflictId}`,
        conflictId: conflict.conflictId,
        issueType: "unresolved_without_resolver",
        description: `Conflict '${conflict.conflictId}' in domain '${conflict.domain}' is unresolved without assigned resolver agent.`,
        timestamp: conflict.timestamp
      };
    }

    // 2. Cascading Conflict Check
    if (conflict.parentConflictId && this.conflicts.has(conflict.parentConflictId)) {
      return {
        violationId: `viol_casc_${conflict.conflictId}`,
        conflictId: conflict.conflictId,
        issueType: "cascading_conflict",
        description: `Cascading conflict detected: Conflict '${conflict.conflictId}' stems from parent conflict '${conflict.parentConflictId}'.`,
        timestamp: conflict.timestamp
      };
    }

    // 3. Recurring Conflict Check
    if (conflict.recurrenceCount > 1) {
      return {
        violationId: `viol_recur_${conflict.conflictId}`,
        conflictId: conflict.conflictId,
        issueType: "recurring_conflict",
        description: `Recurring conflict detected: Conflict '${conflict.conflictId}' has recurred ${conflict.recurrenceCount} times.`,
        timestamp: conflict.timestamp
      };
    }

    this.conflicts.set(conflict.conflictId, conflict);
    return undefined;
  }
}
