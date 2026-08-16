import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { VerbTaxonomyRegistry } from '../../packages/semantiq/src/verb-taxonomy.js';

describe('Verb-Centered Behavioral Taxonomy', () => {
  const specPath = path.resolve(__dirname, '../../products/semantiq/specs/verb-taxonomy.json');
  const specData = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  const registry = new VerbTaxonomyRegistry(specData);

  it('resolves canonical verbs by identifier', () => {
    const verb = registry.getVerb('execute');
    expect(verb.family).toBe('operational');
    expect(verb.defaultRiskClass).toBe('high');
  });

  it('resolves verb aliases deterministically', () => {
    const verb = registry.resolveVerb('run_command');
    expect(verb).toBeDefined();
    expect(verb?.identifier).toBe('execute');
  });

  it('rejects unknown or unmapped verbs', () => {
    const verb = registry.resolveVerb('do_unknown_stuff');
    expect(verb).toBeUndefined();
    expect(() => registry.getVerb('nonexistent_verb')).toThrow('Unknown canonical verb identifier');
  });

  it('validates mandatory evidence requirements for events', () => {
    const invalidResult = registry.validateVerbEvent('execute', ['command_line']);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.reason).toContain("Missing mandatory evidence requirement 'exit_code'");

    const validResult = registry.validateVerbEvent('execute', ['command_line', 'exit_code', 'stdout_hash']);
    expect(validResult.valid).toBe(true);
  });

  it('contains all 7 required verb families', () => {
    const families = [
      'generative',
      'observational',
      'cognitive',
      'operational',
      'communicative',
      'coordinative',
      'protective_and_recovery'
    ];
    for (const fam of families) {
      const verbs = registry.listVerbs(fam as any);
      expect(verbs.length).toBeGreaterThan(0);
    }
  });
});
