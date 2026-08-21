/**
 * @package @semantiq/evidence
 * Append-Only Hash-Chained Workbench Audit Log
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import type { WorkbenchAuditEntry } from "./types.js";

export class WorkbenchAuditLogEngine {
  public static readonly GENESIS_HASH = "0".repeat(64);
  private readonly entries: WorkbenchAuditEntry[] = [];

  public recordEvent(
    action: string,
    itemId: string,
    actorId: string,
    payload: unknown
  ): WorkbenchAuditEntry {
    const sequenceNumber = this.entries.length;
    const prevHash =
      sequenceNumber === 0
        ? WorkbenchAuditLogEngine.GENESIS_HASH
        : this.entries[sequenceNumber - 1]!.hash;

    const payloadDigest = computeSha256(JSON.stringify(payload));
    const timestamp = new Date().toISOString();

    const hashPayload = `${prevHash}:${sequenceNumber}:${action}:${itemId}:${actorId}:${payloadDigest}:${timestamp}`;
    const hash = computeSha256(hashPayload);

    const entry: WorkbenchAuditEntry = {
      sequenceNumber,
      action,
      itemId,
      actorId,
      payloadDigest,
      prevHash,
      hash,
      timestamp
    };

    const frozen = Object.freeze(entry);
    this.entries.push(frozen);
    return frozen;
  }

  public getEntries(): readonly WorkbenchAuditEntry[] {
    return Object.freeze([...this.entries]);
  }

  public getEntriesForItem(itemId: string): readonly WorkbenchAuditEntry[] {
    return Object.freeze(this.entries.filter((e) => e.itemId === itemId));
  }

  /**
   * Verifies the cryptographic integrity of the append-only hash chain.
   */
  public verifyChainIntegrity(): {
    isValid: boolean;
    verifiedEntriesCount: number;
    brokenSequenceNumber?: number | undefined;
  } {
    let prev = WorkbenchAuditLogEngine.GENESIS_HASH;

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i]!;

      if (entry.sequenceNumber !== i) {
        return { isValid: false, verifiedEntriesCount: i, brokenSequenceNumber: i };
      }

      if (entry.prevHash !== prev) {
        return { isValid: false, verifiedEntriesCount: i, brokenSequenceNumber: i };
      }

      const expectedPayload = `${entry.prevHash}:${entry.sequenceNumber}:${entry.action}:${entry.itemId}:${entry.actorId}:${entry.payloadDigest}:${entry.timestamp}`;
      const expectedHash = computeSha256(expectedPayload);

      if (entry.hash !== expectedHash) {
        return { isValid: false, verifiedEntriesCount: i, brokenSequenceNumber: i };
      }

      prev = entry.hash;
    }

    return {
      isValid: true,
      verifiedEntriesCount: this.entries.length
    };
  }
}
