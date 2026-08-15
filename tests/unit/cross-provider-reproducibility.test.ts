import { describe, it, expect } from 'vitest';
import { CrossProviderEquivalenceEvaluator } from '../../packages/sandbox-contracts/src/cross-provider.js';
import type { CrossProviderComparisonRequest } from '../../packages/sandbox-contracts/src/cross-provider.js';
import type { SandboxProvenance } from '../../packages/sandbox-contracts/src/types.js';

describe('SemantIQ Sandbox Phase — Cross-Provider Reproducibility', () => {
  const evaluator = new CrossProviderEquivalenceEvaluator();

  const baselineProvenance: SandboxProvenance = {
    provenanceId: 'prov-baseline',
    specHash: 'sha256:aaaa',
    providerId: 'docker-oci',
    providerVersion: '1.0.0',
    adapterVersion: '1.0.0',
    imageDigest: 'sha256:image1',
    hostArchitecture: 'x86_64',
    deterministicSeed: '42',
    recordedAt: '2026-08-15T16:00:00Z',
    reproducibilityTier: 'ISOLATED_REPRODUCIBLE'
  };

  const candidateProvenance: SandboxProvenance = {
    provenanceId: 'prov-candidate',
    specHash: 'sha256:aaaa',
    providerId: 'opensandbox',
    providerVersion: '2.1.0',
    adapterVersion: '1.0.0',
    imageDigest: 'sha256:image1',
    hostArchitecture: 'aarch64',
    deterministicSeed: '42',
    recordedAt: '2026-08-15T16:05:00Z',
    reproducibilityTier: 'ISOLATED_REPRODUCIBLE'
  };

  it('identifies semantically equivalent execution despite architecture and timestamp drift', () => {
    const request: CrossProviderComparisonRequest = {
      comparisonId: 'comp-001',
      scenarioId: 'scen-fix-bug',
      baselineProvenance,
      candidateProvenance,
      baselineExitCode: 0,
      candidateExitCode: 0,
      baselineStdout: 'Build successful at 2026-08-15T16:00:00.000Z. All 4 tests passed.',
      candidateStdout: 'Build successful at 2026-08-15T16:05:00.000Z. All 4 tests passed.'
    };

    const report = evaluator.evaluateComparison(request);
    expect(report.isEquivalent).toBe(true);
    expect(report.equivalenceLevel).toBe('SEMANTICALLY_EQUIVALENT');
    expect(report.divergences.some(d => d.property === 'hostArchitecture')).toBe(true);
  });

  it('flags behavioral divergence when exit codes do not match', () => {
    const request: CrossProviderComparisonRequest = {
      comparisonId: 'comp-002',
      scenarioId: 'scen-fix-bug',
      baselineProvenance,
      candidateProvenance,
      baselineExitCode: 0,
      candidateExitCode: 1,
      baselineStdout: 'Tests passed.',
      candidateStdout: 'AssertionError: expected 1 to equal 2'
    };

    const report = evaluator.evaluateComparison(request);
    expect(report.isEquivalent).toBe(false);
    expect(report.equivalenceLevel).toBe('DIVERGENT');
    expect(report.divergences.some(d => d.category === 'BEHAVIORAL_DIVERGENCE')).toBe(true);
  });
});
