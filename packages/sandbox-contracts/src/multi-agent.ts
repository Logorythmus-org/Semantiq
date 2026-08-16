/**
 * @package @tech-club/sandbox-contracts
 * Multi-Agent Sandbox Provider-Neutral Contracts and Interfaces
 */

import type { ExecutionRequest, ExecutionResult } from './types.js';

export type AgentIsolationLevel = 'shared_process' | 'isolated_container' | 'isolated_microvm';
export type SharedResourceType = 'shared_filesystem' | 'message_bus' | 'shared_memory' | 'database';

export interface AgentParticipantSpec {
  readonly agentId: string;
  readonly role: string;
  readonly isolationLevel: AgentIsolationLevel;
  readonly permissions: readonly string[];
  readonly environmentOverrides?: Readonly<Record<string, string>> | undefined;
}

export interface SharedResourceSpec {
  readonly resourceId: string;
  readonly resourceType: SharedResourceType;
  readonly mountPath?: string | undefined;
  readonly accessMode: 'read_write' | 'read_only';
  readonly accessibleByAgentIds: readonly string[];
}

export interface CommunicationPolicy {
  readonly fromAgentId: string;
  readonly toAgentId: string;
  readonly isAllowed: boolean;
  readonly isMonitored: boolean;
}

export interface MultiAgentTopologySpec {
  readonly topologyId: string;
  readonly participants: readonly AgentParticipantSpec[];
  readonly sharedResources: readonly SharedResourceSpec[];
  readonly communicationPolicies: readonly CommunicationPolicy[];
  readonly maxExecutionDurationSeconds: number;
}

export interface AgentMessage {
  readonly messageId: string;
  readonly fromAgentId: string;
  readonly toAgentId: string;
  readonly sequenceNumber: number;
  readonly messageType: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly timestamp: string;
}

export interface AttributedExecutionRequest {
  readonly actorId: string;
  readonly actorRole: string;
  readonly request: ExecutionRequest;
}

export interface AttributedMutationEvent {
  readonly actorId: string;
  readonly actorRole: string;
  readonly action: 'CREATE' | 'MODIFY' | 'DELETE' | 'MESSAGE_SENT' | 'TOOL_INVOKED';
  readonly target: string;
  readonly sequenceNumber: number;
  readonly timestamp: string;
}

export interface MultiAgentObservationEvent {
  readonly eventId: string;
  readonly topologyId: string;
  readonly primaryActorId: string;
  readonly targetActorId?: string | undefined;
  readonly eventType: string;
  readonly summary: string;
  readonly causalSequenceNumber: number;
  readonly timestamp: string;
}

export interface IMultiAgentSandboxSession {
  readonly topologyId: string;
  readonly spec: MultiAgentTopologySpec;

  executeAgentCommand(request: AttributedExecutionRequest): Promise<ExecutionResult>;
  dispatchMessage(message: AgentMessage): Promise<void>;
  getAgentMessages(agentId: string): Promise<readonly AgentMessage[]>;
  close(): Promise<void>;
}

/**
 * Multi-Agent Causal Tracker.
 * Manages monotonic sequence numbers and validates communication policies
 * between agent participants.
 */
export class MultiAgentCausalTracker {
  private currentSequence = 0;
  private readonly policies: Map<string, boolean> = new Map();

  constructor(policies: readonly CommunicationPolicy[] = []) {
    for (const p of policies) {
      this.policies.set(`${p.fromAgentId}->${p.toAgentId}`, p.isAllowed);
    }
  }

  isCommunicationAllowed(fromAgentId: string, toAgentId: string): boolean {
    if (fromAgentId === toAgentId) return true;
    const key = `${fromAgentId}->${toAgentId}`;
    return this.policies.get(key) ?? false;
  }

  recordAttributedEvent(
    actorId: string,
    actorRole: string,
    action: AttributedMutationEvent['action'],
    target: string
  ): AttributedMutationEvent {
    this.currentSequence++;
    return {
      actorId,
      actorRole,
      action,
      target,
      sequenceNumber: this.currentSequence,
      timestamp: new Date().toISOString()
    };
  }
}
