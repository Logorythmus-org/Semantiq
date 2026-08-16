import { describe, it, expect } from 'vitest';
import type { PolicyIdentity, PolicyLifecycleRecord, PolicyRule, PolicyStatement } from '../../packages/semantiq/src/policy-evidence-model.js';
import { PolicyEvidenceEngine } from '../../packages/semantiq/src/policy-evidence-model.js';

describe('Policy Evidence Model (Prompt 10.1)', () => {
  const engine = new PolicyEvidenceEngine();

  const identity: PolicyIdentity = {
    policyId: 'pol_101',
    name: 'Data Security Policy v1',
    domain: 'security.data'
  };

  const activeLifecycle: PolicyLifecycleRecord = {
    recordId: 'rec_101',
    policyId: 'pol_101',
    state: 'active',
    updatedAt: '2026-08-01T14:00:00Z'
  };

  it('approves compliant active policy registration', () => {
    const report = engine.registerPolicy(identity, activeLifecycle);
    expect(report).toBeUndefined();
  });

  it('detects missing domain provenance', () => {
    const noProvIdentity: PolicyIdentity = {
      ...identity,
      policyId: 'pol_102',
      domain: ''
    };
    const report = engine.registerPolicy(noProvIdentity, activeLifecycle);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('missing_provenance');
  });

  it('detects expired or revoked policy registered as active', () => {
    const expiredLifecycle: PolicyLifecycleRecord = {
      ...activeLifecycle,
      state: 'expired'
    };
    const report = engine.registerPolicy(identity, expiredLifecycle);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('expired_or_revoked_policy_used_as_active');
  });

  it('detects unattributed rule interpretation', () => {
    const stmt: PolicyStatement = { statementId: 'stmt_101', rawText: 'No unauthorized writes allowed.' };
    const rule: PolicyRule = { ruleId: 'rule_101', statementId: 'stmt_101', verb: 'write', effect: 'deny' };

    const report = engine.validateRuleParsing(stmt, rule, '');
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe('unattributed_interpretation');
  });
});
