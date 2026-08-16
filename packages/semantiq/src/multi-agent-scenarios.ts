import * as fs from 'node:fs';
import * as path from 'node:path';

export interface SyntheticMultiAgentScenario {
  readonly scenarioId: string;
  readonly title: string;
  readonly description: string;
  readonly seed: number;
  readonly agentRoster: readonly string[];
  readonly roles: readonly string[];
  readonly capabilities: readonly string[];
  readonly authorities: readonly string[];
  readonly mission: string;
  readonly sharedContext: Readonly<Record<string, unknown>>;
  readonly tools: readonly string[];
  readonly permissions: readonly string[];
  readonly expectedInteractions: readonly string[];
  readonly expectedConflicts: readonly string[];
  readonly expectedEvidence: readonly string[];
  readonly successConditions: readonly string[];
  readonly failureConditions: readonly string[];
  readonly responsibilityExpectations: Readonly<Record<string, string>>;
  readonly recoveryExpectations: Readonly<Record<string, string>>;
}

export interface ScenarioPackManifest {
  readonly version: string;
  readonly scenarios: readonly SyntheticMultiAgentScenario[];
}

export class MultiAgentScenarioPackRunner {
  private readonly manifest: ScenarioPackManifest;

  constructor(jsonPath?: string) {
    const targetPath =
      jsonPath ??
      path.resolve(
        process.cwd(),
        'products',
        'semantiq',
        'specs',
        'multi-agent-scenarios.json'
      );
    const content = fs.readFileSync(targetPath, 'utf8');
    this.manifest = JSON.parse(content) as ScenarioPackManifest;
  }

  getScenarios(): readonly SyntheticMultiAgentScenario[] {
    return this.manifest.scenarios;
  }

  getScenarioById(id: string): SyntheticMultiAgentScenario | undefined {
    return this.manifest.scenarios.find((s) => s.scenarioId === id);
  }

  runDeterministicCheck(scenarioId: string): { deterministic: boolean; seed: number } {
    const sc = this.getScenarioById(scenarioId);
    if (!sc) throw new Error(`Scenario '${scenarioId}' not found.`);
    return {
      deterministic: typeof sc.seed === 'number' && sc.seed > 0,
      seed: sc.seed
    };
  }
}
