export type DisputeState =
  | 'submitted'
  | 'acknowledged'
  | 'under_review'
  | 'evidence_requested'
  | 'partially_accepted'
  | 'accepted'
  | 'rejected_with_reasons'
  | 'appealed'
  | 'resolved'
  | 'reopened'
  | 'superseded';

export type CorrectionLevel =
  | 'clarification'
  | 'metadata_correction'
  | 'score_recalculation'
  | 'annotation'
  | 'suspension'
  | 'partial_withdrawal'
  | 'full_withdrawal'
  | 'benchmark_deprecation'
  | 'methodology_revision';

export interface ScoreDisputeRecord {
  readonly disputeId: string;
  readonly targetResultId: string;
  readonly challenger: string;
  readonly submittedAt: string;
  readonly state: DisputeState;
  readonly evidenceUrls: readonly string[];
  readonly justification: string;
  readonly stateHistory: readonly { readonly state: DisputeState; readonly timestamp: string; readonly notes: string }[];
}

export interface CorrectionRecord {
  readonly correctionId: string;
  readonly originalResultId: string;
  readonly correctionLevel: CorrectionLevel;
  readonly issuedAt: string;
  readonly originalEvidencePreserved: boolean;
  readonly originalScore: number;
  readonly revisedScore?: number | undefined;
  readonly rationale: string;
  readonly isSuspended: boolean;
  readonly isWithdrawn: boolean;
}

export interface ContradictionReport {
  readonly reportId: string;
  readonly affectedResultId: string;
  readonly realWorldIncidentEvidence: string;
  readonly deploymentDifferences: string;
  readonly benchmarkBlindSpotDescription: string;
  readonly requiresBenchmarkRevision: boolean;
}

export interface DisputeValidationReport {
  readonly isValid: boolean;
  readonly violations: readonly string[];
}

/**
 * Score Disputes & Corrections Engine.
 * Manages result disputes, append-only correction logs, suspensions,
 * withdrawals, and benchmark-reality contradiction reports.
 */
export class ScoreDisputesEngine {
  validateCorrectionRecord(record: CorrectionRecord): DisputeValidationReport {
    const violations: string[] = [];

    if (!record.originalEvidencePreserved) {
      violations.push('Correction records must preserve the original evaluation evidence.');
    }

    if (record.isWithdrawn && record.correctionLevel !== 'full_withdrawal' && record.correctionLevel !== 'partial_withdrawal') {
      violations.push('Withdrawn status requires correctionLevel of full_withdrawal or partial_withdrawal.');
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  transitionDisputeState(
    existing: ScoreDisputeRecord,
    newState: DisputeState,
    notes: string
  ): ScoreDisputeRecord {
    return {
      ...existing,
      state: newState,
      stateHistory: [
        ...existing.stateHistory,
        { state: newState, timestamp: new Date().toISOString(), notes }
      ]
    };
  }

  isScoreActive(correction?: CorrectionRecord | undefined): boolean {
    if (!correction) return true;
    return !correction.isSuspended && !correction.isWithdrawn;
  }
}
