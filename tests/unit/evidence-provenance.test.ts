import { describe, it, expect } from 'vitest';
import {
  EvidenceProvenanceEngine,
  type BenchmarkManifestLineage,
  type ModelAgentLineage,
  type EnvironmentProviderLineage,
  type TransformationRecord,
  type ArtifactProvenanceRecord,
  type EvaluatorLineageRecord
} from '../../packages/sandbox-contracts/src/index.js';

describe('SemantIQ Sandbox Phase — Evidence Provenance Architecture', () => {
  const engine = new EvidenceProvenanceEngine();

  const sampleBenchmark: BenchmarkManifestLineage = {
    scenarioId: 'scenario-prov-001',
    manifestDigest: '1111111111111111111111111111111111111111111111111111111111111111',
    dslVersion: '1.0.0',
    gitCommitSha: 'commit-abc123'
  };

  const sampleModel: ModelAgentLineage = {
    modelId: 'claude-3-7-sonnet',
    modelVersion: '20250219',
    agentArchitecture: 'REASONING_ACTOR_CRITIC',
    promptDigest: '2222222222222222222222222222222222222222222222222222222222222222',
    temperature: 0.2
  };

  const sampleEnvironment: EnvironmentProviderLineage = {
    providerId: 'local-docker',
    providerVersion: '24.0.7',
    imageDigest: 'sha256:3333333333333333333333333333333333333333333333333333333333333333',
    hostPlatform: 'linux/amd64',
    kernelVersion: '6.5.0-generic'
  };

  const sampleTransformations: TransformationRecord[] = [
    {
      transformationId: 'trans-1',
      operation: 'STRIP_ANSI_ESCAPES',
      inputDigest: '4444444444444444444444444444444444444444444444444444444444444444',
      outputDigest: '5555555555555555555555555555555555555555555555555555555555555555',
      appliedAt: '2026-08-15T12:00:00Z'
    },
    {
      transformationId: 'trans-2',
      operation: 'EXTRACT_DIFF_PATCH',
      inputDigest: '5555555555555555555555555555555555555555555555555555555555555555',
      outputDigest: '6666666666666666666666666666666666666666666666666666666666666666',
      appliedAt: '2026-08-15T12:00:05Z'
    }
  ];

  const sampleArtifacts: ArtifactProvenanceRecord[] = [
    {
      artifactId: 'art-1',
      path: '/workspace/fix.patch',
      sha256: '7777777777777777777777777777777777777777777777777777777777777777',
      sizeBytes: 1024,
      sourceStep: 2,
      generatedBy: 'agent-007'
    }
  ];

  const sampleEvaluator: EvaluatorLineageRecord = {
    evaluatorId: 'semantiq-assertion-evaluator',
    evaluatorVersion: '1.0.0',
    rubricDigest: '8888888888888888888888888888888888888888888888888888888888888888',
    evaluatedAt: '2026-08-15T12:00:10Z'
  };

  it('constructs complete 6-layer provenance graph with Merkle root and cryptographic signature', () => {
    const graph = engine.constructGraph(
      'scenario-prov-001',
      'run-prov-001',
      sampleBenchmark,
      sampleModel,
      sampleEnvironment,
      sampleTransformations,
      sampleArtifacts,
      sampleEvaluator
    );

    expect(graph.scenarioId).toBe('scenario-prov-001');
    expect(graph.runId).toBe('run-prov-001');
    expect(graph.graphMerkleRoot).toMatch(/^[a-f0-9]{64}$/);
    expect(graph.lineageSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it('verifies valid lineage continuity and detects broken transformation chain', () => {
    const graph = engine.constructGraph(
      'scenario-prov-001',
      'run-prov-001',
      sampleBenchmark,
      sampleModel,
      sampleEnvironment,
      sampleTransformations,
      sampleArtifacts,
      sampleEvaluator
    );

    const validCheck = engine.verifyContinuity(graph);
    expect(validCheck.valid).toBe(true);
    expect(validCheck.violations.length).toBe(0);

    const brokenTransformations: TransformationRecord[] = [
      sampleTransformations[0]!,
      {
        transformationId: 'trans-2',
        operation: 'EXTRACT_DIFF_PATCH',
        inputDigest: 'badf00dbadf00dbadf00dbadf00dbadf00dbadf00dbadf00dbadf00dbadf00d', // Broken link
        outputDigest: '6666666666666666666666666666666666666666666666666666666666666666',
        appliedAt: '2026-08-15T12:00:05Z'
      }
    ];

    const brokenGraph = engine.constructGraph(
      'scenario-prov-001',
      'run-prov-001',
      sampleBenchmark,
      sampleModel,
      sampleEnvironment,
      brokenTransformations,
      sampleArtifacts,
      sampleEvaluator
    );

    const brokenCheck = engine.verifyContinuity(brokenGraph);
    expect(brokenCheck.valid).toBe(false);
    expect(brokenCheck.violations[0]).toContain('Transformation pipeline broken');
  });

  it('formats comprehensive Markdown evidence provenance report', () => {
    const graph = engine.constructGraph(
      'scenario-prov-001',
      'run-prov-001',
      sampleBenchmark,
      sampleModel,
      sampleEnvironment,
      sampleTransformations,
      sampleArtifacts,
      sampleEvaluator
    );

    const markdown = engine.formatProvenanceMarkdown(graph);

    expect(markdown).toContain('# SemantIQ Evidence Provenance Graph');
    expect(markdown).toContain('Graph Merkle Root');
    expect(markdown).toContain('claude-3-7-sonnet');
    expect(markdown).toContain('local-docker');
    expect(markdown).toContain('/workspace/fix.patch');
    expect(markdown).toContain('Provenance Cryptographic Signature');
  });
});
