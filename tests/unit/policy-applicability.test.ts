import { describe, it, expect } from 'vitest';
import { PolicyApplicabilityEngine } from '../../packages/semantiq/src/policy-applicability.js';

describe('Policy Applicability and Scope Evaluation (Prompt 10.2)', () => {
  const engine = new PolicyApplicabilityEngine();

  it('evaluates valid actor, resource, and temporal applicability cleanly', () => {
    const res = engine.evaluateApplicability(
      'pol_101',
      ['agent_leader', 'agent_worker'],
      ['/tmp/scratch/file.txt'],
      '2026-08-01T15:00:00Z',
      'agent_worker',
      '/tmp/scratch/file.txt',
      '2026-08-01T14:00:00Z'
    );
    expect(res.applicability.isApplicable).toBe(true);
    expect(res.failure).toBeUndefined();
  });

  it('detects wrong actor scope', () => {
    const res = engine.evaluateApplicability(
      'pol_101',
      ['agent_leader'], // Only leader allowed
      ['/tmp/scratch/file.txt'],
      undefined,
      'agent_rogue',
      '/tmp/scratch/file.txt',
      '2026-08-01T14:00:00Z'
    );
    expect(res.applicability.isApplicable).toBe(false);
    expect(res.failure).toBeDefined();
    expect(res.failure?.failureClass).toBe('wrong_actor_scope');
  });

  it('detects wrong resource scope', () => {
    const res = engine.evaluateApplicability(
      'pol_101',
      ['agent_worker'],
      ['/tmp/scratch/allowed.txt'],
      undefined,
      'agent_worker',
      '/tmp/scratch/forbidden.txt',
      '2026-08-01T14:00:00Z'
    );
    expect(res.applicability.isApplicable).toBe(false);
    expect(res.failure).toBeDefined();
    expect(res.failure?.failureClass).toBe('wrong_resource_scope');
  });

  it('detects temporal mismatch expiration', () => {
    const res = engine.evaluateApplicability(
      'pol_101',
      ['agent_worker'],
      ['/tmp/scratch/file.txt'],
      '2026-08-01T12:00:00Z', // Expired at 12:00
      'agent_worker',
      '/tmp/scratch/file.txt',
      '2026-08-01T14:00:00Z'  // Evaluated at 14:00
    );
    expect(res.applicability.isApplicable).toBe(false);
    expect(res.failure).toBeDefined();
    expect(res.failure?.failureClass).toBe('temporal_mismatch');
  });

  it('detects insufficient evidence when evidence flag is false', () => {
    const res = engine.evaluateApplicability(
      'pol_101',
      ['agent_worker'],
      ['/tmp/scratch/file.txt'],
      undefined,
      'agent_worker',
      '/tmp/scratch/file.txt',
      '2026-08-01T14:00:00Z',
      false // missing evidence
    );
    expect(res.applicability.isApplicable).toBe(false);
    expect(res.failure).toBeDefined();
    expect(res.failure?.failureClass).toBe('insufficient_evidence');
  });
});
