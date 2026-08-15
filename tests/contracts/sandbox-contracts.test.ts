import { describe, it, expect } from 'vitest';
import {
  type EnvironmentSpec,
  computeSha256,
  canonicalJson,
  computeSpecHash,
  computeMerkleRoot,
  generateProvenance,
  environmentSpecSchema,
  executionRequestSchema,
  executionResultSchema
} from '../../packages/sandbox-contracts/src/index.js';

describe('Sandbox Contracts & Cryptographic Utilities', () => {
  const sampleSpec: EnvironmentSpec = {
    specVersion: '1.0.0',
    runtimeType: 'container',
    image: {
      name: 'python:3.11-slim',
      digest: 'sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0'
    },
    workingDirectory: '/workspace',
    resources: {
      cpuLimitCores: 2,
      memoryLimitMebibytes: 2048,
      diskLimitMebibytes: 5120,
      maxExecutionTimeoutSeconds: 300
    },
    security: {
      networkMode: 'none',
      readOnlyRootFilesystem: true
    }
  };

  it('computes deterministic SHA256 checksums', () => {
    const hash = computeSha256('SemantIQ Sandbox');
    expect(hash).toHaveLength(64);
    expect(computeSha256('SemantIQ Sandbox')).toBe(hash);
  });

  it('produces canonical JSON sorting keys deterministically', () => {
    const obj1 = { b: 2, a: 1, c: { y: 2, x: 1 } };
    const obj2 = { a: 1, c: { x: 1, y: 2 }, b: 2 };
    expect(canonicalJson(obj1)).toBe(canonicalJson(obj2));
    expect(canonicalJson(obj1)).toBe('{"a":1,"b":2,"c":{"x":1,"y":2}}');
  });

  it('computes deterministic SpecHash for EnvironmentSpec', () => {
    const hash1 = computeSpecHash(sampleSpec);
    const hash2 = computeSpecHash({ ...sampleSpec });
    expect(hash1).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(hash1).toBe(hash2);
  });

  it('computes deterministic Merkle Root for file entries', () => {
    const files = [
      { path: '/workspace/b.py', sha256: 'sha256_b' },
      { path: '/workspace/a.py', sha256: 'sha256_a' }
    ];
    const root1 = computeMerkleRoot(files);
    const root2 = computeMerkleRoot([...files].reverse());
    expect(root1).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(root1).toBe(root2);
  });

  it('generates complete SandboxProvenance record', () => {
    const provenance = generateProvenance(
      sampleSpec,
      'local-oci',
      '1.0.0',
      '1.0.0',
      'seed-42',
      'HERMETIC_DETERMINISTIC'
    );

    expect(provenance.providerId).toBe('local-oci');
    expect(provenance.specHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(provenance.imageDigest).toBe(sampleSpec.image.digest);
    expect(provenance.reproducibilityTier).toBe('HERMETIC_DETERMINISTIC');
    expect(provenance.deterministicSeed).toBe('seed-42');
  });

  it('exports valid JSON Schemas', () => {
    expect(environmentSpecSchema.$id).toContain('environment-spec.json');
    expect(executionRequestSchema.$id).toContain('execution-request.json');
    expect(executionResultSchema.$id).toContain('execution-result.json');
  });
});
