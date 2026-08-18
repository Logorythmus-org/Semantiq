/**
 * @package @tech-club/semantiq
 * Authoritative Comparisons & Statistical Contrast Application Service
 */

import {
  EvidenceDecisionPolicy,
  RobustnessEngine,
  RunProfileMatcher,
  StatisticalContrastEngine,
  type EvidenceGovernanceDecision,
  type EvidenceGovernanceInputs,
  type MatchedContrastReport,
  type MatchedRunPair,
  type MatchingDimension,
  type RobustnessDiagnosticReport,
  type RobustnessSuiteOptions,
  type RunProfile
} from "../../../evidence/src/index.js";

export class ComparisonsService {
  private readonly matcher = new RunProfileMatcher();
  private readonly contrastEngine = new StatisticalContrastEngine();
  private readonly robustnessEngine = new RobustnessEngine();
  private readonly policy = new EvidenceDecisionPolicy("1.0.0");

  public async matchControls(
    runs: readonly RunProfile[],
    targetMetric: string,
    dimensions?: readonly MatchingDimension[]
  ): Promise<{
    matchedPairs: readonly MatchedRunPair[];
    treatmentCount: number;
    controlCount: number;
    unmatchedCount: number;
    matchingCoverageRatio: number;
  }> {
    return this.matcher.matchRuns(runs, targetMetric, dimensions);
  }

  public async computeStatisticalContrast(
    targetMetric: string,
    matchedData: {
      matchedPairs: readonly MatchedRunPair[];
      treatmentCount: number;
      controlCount: number;
      unmatchedCount: number;
      matchingCoverageRatio: number;
    }
  ): Promise<MatchedContrastReport> {
    return this.contrastEngine.evaluateContrast(targetMetric, matchedData);
  }

  public async runRobustnessDiagnostics(
    runs: readonly RunProfile[],
    targetMetric: string,
    options?: RobustnessSuiteOptions
  ): Promise<RobustnessDiagnosticReport> {
    return this.robustnessEngine.evaluateRobustnessSuite(runs, targetMetric, options);
  }

  public async evaluateGovernanceDecision(
    inputs: EvidenceGovernanceInputs
  ): Promise<EvidenceGovernanceDecision> {
    return this.policy.evaluate(inputs);
  }
}
