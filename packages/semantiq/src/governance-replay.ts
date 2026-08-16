import type { EvidenceChecksum } from "./event-schema.js";

export type GovernanceReplayFailureClass =
  | "missing_policy"
  | "changed_policy_version"
  | "altered_approval"
  | "missing_exception"
  | "changed_decision_evidence"
  | "missing_dissent"
  | "tampered_incident"
  | "changed_responsibility_edge"
  | "incomplete_recovery"
  | "changed_profile_input";

export interface GovernanceReplayBundle {
  readonly bundleId: string;
  readonly sessionTarget: string;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly approvalChecksum: EvidenceChecksum;
  readonly decisionChecksum: EvidenceChecksum;
  readonly incidentChecksum: EvidenceChecksum;
  readonly recoveryCompleted: boolean;
  readonly timestamp: string;
}

export interface GovernanceReplayFailure {
  readonly failureId: string;
  readonly failureClass: GovernanceReplayFailureClass;
  readonly bundleId: string;
  readonly description: string;
  readonly timestamp: string;
}

/**
 * Governance Replay Verifier.
 * Verifies deterministic reconstruction of governance runs without re-executing external actions.
 */
export class GovernanceReplayVerifier {
  verifyReplay(
    original: GovernanceReplayBundle,
    reconstructed: GovernanceReplayBundle | undefined
  ): GovernanceReplayFailure | undefined {
    // 1. Missing Policy Check
    if (!reconstructed) {
      return {
        failureId: `fail_missing_${original.bundleId}`,
        failureClass: "missing_policy",
        bundleId: original.bundleId,
        description: `Reconstructed governance bundle '${original.bundleId}' is missing.`,
        timestamp: original.timestamp
      };
    }

    // 2. Changed Policy Version Check
    if (original.policyVersion !== reconstructed.policyVersion) {
      return {
        failureId: `fail_ver_${original.bundleId}`,
        failureClass: "changed_policy_version",
        bundleId: original.bundleId,
        description: `Policy version mismatch: original '${original.policyVersion}' vs reconstructed '${reconstructed.policyVersion}'.`,
        timestamp: original.timestamp
      };
    }

    // 3. Altered Approval Check
    if (original.approvalChecksum.hash !== reconstructed.approvalChecksum.hash) {
      return {
        failureId: `fail_app_${original.bundleId}`,
        failureClass: "altered_approval",
        bundleId: original.bundleId,
        description: `Approval checksum mismatch detected for bundle '${original.bundleId}'.`,
        timestamp: original.timestamp
      };
    }

    // 4. Changed Decision Evidence Check
    if (original.decisionChecksum.hash !== reconstructed.decisionChecksum.hash) {
      return {
        failureId: `fail_dec_${original.bundleId}`,
        failureClass: "changed_decision_evidence",
        bundleId: original.bundleId,
        description: `Decision evidence checksum mismatch detected for bundle '${original.bundleId}'.`,
        timestamp: original.timestamp
      };
    }

    // 5. Tampered Incident Check
    if (original.incidentChecksum.hash !== reconstructed.incidentChecksum.hash) {
      return {
        failureId: `fail_inc_${original.bundleId}`,
        failureClass: "tampered_incident",
        bundleId: original.bundleId,
        description: `Incident checksum mismatch detected for bundle '${original.bundleId}'.`,
        timestamp: original.timestamp
      };
    }

    // 6. Incomplete Recovery Check
    if (!reconstructed.recoveryCompleted) {
      return {
        failureId: `fail_rec_${original.bundleId}`,
        failureClass: "incomplete_recovery",
        bundleId: original.bundleId,
        description: `Reconstructed replay bundle '${original.bundleId}' has incomplete recovery status.`,
        timestamp: original.timestamp
      };
    }

    return undefined;
  }
}
