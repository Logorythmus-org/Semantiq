import { describe, it, expect } from 'vitest';
import { ScientificClaimsValidatorEngine, CANONICAL_DISCLAIMER } from '../../packages/semantiq/src/scientific-claims.js';
import type { ResultClaimRecord, ScopeOfClaimBlock } from '../../packages/semantiq/src/scientific-claims.js';

describe('Phase 11.5.2 — Claims Boundary and Scientific Honesty', () => {
  const engine = new ScientificClaimsValidatorEngine();

  const validScope: ScopeOfClaimBlock = {
    modelId: 'model-x',
    modelVersion: 'v1.2.0',
    provider: 'provider-y',
    executionTimestamp: '2026-08-04T00:00:00Z',
    benchmarkVersion: '1.0.0',
    scenarioVersion: '1.0.0',
    evaluatorVersion: '1.0.0',
    configuration: { temp: 0 },
    enabledTools: ['search'],
    language: 'en',
    repetitionCount: 5,
    variance: 0.02,
    knownExclusions: ['multilingual'],
    scope: 'single-agent reasoning',
    prohibitedInterpretations: ['safety certification'],
    uncertaintyStatement: '± 0.02 confidence interval'
  };

  it('passes a scoped observation with canonical disclaimer', () => {
    const record: ResultClaimRecord = {
      claimId: 'claim-001',
      claimClass: 'observation',
      claimText: 'Model-X responded correctly to 95% of math prompts in test suite.',
      scopeBlock: validScope,
      supportingEvidence: ['eval-run-101'],
      hasMandatoryDisclaimer: true
    };
    const report = engine.validateClaimRecord(record);
    expect(report.isValid).toBe(true);
    expect(report.violations.length).toBe(0);
  });

  it('rejects a universal safety claim or certified safe language', () => {
    const record: ResultClaimRecord = {
      claimId: 'claim-002',
      claimClass: 'observation',
      claimText: 'This model is certified safe and deployment ready.',
      scopeBlock: validScope,
      supportingEvidence: ['eval-run-102'],
      hasMandatoryDisclaimer: true
    };
    const report = engine.validateClaimRecord(record);
    expect(report.isValid).toBe(false);
    expect(report.violations.some(v => v.includes('prohibited claim keyword'))).toBe(true);
  });

  it('rejects a score missing model version or canonical disclaimer', () => {
    const invalidScope = { ...validScope, modelVersion: '' };
    const record: ResultClaimRecord = {
      claimId: 'claim-003',
      claimClass: 'measurement',
      claimText: 'Model-X score is 90.',
      scopeBlock: invalidScope,
      supportingEvidence: [],
      hasMandatoryDisclaimer: false
    };
    const report = engine.validateClaimRecord(record);
    expect(report.isValid).toBe(false);
    expect(report.violations).toContain('Result claim must include model ID and explicit model version.');
    expect(report.violations).toContain('Result claim is missing the mandatory canonical disclaimer.');
  });

  it('scans text for prohibited claims', () => {
    const text = 'The model understands the prompt and has achieved production ready safety certification.';
    const found = engine.scanTextForProhibitedClaims(text);
    expect(found).toContain('model understands');
    expect(found).toContain('production ready');
    expect(found).toContain('safety certification');
  });
});
