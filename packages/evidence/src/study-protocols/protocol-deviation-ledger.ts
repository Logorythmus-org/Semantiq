/**
 * @package @semantiq/evidence
 * Protocol Deviation Ledger & Evidence Level Capping Engine
 *
 * Invariants:
 * 1. Deviation ledger is append-only and cryptographically hash-chained.
 * 2. Material deviations during or post-hoc cap evidence level to prevent false claims of confirmatory replication.
 * 3. Preregistration ensures protocol transparency, not truth.
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import {
  EPISTEMIC_PREREGISTRATION_DISCLAIMER,
  type EvidenceLevelCap,
  type ProtocolDeviation,
  type ProtocolDeviationSeverity,
  type ProtocolDeviationTiming,
  type ProtocolExecutionSummary,
  type StudyProtocol
} from "./types.js";

export interface RecordDeviationOptions {
  readonly protocolId: string;
  readonly timing: ProtocolDeviationTiming;
  readonly severity: ProtocolDeviationSeverity;
  readonly description: string;
  readonly rationale: string;
  readonly recordedBy: string;
}

export class ProtocolDeviationLedger {
  private readonly deviations = new Map<string, ProtocolDeviation[]>();
  private readonly protocols = new Map<string, StudyProtocol>();

  public registerProtocol(protocol: StudyProtocol): void {
    this.protocols.set(protocol.protocolId, Object.freeze({ ...protocol }));
  }

  public getProtocol(protocolId: string): StudyProtocol | undefined {
    return this.protocols.get(protocolId);
  }

  public recordDeviation(options: RecordDeviationOptions): ProtocolDeviation {
    const list = this.deviations.get(options.protocolId) ?? [];
    const previous = list.length > 0 ? list[list.length - 1] : undefined;
    const previousHash = previous ? previous.deviationHash : "GENESIS_DEVIATION_HASH";

    const deviationId = `dev_${computeSha256(`${options.protocolId}:${list.length}:${options.description}`).slice(0, 16)}`;
    const recordedAt = new Date().toISOString();

    const deviationHash = computeSha256(
      `${deviationId}:${options.protocolId}:${options.timing}:${options.severity}:${options.description}:${options.rationale}:${options.recordedBy}:${recordedAt}:${previousHash}`
    );

    const deviation: ProtocolDeviation = {
      deviationId,
      protocolId: options.protocolId,
      timing: options.timing,
      severity: options.severity,
      description: options.description,
      rationale: options.rationale,
      recordedAt,
      recordedBy: options.recordedBy,
      deviationHash,
      previousDeviationHash: previousHash
    };

    const frozen = Object.freeze(deviation);
    list.push(frozen);
    this.deviations.set(options.protocolId, list);
    return frozen;
  }

  public listDeviations(protocolId: string): readonly ProtocolDeviation[] {
    return Object.freeze([...(this.deviations.get(protocolId) ?? [])]);
  }

  /**
   * Verifies the cryptographic hash-chain of deviations for a given protocol.
   */
  public verifyDeviationChain(protocolId: string): boolean {
    const list = this.deviations.get(protocolId) ?? [];
    let prevHash = "GENESIS_DEVIATION_HASH";

    for (const dev of list) {
      if (dev.previousDeviationHash !== prevHash) {
        return false;
      }
      const expectedHash = computeSha256(
        `${dev.deviationId}:${dev.protocolId}:${dev.timing}:${dev.severity}:${dev.description}:${dev.rationale}:${dev.recordedBy}:${dev.recordedAt}:${prevHash}`
      );
      if (dev.deviationHash !== expectedHash) {
        return false;
      }
      prevHash = dev.deviationHash;
    }

    return true;
  }

  /**
   * Evaluates evidence level capping based on protocol status and recorded deviations.
   * INVARIANT: Material deviations during or post-hoc cap evidence level.
   */
  public evaluateEvidenceCap(protocolId: string): ProtocolExecutionSummary {
    const protocol = this.protocols.get(protocolId);
    const deviations = this.listDeviations(protocolId);

    const isFrozen = protocol?.status === "frozen" || protocol?.status === "executed";
    const isChainValid = this.verifyDeviationChain(protocolId);

    let materialCount = 0;
    let criticalCount = 0;
    let postHocOrDuringMaterial = false;

    for (const d of deviations) {
      if (d.severity === "critical") {
        criticalCount++;
      } else if (d.severity === "material") {
        materialCount++;
        if (d.timing === "during_execution" || d.timing === "post_hoc") {
          postHocOrDuringMaterial = true;
        }
      }
    }

    let evidenceCap: EvidenceLevelCap = "NO_CAP";
    let capReason: string | undefined;

    if (!protocol) {
      evidenceCap = "CAP_E1_CONTESTED";
      capReason = "Protocol not registered in deviation ledger.";
    } else if (!isFrozen) {
      evidenceCap = "CAP_E1_CONTESTED";
      capReason = "Protocol was not frozen prior to study execution (exploratory only).";
    } else if (!isChainValid) {
      evidenceCap = "CAP_E1_CONTESTED";
      capReason = "Deviation audit hash chain verification failed (tamper detected).";
    } else if (criticalCount > 0) {
      evidenceCap = "CAP_E1_CONTESTED";
      capReason = `${criticalCount} critical deviation(s) recorded in protocol execution.`;
    } else if (postHocOrDuringMaterial) {
      evidenceCap = "CAP_E2_LOCAL_CONSISTENT";
      capReason = `${materialCount} material deviation(s) occurred during execution or post-hoc, capping confirmatory evidence to local consistency.`;
    }

    const summary: ProtocolExecutionSummary = {
      protocolId,
      preregistrationFrozen: isFrozen,
      protocolHashValid: isChainValid,
      totalDeviations: deviations.length,
      materialDeviationsCount: materialCount,
      criticalDeviationsCount: criticalCount,
      evidenceLevelCap: evidenceCap,
      capReason,
      evaluatedAt: new Date().toISOString(),
      epistemicDisclaimer: EPISTEMIC_PREREGISTRATION_DISCLAIMER
    };

    return Object.freeze(summary);
  }
}
