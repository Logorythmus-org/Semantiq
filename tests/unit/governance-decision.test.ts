import { describe, it, expect } from 'vitest';
import type { GovernanceDecisionRecord } from '../../packages/semantiq/src/governance-decision.js';
import { GovernanceDecisionEngine } from '../../packages/semantiq/src/governance-decision.js';

describe('Governance Decision Evidence (Prompt 10.5)', () => {
  const engine = new GovernanceDecisionEngine();

  const validRecord: GovernanceDecisionRecord = {
    decisionId: 'gdec_101',
    actorId: 'agent_lead',
    authorityRef: 'auth_lead_100',
    missionRef: 'mission_prod_deploy',
    policyRef: 'pol_security_v1',
    approvalRef: 'dec_101',
    options: [
      { optionId: 'opt_1', description: 'Deploy to Prod', isSelected: true },
      { optionId: 'opt_2', description: 'Abort Deploy', isSelected: false }
    ],
    evidence: [{ evidenceId: 'ev_1', checksum: { uri: 'file:///tmp/ev.json', algorithm: 'sha256', hash: 'hash1' }, description: 'Pre-flight checks passed' }],
    dissents: [{ dissentId: 'dis_1', agentId: 'agent_sec', reason: 'Concerns regarding load latency' }],
    uncertainty: { score: 0.2, rationale: 'Minor latency concern raised by security agent' },
    expectedOutcome: 'Successful deployment to production',
    observedOutcome: 'Successful deployment to production',
    timestamp: '2026-08-01T14:10:00Z'
  };

  it('approves compliant governance decision record', () => {
    const report = engine.evaluateDecisionRecord(validRecord);
    expect(report).toBeUndefined();
  });

  it('detects decision without authority reference', () => {
    const noAuthRecord: GovernanceDecisionRecord = {
      ...validRecord,
      authorityRef: ''
    };
    const report = engine.evaluateDecisionRecord(noAuthRecord);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('decision_without_authority');
  });

  it('detects missing human approval reference', () => {
    const noAppRecord: GovernanceDecisionRecord = {
      ...validRecord,
      approvalRef: undefined
    };
    const report = engine.evaluateDecisionRecord(noAppRecord);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('missing_approval');
  });

  it('detects unsupported certainty claiming 0 uncertainty with active dissents', () => {
    const falseCertaintyRecord: GovernanceDecisionRecord = {
      ...validRecord,
      uncertainty: { score: 0, rationale: 'Claiming 100% certainty' } // Score 0 despite dissents
    };
    const report = engine.evaluateDecisionRecord(falseCertaintyRecord);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('unsupported_certainty');
  });

  it('detects outcome inconsistent with recorded basis', () => {
    const inconsistentRecord: GovernanceDecisionRecord = {
      ...validRecord,
      observedOutcome: 'Database connection timeout error' // Differs from expected
    };
    const report = engine.evaluateDecisionRecord(inconsistentRecord);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('outcome_inconsistent_with_recorded_basis');
  });
});
