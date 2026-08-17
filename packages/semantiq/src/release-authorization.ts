export type ReleaseLevel =
  | "level_0_no_release"
  | "level_1_research_preview"
  | "level_2_public_alpha"
  | "level_3_public_benchmark_release";

export interface GateStatus {
  readonly gateId: string;
  readonly gateName: string;
  readonly isPassed: boolean;
  readonly evidenceReference: string;
}

export interface ReleaseAuthorizationDecision {
  readonly decisionId: string;
  readonly approvedReleaseLevel: ReleaseLevel;
  readonly approvedComponents: readonly string[];
  readonly excludedComponents: readonly string[];
  readonly conditions: readonly string[];
  readonly expirationDate: string;
  readonly unresolvedRisks: readonly string[];
  readonly rollbackTrigger: string;
  readonly responsibleMaintainers: readonly string[];
  readonly evidenceManifestLinks: readonly string[];
  readonly dissentingOpinions: readonly string[];
  readonly isPhase12Approved: boolean;
  readonly timestamp: string;
}

export interface GateSuiteEvaluation {
  readonly gateA_scientificHonesty: GateStatus;
  readonly gateB_reproducibility: GateStatus;
  readonly gateC_contestability: GateStatus;
  readonly gateD_humanResponsibility: GateStatus;
  readonly gateE_antiGaming: GateStatus;
  readonly gateF_communityLegitimacy: GateStatus;
  readonly gateG_correctionCapability: GateStatus;
  readonly gateH_selfObservation: GateStatus;
}

export interface ReleaseAuthorizationReport {
  readonly isValid: boolean;
  readonly violations: readonly string[];
}

/**
 * Release Authorization Engine.
 * Evaluates Phase 11.5 evidence gates A through H to determine allowable release level
 * and generate machine-readable Phase 12 release authorization.
 */
export class ReleaseAuthorizationEngine {
  evaluateGates(gates: GateSuiteEvaluation, criticalBlockersCount: number): ReleaseLevel {
    const allGatesPassed =
      gates.gateA_scientificHonesty.isPassed &&
      gates.gateB_reproducibility.isPassed &&
      gates.gateC_contestability.isPassed &&
      gates.gateD_humanResponsibility.isPassed &&
      gates.gateE_antiGaming.isPassed &&
      gates.gateF_communityLegitimacy.isPassed &&
      gates.gateG_correctionCapability.isPassed &&
      gates.gateH_selfObservation.isPassed;

    if (
      criticalBlockersCount > 0 ||
      !gates.gateA_scientificHonesty.isPassed ||
      !gates.gateD_humanResponsibility.isPassed
    ) {
      return "level_0_no_release";
    }

    if (allGatesPassed && criticalBlockersCount === 0) {
      return "level_2_public_alpha"; // Approved for Level 2 Public Alpha transition to Phase 12
    }

    return "level_1_research_preview";
  }

  validateDecision(
    decision: ReleaseAuthorizationDecision,
    _gates: GateSuiteEvaluation
  ): ReleaseAuthorizationReport {
    const violations: string[] = [];

    if (decision.approvedReleaseLevel === "level_3_public_benchmark_release") {
      // Require independent external reproduction evidence before Level 3
      const hasExtRep = decision.evidenceManifestLinks.some((l) =>
        l.includes("independent-reproduction")
      );
      if (!hasExtRep) {
        violations.push(
          "Level 3 Public Benchmark Release requires documented independent external reproduction evidence."
        );
      }
    }

    if (!decision.evidenceManifestLinks || decision.evidenceManifestLinks.length === 0) {
      violations.push("Release authorization decision must link to evidence manifests.");
    }

    if (!decision.rollbackTrigger || decision.rollbackTrigger.trim() === "") {
      violations.push("Release authorization decision must define a rollback trigger.");
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }
}
