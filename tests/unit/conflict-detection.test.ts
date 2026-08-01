import { describe, it, expect } from 'vitest';
import type { ConflictRecord } from '../../packages/semantiq/src/conflict-detection.js';
import { ConflictDetectionEngine } from '../../packages/semantiq/src/conflict-detection.js';

describe('Conflict and Contradiction Detection (Prompt 9.7)', () => {
  const engine = new ConflictDetectionEngine();

  const conflict1: ConflictRecord = {
    conflictId: 'conf_101',
    domain: 'goal',
    state: 'explicit',
    involvedAgentIds: ['agent_a', 'agent_b'],
    originEventIds: ['evt_a', 'evt_b'],
    conflictingEvidence: [{ uri: 'file:///tmp/ev_a.json', algorithm: 'sha256', hash: 'hasha' }],
    description: 'Conflicting optimization goals for dataset pruning',
    resolverAgentId: 'agent_leader',
    recurrenceCount: 1,
    timestamp: '2026-08-01T14:00:00Z'
  };

  it('approves compliant explicit conflict with resolver', () => {
    const violation = engine.registerConflict(conflict1);
    expect(violation).toBeUndefined();
  });

  it('detects unresolved conflict without resolver agent', () => {
    const unresConflict: ConflictRecord = {
      ...conflict1,
      conflictId: 'conf_102',
      state: 'unresolved_without_accountable_resolver',
      resolverAgentId: undefined
    };
    const violation = engine.registerConflict(unresConflict);
    expect(violation).toBeDefined();
    expect(violation?.issueType).toBe('unresolved_without_resolver');
  });

  it('detects cascading conflict with parent reference', () => {
    const cascadingConflict: ConflictRecord = {
      ...conflict1,
      conflictId: 'conf_103',
      parentConflictId: 'conf_101'
    };
    const violation = engine.registerConflict(cascadingConflict);
    expect(violation).toBeDefined();
    expect(violation?.issueType).toBe('cascading_conflict');
  });

  it('detects recurring conflict when recurrence count > 1', () => {
    const recurringConflict: ConflictRecord = {
      ...conflict1,
      conflictId: 'conf_104',
      recurrenceCount: 3
    };
    const violation = engine.registerConflict(recurringConflict);
    expect(violation).toBeDefined();
    expect(violation?.issueType).toBe('recurring_conflict');
  });
});
