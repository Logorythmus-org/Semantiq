export interface RuntimeEnvironment {
  readonly nodeVersion: string;
  readonly packageManager: string;
  readonly packageManagerVersion: string;
  readonly os: string;
  readonly architecture: string;
  readonly timestamp: string;
}

export type ValidationStepResult = 'PASSED' | 'FAILED' | 'SKIPPED' | 'WARNING';

export interface IsolatedValidationStep {
  readonly step: string;
  readonly command: string;
  readonly result: ValidationStepResult;
  readonly exitCode: number;
  readonly notes?: string | undefined;
}

export interface IsolatedValidationSuite {
  readonly environment: RuntimeEnvironment;
  readonly steps: readonly IsolatedValidationStep[];
  readonly overallPassed: boolean;
  readonly totalSteps: number;
  readonly passedSteps: number;
  readonly failedSteps: number;
  readonly timestamp: string;
}

/**
 * Isolated Validator Engine.
 * Records and evaluates the results of isolated install, build, and test
 * runs for the SemantIQ release candidate.
 */
export class IsolatedValidatorEngine {
  buildEnvironment(
    nodeVersion: string,
    pmName: string,
    pmVersion: string,
    os: string,
    arch: string
  ): RuntimeEnvironment {
    return {
      nodeVersion,
      packageManager: pmName,
      packageManagerVersion: pmVersion,
      os,
      architecture: arch,
      timestamp: new Date().toISOString()
    };
  }

  evaluateStep(
    step: string,
    command: string,
    exitCode: number,
    notes?: string | undefined
  ): IsolatedValidationStep {
    const result: ValidationStepResult = exitCode === 0 ? 'PASSED' : 'FAILED';
    const base = { step, command, result, exitCode };
    return notes !== undefined ? { ...base, notes } : base;
  }

  buildSuite(
    environment: RuntimeEnvironment,
    steps: readonly IsolatedValidationStep[]
  ): IsolatedValidationSuite {
    const passed = steps.filter(s => s.result === 'PASSED').length;
    const failed = steps.filter(s => s.result === 'FAILED').length;
    return {
      environment,
      steps,
      overallPassed: failed === 0,
      totalSteps: steps.length,
      passedSteps: passed,
      failedSteps: failed,
      timestamp: new Date().toISOString()
    };
  }
}
