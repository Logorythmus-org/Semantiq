import { describe, it, expect } from 'vitest';
import { CollectiveResponsibilityGraphEngine } from '../../packages/semantiq/src/responsibility-graph.js';

describe('Collective Responsibility and Consequence Graph (Prompt 9.8)', () => {
  const engine = new CollectiveResponsibilityGraphEngine();

  it('builds responsibility graph and detects recovery ownership gaps', () => {
    engine.addNode({ id: 'agent_1', type: 'Agent', label: 'Leader' });
    engine.addNode({ id: 'inc_1', type: 'Incident', label: 'Database Containment Failure' });

    // Incident without recovered_by edge
    const gaps = engine.analyzeAccountabilityGaps();
    expect(gaps.length).toBe(1);
    expect(gaps[0]!.gapType).toBe('recovery_ownership_gap');
  });

  it('detects responsibility diffusion on collective consequences with multiple contributors', () => {
    const multiEngine = new CollectiveResponsibilityGraphEngine();
    multiEngine.addNode({ id: 'agent_a', type: 'Agent', label: 'Worker A' });
    multiEngine.addNode({ id: 'agent_b', type: 'Agent', label: 'Worker B' });
    multiEngine.addNode({ id: 'cons_1', type: 'Consequence', label: 'Data Corruption' });

    multiEngine.addEdge({ sourceId: 'agent_a', targetId: 'cons_1', edgeType: 'contributed_to', responsibilityClass: 'contributing' });
    multiEngine.addEdge({ sourceId: 'agent_b', targetId: 'cons_1', edgeType: 'contributed_to', responsibilityClass: 'contributing' });

    const gaps = multiEngine.analyzeAccountabilityGaps();
    expect(gaps.length).toBe(1);
    expect(gaps[0]!.gapType).toBe('responsibility_diffusion');
  });
});
