/**
 * @package @tech-club/semantiq
 * Authoritative Evaluations Application Service
 */

import {
  EvaluationLedgerEngine,
  type EvaluationLedgerEntry,
  type LedgerVerificationResult
} from "../../../evidence/src/index.js";
import { EvidenceConfidence } from "../../../sandbox-contracts/src/index.js";
import type { RecordEvaluationRequest } from "./types.js";

export class EvaluationsService {
  private readonly ledger = new EvaluationLedgerEngine();

  public async recordEvaluation(
    request: RecordEvaluationRequest
  ): Promise<EvaluationLedgerEntry> {
    return this.ledger.appendEvaluation({
      evaluationId: request.evaluation.id,
      runId: request.evaluation.runId,
      benchmarkId: request.evaluation.benchmarkId,
      contentFingerprint: request.contentFingerprint,
      configFingerprint: request.configFingerprint,
      overallScore: request.evaluation.overallScore,
      confidence: EvidenceConfidence.DETERMINISTIC,
      environmentFingerprint: request.reproducibility.environmentFingerprint ?? "sha256:env_local",
      deterministicSeed: typeof request.reproducibility.deterministicSeed === "number"
        ? request.reproducibility.deterministicSeed
        : 42,
      toolchainVersion: request.reproducibility.toolchainVersion ?? "1.0.0"
    });
  }

  public async getEvaluation(target: number | string): Promise<EvaluationLedgerEntry | undefined> {
    if (typeof target === "number") {
      return this.ledger.getEntry(target);
    }
    return this.ledger.getHistory().find((e) => e.evaluationId === target);
  }

  public async listEvaluations(): Promise<readonly EvaluationLedgerEntry[]> {
    return this.ledger.getHistory();
  }

  public async verifyLedgerIntegrity(): Promise<LedgerVerificationResult> {
    return this.ledger.verifyLedgerIntegrity();
  }
}
