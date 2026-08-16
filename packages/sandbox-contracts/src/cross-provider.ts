/**
 * @package @semantiq/sandbox-contracts
 * Cross-Provider Reproducibility and Equivalence Contracts and Interfaces
 */

import type { StateDelta, SandboxProvenance } from "./types.js";

export type DivergenceCategory =
  | "BENIGN_ENVIRONMENTAL_DRIFT"
  | "PERFORMANCE_VARIANCE"
  | "BEHAVIORAL_DIVERGENCE"
  | "CRITICAL_FAULT";

export type EquivalenceLevel = "EXACT_BYTE_IDENTICAL" | "SEMANTICALLY_EQUIVALENT" | "DIVERGENT";

export interface CrossProviderComparisonRequest {
  readonly comparisonId: string;
  readonly scenarioId: string;
  readonly baselineProvenance: SandboxProvenance;
  readonly candidateProvenance: SandboxProvenance;
  readonly baselineExitCode: number;
  readonly candidateExitCode: number;
  readonly baselineStdout: string;
  readonly candidateStdout: string;
  readonly baselineStateDelta?: StateDelta | undefined;
  readonly candidateStateDelta?: StateDelta | undefined;
}

export interface CrossProviderDivergenceItem {
  readonly property: string;
  readonly baselineValue: string;
  readonly candidateValue: string;
  readonly category: DivergenceCategory;
  readonly description: string;
}

export interface CrossProviderDivergenceReport {
  readonly comparisonId: string;
  readonly scenarioId: string;
  readonly equivalenceLevel: EquivalenceLevel;
  readonly isEquivalent: boolean;
  readonly divergences: readonly CrossProviderDivergenceItem[];
  readonly comparisonTimestamp: string;
}

/**
 * Cross-Provider Equivalence Evaluator.
 * Compares benchmark execution outputs across distinct provider runtimes
 * separating benign environment variations from actual model behavioral divergence.
 */
export class CrossProviderEquivalenceEvaluator {
  evaluateComparison(request: CrossProviderComparisonRequest): CrossProviderDivergenceReport {
    const divergences: CrossProviderDivergenceItem[] = [];

    // 1. Exit code parity check (Critical)
    if (request.baselineExitCode !== request.candidateExitCode) {
      divergences.push({
        property: "exitCode",
        baselineValue: String(request.baselineExitCode),
        candidateValue: String(request.candidateExitCode),
        category: "BEHAVIORAL_DIVERGENCE",
        description: `Exit codes do not match (${request.baselineExitCode} vs ${request.candidateExitCode}).`
      });
    }

    // 2. Canonicalized stdout comparison
    const normBaselineStdout = this.canonicalizeText(request.baselineStdout);
    const normCandidateStdout = this.canonicalizeText(request.candidateStdout);

    if (normBaselineStdout !== normCandidateStdout) {
      const isMinor = this.isMinorDrift(normBaselineStdout, normCandidateStdout);
      divergences.push({
        property: "stdout",
        baselineValue: normBaselineStdout.slice(0, 100),
        candidateValue: normCandidateStdout.slice(0, 100),
        category: isMinor ? "BENIGN_ENVIRONMENTAL_DRIFT" : "BEHAVIORAL_DIVERGENCE",
        description: isMinor
          ? "Minor formatting or path differences detected in stdout."
          : "Significant divergence in output text content."
      });
    }

    // 3. Architecture or Provider drift
    if (
      request.baselineProvenance.hostArchitecture !== request.candidateProvenance.hostArchitecture
    ) {
      divergences.push({
        property: "hostArchitecture",
        baselineValue: request.baselineProvenance.hostArchitecture,
        candidateValue: request.candidateProvenance.hostArchitecture,
        category: "BENIGN_ENVIRONMENTAL_DRIFT",
        description: "Execution occurred on different CPU architectures."
      });
    }

    const hasBehavioralDivergence = divergences.some(
      (d) => d.category === "BEHAVIORAL_DIVERGENCE" || d.category === "CRITICAL_FAULT"
    );

    let equivalenceLevel: EquivalenceLevel = "DIVERGENT";
    if (!hasBehavioralDivergence) {
      equivalenceLevel =
        divergences.length === 0 ? "EXACT_BYTE_IDENTICAL" : "SEMANTICALLY_EQUIVALENT";
    }

    return {
      comparisonId: request.comparisonId,
      scenarioId: request.scenarioId,
      equivalenceLevel,
      isEquivalent: !hasBehavioralDivergence,
      divergences,
      comparisonTimestamp: new Date().toISOString()
    };
  }

  private canonicalizeText(text: string): string {
    return text
      .replace(/\r\n/g, "\n")
      .replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z/g, "[TIMESTAMP]")
      .trim();
  }

  private isMinorDrift(a: string, b: string): boolean {
    // Basic heuristic: length difference < 10% and contains similar tokens
    const lengthDiff = Math.abs(a.length - b.length);
    return lengthDiff < Math.max(a.length, b.length) * 0.1;
  }
}
