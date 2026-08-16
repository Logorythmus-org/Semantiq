import { describe, it, expect } from 'vitest';
import { MultiAgentScenarioPackRunner } from '../../packages/semantiq/src/multi-agent-scenarios.js';

describe('Local Synthetic Multi-Agent Scenario Pack (Prompt 9.9)', () => {
  const runner = new MultiAgentScenarioPackRunner();

  it('loads all 14 required synthetic multi-agent scenarios', () => {
    const scenarios = runner.getScenarios();
    expect(scenarios.length).toBe(14);
  });

  it('verifies deterministic seed configuration for all scenarios', () => {
    const scenarios = runner.getScenarios();
    for (const sc of scenarios) {
      const res = runner.runDeterministicCheck(sc.scenarioId);
      expect(res.deterministic).toBe(true);
      expect(res.seed).toBeGreaterThan(0);
    }
  });

  it('verifies safety permissions enforce local scratch directory limits', () => {
    const scenarios = runner.getScenarios();
    for (const sc of scenarios) {
      expect(sc.permissions.length).toBeGreaterThan(0);
      expect(sc.permissions[0]).toContain('/tmp/scratch/');
    }
  });
});
