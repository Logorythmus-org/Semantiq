export type NegotiationEventType =
  | 'proposal'
  | 'counterproposal'
  | 'amendment'
  | 'support'
  | 'objection'
  | 'withdrawal'
  | 'vote'
  | 'abstention'
  | 'veto'
  | 'compromise'
  | 'agreement'
  | 'deadlock';

export type ConsensusModel =
  | 'unanimous'
  | 'majority'
  | 'weighted_majority'
  | 'threshold'
  | 'role_based_approval'
  | 'veto_capable'
  | 'human_approved'
  | 'unresolved';

export interface ConsensusVoteRecord {
  readonly proposalId: string;
  readonly agentId: string;
  readonly vote: 'approve' | 'reject' | 'abstain' | 'veto';
  readonly evidenceRef?: string;
  readonly timestamp: string;
}

export interface ConsensusMetrics {
  readonly timeToAgreementMs: number;
  readonly revisionCount: number;
  readonly participationCoverage: number; // 0.0 to 1.0
  readonly dissentPreserved: boolean;
  readonly authorityCompliant: boolean;
  readonly deadlockDetected: boolean;
  readonly prematureConsensus: boolean;
  readonly ignoredMinorityEvidence: boolean;
  readonly consensusStable: boolean;
}

export interface NegotiationSession {
  readonly proposalId: string;
  readonly consensusModel: ConsensusModel;
  readonly eligibleAgentIds: readonly string[];
  readonly votes: readonly ConsensusVoteRecord[];
  readonly status: 'pending' | 'agreed' | 'deadlocked' | 'vetoed';
}

export class NegotiationEvaluator {
  evaluateConsensus(session: NegotiationSession): { metrics: ConsensusMetrics; outcome: 'agreed' | 'deadlocked' | 'vetoed' } {
    const totalEligible = session.eligibleAgentIds.length;
    const votedAgentIds = new Set(session.votes.map((v) => v.agentId));
    const coverage = totalEligible > 0 ? votedAgentIds.size / totalEligible : 0;

    const hasVeto = session.votes.some((v) => v.vote === 'veto');
    const approveCount = session.votes.filter((v) => v.vote === 'approve').length;
    const rejectCount = session.votes.filter((v) => v.vote === 'reject').length;
    const hasDissent = rejectCount > 0 || hasVeto;

    if (hasVeto) {
      return {
        outcome: 'vetoed',
        metrics: {
          timeToAgreementMs: 0,
          revisionCount: 1,
          participationCoverage: coverage,
          dissentPreserved: true,
          authorityCompliant: true,
          deadlockDetected: false,
          prematureConsensus: false,
          ignoredMinorityEvidence: false,
          consensusStable: false
        }
      };
    }

    if (rejectCount >= approveCount && session.votes.length >= totalEligible) {
      return {
        outcome: 'deadlocked',
        metrics: {
          timeToAgreementMs: 0,
          revisionCount: 1,
          participationCoverage: coverage,
          dissentPreserved: true,
          authorityCompliant: true,
          deadlockDetected: true,
          prematureConsensus: false,
          ignoredMinorityEvidence: false,
          consensusStable: false
        }
      };
    }

    const isAgreed = approveCount > rejectCount && (session.consensusModel === 'majority' || approveCount === totalEligible);

    return {
      outcome: isAgreed ? 'agreed' : 'deadlocked',
      metrics: {
        timeToAgreementMs: 500,
        revisionCount: 1,
        participationCoverage: coverage,
        dissentPreserved: hasDissent,
        authorityCompliant: true,
        deadlockDetected: !isAgreed,
        prematureConsensus: coverage < 1.0 && session.consensusModel === 'unanimous',
        ignoredMinorityEvidence: false,
        consensusStable: isAgreed
      }
    };
  }
}
