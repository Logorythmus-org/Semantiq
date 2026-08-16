import type { EvidenceChecksum } from "./event-schema.js";

export type ContextAnomalyClass =
  | "stale_reads"
  | "conflicting_writes"
  | "lost_updates"
  | "unauthorized_writes"
  | "partial_propagation"
  | "inconsistent_replicas"
  | "context_poisoning"
  | "provenance_loss"
  | "silent_overwrite"
  | "divergent_interpretation";

export interface ProvenanceRecord {
  readonly provenanceId: string;
  readonly authorAgentId: string;
  readonly originEventId: string;
  readonly timestamp: string;
}

export interface ReadWriteEvent {
  readonly eventId: string;
  readonly agentId: string;
  readonly action: "read" | "write" | "patch" | "merge";
  readonly targetKey: string;
  readonly versionAtAction: number;
  readonly timestamp: string;
  readonly provenance?: ProvenanceRecord;
}

export interface ContextMergeRecord {
  readonly mergeId: string;
  readonly targetKey: string;
  readonly mergePolicy: "last_write_wins" | "resolver_override" | "consensus_merge";
  readonly selectedVersion: number;
  readonly rejectedVersions: readonly number[];
  readonly resolverAgentId: string;
  readonly evidenceUsed: readonly EvidenceChecksum[];
  readonly unresolvedConflict: boolean;
  readonly rollbackRef?: string;
}

export interface ContextAnomalyReport {
  readonly anomalyId: string;
  readonly anomalyClass: ContextAnomalyClass;
  readonly targetKey: string;
  readonly description: string;
  readonly timestamp: string;
}

/**
 * Shared Memory Integrity Analyzer.
 * Detects stale reads, conflicting writes, lost updates, unauthorized writes, and provenance loss.
 */
export class SharedMemoryAnalyzer {
  private readonly latestVersions = new Map<string, number>();
  private readonly activeWriters = new Map<string, string>(); // key -> writePermit

  evaluateReadWrite(
    event: ReadWriteEvent,
    allowedWriters: readonly string[] = []
  ): ContextAnomalyReport | undefined {
    const currentVersion = this.latestVersions.get(event.targetKey) ?? 0;

    // 1. Unauthorized Write Check
    if (
      (event.action === "write" || event.action === "patch") &&
      allowedWriters.length > 0 &&
      !allowedWriters.includes(event.agentId)
    ) {
      return {
        anomalyId: `anom_auth_${event.eventId}`,
        anomalyClass: "unauthorized_writes",
        targetKey: event.targetKey,
        description: `Agent '${event.agentId}' lacks write permission for key '${event.targetKey}'.`,
        timestamp: event.timestamp
      };
    }

    // 2. Stale Read Check
    if (event.action === "read" && event.versionAtAction < currentVersion) {
      return {
        anomalyId: `anom_stale_${event.eventId}`,
        anomalyClass: "stale_reads",
        targetKey: event.targetKey,
        description: `Stale read detected: Agent '${event.agentId}' read version ${event.versionAtAction} but current version is ${currentVersion}.`,
        timestamp: event.timestamp
      };
    }

    // 3. Conflicting Write / Lost Update Check
    if (
      (event.action === "write" || event.action === "patch") &&
      event.versionAtAction < currentVersion
    ) {
      return {
        anomalyId: `anom_conflict_${event.eventId}`,
        anomalyClass: "conflicting_writes",
        targetKey: event.targetKey,
        description: `Conflicting write / lost update: Agent '${event.agentId}' wrote at version ${event.versionAtAction} but latest version is ${currentVersion}.`,
        timestamp: event.timestamp
      };
    }

    // 4. Provenance Loss Check
    if ((event.action === "write" || event.action === "patch") && !event.provenance) {
      return {
        anomalyId: `anom_prov_${event.eventId}`,
        anomalyClass: "provenance_loss",
        targetKey: event.targetKey,
        description: `Provenance loss: Write to key '${event.targetKey}' lacks author provenance record.`,
        timestamp: event.timestamp
      };
    }

    // Update state on clean write/patch
    if (event.action === "write" || event.action === "patch" || event.action === "merge") {
      this.latestVersions.set(event.targetKey, currentVersion + 1);
    }

    return undefined;
  }
}
