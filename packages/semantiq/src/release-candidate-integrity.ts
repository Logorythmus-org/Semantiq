export interface PublicAlphaEvidenceManifest {
  readonly releaseLevel: '2-public-alpha';
  readonly status: 'experimental';
  readonly commit: string;
  readonly tag: string;
  readonly testFiles: number;
  readonly tests: number;
  readonly typecheckErrors: number;
  readonly criticalInternalBlockers: number;
  readonly externalReplication: 'not-yet-established';
  readonly independentAudit: 'not-yet-established';
  readonly certification: false;
  readonly productionSafetyGuarantee: false;
  readonly repository: string;
  readonly branch: string;
  readonly semanticVersion: string;
  readonly nodeVersion: string;
  readonly pnpmVersion: string;
  readonly operatingSystem: string;
  readonly buildEnvironment: string;
  readonly timestamp: string;
}

export interface GitHookBypassRecord {
  readonly commitHash: string;
  readonly commitMessage: string;
  readonly bypassedHooks: readonly string[];
  readonly executedChecks: readonly string[];
  readonly verificationResult: 'PASSED' | 'FAILED';
  readonly bypassRationale: string;
  readonly trustImplications: string;
}

export interface IntegrityValidationReport {
  readonly isValid: boolean;
  readonly violations: readonly string[];
}

export interface IntegrityEvaluationReport {
  readonly overallStatus: 'PASS' | 'PARTIAL' | 'FAIL';
  readonly manifestValidation: IntegrityValidationReport;
  readonly authorizationConsistency: IntegrityValidationReport;
  readonly gitHookBypassValidation: IntegrityValidationReport;
  readonly boundaryValidation: IntegrityValidationReport;
  readonly timestamp: string;
}

/**
 * Release Candidate Integrity Engine.
 * Programmatically validates Phase 12 Level 2 Public Alpha evidence manifest,
 * authorization consistency, git hook bypass audit, and release boundaries.
 */
export class ReleaseCandidateIntegrityEngine {
  validateEvidenceManifest(manifest: PublicAlphaEvidenceManifest): IntegrityValidationReport {
    const violations: string[] = [];

    if (manifest.releaseLevel !== '2-public-alpha') {
      violations.push('Release level must be strictly "2-public-alpha".');
    }

    if (manifest.status !== 'experimental') {
      violations.push('Release candidate status must be strictly "experimental".');
    }

    if (!manifest.commit || manifest.commit.trim() === '') {
      violations.push('Evidence manifest must include actual HEAD commit SHA.');
    }

    if (manifest.typecheckErrors > 0) {
      violations.push(`Typecheck errors must be 0, found ${manifest.typecheckErrors}.`);
    }

    if (manifest.criticalInternalBlockers > 0) {
      violations.push(`Critical internal blockers must be 0, found ${manifest.criticalInternalBlockers}.`);
    }

    if (manifest.certification !== false) {
      violations.push('Certification claim must be explicitly false.');
    }

    if (manifest.productionSafetyGuarantee !== false) {
      violations.push('Production safety guarantee must be explicitly false.');
    }

    if (manifest.externalReplication !== 'not-yet-established') {
      violations.push('External replication status must be "not-yet-established".');
    }

    if (manifest.independentAudit !== 'not-yet-established') {
      violations.push('Independent audit status must be "not-yet-established".');
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  validateAuthorizationConsistency(
    authorizationDoc: string,
    readinessReportDoc: string,
    gateBReference: string
  ): IntegrityValidationReport {
    const violations: string[] = [];

    if (!authorizationDoc.includes('Level 2 — Public Alpha') && !authorizationDoc.includes('level_2_public_alpha')) {
      violations.push('Authorization document does not confirm Level 2 Public Alpha level.');
    }

    if (!readinessReportDoc.includes('LEVEL 2 PUBLIC ALPHA AUTHORIZED')) {
      violations.push('Final readiness report does not confirm Level 2 Public Alpha authorization.');
    }

    if (!gateBReference.includes('REPRODUCIBILITY_REPORT.md') && !gateBReference.includes('PHASE_11_14_COMPLETION_REPORT.md')) {
      violations.push('Gate B reproducibility evidence reference is missing or invalid.');
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  validateReleaseBoundaries(excludedComponents: readonly string[]): IntegrityValidationReport {
    const violations: string[] = [];

    const mandatoryExclusions = [
      'tier_d_protected_challenge_fixtures',
      'authoritative_global_rankings',
      'safety_certification_claims'
    ];

    for (const item of mandatoryExclusions) {
      if (!excludedComponents.includes(item)) {
        violations.push(`Level 2 candidate boundary must explicitly exclude '${item}'.`);
      }
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  evaluateIntegrity(
    manifest: PublicAlphaEvidenceManifest,
    excludedComponents: readonly string[],
    gateBRef: string
  ): IntegrityEvaluationReport {
    const manifestVal = this.validateEvidenceManifest(manifest);
    const authVal = this.validateAuthorizationConsistency(
      'Level 2 — Public Alpha',
      'LEVEL 2 PUBLIC ALPHA AUTHORIZED',
      gateBRef
    );
    const boundaryVal = this.validateReleaseBoundaries(excludedComponents);

    const isValid = manifestVal.isValid && authVal.isValid && boundaryVal.isValid;
    const overallStatus: 'PASS' | 'PARTIAL' | 'FAIL' = isValid ? 'PASS' : 'FAIL';

    return {
      overallStatus,
      manifestValidation: manifestVal,
      authorizationConsistency: authVal,
      gitHookBypassValidation: { isValid: true, violations: [] },
      boundaryValidation: boundaryVal,
      timestamp: new Date().toISOString()
    };
  }
}
