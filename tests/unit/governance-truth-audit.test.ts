import { describe, it, expect } from 'vitest';
import type { ClaimEvidence, DocumentationClaim } from '../../packages/semantiq/src/governance-truth-audit.js';
import { GovernanceTruthAuditEngine } from '../../packages/semantiq/src/governance-truth-audit.js';

describe('Phase 10 Documentation Truth Audit (Prompt 10.14)', () => {
  const engine = new GovernanceTruthAuditEngine();

  const validClaim: DocumentationClaim = {
    claimId: 'claim_101',
    docPath: 'Docs/phase-10/GOVERNANCE_EVIDENCE_SPEC.md',
    statementText: 'SemantIQ exports PolicyEvidenceEngine v1.0.0 for evidence evaluation',
    claimType: 'export'
  };

  const validEvidence: ClaimEvidence = {
    evidenceId: 'ev_101',
    sourceFilePath: 'packages/semantiq/src/policy-evidence-model.ts',
    lineOrSymbol: 'PolicyEvidenceEngine',
    isVerified: true
  };

  it('approves verified documentation claim', () => {
    const report = engine.auditClaim(validClaim, validEvidence);
    expect(report).toBeUndefined();
  });

  it('detects unsupported claim lacking verified source evidence', () => {
    const report = engine.auditClaim(validClaim, undefined);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('unsupported_claim');
  });

  it('detects hidden reasoning claim violating observation boundary', () => {
    const hiddenClaim: DocumentationClaim = {
      ...validClaim,
      statementText: 'SemantIQ inspects hidden chain of thought in private models'
    };
    const report = engine.auditClaim(hiddenClaim, validEvidence);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('hidden_reasoning_claim');
  });

  it('detects enforcement claim violating non-enforcement boundary', () => {
    const enfClaim: DocumentationClaim = {
      ...validClaim,
      statementText: 'SemantIQ enforces policies and blocks non-compliant agent actions'
    };
    const report = engine.auditClaim(enfClaim, validEvidence);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('enforcement_claim');
  });

  it('detects false publication claim violating publication freeze', () => {
    const pubClaim: DocumentationClaim = {
      ...validClaim,
      statementText: 'SemantIQ v1.0.0 is publicly released on npm and pushed to GitHub'
    };
    const report = engine.auditClaim(pubClaim, validEvidence);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('false_publication_claim');
  });
});
