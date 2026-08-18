/**
 * @package @semantiq/evidence
 * External Evidence Eligibility Gate Types
 * 
 * Invariants:
 * 1. Gate eligibility determines evidence admissibility for aggregation; eligibility does not confer scientific truth or causal proof.
 * 2. Ineligible evidence (quarantined or rejected) is strictly blocked from Evidence Graph and E-level promotion.
 * 3. Quarantined and rejected submissions remain stored and auditable.
 */

import type { StudyExecutionManifest } from "../execution-manifests/types.js";
import type { StudyProtocol, ProtocolDeviation } from "../study-protocols/types.js";
import type { BundleVerificationResult } from "../research-bundles/types.js";
import type { PartnerOrganization } from "../partner-exchange/types.js";

export const EPISTEMIC_GATE_DISCLAIMER =
  "Gate eligibility determines evidence admissibility for aggregation; eligibility does not confer scientific truth or causal proof.";

export type EligibilityVerdict =
  | "eligible"
  | "eligible_with_caveats"
  | "quarantined"
  | "rejected";

export type GateReasonCode =
  | "PREREG_HASH_MATCH"
  | "PREREG_HASH_MISMATCH"
  | "BUNDLE_INTEGRITY_VERIFIED"
  | "BUNDLE_INTEGRITY_TAMPERED"
  | "DEVIATION_CHAIN_VALID"
  | "DEVIATION_CHAIN_BROKEN"
  | "DEVIATION_MATERIAL_CAPPED"
  | "DEVIATION_CRITICAL_REJECTED"
  | "INSTRUMENTATION_COMPLETE"
  | "INSTRUMENTATION_DEFICIENT"
  | "PROVENANCE_AUTHENTICATED"
  | "PROVENANCE_UNVERIFIED"
  | "SAMPLE_POWER_SUFFICIENT"
  | "SAMPLE_POWER_DEFICIENT"
  | "NEGATIVE_CONTROLS_PASSED"
  | "NEGATIVE_CONTROLS_FAILED"
  | "MISSING_DATA_ACCEPTABLE"
  | "MISSING_DATA_EXCESSIVE";

export interface GateEvaluationInput {
  readonly manifest: StudyExecutionManifest;
  readonly protocol: StudyProtocol;
  readonly bundleVerification: BundleVerificationResult;
  readonly deviations: readonly ProtocolDeviation[];
  readonly deviationChainValid: boolean;
  readonly organization: PartnerOrganization;
}

export interface ExternalEvidenceEligibilityDecision {
  readonly decisionId: string;
  readonly studyId: string;
  readonly targetClaimId: string;
  readonly organizationId: string;
  readonly verdict: EligibilityVerdict;
  readonly isAdmissibleForAggregation: boolean;
  readonly reasonCodes: readonly GateReasonCode[];
  readonly reasons: readonly string[];
  readonly caveats: readonly string[];
  readonly evaluatedAt: string;
  readonly epistemicDisclaimer: typeof EPISTEMIC_GATE_DISCLAIMER;
}
