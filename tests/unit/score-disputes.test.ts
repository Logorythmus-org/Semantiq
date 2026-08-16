import { describe, it, expect } from 'vitest';
import { ScoreDisputesEngine } from '../../packages/semantiq/src/score-disputes.js';
import type { ScoreDisputeRecord, CorrectionRecord, ContradictionReport } from '../../packages/semantiq/src/score-disputes.js';

describe('Phase 11.5.6 — Score Disputes, Corrections, and Withdrawals', () => {
  const engine = new ScoreDisputesEngine();

  const validDispute: ScoreDisputeRecord = {
    disputeId: 'disp-101',
    targetResultId: 'res-99',
    challenger: 'Research Lab B',
    submittedAt: '2026-08-07T00:00:00Z',
    state: 'submitted',
    evidenceUrls: ['https://example.org/evidence-99'],
    justification: 'Prompt temperature was set incorrectly during evaluation.',
    stateHistory: [{ state: 'submitted', timestamp: '2026-08-07T00:00:00Z', notes: 'Initial submission' }]
  };

  it('transitions dispute states preserving complete history', () => {
    const updated = engine.transitionDisputeState(validDispute, 'under_review', 'Assigned to reviewer');
    expect(updated.state).toBe('under_review');
    expect(updated.stateHistory.length).toBe(2);
    expect(updated.stateHistory[1]?.state).toBe('under_review');
  });

  it('rejects a correction record that fails to preserve original evidence', () => {
    const record: CorrectionRecord = {
      correctionId: 'corr-01',
      originalResultId: 'res-99',
      correctionLevel: 'score_recalculation',
      issuedAt: '2026-08-07T00:00:00Z',
      originalEvidencePreserved: false,
      originalScore: 90,
      revisedScore: 82,
      rationale: 'Recalculated under fixed temperature',
      isSuspended: false,
      isWithdrawn: false
    };
    const report = engine.validateCorrectionRecord(record);
    expect(report.isValid).toBe(false);
    expect(report.violations).toContain('Correction records must preserve the original evaluation evidence.');
  });

  it('marks suspended or withdrawn scores as inactive', () => {
    const activeCorrection: CorrectionRecord = {
      correctionId: 'corr-02',
      originalResultId: 'res-100',
      correctionLevel: 'clarification',
      issuedAt: '2026-08-07T00:00:00Z',
      originalEvidencePreserved: true,
      originalScore: 95,
      rationale: 'Clarified scope',
      isSuspended: false,
      isWithdrawn: false
    };
    expect(engine.isScoreActive(activeCorrection)).toBe(true);

    const suspendedCorrection: CorrectionRecord = {
      ...activeCorrection,
      correctionLevel: 'suspension',
      isSuspended: true
    };
    expect(engine.isScoreActive(suspendedCorrection)).toBe(false);

    const withdrawnCorrection: CorrectionRecord = {
      ...activeCorrection,
      correctionLevel: 'full_withdrawal',
      isWithdrawn: true
    };
    expect(engine.isScoreActive(withdrawnCorrection)).toBe(false);
  });
});
