import { describe, it, expect } from 'vitest';
import { DataLayerEngine } from '../../packages/semantiq/src/data-layer.js';

const CANDIDATE_ROOT = '/workspace/semantiq-candidate';

describe('Independent Data and Adapter Layer (Prompt 11.6)', () => {
  const engine = new DataLayerEngine();

  it('resolves candidate-relative paths as valid', () => {
    const result = engine.resolveDataPath('./reports/output.json', CANDIDATE_ROOT);
    expect(result.isValid).toBe(true);
    expect(result.isRelative).toBe(true);
    expect(result.isParentTraversal).toBe(false);
  });

  it('detects parent traversal path as invalid', () => {
    const result = engine.resolveDataPath('../../parent-config/secret.json', CANDIDATE_ROOT);
    expect(result.isValid).toBe(false);
    expect(result.isParentTraversal).toBe(true);
  });

  it('audits clean relative path list as independent', () => {
    const paths = ['./fixtures/benchmark.json', './reports', './tmp/session-cache'];
    const report = engine.auditDataLayer(paths, CANDIDATE_ROOT);
    expect(report.isIndependent).toBe(true);
    expect(report.absoluteParentPathCount).toBe(0);
    expect(report.forbiddenDbAccessCount).toBe(0);
  });

  it('detects forbidden parent DB access in path list', () => {
    const paths = ['./reports', '/var/lib/parent-db/data'];
    const report = engine.auditDataLayer(paths, CANDIDATE_ROOT);
    expect(report.isIndependent).toBe(false);
    expect(report.forbiddenDbAccessCount).toBe(1);
  });
});
