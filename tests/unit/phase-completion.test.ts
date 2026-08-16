import { describe, it, expect } from 'vitest';
import {
  SandboxPhaseCompletionEngine
} from '../../packages/sandbox-contracts/src/index.js';

describe('SemantIQ Sandbox Phase — Canonical Completion & Release Seal', () => {
  const engine = new SandboxPhaseCompletionEngine();

  it('generates canonical completion summary and verifies cryptographic release seal', () => {
    const summary = engine.generateCompletionReport('1.0.0');

    expect(summary.phase).toBe('SANDBOX_PHASE');
    expect(summary.version).toBe('1.0.0');
    expect(summary.promptsCompleted).toBe(64);
    expect(summary.totalSpecsCreated).toBe(34);
    expect(summary.totalAdrsCreated).toBe(34);
    expect(summary.totalTestSuitesPassing).toBe(35);
    expect(summary.totalUnitTestsPassing).toBe(128);
    expect(summary.checksVerifiedCount).toBe(30);
    expect(summary.zeroDaysFound).toBe(0);
    expect(summary.lockInRisk).toBe(0.0);
    expect(summary.verdict).toBe('PHASE_COMPLETED_AND_SEALED');
    expect(summary.releaseSealSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it('formats comprehensive Markdown completion report', () => {
    const summary = engine.generateCompletionReport('1.0.0');
    const markdown = engine.formatCompletionMarkdown(summary);

    expect(markdown).toContain('# SemantIQ Sandbox Phase — Canonical Completion & Release Seal');
    expect(markdown).toContain('PHASE_COMPLETED_AND_SEALED');
    expect(markdown).toContain('Prompts Completed');
    expect(markdown).toContain('64/64');
    expect(markdown).toContain('Mandatory Architecture Checks Passed');
    expect(markdown).toContain('30/30 (100%)');
    expect(markdown).toContain('Canonical Architecture Invariant');
    expect(markdown).toContain('Release Authority Cryptographic Seal');
  });
});
