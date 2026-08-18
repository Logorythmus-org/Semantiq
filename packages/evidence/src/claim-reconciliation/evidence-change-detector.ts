/**
 * @package @semantiq/evidence
 * Evidence Change Detector
 */

import type {
  EvidenceDiff,
  EvidenceStateSnapshot
} from "./types.js";

export class EvidenceChangeDetector {
  /**
   * Detects evidence changes and computes an EvidenceDiff between snapshots.
   */
  public detectChanges(
    baseline: EvidenceStateSnapshot,
    current: EvidenceStateSnapshot,
    newCounterevidenceCount = 0
  ): EvidenceDiff {
    const runCountDelta = current.runIds.length - baseline.runIds.length;
    const metricDelta = Number((current.meanMetricScore - baseline.meanMetricScore).toFixed(4));
    const negControlDelta = current.negativeControlFailures - baseline.negativeControlFailures;

    const governanceShift =
      baseline.latestGovernanceVerdict !== current.latestGovernanceVerdict
        ? {
            from: baseline.latestGovernanceVerdict,
            to: current.latestGovernanceVerdict
          }
        : undefined;

    return {
      runCountDelta,
      metricDelta,
      governanceShift,
      newCounterevidenceCount,
      negativeControlFailuresDelta: negControlDelta
    };
  }
}
