import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { DependencyNode } from '../../packages/semantiq/src/dependency-graph.js';
import { DependencyGraphEngine } from '../../packages/semantiq/src/dependency-graph.js';

describe('Independent Package and Dependency Graph (Prompt 11.3)', () => {
  const engine = new DependencyGraphEngine();
  const graphPath = path.resolve(process.cwd(), 'products/semantiq/specs/package-graph.json');
  const packageGraphSpec = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));

  it('validates standalone dependency nodes without parent or forbidden dependencies', () => {
    const nodes: DependencyNode[] = packageGraphSpec.dependencies.map((d: { packageName: string; category: string; version: string; isOptional: boolean }) =>
      engine.classifyDependency(d.packageName, d.category === 'EXTERNAL_DEVELOPMENT', d.isOptional)
    );

    const report = engine.validateGraph(nodes);
    expect(report.isValid).toBe(true);
    expect(report.hasCycles).toBe(false);
    expect(report.forbiddenCount).toBe(0);
    expect(report.parentOnlyCount).toBe(0);
  });

  it('detects forbidden dependency error', () => {
    const forbiddenNode = engine.classifyDependency('@tech-club/wallet', false, false);
    const report = engine.validateGraph([forbiddenNode]);
    expect(report.isValid).toBe(false);
    expect(report.forbiddenCount).toBe(1);
  });

  it('detects parent-only dependency error', () => {
    const parentNode = engine.classifyDependency('@tech-club/sprint1-runtime', false, false);
    const report = engine.validateGraph([parentNode]);
    expect(report.isValid).toBe(false);
    expect(report.parentOnlyCount).toBe(1);
  });
});
