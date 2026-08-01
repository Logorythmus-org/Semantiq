import type { AgentAuthority, AgentCapability, AgentIdentity, AgentRole } from './multi-agent-model.js';
import type { BehavioralEventSchema } from './event-schema.js';

export type IdentityFailureClass =
  | 'identity_collision'
  | 'unauthorized_action'
  | 'impersonation_attempt'
  | 'expired_authority'
  | 'invalid_authority_transfer'
  | 'role_overreach'
  | 'unproven_capability';

export interface IdentityViolationReport {
  readonly violationId: string;
  readonly failureClass: IdentityFailureClass;
  readonly agentId: string;
  readonly description: string;
  readonly timestamp: string;
}

/**
 * Agent Authority & Role Evaluator.
 * Evaluates whether an agent has valid, unexpired authority to perform an action.
 */
export class AuthorityEvaluator {
  evaluateAction(
    identity: AgentIdentity | undefined,
    role: AgentRole | undefined,
    authority: AgentAuthority | undefined,
    event: BehavioralEventSchema,
    capability?: AgentCapability
  ): IdentityViolationReport | undefined {
    // 1. Missing Actor Identity
    if (!identity) {
      return {
        violationId: `viol_id_${event.eventId}`,
        failureClass: 'impersonation_attempt',
        agentId: event.actorId,
        description: `Action attempted by unauthenticated actor '${event.actorId}'.`,
        timestamp: event.timestamp
      };
    }

    // 2. Action Outside Role
    if (role && !role.allowedVerbs.includes(event.primaryVerb)) {
      return {
        violationId: `viol_role_${event.eventId}`,
        failureClass: 'role_overreach',
        agentId: identity.agentId,
        description: `Verb '${event.primaryVerb}' is outside assigned role '${role.name}'.`,
        timestamp: event.timestamp
      };
    }

    // 3. Expired or Revoked Authority
    if (!authority || authority.isRevoked) {
      return {
        violationId: `viol_auth_${event.eventId}`,
        failureClass: 'unauthorized_action',
        agentId: identity.agentId,
        description: `Agent '${identity.agentId}' lacks active authority.`,
        timestamp: event.timestamp
      };
    }

    if (authority.expiresAt && new Date(event.timestamp) > new Date(authority.expiresAt)) {
      return {
        violationId: `viol_exp_${event.eventId}`,
        failureClass: 'expired_authority',
        agentId: identity.agentId,
        description: `Authority '${authority.authorityId}' expired at ${authority.expiresAt}.`,
        timestamp: event.timestamp
      };
    }

    // 4. Capability Claim Without Evidence
    if (capability && !capability.evidenceRef) {
      return {
        violationId: `viol_cap_${event.eventId}`,
        failureClass: 'unproven_capability',
        agentId: identity.agentId,
        description: `Capability '${capability.name}' claimed without evidence checksum.`,
        timestamp: event.timestamp
      };
    }

    return undefined;
  }
}
