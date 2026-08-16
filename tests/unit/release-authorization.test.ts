import { describe, it, expect } from 'vitest';
import { ReleaseAuthorizationEngine } from '../../packages/semantiq/src/release-authorization.js';
import type { GateSuiteEvaluation, ReleaseAuthorizationDecision } from '../../packages/semantiq/src/release-authorization.js';

describe('Phase 11.5.10 — Phase 12 Release Authorization', () => {
  const engine = new ReleaseAuthorizationEngine();

  const passedGates: GateSuiteEvaluation = {
    gateA_scientificHonesty: { gateId: 'gate-a', gateName: 'Scientific Honesty', isPassed: true, evidenceReference: 'PHASE_11_5_2_COMPLETION_REPORT.md' },
    gateB_reproducibility: { gateId: 'gate-b', gateName: 'Reproducibility', isPassed: true, evidenceReference: 'PHASE_11_14_COMPLETION_REPORT.md' },
    gateC_contestability: { gateId: 'gate-c', gateName: 'Contestability', isPassed: true, evidenceReference: 'PHASE_11_5_6_COMPLETION_REPORT.md' },
    gateD_humanResponsibility: { gateId: 'gate-d', gateName: 'Human Responsibility', isPassed: true, evidenceReference: 'PHASE_11_5_3_COMPLETION_REPORT.md' },
    gateE_antiGaming: { gateId: 'gate-e', gateName: 'Anti-Gaming', isPassed: true, evidenceReference: 'PHASE_11_5_4_COMPLETION_REPORT.md' },
    gateF_communityLegitimacy: { gateId: 'gate-f', gateName: 'Community Legitimacy', isPassed: true, evidenceReference: 'PHASE_11_5_7_COMPLETION_REPORT.md' },
    gateG_correctionCapability: { gateId: 'gate-g', gateName: 'Correction Capability', isPassed: true, evidenceReference: 'PHASE_11_5_6_COMPLETION_REPORT.md' },
    gateH_selfObservation: { gateId: 'gate-h', gateName: 'Self-Observation', isPassed: true, evidenceReference: 'PHASE_11_5_8_COMPLETION_REPORT.md' }
  };

  it('evaluates Gates A through H and authorizes Level 2 Public Alpha with 0 blockers', () => {
    const level = engine.evaluateGates(passedGates, 0);
    expect(level).toBe('level_2_public_alpha');
  });

  it('downgrades release to Level 0 if critical blockers exist or Gate A fails', () => {
    const failedGateA = {
      ...passedGates,
      gateA_scientificHonesty: { gateId: 'gate-a', gateName: 'Scientific Honesty', isPassed: false, evidenceReference: 'Failed' }
    };
    expect(engine.evaluateGates(failedGateA, 0)).toBe('level_0_no_release');
    expect(engine.evaluateGates(passedGates, 2)).toBe('level_0_no_release');
  });

  it('validates a Level 2 authorization decision linked to evidence manifests', () => {
    const decision: ReleaseAuthorizationDecision = {
      decisionId: 'auth-2026-08',
      approvedReleaseLevel: 'level_2_public_alpha',
      approvedComponents: ['packages/semantiq', 'docs', 'schemas'],
      excludedComponents: ['protected-tier-d-challenges'],
      conditions: ['Phase 11 local freeze remains active until Phase 12 start'],
      expirationDate: '2026-11-01',
      unresolvedRisks: ['Small maintainer count'],
      rollbackTrigger: 'Discovery of unhandled security or claim boundary violation',
      responsibleMaintainers: ['Core Governance Board'],
      evidenceManifestLinks: ['PHASE_11_5_FINAL_READINESS_REPORT.md'],
      dissentingOpinions: [],
      isPhase12Approved: true,
      timestamp: '2026-08-07T00:00:00Z'
    };
    const report = engine.validateDecision(decision, passedGates);
    expect(report.isValid).toBe(true);
    expect(report.violations.length).toBe(0);
  });
});
