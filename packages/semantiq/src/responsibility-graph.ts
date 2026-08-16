export type ResponsibilityNodeType =
  | 'Agent'
  | 'Role'
  | 'Authority'
  | 'Decision'
  | 'Delegation'
  | 'Action'
  | 'Resource'
  | 'Result'
  | 'Consequence'
  | 'Incident'
  | 'Recovery'
  | 'Approval'
  | 'Dissent';

export type ResponsibilityEdgeType =
  | 'decided_by'
  | 'delegated_by'
  | 'delegated_to'
  | 'approved_by'
  | 'executed_by'
  | 'enabled_by'
  | 'contributed_to'
  | 'caused_by'
  | 'opposed_by'
  | 'detected_by'
  | 'recovered_by'
  | 'accountable_to';

export type ResponsibilityClass =
  | 'direct'
  | 'delegated'
  | 'supervisory'
  | 'approval'
  | 'execution'
  | 'contributing'
  | 'recovery'
  | 'unknown';

export interface ResponsibilityNode {
  readonly id: string;
  readonly type: ResponsibilityNodeType;
  readonly label: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface ResponsibilityEdge {
  readonly sourceId: string;
  readonly targetId: string;
  readonly edgeType: ResponsibilityEdgeType;
  readonly responsibilityClass?: ResponsibilityClass;
}

export interface AccountabilityGapReport {
  readonly gapId: string;
  readonly gapType:
    | 'responsibility_diffusion'
    | 'accountability_gap'
    | 'false_single_agent_attribution'
    | 'missing_approver'
    | 'missing_delegator'
    | 'untraceable_collective_consequence'
    | 'recovery_ownership_gap';
  readonly targetNodeId: string;
  readonly description: string;
}

export class CollectiveResponsibilityGraphEngine {
  private readonly nodes = new Map<string, ResponsibilityNode>();
  private readonly edges: ResponsibilityEdge[] = [];

  addNode(node: ResponsibilityNode): void {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: ResponsibilityEdge): void {
    this.edges.push(edge);
  }

  analyzeAccountabilityGaps(): readonly AccountabilityGapReport[] {
    const gaps: AccountabilityGapReport[] = [];

    // 1. Recovery Ownership Gap: Incidents without recovery edge
    const incidentNodes = Array.from(this.nodes.values()).filter((n) => n.type === 'Incident');
    for (const inc of incidentNodes) {
      const hasRecovery = this.edges.some((e) => e.targetId === inc.id && e.edgeType === 'recovered_by');
      if (!hasRecovery) {
        gaps.push({
          gapId: `gap_rec_${inc.id}`,
          gapType: 'recovery_ownership_gap',
          targetNodeId: inc.id,
          description: `Incident '${inc.id}' has no assigned recovery ownership edge.`
        });
      }
    }

    // 2. False Single Agent Attribution: Consequence with multiple contributors attributed to only 1 agent
    const consequenceNodes = Array.from(this.nodes.values()).filter((n) => n.type === 'Consequence');
    for (const cons of consequenceNodes) {
      const contributors = this.edges.filter((e) => e.targetId === cons.id && e.edgeType === 'contributed_to');
      if (contributors.length > 1) {
        const uniqueActors = new Set(contributors.map((c) => c.sourceId));
        if (uniqueActors.size > 1 && !this.edges.some((e) => e.targetId === cons.id && e.edgeType === 'accountable_to')) {
          gaps.push({
            gapId: `gap_diff_${cons.id}`,
            gapType: 'responsibility_diffusion',
            targetNodeId: cons.id,
            description: `Collective consequence '${cons.id}' has multiple contributors without explicit primary accountable agent.`
          });
        }
      }
    }

    return gaps;
  }
}
