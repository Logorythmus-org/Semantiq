import type { EvidenceChecksum } from "./event-schema.js";

export type ApplicabilityDimensionType =
  | "actor"
  | "role"
  | "authority"
  | "mission"
  | "resource"
  | "action"
  | "environment"
  | "organization"
  | "temporal";

export type ApplicabilityFailureClass =
  | "wrong_actor_scope"
  | "wrong_resource_scope"
  | "temporal_mismatch"
  | "overlapping_policies"
  | "stale_policy_reference"
  | "silent_assumption_of_applicability"
  | "insufficient_evidence";

export interface ApplicabilityDimension {
  readonly dimensionType: ApplicabilityDimensionType;
  readonly targetValue: string;
}

export interface ApplicabilityEvidence {
  readonly evidenceId: string;
  readonly checksum: EvidenceChecksum;
  readonly description: string;
}

export interface ApplicabilityCondition {
  readonly conditionId: string;
  readonly field: string;
  readonly expectedValue: string;
}

export interface ApplicabilityConflict {
  readonly conflictId: string;
  readonly policyIdA: string;
  readonly policyIdB: string;
  readonly overlappingDimension: ApplicabilityDimensionType;
}

export interface ApplicabilityUncertainty {
  readonly uncertaintyId: string;
  readonly score: number; // 0.0 (certain) to 1.0 (uncertain)
  readonly missingEvidenceFields: readonly string[];
}

export interface PolicyApplicability {
  readonly applicabilityId: string;
  readonly policyId: string;
  readonly targetActorId: string;
  readonly targetResourceId: string;
  readonly timestamp: string;
  readonly isApplicable: boolean;
  readonly dimensions: readonly ApplicabilityDimension[];
  readonly uncertainty?: ApplicabilityUncertainty;
}

export interface ApplicabilityReport {
  readonly reportId: string;
  readonly failureClass: ApplicabilityFailureClass;
  readonly policyId: string;
  readonly description: string;
  readonly timestamp: string;
}

export class PolicyApplicabilityEngine {
  evaluateApplicability(
    policyId: string,
    policyAllowedActors: readonly string[],
    policyAllowedResources: readonly string[],
    validUntil: string | undefined,
    requestActorId: string,
    requestResourceId: string,
    timestamp: string,
    hasEvidence = true
  ): { applicability: PolicyApplicability; failure?: ApplicabilityReport } {
    // 1. Insufficient Evidence Check
    if (!hasEvidence) {
      return {
        applicability: {
          applicabilityId: `app_fail_${policyId}`,
          policyId,
          targetActorId: requestActorId,
          targetResourceId: requestResourceId,
          timestamp,
          isApplicable: false,
          dimensions: [],
          uncertainty: {
            uncertaintyId: `unc_${policyId}`,
            score: 1.0,
            missingEvidenceFields: ["evidence_checksum"]
          }
        },
        failure: {
          reportId: `fail_ev_${policyId}`,
          failureClass: "insufficient_evidence",
          policyId,
          description: `Applicability for policy '${policyId}' cannot be evaluated without evidence.`,
          timestamp
        }
      };
    }

    // 2. Wrong Actor Scope Check
    if (policyAllowedActors.length > 0 && !policyAllowedActors.includes(requestActorId)) {
      return {
        applicability: {
          applicabilityId: `app_actor_${policyId}`,
          policyId,
          targetActorId: requestActorId,
          targetResourceId: requestResourceId,
          timestamp,
          isApplicable: false,
          dimensions: [{ dimensionType: "actor", targetValue: requestActorId }]
        },
        failure: {
          reportId: `fail_actor_${policyId}`,
          failureClass: "wrong_actor_scope",
          policyId,
          description: `Actor '${requestActorId}' is outside allowed policy scope.`,
          timestamp
        }
      };
    }

    // 3. Wrong Resource Scope Check
    if (policyAllowedResources.length > 0 && !policyAllowedResources.includes(requestResourceId)) {
      return {
        applicability: {
          applicabilityId: `app_res_${policyId}`,
          policyId,
          targetActorId: requestActorId,
          targetResourceId: requestResourceId,
          timestamp,
          isApplicable: false,
          dimensions: [{ dimensionType: "resource", targetValue: requestResourceId }]
        },
        failure: {
          reportId: `fail_res_${policyId}`,
          failureClass: "wrong_resource_scope",
          policyId,
          description: `Resource '${requestResourceId}' is outside allowed policy scope.`,
          timestamp
        }
      };
    }

    // 4. Temporal Mismatch Check
    if (validUntil && new Date(timestamp) > new Date(validUntil)) {
      return {
        applicability: {
          applicabilityId: `app_time_${policyId}`,
          policyId,
          targetActorId: requestActorId,
          targetResourceId: requestResourceId,
          timestamp,
          isApplicable: false,
          dimensions: [{ dimensionType: "temporal", targetValue: validUntil }]
        },
        failure: {
          reportId: `fail_time_${policyId}`,
          failureClass: "temporal_mismatch",
          policyId,
          description: `Policy evaluation at '${timestamp}' exceeds valid expiration date '${validUntil}'.`,
          timestamp
        }
      };
    }

    return {
      applicability: {
        applicabilityId: `app_ok_${policyId}`,
        policyId,
        targetActorId: requestActorId,
        targetResourceId: requestResourceId,
        timestamp,
        isApplicable: true,
        dimensions: [
          { dimensionType: "actor", targetValue: requestActorId },
          { dimensionType: "resource", targetValue: requestResourceId }
        ]
      }
    };
  }
}
