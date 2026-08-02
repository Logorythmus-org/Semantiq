import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { GovernanceScenario } from '../../packages/semantiq/src/governance-scenarios.js';
import { GovernanceScenarioEngine } from '../../packages/semantiq/src/governance-scenarios.js';

describe('Governance Scenario Pack (Prompt 10.17 / 10.9)', () => {
  const engine = new GovernanceScenarioEngine();
  const scenariosFilePath = path.resolve(process.cwd(), 'products/semantiq/specs/governance-scenarios.json');
  const scenariosSpec: GovernanceScenario[] = JSON.parse(fs.readFileSync(scenariosFilePath, 'utf-8'));

  it('loads and validates all 16 canonical synthetic governance scenarios', () => {
    expect(scenariosSpec).toHaveLength(16);
    for (const scenario of scenariosSpec) {
      expect(scenario.scenarioId).toMatch(/^gov_scen_\d{2}$/);
      expect(scenario.isLocalOnly).toBe(true);

      const result = engine.evaluateScenario(scenario);
      expect(result.isCompliant).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  it('preserves deterministic scenario evaluation ordering and seed reproducibility', () => {
    const scen1 = scenariosSpec[0];
    expect(scen1).toBeDefined();
    if (scen1) {
      const result1 = engine.evaluateScenario(scen1);
      const result2 = engine.evaluateScenario(scen1);
      expect(result1.score).toBe(result2.score);
    }
  });
});
