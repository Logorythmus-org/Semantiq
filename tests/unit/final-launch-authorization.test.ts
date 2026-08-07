import { describe, it, expect } from 'vitest';
import { FinalLaunchAuthorizationEngine } from '../../packages/semantiq/src/final-launch-authorization.js';
import type { FinalLaunchAuthorizationRecord } from '../../packages/semantiq/src/final-launch-authorization.js';

describe('SemantIQ Master Prompt 05 — Final Phase 12 Public Alpha Launch Authorization', () => {
  const engine = new FinalLaunchAuthorizationEngine();

  const validRecord: FinalLaunchAuthorizationRecord = {
    authorizationId: 'auth-launch-alpha-1',
    decision: 'AUTHORIZED — LEVEL 2 PUBLIC ALPHA',
    releaseLevel: '2-public-alpha',
    targetCommit: '4f5788f000000000000000000000000000000000',
    targetTag: 'v0.1.0-alpha.1',
    mandatoryReleaseStatement:
      'SemantIQ Public Alpha is an experimental open-source evaluation and evidence infrastructure. Its results describe observed behavior under declared conditions. They are not certifications of intelligence, safety, legal compliance, or deployment suitability. The project is open to reproduction, criticism, dispute, correction, and forking.',
    publicLimitations: [
      'External replication and independent audit are not yet established',
      'Community governance has not yet been validated at scale',
      'Real-world benchmark gaming may reveal new weaknesses',
      'Scores are version- and configuration-dependent',
      'Unknown risks remain and Level 2 is not Level 3'
    ],
    releaseExclusions: [
      'authoritative_global_leaderboards',
      'safety_certification_claims',
      'tier_d_protected_challenge_prompts',
      'high_impact_human_decision_delegation',
      'unsupported_legal_compliance_claims'
    ],
    rollbackTriggers: [
      'Discovery of unhandled secret/credential leaks',
      'Unhandled prompt injection vulnerability',
      'Breach of high-impact human responsibility boundary'
    ],
    gateStatuses: {
      artifactIdentity: true,
      internalVerification: true,
      cleanRoomReproducibility: true,
      publicationSecurity: true,
      scientificHonesty: true,
      humanResponsibility: true,
      contestability: true,
      governanceHonesty: true,
      antiGamingIntegrity: true,
      rollbackCapability: true
    },
    timestamp: '2026-08-07T18:50:00Z'
  };

  it('validates a correct Level 2 Public Alpha Launch Authorization Record', () => {
    const report = engine.validateFinalLaunchAuthorization(validRecord);
    expect(report.isValid).toBe(true);
    expect(report.violations.length).toBe(0);
  });

  it('rejects an authorization record missing mandatory public limitations', () => {
    const invalid = { ...validRecord, publicLimitations: ['Too brief'] };
    const report = engine.validateFinalLaunchAuthorization(invalid);
    expect(report.isValid).toBe(false);
    expect(report.violations).toContain('Launch authorization must document all mandatory public limitations.');
  });
});
