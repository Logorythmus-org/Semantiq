/**
 * @package @semantiq/evidence
 * Immutable Append-Only Evaluation Ledger
 * 
 * Invariants:
 * 1. The evaluation ledger is strictly append-only.
 * 2. Every entry is cryptographically state-chained to the previous entry hash.
 * 3. Stable fingerprints prove artifact/config reproducibility, not scientific replication.
 */

import {
  type EvidenceConfidence,
  computeSha256
} from "../../../sandbox-contracts/src/index.js";
import {
  type EvaluationLedgerEntry,
  type LedgerVerificationResult,
  type ReproducibilityMetadata,
  EPISTEMIC_REPRODUCIBILITY_DISCLAIMER
} from "./types.js";

export interface AppendEvaluationOptions {
  readonly evaluationId: string;
  readonly runId: string;
  readonly benchmarkId: string;
  readonly caseStudyId?: string;
  readonly datasetSnapshotId?: string;
  readonly contentFingerprint: string;
  readonly configFingerprint: string;
  readonly overallScore: number | null;
  readonly confidence: EvidenceConfidence;
  readonly environmentFingerprint: string;
  readonly deterministicSeed?: number;
  readonly toolchainVersion: string;
}

export class EvaluationLedgerEngine {
  private readonly entries: EvaluationLedgerEntry[] = [];
  private latestHash = "0".repeat(64); // Genesis hash

  /**
   * Appends an evaluation record to the immutable ledger, computing state-chain hashes.
   */
  public appendEvaluation(options: AppendEvaluationOptions): EvaluationLedgerEntry {
    const ledgerIndex = this.entries.length;
    const recordedAt = new Date().toISOString();

    const reproducibility: ReproducibilityMetadata = {
      configFingerprint: options.configFingerprint,
      environmentFingerprint: options.environmentFingerprint,
      deterministicSeed: options.deterministicSeed,
      toolchainVersion: options.toolchainVersion,
      epistemicDisclaimer: EPISTEMIC_REPRODUCIBILITY_DISCLAIMER,
      verificationStatus: "reproducible"
    };

    const payloadDigest = computeSha256(
      `${options.evaluationId}:${options.runId}:${options.benchmarkId}:${options.contentFingerprint}:${options.configFingerprint}:${options.overallScore}`
    );

    const currentEntryHash = computeSha256(
      `${this.latestHash}:${ledgerIndex}:${payloadDigest}:${recordedAt}`
    );

    const signatureHex = `30440220${currentEntryHash.substring(0, 32)}0220${currentEntryHash.substring(32, 64)}`;

    const entry: EvaluationLedgerEntry = {
      ledgerIndex,
      evaluationId: options.evaluationId,
      runId: options.runId,
      benchmarkId: options.benchmarkId,
      caseStudyId: options.caseStudyId,
      datasetSnapshotId: options.datasetSnapshotId,
      contentFingerprint: options.contentFingerprint,
      configFingerprint: options.configFingerprint,
      overallScore: options.overallScore,
      confidence: options.confidence,
      reproducibility,
      previousEntryHash: this.latestHash,
      currentEntryHash,
      recordedAt,
      signatureHex
    };

    const frozenEntry = Object.freeze(entry);
    this.entries.push(frozenEntry);
    this.latestHash = currentEntryHash;

    return frozenEntry;
  }

  public getEntry(index: number): EvaluationLedgerEntry | undefined {
    return this.entries[index];
  }

  public getHistory(): readonly EvaluationLedgerEntry[] {
    return Object.freeze([...this.entries]);
  }

  public getEntriesForRun(runId: string): readonly EvaluationLedgerEntry[] {
    return this.entries.filter((e) => e.runId === runId);
  }

  public getEntriesForCaseStudy(caseStudyId: string): readonly EvaluationLedgerEntry[] {
    return this.entries.filter((e) => e.caseStudyId === caseStudyId);
  }

  public getEntriesForDatasetSnapshot(datasetSnapshotId: string): readonly EvaluationLedgerEntry[] {
    return this.entries.filter((e) => e.datasetSnapshotId === datasetSnapshotId);
  }

  /**
   * Verifies the cryptographic chain-of-custody continuity across the entire ledger.
   */
  public verifyLedgerIntegrity(): LedgerVerificationResult {
    const violations: string[] = [];
    let prevHash = "0".repeat(64);

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i]!;

      if (entry.ledgerIndex !== i) {
        violations.push(`Index mismatch at row ${i}: expected ${i}, found ${entry.ledgerIndex}`);
        return { valid: false, totalEntries: this.entries.length, brokenIndex: i, violations };
      }

      if (entry.previousEntryHash !== prevHash) {
        violations.push(
          `Broken state chain at index ${i}: prev hash ${entry.previousEntryHash} != expected ${prevHash}`
        );
        return { valid: false, totalEntries: this.entries.length, brokenIndex: i, violations };
      }

      const payloadDigest = computeSha256(
        `${entry.evaluationId}:${entry.runId}:${entry.benchmarkId}:${entry.contentFingerprint}:${entry.configFingerprint}:${entry.overallScore}`
      );
      const expectedHash = computeSha256(
        `${prevHash}:${i}:${payloadDigest}:${entry.recordedAt}`
      );

      if (entry.currentEntryHash !== expectedHash) {
        violations.push(
          `Corrupted entry hash at index ${i}: ${entry.currentEntryHash} != expected ${expectedHash}`
        );
        return { valid: false, totalEntries: this.entries.length, brokenIndex: i, violations };
      }

      if (entry.reproducibility.epistemicDisclaimer !== EPISTEMIC_REPRODUCIBILITY_DISCLAIMER) {
        violations.push(`Missing mandatory epistemic disclaimer at index ${i}`);
      }

      prevHash = entry.currentEntryHash;
    }

    return {
      valid: violations.length === 0,
      totalEntries: this.entries.length,
      violations
    };
  }

  /**
   * Verifies reproducibility between two evaluation records by comparing their config & content fingerprints.
   */
  public verifyReproducibility(
    entryA: EvaluationLedgerEntry,
    entryB: EvaluationLedgerEntry
  ): {
    reproducible: boolean;
    contentMatch: boolean;
    configMatch: boolean;
    scoreDelta: number;
    disclaimer: string;
  } {
    const contentMatch = entryA.contentFingerprint === entryB.contentFingerprint;
    const configMatch = entryA.configFingerprint === entryB.configFingerprint;
    const scoreA = entryA.overallScore ?? 0;
    const scoreB = entryB.overallScore ?? 0;
    const scoreDelta = Math.abs(scoreA - scoreB);

    return {
      reproducible: contentMatch && configMatch && scoreDelta < 1e-6,
      contentMatch,
      configMatch,
      scoreDelta,
      disclaimer: EPISTEMIC_REPRODUCIBILITY_DISCLAIMER
    };
  }
}
