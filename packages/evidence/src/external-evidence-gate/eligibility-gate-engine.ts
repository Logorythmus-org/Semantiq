/**
 * @package @semantiq/evidence
 * External Evidence Eligibility Gate Engine
 * 
 * Invariants:
 * 1. Gate eligibility determines evidence admissibility for aggregation; eligibility does not confer truth.
 * 2. Ineligible evidence (quarantined or rejected) is strictly blocked from Evidence Graph and E-level promotion.
 * 3. Quarantined and rejected submissions remain stored and auditable.
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import {
  EPISTEMIC_GATE_DISCLAIMER,
  type EligibilityVerdict,
  type ExternalEvidenceEligibilityDecision,
  type GateEvaluationInput,
  type GateReasonCode
} from "./types.js";

export class ExternalEvidenceEligibilityGate {
  /**
   * Deterministically evaluates external study evidence against pre-registration,
   * bundle integrity, audit chains, instrumentation, and provenance.
   */
  public evaluateSubmission(input: GateEvaluationInput): ExternalEvidenceEligibilityDecision {
    const reasonCodes: GateReasonCode[] = [];
    const reasons: string[] = [];
    const caveats: string[] = [];

    let hasCriticalFailure = false;
    let hasMaterialFailure = false;

    // 1. Bundle Verification & Cryptographic Tamper Detection
    if (!input.bundleVerification.isValid || input.bundleVerification.tamperDetected) {
      hasCriticalFailure = true;
      reasonCodes.push("BUNDLE_INTEGRITY_TAMPERED");
      reasons.push(
        `Bundle tamper detected: ${input.bundleVerification.violations.join(", ") || "corrupted artifacts or Merkle root"}`
      );
    } else {
      reasonCodes.push("BUNDLE_INTEGRITY_VERIFIED");
    }

    // 2. Preregistration Match
    const preregMatches =
      input.manifest.preregistrationFingerprint === input.protocol.preregistrationHash &&
      (input.protocol.status === "frozen" || input.protocol.status === "executed");

    if (!preregMatches) {
      hasCriticalFailure = true;
      reasonCodes.push("PREREG_HASH_MISMATCH");
      reasons.push(
        `Preregistration hash mismatch: manifest referenced '${input.manifest.preregistrationFingerprint}' != protocol hash '${input.protocol.preregistrationHash}' (status: ${input.protocol.status})`
      );
    } else {
      reasonCodes.push("PREREG_HASH_MATCH");
    }

    // 3. Deviation Hash Chain & Severity Analysis
    if (!input.deviationChainValid) {
      hasCriticalFailure = true;
      reasonCodes.push("DEVIATION_CHAIN_BROKEN");
      reasons.push("Protocol deviation audit hash-chain is broken or corrupted.");
    } else {
      reasonCodes.push("DEVIATION_CHAIN_VALID");
    }

    for (const dev of input.deviations) {
      if (dev.severity === "critical") {
        hasCriticalFailure = true;
        reasonCodes.push("DEVIATION_CRITICAL_REJECTED");
        reasons.push(`Critical protocol deviation recorded: ${dev.description}`);
      } else if (dev.severity === "material" && (dev.timing === "during_execution" || dev.timing === "post_hoc")) {
        hasMaterialFailure = true;
        reasonCodes.push("DEVIATION_MATERIAL_CAPPED");
        reasons.push(`Material deviation occurred during/post execution: ${dev.description}`);
      } else if (dev.severity === "minor") {
        caveats.push(`Minor protocol deviation noted: ${dev.description}`);
      }
    }

    // 4. Provenance & Organization Trust Tier
    if (input.organization.trustTier === "unverified") {
      hasCriticalFailure = true;
      reasonCodes.push("PROVENANCE_UNVERIFIED");
      reasons.push(`Partner organization '${input.organization.id}' has unverified trust tier.`);
    } else {
      reasonCodes.push("PROVENANCE_AUTHENTICATED");
    }

    // 5. Instrumentation Completeness
    const inst = input.manifest.observedInstrumentation;
    if (inst.samplingRateHz <= 0 || inst.isolationGuarantees.length === 0) {
      hasMaterialFailure = true;
      reasonCodes.push("INSTRUMENTATION_DEFICIENT");
      reasons.push("Instrumentation deficient: missing sampling rate or isolation guarantees.");
    } else {
      reasonCodes.push("INSTRUMENTATION_COMPLETE");
    }

    // 6. Negative Controls Execution
    const allNegControlsPassed = input.protocol.negativeControls.every((ctrl) => {
      const executed = input.manifest.executedNegativeControls.find((c) => c.controlId === ctrl.controlId);
      return executed && executed.executed && executed.passedBound;
    });

    if (!allNegControlsPassed) {
      hasMaterialFailure = true;
      reasonCodes.push("NEGATIVE_CONTROLS_FAILED");
      reasons.push("One or more negative controls were omitted or failed expected null-hypothesis bounds.");
    } else {
      reasonCodes.push("NEGATIVE_CONTROLS_PASSED");
    }

    // 7. Missing Data & Sample Power
    const missingRatio = input.manifest.missingDataReport.missingDataRatio;
    if (missingRatio > 0.20) {
      hasMaterialFailure = true;
      reasonCodes.push("MISSING_DATA_EXCESSIVE");
      reasons.push(`Missing data ratio ${(missingRatio * 100).toFixed(1)}% exceeds 20% tolerance.`);
    } else {
      reasonCodes.push("MISSING_DATA_ACCEPTABLE");
      if (missingRatio > 0.05) {
        caveats.push(`Mild missing data observed: ${(missingRatio * 100).toFixed(1)}%`);
      }
    }

    const minPairs = input.protocol.sampleGuidance.minimumPairsRequired;
    const recommendedPairs = input.protocol.sampleGuidance.recommendedPairsForGradeA;
    if (input.manifest.matchedPairsCount < minPairs) {
      hasMaterialFailure = true;
      reasonCodes.push("SAMPLE_POWER_DEFICIENT");
      reasons.push(`Matched pairs count ${input.manifest.matchedPairsCount} is below minimum ${minPairs}.`);
    } else {
      reasonCodes.push("SAMPLE_POWER_SUFFICIENT");
      if (input.manifest.matchedPairsCount < recommendedPairs) {
        caveats.push(
          `Sample size (${input.manifest.matchedPairsCount}) meets minimum but is below recommended power target (${recommendedPairs}).`
        );
      }
    }

    // 8. Verdict Assignment
    let verdict: EligibilityVerdict;
    let isAdmissibleForAggregation = false;

    if (hasCriticalFailure) {
      verdict = "rejected";
      isAdmissibleForAggregation = false;
    } else if (hasMaterialFailure) {
      verdict = "quarantined";
      isAdmissibleForAggregation = false;
    } else if (caveats.length > 0) {
      verdict = "eligible_with_caveats";
      isAdmissibleForAggregation = true;
    } else {
      verdict = "eligible";
      isAdmissibleForAggregation = true;
    }

    const decisionId = `gate_dec_${computeSha256(`${input.manifest.manifestId}:${verdict}:${reasons.join("|")}`).slice(0, 16)}`;

    const decision: ExternalEvidenceEligibilityDecision = {
      decisionId,
      studyId: input.manifest.studyId,
      targetClaimId: input.protocol.targetPatternId,
      organizationId: input.organization.id,
      verdict,
      isAdmissibleForAggregation,
      reasonCodes: Object.freeze(reasonCodes),
      reasons: Object.freeze(reasons),
      caveats: Object.freeze(caveats),
      evaluatedAt: new Date().toISOString(),
      epistemicDisclaimer: EPISTEMIC_GATE_DISCLAIMER
    };

    return Object.freeze(decision);
  }
}
