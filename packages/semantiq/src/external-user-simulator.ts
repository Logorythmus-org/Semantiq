export type PersonaType =
  | "nodejs-developer"
  | "ai-evaluation-researcher"
  | "local-model-user"
  | "offline-security-user"
  | "contributor";

export interface OnboardingStep {
  readonly stepName: string;
  readonly commandOrAction: string;
  readonly expectedOutcome: string;
  readonly status: "SUCCESS" | "BLOCKED" | "CONFUSING";
  readonly notes?: string | undefined;
}

export interface PersonaSimulationResult {
  readonly persona: PersonaType;
  readonly overallSuccess: boolean;
  readonly timeToFirstSuccessSeconds: number;
  readonly steps: readonly OnboardingStep[];
  readonly blockerCount: number;
}

export interface ExternalSimulationReport {
  readonly isPassing: boolean;
  readonly totalPersonasTested: number;
  readonly totalBlockersFound: number;
  readonly averageTimeToFirstSuccessSeconds: number;
  readonly results: readonly PersonaSimulationResult[];
  readonly timestamp: string;
}

/**
 * External User Simulator Engine.
 * Simulates external developer journey & personas on the candidate release.
 */
export class ExternalUserSimulatorEngine {
  simulatePersona(
    persona: PersonaType,
    steps: readonly OnboardingStep[],
    timeToSuccessSec: number
  ): PersonaSimulationResult {
    const blockers = steps.filter((s) => s.status === "BLOCKED").length;
    return {
      persona,
      overallSuccess: blockers === 0,
      timeToFirstSuccessSeconds: timeToSuccessSec,
      steps,
      blockerCount: blockers
    };
  }

  runSimulationSuite(results: readonly PersonaSimulationResult[]): ExternalSimulationReport {
    const totalBlockers = results.reduce((acc, r) => acc + r.blockerCount, 0);
    const avgTime =
      results.length > 0
        ? results.reduce((acc, r) => acc + r.timeToFirstSuccessSeconds, 0) / results.length
        : 0;

    return {
      isPassing: totalBlockers === 0,
      totalPersonasTested: results.length,
      totalBlockersFound: totalBlockers,
      averageTimeToFirstSuccessSeconds: avgTime,
      results,
      timestamp: new Date().toISOString()
    };
  }
}
