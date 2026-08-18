import type { EvidenceChecksum } from "./event-schema.js";

export type MappingFailureClass =
  | "outdated_framework_version"
  | "unsupported_mapping"
  | "missing_evidence"
  | "conflicting_mapping"
  | "false_certification_language"
  | "historical_mapping_rewrite"
  | "hidden_legal_assumptions";

export interface FrameworkIdentity {
  readonly frameworkId: string;
  readonly name: string;
  readonly publisher: string;
}

export interface FrameworkVersion {
  readonly versionString: string;
  readonly releasedAt: string;
  readonly isSupported: boolean;
}

export interface ControlIdentity {
  readonly controlId: string;
  readonly frameworkId: string;
  readonly title: string;
}

export interface RequirementIdentity {
  readonly requirementId: string;
  readonly controlId: string;
  readonly text: string;
}

export interface MappingConfidence {
  readonly score: number; // 0.0 to 1.0
  readonly rationale: string;
}

export interface EvidenceMapping {
  readonly mappingId: string;
  readonly requirementId: string;
  readonly evidenceChecksum: EvidenceChecksum;
  readonly confidence: MappingConfidence;
  readonly mappedAt: string;
  readonly claimText: string;
}

export interface CoverageRecord {
  readonly coverageId: string;
  readonly requirementId: string;
  readonly status: "covered" | "partial" | "uncovered";
  readonly mappedEvidenceCount: number;
}

export interface GapRecord {
  readonly gapId: string;
  readonly requirementId: string;
  readonly description: string;
}

export interface MappingReview {
  readonly reviewId: string;
  readonly reviewerId: string;
  readonly isVerified: boolean;
}

export interface MappingFailureReport {
  readonly reportId: string;
  readonly failureClass: MappingFailureClass;
  readonly mappingId: string;
  readonly description: string;
  readonly timestamp: string;
}

/**
 * Compliance Mapping Engine.
 * Evaluates mapping coverage, framework version currency, false certification language, and missing evidence.
 */
export class ComplianceMappingEngine {
  evaluateMapping(
    frameworkVersion: FrameworkVersion,
    mapping: EvidenceMapping,
    hasEvidence = true
  ): MappingFailureReport | undefined {
    // 1. Outdated Framework Version Check
    if (!frameworkVersion.isSupported) {
      return {
        reportId: `fail_outdated_${mapping.mappingId}`,
        failureClass: "outdated_framework_version",
        mappingId: mapping.mappingId,
        description: `Framework version '${frameworkVersion.versionString}' is deprecated or unsupported.`,
        timestamp: mapping.mappedAt
      };
    }

    // 2. Missing Evidence Check
    if (
      !hasEvidence ||
      !mapping.evidenceChecksum.hash ||
      mapping.evidenceChecksum.hash.trim() === ""
    ) {
      return {
        reportId: `fail_no_ev_${mapping.mappingId}`,
        failureClass: "missing_evidence",
        mappingId: mapping.mappingId,
        description: `Mapping '${mapping.mappingId}' references non-existent or empty evidence hash.`,
        timestamp: mapping.mappedAt
      };
    }

    // 3. False Certification Language Check
    const lowerClaim = mapping.claimText.toLowerCase();
    if (
      lowerClaim.includes("certified") ||
      lowerClaim.includes("legal compliance guaranteed") ||
      lowerClaim.includes("fully compliant")
    ) {
      return {
        reportId: `fail_cert_${mapping.mappingId}`,
        failureClass: "false_certification_language",
        mappingId: mapping.mappingId,
        description: `Mapping claim '${mapping.claimText}' violates non-certification boundary.`,
        timestamp: mapping.mappedAt
      };
    }

    // 4. Unsupported Mapping Check
    if (mapping.confidence.score < 0.2) {
      return {
        reportId: `fail_unsup_${mapping.mappingId}`,
        failureClass: "unsupported_mapping",
        mappingId: mapping.mappingId,
        description: `Mapping confidence score ${mapping.confidence.score} is below minimum threshold 0.2.`,
        timestamp: mapping.mappedAt
      };
    }

    return undefined;
  }
}
