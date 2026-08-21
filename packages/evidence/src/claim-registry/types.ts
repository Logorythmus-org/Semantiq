/**
 * @package @semantiq/evidence
 * Governed Claim Registry, Controlled Language, and Lifecycle Types
 */

import type { EvidenceGovernanceVerdict } from "../governance-policy/types.js";

export const EPISTEMIC_LANGUAGE_DISCLAIMER = "Release controls wording, not truth.";

export type ClaimLifecycleStatus = "draft" | "active" | "superseded" | "retracted";

export interface ControlledLanguageViolation {
  readonly prohibitedPhrase: string;
  readonly reason: string;
  readonly suggestedAlternative: string;
}

export interface GovernedClaimReview {
  readonly reviewerId: string;
  readonly decision: "approve" | "reject" | "request_changes";
  readonly comments: string;
  readonly reviewedAt: string;
}

export interface ClaimEvidenceReferences {
  readonly runIds: readonly string[];
  readonly observationIds: readonly string[];
  readonly decisionReportIds: readonly string[];
  readonly sourceIds: readonly string[];
}

export interface GovernedEvidenceClaim {
  readonly id: string;
  readonly claimFamilyId: string;
  readonly version: string;
  readonly statement: string;
  readonly status: ClaimLifecycleStatus;
  readonly targetPatternOrRelationId: string;
  readonly evidenceReferences: ClaimEvidenceReferences;
  readonly governanceVerdict: EvidenceGovernanceVerdict;
  readonly reviews: readonly GovernedClaimReview[];
  readonly supersededByClaimId?: string | undefined;
  readonly retractionReason?: string | undefined;
  readonly epistemicDisclaimer: typeof EPISTEMIC_LANGUAGE_DISCLAIMER;
  readonly createdAt: string;
  readonly releasedAt?: string | undefined;
  readonly retractedAt?: string | undefined;
}
