import { describe, it, expect } from 'vitest';
import { RuntimeDependencyRemoverEngine } from '../../packages/semantiq/src/runtime-dependency-remover.js';

describe('Parent Workspace Runtime Dependency Removal (Prompt 11.4)', () => {
  const engine = new RuntimeDependencyRemoverEngine();

  it('approves standalone import list without parent dependencies', () => {
    const cleanImports = ['./policy-evidence-model.js', './governance-decision.js', 'vitest'];
    const report = engine.auditRuntimeImports(cleanImports);
    expect(report.isStandalone).toBe(true);
    expect(report.parentImportCount).toBe(0);
    expect(report.unresolvedDependencyCount).toBe(0);
  });

  it('detects parent-only package import', () => {
    const dirtyImports = ['./policy-evidence-model.js', '@tech-club/wallet'];
    const report = engine.auditRuntimeImports(dirtyImports);
    expect(report.isStandalone).toBe(false);
    expect(report.parentImportCount).toBe(1);
  });

  it('detects parent path traversal import', () => {
    const dirtyImports = ['../../packages/sprint1-runtime/src/index.js'];
    const report = engine.auditRuntimeImports(dirtyImports);
    expect(report.isStandalone).toBe(false);
    expect(report.unresolvedDependencyCount).toBe(1);
  });
});
