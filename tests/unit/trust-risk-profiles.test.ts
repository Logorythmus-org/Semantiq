import { describe, it, expect } from 'vitest';
import type { TrustProfile } from '../../packages/semantiq/src/trust-risk-profiles.js';
import { TrustRiskProfileEngine } from '../../packages/semantiq/src/trust-risk-profiles.js';

describe('Trust and Risk Profiles (Prompt 10.8)', () => {
  const engine = new TrustRiskProfileEngine();

  const validProfile: TrustProfile = {
    profileId: 'tprof_101',
    targetAgentId: 'agent_eval_lead',
    contextDomain: 'security.data_access',
    timeWindow: {
      windowId: 'win_101',
      startTimestamp: '2026-08-01T00:00:00Z',
      endTimestamp: '2026-08-01T23:59:59Z'
    },
    dimensions: [
      {
        dimensionType: 'policy_adherence',
        score: 0.95,
        explanation: { explanationId: 'exp_1', summary: 'Consistently adhered to data policies', rationale: 'No policy violations observed in window' }
      },
      {
        dimensionType: 'approval_discipline',
        score: 0.90,
        explanation: { explanationId: 'exp_2', summary: 'Obtained required approvals', rationale: 'All privileged actions backed by human approvals' }
      }
    ],
    uncertainty: { score: 0.1, missingEvidenceItems: [] },
    evidence: [{ evidenceId: 'ev_1', checksum: { uri: 'file:///tmp/audit.json', algorithm: 'sha256', hash: 'hash1' }, description: 'Audit log digest' }],
    label: 'High Policy Adherence Profile'
  };

  it('approves compliant trust profile evaluation', () => {
    const report = engine.evaluateTrustProfile(validProfile);
    expect(report).toBeUndefined();
  });

  it('detects missing evidence treated as success', () => {
    const noEvProfile: TrustProfile = {
      ...validProfile,
      evidence: [], // 0 evidence items
      uncertainty: { score: 0.1, missingEvidenceItems: [] } // But claiming low uncertainty score 0.1
    };
    const report = engine.evaluateTrustProfile(noEvProfile);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('missing_evidence_treated_as_success');
  });

  it('detects absolute trust label violating non-absolute rule', () => {
    const absProfile: TrustProfile = {
      ...validProfile,
      label: '100% Trustworthy Absolute Actor'
    };
    const report = engine.evaluateTrustProfile(absProfile);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('absolute_trust_label');
  });

  it('detects moral or legal judgment violating neutral boundary', () => {
    const moralProfile: TrustProfile = {
      ...validProfile,
      label: 'Malicious Criminal Actor Profile'
    };
    const report = engine.evaluateTrustProfile(moralProfile);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('moral_or_legal_judgment');
  });

  it('detects profile dimension lacking explanation rationale', () => {
    const noExpProfile: TrustProfile = {
      ...validProfile,
      dimensions: [
        {
          dimensionType: 'policy_adherence',
          score: 0.95,
          explanation: { explanationId: 'exp_1', summary: '', rationale: '' } // Empty explanation
        }
      ]
    };
    const report = engine.evaluateTrustProfile(noExpProfile);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('profile_without_explanation');
  });
});
