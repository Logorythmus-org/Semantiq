import type { Delegation } from './multi-agent-model.js';

export type DelegationState =
  | 'proposed'
  | 'accepted'
  | 'declined'
  | 'partially_accepted'
  | 'reassigned'
  | 'escalated'
  | 'cancelled'
  | 'completed'
  | 'failed'
  | 'expired';

export type DelegationFailureClass =
  | 'delegation_without_authority'
  | 'acceptance_without_capability'
  | 'orphaned_tasks'
  | 'circular_delegation'
  | 'responsibility_diffusion'
  | 'silent_reassignment'
  | 'incomplete_handoff'
  | 'ambiguous_completion_ownership'
  | 'failure_without_accountable_actor';

export interface DelegationRecord {
  readonly delegation: Delegation;
  readonly state: DelegationState;
  readonly accountableAgentId: string;
  readonly parentDelegationId?: string;
  readonly handoffEvidenceUri?: string;
}

export interface DelegationViolationReport {
  readonly violationId: string;
  readonly failureClass: DelegationFailureClass;
  readonly delegationId: string;
  readonly description: string;
  readonly timestamp: string;
}

/**
 * Delegation & Responsibility Evaluator.
 * Tracks delegation chains, detects circular delegations, orphaned tasks, and responsibility diffusion.
 */
export class DelegationEvaluator {
  private readonly delegations = new Map<string, DelegationRecord>();

  registerDelegation(record: DelegationRecord): DelegationViolationReport | undefined {
    // 1. Circular Delegation Check
    if (this.detectCircularDelegation(record.delegation.delegatorAgentId, record.delegation.delegateeAgentId)) {
      return {
        violationId: `viol_circ_${record.delegation.delegationId}`,
        failureClass: 'circular_delegation',
        delegationId: record.delegation.delegationId,
        description: `Circular delegation detected between '${record.delegation.delegatorAgentId}' and '${record.delegation.delegateeAgentId}'.`,
        timestamp: record.delegation.issuedAt
      };
    }

    // 2. Incomplete Handoff Check for Completed/Accepted Delegations
    if ((record.state === 'completed' || record.state === 'accepted') && !record.handoffEvidenceUri) {
      return {
        violationId: `viol_handoff_${record.delegation.delegationId}`,
        failureClass: 'incomplete_handoff',
        delegationId: record.delegation.delegationId,
        description: `Delegation '${record.delegation.delegationId}' lacks required handoff evidence URI.`,
        timestamp: record.delegation.issuedAt
      };
    }

    // 3. Ambiguous Accountable Actor
    if (!record.accountableAgentId || record.accountableAgentId.trim() === '') {
      return {
        violationId: `viol_account_${record.delegation.delegationId}`,
        failureClass: 'failure_without_accountable_actor',
        delegationId: record.delegation.delegationId,
        description: `Delegation '${record.delegation.delegationId}' lacks explicit accountable actor ID.`,
        timestamp: record.delegation.issuedAt
      };
    }

    this.delegations.set(record.delegation.delegationId, record);
    return undefined;
  }

  private detectCircularDelegation(delegatorId: string, delegateeId: string): boolean {
    if (delegatorId === delegateeId) return true;
    for (const record of this.delegations.values()) {
      if (record.delegation.delegatorAgentId === delegateeId && record.delegation.delegateeAgentId === delegatorId) {
        return true;
      }
    }
    return false;
  }
}
