import type { EvidenceChecksum } from "./event-schema.js";

export type ProfileFailureClass =
  | "missing_evidence_treated_as_success"
  | "absolute_trust_label"
  | "moral_or_legal_judgment"
  | "cross_context_comparison_without_qualification"
  | "profile_without_explanation"
  | "historical_profile_overwrite";

export type ProfileDimensionType =
  | "policy_adherence"
  | "approval_discipline"
  | "authority_discipline"
  | "evidence_completeness"
  | "transparency_and_uncertainty"
  | "recovery_quality"
  | "responsibility_traceability"
  | "exception_frequency"
  | "conflict_handling"
  | "incident_recurrence"
  | "residual_risk";

export interface ProfileTimeWindow {
  readonly windowId: string;
  readonly startTimestamp: string;
  readonly endTimestamp: string;
}

export interface ProfileEvidence {
  readonly evidenceId: string;
  readonly checksum: EvidenceChecksum;
  readonly description: string;
}

export interface ProfileExplanation {
  readonly explanationId: string;
  readonly summary: string;
  readonly rationale: string;
}

export interface ProfileUncertainty {
  readonly score: number; // 0.0 (certain) to 1.0 (uncertain)
  readonly missingEvidenceItems: readonly string[];
}

export interface ProfileDimension {
  readonly dimensionType: ProfileDimensionType;
  readonly score: number; // 0.0 to 1.0 relative metric
  readonly explanation: ProfileExplanation;
}

export interface TrustProfile {
  readonly profileId: string;
  readonly targetAgentId: string;
  readonly contextDomain: string;
  readonly timeWindow: ProfileTimeWindow;
  readonly dimensions: readonly ProfileDimension[];
  readonly uncertainty: ProfileUncertainty;
  readonly evidence: readonly ProfileEvidence[];
  readonly label: string;
}

export interface RiskProfile {
  readonly profileId: string;
  readonly targetAgentId: string;
  readonly contextDomain: string;
  readonly timeWindow: ProfileTimeWindow;
  readonly dimensions: readonly ProfileDimension[];
  readonly uncertainty: ProfileUncertainty;
  readonly evidence: readonly ProfileEvidence[];
}

export interface ProfileFailureReport {
  readonly reportId: string;
  readonly failureClass: ProfileFailureClass;
  readonly profileId: string;
  readonly description: string;
  readonly timestamp: string;
}

/**
 * Trust & Risk Profile Engine.
 * Evaluates behavioral trust & risk profiles for explainability, non-absolute labeling, and non-judgment boundaries.
 */
export class TrustRiskProfileEngine {
  evaluateTrustProfile(profile: TrustProfile): ProfileFailureReport | undefined {
    // 1. Missing Evidence Treated as Success Check
    if (profile.evidence.length === 0 && profile.uncertainty.score < 0.5) {
      return {
        reportId: `fail_no_ev_${profile.profileId}`,
        failureClass: "missing_evidence_treated_as_success",
        profileId: profile.profileId,
        description: `Profile '${profile.profileId}' has 0 evidence items but claims low uncertainty score of ${profile.uncertainty.score}.`,
        timestamp: profile.timeWindow.endTimestamp
      };
    }

    // 2. Absolute Trust Label Check
    const lowerLabel = profile.label.toLowerCase();
    if (
      lowerLabel.includes("absolutely trusted") ||
      lowerLabel.includes("100% trustworthy") ||
      lowerLabel.includes("perfect actor")
    ) {
      return {
        reportId: `fail_abs_${profile.profileId}`,
        failureClass: "absolute_trust_label",
        profileId: profile.profileId,
        description: `Profile label '${profile.label}' uses forbidden absolute trust terminology.`,
        timestamp: profile.timeWindow.endTimestamp
      };
    }

    // 3. Moral or Legal Judgment Check
    if (
      lowerLabel.includes("guilty") ||
      lowerLabel.includes("malicious") ||
      lowerLabel.includes("criminal") ||
      lowerLabel.includes("immoral")
    ) {
      return {
        reportId: `fail_moral_${profile.profileId}`,
        failureClass: "moral_or_legal_judgment",
        profileId: profile.profileId,
        description: `Profile label '${profile.label}' contains forbidden moral or legal judgment terms.`,
        timestamp: profile.timeWindow.endTimestamp
      };
    }

    // 4. Profile Without Explanation Check
    for (const dim of profile.dimensions) {
      if (!dim.explanation || !dim.explanation.summary || dim.explanation.summary.trim() === "") {
        return {
          reportId: `fail_no_exp_${profile.profileId}`,
          failureClass: "profile_without_explanation",
          profileId: profile.profileId,
          description: `Profile dimension '${dim.dimensionType}' lacks mandatory explanation rationale.`,
          timestamp: profile.timeWindow.endTimestamp
        };
      }
    }

    return undefined;
  }
}
