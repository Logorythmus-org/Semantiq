import { describe, it, expect } from 'vitest';
import { ConstitutionalValidatorEngine } from '../../packages/semantiq/src/trust-constitution.js';
import type { ConstitutionalDecisionRecord, EmergencyPolicyRule } from '../../packages/semantiq/src/trust-constitution.js';

describe('Phase 11.5.1 — Trust Constitution and Power Boundaries', () => {
  const engine = new ConstitutionalValidatorEngine();

  it('rejects an emergency rule without expiration or marked permanent', () => {
    const ruleNoExpiry: EmergencyPolicyRule = {
      ruleId: 'emerg-01',
      description: 'Temporary freeze',
      declaredAt: '2026-08-04T00:00:00Z'
    };
    const report1 = engine.validateEmergencyRule(ruleNoExpiry);
    expect(report1.isValid).toBe(false);
    expect(report1.violations.length).toBeGreaterThan(0);

    const rulePermanent: EmergencyPolicyRule = {
      ruleId: 'emerg-02',
      description: 'Permanent override',
      declaredAt: '2026-08-04T00:00:00Z',
      expiresAt: '2026-09-04T00:00:00Z',
      isPermanent: true
    };
    const report2 = engine.validateEmergencyRule(rulePermanent);
    expect(report2.isValid).toBe(false);
  });

  it('rejects a governance decision without evidence or appeal path', () => {
    const invalidRecord: ConstitutionalDecisionRecord = {
      decisionId: 'gov-001',
      title: 'Unbacked decision',
      proposer: 'Founder',
      date: '2026-08-04',
      affectedScope: 'all',
      evidence: [],
      alternativesConsidered: ['none'],
      conflictsOfInterest: [],
      decision: 'Approved',
      dissentingOpinions: [],
      appealDeadline: '',
      reviewDate: '2026-12-31',
      supersededDecisions: [],
      version: '1.0.0'
    };
    const report = engine.validateDecisionRecord(invalidRecord);
    expect(report.isValid).toBe(false);
    expect(report.violations).toContain('Governance decision must contain supporting evidence.');
    expect(report.violations).toContain('Governance decision must specify an explicit appeal deadline.');
  });

  it('attaches and preserves dissenting opinions', () => {
    const baseRecord: ConstitutionalDecisionRecord = {
      decisionId: 'gov-002',
      title: 'Weight Adjustment',
      proposer: 'Maintainer A',
      date: '2026-08-04',
      affectedScope: 'scoring',
      evidence: ['benchmark-data-v1'],
      alternativesConsidered: ['keep weights'],
      conflictsOfInterest: [],
      decision: 'Approved',
      dissentingOpinions: [],
      appealDeadline: '2026-09-01',
      reviewDate: '2026-12-31',
      supersededDecisions: [],
      version: '1.0.0'
    };

    const updated = engine.attachDissent(baseRecord, 'I dissent because sample size is small.');
    expect(updated.dissentingOpinions).toContain('I dissent because sample size is small.');
  });

  it('preserves history when superseding a decision', () => {
    const original: ConstitutionalDecisionRecord = {
      decisionId: 'gov-002',
      title: 'V1 Weights',
      proposer: 'Maintainer A',
      date: '2026-08-04',
      affectedScope: 'scoring',
      evidence: ['ev-1'],
      alternativesConsidered: [],
      conflictsOfInterest: [],
      decision: 'Approved',
      dissentingOpinions: [],
      appealDeadline: '2026-09-01',
      reviewDate: '2026-12-31',
      supersededDecisions: [],
      version: '1.0.0'
    };

    const superseded = engine.supersedeDecision(original, 'gov-003', 'V2 Weights', 'Revised weights', '2.0.0');
    expect(superseded.supersededDecisions).toContain('gov-002');
  });
});
