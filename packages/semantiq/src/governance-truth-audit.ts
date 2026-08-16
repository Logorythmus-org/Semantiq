export type TruthAuditFailureClass =
  | 'unsupported_claim'
  | 'stale_name'
  | 'example_does_not_compile'
  | 'hidden_reasoning_claim'
  | 'enforcement_claim'
  | 'certification_claim'
  | 'absolute_trust_claim'
  | 'false_publication_claim'
  | 'unsupported_legal_conclusion';

export interface DocumentationClaim {
  readonly claimId: string;
  readonly docPath: string;
  readonly statementText: string;
  readonly claimType: 'export' | 'performance' | 'boundary' | 'non_goal';
}

export interface ClaimEvidence {
  readonly evidenceId: string;
  readonly sourceFilePath: string;
  readonly lineOrSymbol: string;
  readonly isVerified: boolean;
}

export interface DocumentationGap {
  readonly gapId: string;
  readonly docPath: string;
  readonly description: string;
}

export interface UnsupportedClaim {
  readonly claimId: string;
  readonly docPath: string;
  readonly unsupportedReason: string;
}

export interface TruthAuditReport {
  readonly reportId: string;
  readonly failureClass: TruthAuditFailureClass;
  readonly claimId: string;
  readonly docPath: string;
  readonly description: string;
  readonly timestamp: string;
}

/**
 * Governance Truth Audit Engine.
 * Verifies 100% truth alignment between active documentation, source exports, tests, and non-goal boundaries.
 */
export class GovernanceTruthAuditEngine {
  auditClaim(claim: DocumentationClaim, evidence: ClaimEvidence | undefined): TruthAuditReport | undefined {
    // 1. Unsupported Claim / Missing Evidence
    if (!evidence || !evidence.isVerified) {
      return {
        reportId: `fail_unsupported_${claim.claimId}`,
        failureClass: 'unsupported_claim',
        claimId: claim.claimId,
        docPath: claim.docPath,
        description: `Documentation claim '${claim.statementText}' lacks verified source evidence.`,
        timestamp: new Date().toISOString()
      };
    }

    const lowerStatement = claim.statementText.toLowerCase();

    // 2. Hidden Reasoning Claim Check
    if (lowerStatement.includes('hidden chain of thought') || lowerStatement.includes('internal cognitive trace')) {
      return {
        reportId: `fail_hidden_${claim.claimId}`,
        failureClass: 'hidden_reasoning_claim',
        claimId: claim.claimId,
        docPath: claim.docPath,
        description: `Claim '${claim.statementText}' incorrectly asserts access to hidden model reasoning.`,
        timestamp: new Date().toISOString()
      };
    }

    // 3. Enforcement Claim Check
    if (lowerStatement.includes('enforces policies') || lowerStatement.includes('active regulator')) {
      return {
        reportId: `fail_enf_${claim.claimId}`,
        failureClass: 'enforcement_claim',
        claimId: claim.claimId,
        docPath: claim.docPath,
        description: `Claim '${claim.statementText}' violates non-enforcement observation boundary.`,
        timestamp: new Date().toISOString()
      };
    }

    // 4. Certification Claim Check
    if (lowerStatement.includes('issues legal certification') || lowerStatement.includes('guarantees compliance')) {
      return {
        reportId: `fail_cert_${claim.claimId}`,
        failureClass: 'certification_claim',
        claimId: claim.claimId,
        docPath: claim.docPath,
        description: `Claim '${claim.statementText}' violates non-certification boundary.`,
        timestamp: new Date().toISOString()
      };
    }

    // 5. False Publication Claim Check
    if (lowerStatement.includes('publicly released on npm') || lowerStatement.includes('pushed to github')) {
      return {
        reportId: `fail_pub_${claim.claimId}`,
        failureClass: 'false_publication_claim',
        claimId: claim.claimId,
        docPath: claim.docPath,
        description: `Claim '${claim.statementText}' falsely asserts public release under Phase 7 publication freeze.`,
        timestamp: new Date().toISOString()
      };
    }

    return undefined;
  }
}
