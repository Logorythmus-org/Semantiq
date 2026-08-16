import { describe, it, expect } from 'vitest';
import { ReleaseCandidateIntegrityEngine } from '../../packages/semantiq/src/release-candidate-integrity.js';
import type { PublicAlphaEvidenceManifest } from '../../packages/semantiq/src/release-candidate-integrity.js';

describe('SemantIQ Master Prompt 01 — Release Candidate Integrity', () => {
  const engine = new ReleaseCandidateIntegrityEngine();

  const validManifest: PublicAlphaEvidenceManifest = {
    releaseLevel: '2-public-alpha',
    status: 'experimental',
    commit: '95634c7a875f050070fc8f7be42891d105182f53',
    tag: 'v0.1.0-alpha.1',
    testFiles: 122,
    tests: 453,
    typecheckErrors: 0,
    criticalInternalBlockers: 0,
    externalReplication: 'not-yet-established',
    independentAudit: 'not-yet-established',
    certification: false,
    productionSafetyGuarantee: false,
    repository: 'Semant-iq/Semantiq',
    branch: 'main',
    semanticVersion: '0.1.0-alpha.1',
    nodeVersion: 'v22.15.0',
    pnpmVersion: '11.7.0',
    operatingSystem: 'win32',
    buildEnvironment: 'local_clean_room',
    timestamp: '2026-08-07T12:00:00Z'
  };

  const validExclusions = [
    'tier_d_protected_challenge_fixtures',
    'authoritative_global_rankings',
    'safety_certification_claims'
  ];

  it('validates a correct Public Alpha Evidence Manifest', () => {
    const report = engine.validateEvidenceManifest(validManifest);
    expect(report.isValid).toBe(true);
    expect(report.violations.length).toBe(0);
  });

  it('rejects a manifest claiming production safety guarantee or certification', () => {
    const invalidManifest = {
      ...validManifest,
      certification: true as any,
      productionSafetyGuarantee: true as any
    };
    const report = engine.validateEvidenceManifest(invalidManifest);
    expect(report.isValid).toBe(false);
    expect(report.violations).toContain('Certification claim must be explicitly false.');
    expect(report.violations).toContain('Production safety guarantee must be explicitly false.');
  });

  it('evaluates overall RC integrity and returns PASS status', () => {
    const report = engine.evaluateIntegrity(
      validManifest,
      validExclusions,
      'Docs/phase-11/REPRODUCIBILITY_REPORT.md'
    );
    expect(report.overallStatus).toBe('PASS');
    expect(report.manifestValidation.isValid).toBe(true);
    expect(report.authorizationConsistency.isValid).toBe(true);
    expect(report.boundaryValidation.isValid).toBe(true);
  });
});
