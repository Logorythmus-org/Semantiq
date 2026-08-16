import { describe, it, expect } from 'vitest';
import { MultiAgentCausalTracker } from '../../packages/sandbox-contracts/src/multi-agent.js';
import type {
  MultiAgentTopologySpec,
  CommunicationPolicy
} from '../../packages/sandbox-contracts/src/multi-agent.js';

describe('SemantIQ Sandbox Phase — Multi-Agent Sandbox', () => {
  const samplePolicies: CommunicationPolicy[] = [
    { fromAgentId: 'planner-01', toAgentId: 'coder-01', isAllowed: true, isMonitored: true },
    { fromAgentId: 'coder-01', toAgentId: 'reviewer-01', isAllowed: true, isMonitored: true },
    { fromAgentId: 'reviewer-01', toAgentId: 'planner-01', isAllowed: true, isMonitored: true },
    { fromAgentId: 'coder-01', toAgentId: 'planner-01', isAllowed: false, isMonitored: true }
  ];

  const tracker = new MultiAgentCausalTracker(samplePolicies);

  it('enforces communication policy pairs accurately', () => {
    expect(tracker.isCommunicationAllowed('planner-01', 'coder-01')).toBe(true);
    expect(tracker.isCommunicationAllowed('coder-01', 'reviewer-01')).toBe(true);
    expect(tracker.isCommunicationAllowed('coder-01', 'planner-01')).toBe(false);
    expect(tracker.isCommunicationAllowed('unauthorized-agent', 'planner-01')).toBe(false);
  });

  it('generates monotonically increasing causal sequence numbers for attributed events', () => {
    const event1 = tracker.recordAttributedEvent('planner-01', 'Lead Planner', 'MESSAGE_SENT', 'Task assignment');
    const event2 = tracker.recordAttributedEvent('coder-01', 'Software Engineer', 'MODIFY', '/workspace/src/app.ts');

    expect(event1.actorId).toBe('planner-01');
    expect(event1.actorRole).toBe('Lead Planner');
    expect(event1.sequenceNumber).toBe(1);

    expect(event2.actorId).toBe('coder-01');
    expect(event2.actorRole).toBe('Software Engineer');
    expect(event2.sequenceNumber).toBe(2);
    expect(event2.sequenceNumber).toBeGreaterThan(event1.sequenceNumber);
  });
});
