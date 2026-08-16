import { describe, it, expect } from 'vitest';
import {
  CrossComparisonEngine,
  type ModelRunSummary
} from '../../packages/sandbox-contracts/src/index.js';

describe('SemantIQ Sandbox Phase — Cross-Model and Cross-Provider Comparison Architecture', () => {
  const engine = new CrossComparisonEngine();

  const sampleRuns: ModelRunSummary[] = [
    {
      runId: 'run-m1-p1',
      modelId: 'model-claude-3-7',
      providerId: 'local-docker',
      rawScore: 0.90,
      stepCount: 4,
      durationMs: 1200,
      toolErrorCount: 0
    },
    {
      runId: 'run-m1-p2',
      modelId: 'model-claude-3-7',
      providerId: 'cloud-microvm',
      rawScore: 0.85,
      stepCount: 5,
      durationMs: 3500, // Higher latency cloud provider
      toolErrorCount: 1
    },
    {
      runId: 'run-m2-p1',
      modelId: 'model-gpt-4o',
      providerId: 'local-docker',
      rawScore: 0.80,
      stepCount: 6,
      durationMs: 1300,
      toolErrorCount: 0
    },
    {
      runId: 'run-m2-p2',
      modelId: 'model-gpt-4o',
      providerId: 'cloud-microvm',
      rawScore: 0.70,
      stepCount: 7,
      durationMs: 3800,
      toolErrorCount: 2
    }
  ];

  it('evaluates cross-model cross-provider matrix, decomposes provider effects, and ranks models', () => {
    const report = engine.evaluateComparison('bench-reasoning-01', 'scenario-swe-01', sampleRuns);

    expect(report.totalRuns).toBe(4);
    expect(report.providerEffects.length).toBe(2);
    expect(report.rankings.length).toBe(2);

    const topModel = report.rankings[0]!;
    expect(topModel.modelId).toBe('model-claude-3-7');
    expect(topModel.rank).toBe(1);
    expect(topModel.normalizedScore).toBeGreaterThan(0.85);
    expect(topModel.providerVarianceSensitivity).toBe(0.05); // 0.90 - 0.85
    expect(topModel.confidenceInterval.low).toBeDefined();
    expect(topModel.confidenceInterval.high).toBeDefined();

    expect(report.comparisonSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it('formats comprehensive Markdown cross-comparison report', () => {
    const report = engine.evaluateComparison('bench-reasoning-01', 'scenario-swe-01', sampleRuns);
    const markdown = engine.formatComparisonMarkdown(report);

    expect(markdown).toContain('# SemantIQ Cross-Model & Cross-Provider Fair Comparison Report');
    expect(markdown).toContain('Normalized Comparative Leaderboard');
    expect(markdown).toContain('model-claude-3-7');
    expect(markdown).toContain('Provider Environment Variance & Latency Decomposition');
    expect(markdown).toContain('local-docker');
    expect(markdown).toContain('cloud-microvm');
    expect(markdown).toContain('Comparison Auditor Signature');
  });
});
