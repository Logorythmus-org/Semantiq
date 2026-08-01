import { describe, it, expect } from 'vitest';
import type { CollectiveReplayBundle } from '../../packages/semantiq/src/multi-agent-model.js';
import type { InteractionSchema } from '../../packages/semantiq/src/interaction-schema.js';
import { CollectiveReplayValidator } from '../../packages/semantiq/src/collective-replay.js';

describe('Collective Replay Validation (Prompt 9.13)', () => {
  const validator = new CollectiveReplayValidator();

  const msg1: InteractionSchema = {
    interactionId: 'ix_01',
    schemaVersion: '1.0.0',
    collectiveRunId: 'crun_100',
    senderAgentId: 'agent_leader',
    recipientAgentIds: ['agent_worker'],
    senderRole: 'Leader',
    recipientRoles: ['Worker'],
    timestamp: '2026-08-01T14:00:00Z',
    sequenceNumber: 1,
    monotonicIndex: 1,
    interactionType: 'direct_message',
    contentRef: 'msg_01',
    evidenceRefs: [],
    deliveryState: 'acknowledged',
    redactionMeta: { isRedacted: false, redactedFields: [], policyRule: 'none' },
    payload: {}
  };

  const bundle: CollectiveReplayBundle = {
    replayBundleId: 'bundle_100',
    runId: 'crun_100',
    events: [],
    delegations: []
  };

  it('validates clean deterministic replay bundle', () => {
    const res = validator.validateReplay(bundle, [msg1]);
    expect(res.valid).toBe(true);
    expect(res.violations.length).toBe(0);
  });

  it('detects reordered events during replay', () => {
    const msg2: InteractionSchema = {
      ...msg1,
      interactionId: 'ix_02',
      monotonicIndex: 0 // Reordered index
    };
    const res = validator.validateReplay(bundle, [msg2]);
    expect(res.valid).toBe(false);
    expect(res.violations.some((v) => v.failureClass === 'reordered_events')).toBe(true);
  });
});
