import type { BehavioralEventSchema } from './event-schema.js';

export type GraphNodeType =
  | 'event'
  | 'action'
  | 'decision'
  | 'resource'
  | 'permission'
  | 'evidence'
  | 'result'
  | 'consequence'
  | 'recovery';

export type GraphEdgeType =
  | 'follows'
  | 'caused_by'
  | 'enabled_by'
  | 'denied_by'
  | 'used_tool'
  | 'affected_resource'
  | 'produced'
  | 'observed_as'
  | 'violated'
  | 'recovered_by'
  | 'approved_by'
  | 'delegated_to';

export interface GraphNode {
  readonly id: string;
  readonly type: GraphNodeType;
  readonly label: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface GraphEdge {
  readonly sourceId: string;
  readonly targetId: string;
  readonly type: GraphEdgeType;
  readonly weight?: number;
}

export interface BehavioralExecutionGraph {
  readonly graphId: string;
  readonly runId: string;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly isDeterministic: boolean;
}

export interface ReplayBundle {
  readonly bundleId: string;
  readonly traceId: string;
  readonly runId: string;
  readonly createdAt: string;
  readonly events: readonly BehavioralEventSchema[];
  readonly evidenceHashes: Readonly<Record<string, string>>;
}

/**
 * Execution Graph Builder.
 * Converts ordered behavioral events into an inspectable graph of nodes and causal edges.
 */
export class BehavioralGraphBuilder {
  buildGraph(runId: string, events: readonly BehavioralEventSchema[]): BehavioralExecutionGraph {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeSet = new Set<string>();

    const addNode = (node: GraphNode) => {
      if (!nodeSet.has(node.id)) {
        nodeSet.add(node.id);
        nodes.push(node);
      }
    };

    let prevEventId: string | undefined;

    for (const evt of events) {
      // Event node
      addNode({
        id: evt.eventId,
        type: 'event',
        label: `${evt.eventType}:${evt.primaryVerb}`,
        metadata: { sequenceNumber: evt.sequenceNumber, timestamp: evt.timestamp }
      });

      // Causal edges to parent events
      for (const pId of evt.parentEventIds) {
        edges.push({ sourceId: evt.eventId, targetId: pId, type: 'caused_by' });
      }

      // Temporal edge
      if (prevEventId) {
        edges.push({ sourceId: prevEventId, targetId: evt.eventId, type: 'follows' });
      }
      prevEventId = evt.eventId;

      // Resource node
      if (evt.resourceRef) {
        const resId = `res_${evt.resourceRef}`;
        addNode({ id: resId, type: 'resource', label: evt.resourceRef, metadata: {} });
        edges.push({ sourceId: evt.eventId, targetId: resId, type: 'affected_resource' });
      }

      // Permission node
      if (evt.permissionRef) {
        const permId = `perm_${evt.permissionRef}`;
        addNode({ id: permId, type: 'permission', label: evt.permissionRef, metadata: {} });
        edges.push({ sourceId: evt.eventId, targetId: permId, type: 'enabled_by' });
      }
    }

    return {
      graphId: `graph_${runId}`,
      runId,
      nodes,
      edges,
      isDeterministic: true
    };
  }
}

/**
 * Dry Replay Engine.
 * Rebuilds execution graph from stored replay bundle without making live network or shell calls.
 */
export class DryReplayEngine {
  replayBundle(bundle: ReplayBundle): { success: boolean; graph: BehavioralExecutionGraph; errors: readonly string[] } {
    const errors: string[] = [];

    // Verify evidence hashes match
    for (const evt of bundle.events) {
      for (const evRef of evt.evidenceRefs) {
        const expected = bundle.evidenceHashes[evRef.uri];
        if (expected && expected !== evRef.hash) {
          errors.push(`EVIDENCE CHECKSUM MISMATCH: '${evRef.uri}' expected ${expected} but got ${evRef.hash}`);
        }
      }
    }

    const builder = new BehavioralGraphBuilder();
    const graph = builder.buildGraph(bundle.runId, bundle.events);

    return {
      success: errors.length === 0,
      graph,
      errors
    };
  }
}

/**
 * Human-Readable Trace Renderer.
 * Renders behavioral event trace as clean Markdown documentation.
 */
export class HumanReadableTraceRenderer {
  renderTraceMarkdown(runId: string, events: readonly BehavioralEventSchema[]): string {
    let md = `# Behavioral Execution Trace (Run: ${runId})\n\n`;
    md += `| Step | Event Type | Verb | Target Resource | Timestamp |\n`;
    md += `|---|---|---|---|---|\n`;

    for (const evt of events) {
      md += `| ${evt.sequenceNumber} | ${evt.eventType} | \`${evt.primaryVerb}\` | ${evt.resourceRef || 'N/A'} | ${evt.timestamp} |\n`;
    }

    return md;
  }
}
