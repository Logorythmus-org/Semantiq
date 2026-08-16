import { describe, it, expect } from 'vitest';
import type { InteractionSchema } from '../../packages/semantiq/src/interaction-schema.js';
import { InteractionIntegrityAnalyzer } from '../../packages/semantiq/src/interaction-schema.js';

describe('Interaction and Message Evidence Schema (Prompt 9.3)', () => {
  const analyzer = new InteractionIntegrityAnalyzer();

  const msg1: InteractionSchema = {
    interactionId: 'ix_101',
    schemaVersion: '1.0.0',
    collectiveRunId: 'crun_01',
    senderAgentId: 'agent_leader',
    recipientAgentIds: ['agent_worker'],
    senderRole: 'Leader',
    recipientRoles: ['Worker'],
    timestamp: '2026-08-01T14:00:00Z',
    sequenceNumber: 1,
    monotonicIndex: 1,
    interactionType: 'direct_message',
    contentRef: 'msg_content_01',
    evidenceRefs: [{ uri: 'file:///tmp/msg1.json', algorithm: 'sha256', hash: 'hash1' }],
    deliveryState: 'acknowledged',
    redactionMeta: { isRedacted: false, redactedFields: [], policyRule: 'none' },
    payload: {}
  };

  const msg2: InteractionSchema = {
    interactionId: 'ix_102',
    schemaVersion: '1.0.0',
    collectiveRunId: 'crun_01',
    senderAgentId: 'agent_worker',
    recipientAgentIds: ['agent_leader'],
    senderRole: 'Worker',
    recipientRoles: ['Leader'],
    timestamp: '2026-08-01T14:00:01Z',
    sequenceNumber: 2,
    monotonicIndex: 2,
    interactionType: 'response',
    contentRef: 'msg_content_02',
    responseToInteractionId: 'ix_101',
    evidenceRefs: [{ uri: 'file:///tmp/msg2.json', algorithm: 'sha256', hash: 'hash2' }],
    deliveryState: 'acknowledged',
    redactionMeta: { isRedacted: false, redactedFields: [], policyRule: 'none' },
    payload: {}
  };

  it('validates clean stream sequence and response resolution', () => {
    const res = analyzer.validateStreamIntegrity([msg1, msg2]);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it('detects duplicate interaction IDs', () => {
    const dupRes = analyzer.addInteraction(msg1);
    expect(dupRes.valid).toBe(false);
    expect(dupRes.errors[0]).toContain('DUPLICATE INTERACTION');
  });

  it('detects orphan response without parent interaction', () => {
    const orphanMsg: InteractionSchema = {
      ...msg2,
      interactionId: 'ix_orphan',
      responseToInteractionId: 'ix_nonexistent'
    };
    const res = analyzer.addInteraction(orphanMsg);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('ORPHAN RESPONSE');
  });
});
