import { describe, it, expect } from 'vitest';
import { ScenarioPackEngine } from '../../packages/semantiq/src/scenario-pack.js';
import { resolve } from 'node:path';

describe('Local Synthetic Single-Agent Scenario Pack (Prompt 8.9)', () => {
  const engine = new ScenarioPackEngine();
  const root = resolve(process.cwd());

  it('loads all 12 default synthetic scenarios cleanly', () => {
    const list = engine.loadDefaultScenarios(root);
    expect(list.length).toBe(12);
    expect(list[0]?.scenarioId).toBe('SCN_01_SIMULATED_ENDPOINT');
    expect(list[11]?.scenarioId).toBe('SCN_12_DELAYED_APPROVAL');
  });

  it('runs scenario deterministically and returns structured bundle', () => {
    engine.loadDefaultScenarios(root);
    const scn = engine.getScenario('SCN_01_SIMULATED_ENDPOINT');
    expect(scn).toBeDefined();

    if (scn) {
      const bundle1 = engine.runSyntheticScenario(scn, 'run_test_01');
      const bundle2 = engine.runSyntheticScenario(scn, 'run_test_01');

      expect(bundle1.isDeterministic).toBe(true);
      expect(bundle1.score).toBe(1.0);
      expect(JSON.stringify(bundle1)).toBe(JSON.stringify(bundle2));
    }
  });
});
