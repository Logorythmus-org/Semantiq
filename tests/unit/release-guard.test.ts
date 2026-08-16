// @ts-nocheck
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { evaluateReleaseGuard } from '../../scripts/release-guard.mjs';

describe('Release Guard Evaluation', () => {
  it('blocks publication from active parent workspace root', () => {
    const parentRoot = path.resolve(__dirname, '../../');
    const result = evaluateReleaseGuard(parentRoot);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('RELEASE FREEZE ACTIVE');
  });

  it('fails closed when release freeze contract is missing', () => {
    const emptyDir = path.resolve(__dirname, '../fixtures/empty-dir');
    const result = evaluateReleaseGuard(emptyDir);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Release freeze contract');
  });
});
