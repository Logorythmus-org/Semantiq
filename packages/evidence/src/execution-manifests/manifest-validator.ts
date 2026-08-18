/**
 * @package @semantiq/evidence
 * Protocol-Aware Study Execution Manifest Validator
 * 
 * Invariants:
 * 1. Execution manifests are compared deterministically against frozen pre-registrations.
 * 2. Partner attestation alone does not promote evidence or bypass protocol violations.
 * 3. Statuses: accepted | flagged | quarantined | rejected.
 */

import {
  EPISTEMIC_MANIFEST_DISCLAIMER,
  type ManifestExecutionStatus,
  type ManifestIngestionResult,
  type StudyExecutionManifest
} from "./types.js";
import type { StudyProtocol } from "../study-protocols/types.js";

export class StudyExecutionManifestValidator {
  /**
   * Deterministically validates an executed study manifest against its pre-registered protocol.
   */
  public validateAndIngestManifest(
    manifest: StudyExecutionManifest,
    protocol: StudyProtocol
  ): ManifestIngestionResult {
    const violations: string[] = [];
    const flags: string[] = [];

    // 1. Preregistration Hash & Version Match
    const preregistrationMatch =
      manifest.preregistrationFingerprint === protocol.preregistrationHash &&
      (protocol.status === "frozen" || protocol.status === "executed");

    if (!preregistrationMatch) {
      violations.push(
        `Preregistration hash mismatch: manifest referenced '${manifest.preregistrationFingerprint}' but registered protocol is '${protocol.preregistrationHash}' (status: ${protocol.status})`
      );
    }

    if (manifest.protocolVersion !== protocol.version) {
      violations.push(
        `Protocol version mismatch: manifest '${manifest.protocolVersion}' != protocol '${protocol.version}'`
      );
    }

    // 2. Matching Dimensions Conformity
    const requiredDims = protocol.matchingDimensions;
    const usedDimsSet = new Set(manifest.matchingDimensionsUsed);
    const missingDims = requiredDims.filter((d) => !usedDimsSet.has(d));
    const matchingDimensionsMatch = missingDims.length === 0;

    if (!matchingDimensionsMatch) {
      violations.push(
        `Missing required matching dimension(s): [${missingDims.join(", ")}]`
      );
    }

    // 3. Negative Controls Execution & Bounds
    let negativeControlsPassed = true;
    for (const ctrl of protocol.negativeControls) {
      const executedCtrl = manifest.executedNegativeControls.find((c) => c.controlId === ctrl.controlId);
      if (!executedCtrl) {
        negativeControlsPassed = false;
        violations.push(`Required negative control '${ctrl.controlId}' was not executed.`);
      } else if (!executedCtrl.executed) {
        negativeControlsPassed = false;
        violations.push(`Negative control '${ctrl.controlId}' marked as unexecuted.`);
      } else if (!executedCtrl.passedBound || Math.abs(executedCtrl.deltaObserved) > ctrl.expectedDeltaBound) {
        negativeControlsPassed = false;
        violations.push(
          `Negative control '${ctrl.controlId}' failed bound: observed |${executedCtrl.deltaObserved}| > expected bound ${ctrl.expectedDeltaBound}`
        );
      }
    }

    // 4. Sample Power & Minimum Matched Pairs
    const minRequired = protocol.sampleGuidance.minimumPairsRequired;
    const recommended = protocol.sampleGuidance.recommendedPairsForGradeA;
    const samplePowerSatisfied = manifest.matchedPairsCount >= minRequired;

    if (!samplePowerSatisfied) {
      violations.push(
        `Insufficient sample size: matched pairs ${manifest.matchedPairsCount} < minimum required ${minRequired}`
      );
    } else if (manifest.matchedPairsCount < recommended) {
      flags.push(
        `Sample size (${manifest.matchedPairsCount}) meets minimum (${minRequired}) but is below recommended power target (${recommended})`
      );
    }

    // 5. Missing Data Evaluation
    const missingRatio = manifest.missingDataReport.missingDataRatio;
    const missingDataAcceptable = missingRatio <= 0.20;

    if (!missingDataAcceptable) {
      violations.push(
        `Excessive missing data ratio: ${(missingRatio * 100).toFixed(1)}% exceeds maximum allowable threshold 20.0%`
      );
    } else if (missingRatio > 0.05) {
      flags.push(
        `Elevated missing data observed: ${(missingRatio * 100).toFixed(1)}% missing observation cells`
      );
    }

    // 6. Partner Attestation Presence Check
    // INVARIANT: No attestation alone promotes evidence.
    if (!manifest.partnerAttestation || !manifest.partnerAttestation.attestedBy) {
      flags.push("Missing partner attestation signature or identity.");
    }

    // 7. Calculate Adherence Score (0.0 to 1.0)
    let score = 1.0;
    if (!preregistrationMatch) score -= 0.50;
    if (!matchingDimensionsMatch) score -= 0.20;
    if (!negativeControlsPassed) score -= 0.20;
    if (!samplePowerSatisfied) score -= 0.10;
    if (!missingDataAcceptable) score -= 0.10;
    score = Math.max(0.0, Number(score.toFixed(2)));

    // 8. Determine Manifest Ingestion Status
    let status: ManifestExecutionStatus;
    if (!preregistrationMatch || violations.some((v) => v.includes("Preregistration hash mismatch"))) {
      status = "rejected";
    } else if (violations.length > 0) {
      status = "quarantined";
    } else if (flags.length > 0) {
      status = "flagged";
    } else {
      status = "accepted";
    }

    const result: ManifestIngestionResult = {
      manifestId: manifest.manifestId,
      protocolId: protocol.protocolId,
      status,
      preregistrationMatch,
      matchingDimensionsMatch,
      negativeControlsPassed,
      samplePowerSatisfied,
      missingDataAcceptable,
      flags: Object.freeze(flags),
      violations: Object.freeze(violations),
      adherenceScore: score,
      ingestedAt: new Date().toISOString(),
      epistemicDisclaimer: EPISTEMIC_MANIFEST_DISCLAIMER
    };

    return Object.freeze(result);
  }
}
