import type { BehavioralEventSchema, EvidenceChecksum } from './event-schema.js';
import type { PermissionGrant } from './environment-permissions.js';
import type { MissionContract } from './mission-boundary.js';
import type { IncidentEvidenceBundle } from './consequence-recovery.js';

export interface AgentIdentity {
  readonly agentId: string;
  readonly provider: string;
  readonly modelName: string;
  readonly publicPublicKey?: string;
  readonly createdAt: string;
}

export interface AgentRole {
  readonly roleId: string;
  readonly name: string;
  readonly isTemporary: boolean;
  readonly allowedVerbs: readonly string[];
  readonly assignedAt: string;
  readonly expiresAt?: string;
}

export interface AgentCapability {
  readonly capabilityId: string;
  readonly name: string;
  readonly description: string;
  readonly evidenceRef?: EvidenceChecksum;
}

export interface AgentAuthority {
  readonly authorityId: string;
  readonly agentId: string;
  readonly scope: readonly string[];
  readonly grantedByAgentId?: string;
  readonly grantedAt: string;
  readonly expiresAt?: string;
  readonly isRevoked: boolean;
}

export interface AgentMembership {
  readonly membershipId: string;
  readonly agentId: string;
  readonly sessionId: string;
  readonly roleId: string;
  readonly joinedAt: string;
}

export interface CollectiveSession {
  readonly sessionId: string;
  readonly name: string;
  readonly createdAt: string;
  readonly activeAgentIds: readonly string[];
}

export interface CollectiveMission {
  readonly collectiveMissionId: string;
  readonly baseMission: MissionContract;
  readonly participatingRoles: readonly string[];
}

export interface CollectiveRun {
  readonly collectiveRunId: string;
  readonly sessionId: string;
  readonly missionId: string;
  readonly status: 'active' | 'completed' | 'failed' | 'aborted';
  readonly startedAt: string;
}

export interface Interaction {
  readonly interactionId: string;
  readonly senderAgentId: string;
  readonly recipientAgentIds: readonly string[];
  readonly type: 'message' | 'delegation' | 'consensus_vote' | 'conflict_report';
  readonly timestamp: string;
}

export interface Message {
  readonly messageId: string;
  readonly interactionId: string;
  readonly senderAgentId: string;
  readonly content: string;
  readonly timestamp: string;
}

export interface Delegation {
  readonly delegationId: string;
  readonly delegatorAgentId: string;
  readonly delegateeAgentId: string;
  readonly taskDescription: string;
  readonly delegatedAuthorityId: string;
  readonly issuedAt: string;
  readonly expiresAt?: string;
}

export interface CoordinationState {
  readonly sessionId: string;
  readonly activeDelegationIds: readonly string[];
  readonly activeRoleAssignments: Readonly<Record<string, string>>;
}

export interface ConsensusState {
  readonly consensusId: string;
  readonly proposalId: string;
  readonly votes: Readonly<Record<string, 'approve' | 'reject' | 'abstain'>>;
  readonly isAchieved: boolean;
}

export interface ConflictState {
  readonly conflictId: string;
  readonly agentIds: readonly string[];
  readonly reason: string;
  readonly isResolved: boolean;
}

export interface ResponsibilityAssignment {
  readonly assignmentId: string;
  readonly agentId: string;
  readonly eventId: string;
  readonly roleAtTime: string;
  readonly assignedAt: string;
}

export interface CollectiveConsequence {
  readonly collectiveConsequenceId: string;
  readonly runId: string;
  readonly primaryResponsibleAgentId: string;
  readonly contributorAgentIds: readonly string[];
  readonly description: string;
}

export interface CollectiveRecovery {
  readonly recoveryId: string;
  readonly runId: string;
  readonly recoveringAgentId: string;
  readonly status: 'success' | 'partial' | 'failed';
}

export interface CollectiveEvidenceBundle {
  readonly bundleId: string;
  readonly runId: string;
  readonly incidentBundles: readonly IncidentEvidenceBundle[];
  readonly participantIdentities: readonly AgentIdentity[];
}

export interface CollectiveReplayBundle {
  readonly replayBundleId: string;
  readonly runId: string;
  readonly events: readonly BehavioralEventSchema[];
  readonly delegations: readonly Delegation[];
}

/**
 * Multi-Agent Domain Engine.
 * Validates identity uniqueness, role/authority separation, and multi-actor event attribution.
 */
export class MultiAgentDomainEngine {
  private readonly identities = new Map<string, AgentIdentity>();

  registerIdentity(identity: AgentIdentity): { valid: boolean; error?: string } {
    if (this.identities.has(identity.agentId)) {
      return { valid: false, error: `IDENTITY COLLISION: Agent ID '${identity.agentId}' is already registered.` };
    }
    this.identities.set(identity.agentId, identity);
    return { valid: true };
  }

  validateEventAttribution(
    event: BehavioralEventSchema,
    secondaryActorIds: readonly string[] = []
  ): { valid: boolean; errors: readonly string[] } {
    const errors: string[] = [];
    if (!event.actorId || event.actorId.trim() === '') {
      errors.push(`MISSING ACTOR: Event '${event.eventId}' lacks primary actor ID.`);
    } else if (!this.identities.has(event.actorId)) {
      errors.push(`UNKNOWN ACTOR: Event '${event.eventId}' actor '${event.actorId}' is not registered.`);
    }

    for (const secActor of secondaryActorIds) {
      if (!this.identities.has(secActor)) {
        errors.push(`UNKNOWN SECONDARY ACTOR: Event '${event.eventId}' secondary actor '${secActor}' is not registered.`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
