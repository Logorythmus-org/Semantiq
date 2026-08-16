import { describe, it, expect } from 'vitest';
import {
  IndependentObserverEngine,
  type IndependentObservationRecord
} from '../../packages/sandbox-contracts/src/index.js';

describe('SemantIQ Sandbox Phase — Independent Observer Model Architecture', () => {
  const engine = new IndependentObserverEngine();

  it('creates ground-truth out-of-band PTY mirror observation with 100% confidence', () => {
    const obs = engine.createObservation(
      1,
      'ACTION',
      'SOCKET_PTY_MIRROR',
      { rawBytes: 'bash-5.1$ echo "hello"\nhello\n', exitCode: 0 },
      { rawBytes: 'bash-5.1$ echo "hello"\nhello\n', exitCode: 0 }
    );

    expect(obs.stepIndex).toBe(1);
    expect(obs.sourceType).toBe('SOCKET_PTY_MIRROR');
    expect(obs.trustConfidence).toBe(1.0);
    expect(obs.crossVerificationStatus).toBe('VERIFIED_BY_HOST');
    expect(obs.observationDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it('detects discrepancy between host ground-truth and provider self-report', () => {
    const obs = engine.createObservation(
      2,
      'RESULT',
      'HOST_KERNEL_EBPF',
      { exitCode: 137, oomKilled: true },
      { exitCode: 0, oomKilled: false } // Provider claimed clean exit 0
    );

    expect(obs.crossVerificationStatus).toBe('DISCREPANCY_DETECTED');
    expect(obs.providerClaimDiscrepancy).toBeDefined();
  });

  it('bundles observations, penalizes discrepancies, and signs bundle with cryptographic signature', () => {
    const obs1 = engine.createObservation(
      1,
      'CONTEXT',
      'SOCKET_PTY_MIRROR',
      { data: 'init' }
    );
    const obs2 = engine.createObservation(
      2,
      'ACTION',
      'AGENT_SELF_REPORT',
      { claim: 'I wrote the file' }
    );

    const bundle = engine.bundleObservations('scenario-obs-01', 'run-obs-001', [obs1, obs2]);

    expect(bundle.totalObservations).toBe(2);
    expect(bundle.groundTruthCount).toBe(1);
    expect(bundle.discrepancyCount).toBe(0);
    expect(bundle.overallObservationTrustScore).toBeGreaterThan(0.6);
    expect(bundle.observerSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it('formats comprehensive Markdown independent observer audit report', () => {
    const obs1 = engine.createObservation(
      1,
      'ACTION',
      'SOCKET_PTY_MIRROR',
      { cmd: 'git status' }
    );

    const bundle = engine.bundleObservations('scenario-obs-01', 'run-obs-001', [obs1]);
    const markdown = engine.formatObserverMarkdown(bundle);

    expect(markdown).toContain('# SemantIQ Independent Observer Audit Report');
    expect(markdown).toContain('SOCKET_PTY_MIRROR');
    expect(markdown).toContain('Verified');
    expect(markdown).toContain('Observer Cryptographic Signature');
  });
});
