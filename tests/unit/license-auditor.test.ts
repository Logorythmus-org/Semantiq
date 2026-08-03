import { describe, it, expect } from 'vitest';
import { LicenseAuditorEngine } from '../../packages/semantiq/src/license-auditor.js';

describe('Licensing, Attribution, and Dataset Audit (Prompt 11.9)', () => {
  const engine = new LicenseAuditorEngine();

  it('classifies MIT dependency as compatible with no notice required', () => {
    const record = engine.classifyDependencyLicense('vitest', 'MIT');
    expect(record.compatibility).toBe('COMPATIBLE');
    expect(record.noticeRequired).toBe(false);
  });

  it('classifies Apache-2.0 as compatible and notice required', () => {
    const record = engine.classifyDependencyLicense('some-apache-pkg', 'Apache-2.0');
    expect(record.compatibility).toBe('COMPATIBLE');
    expect(record.noticeRequired).toBe(true);
  });

  it('classifies unknown SPDX as blocking', () => {
    const record = engine.classifyDependencyLicense('mystery-pkg', 'UNLICENSED');
    expect(record.compatibility).toBe('UNKNOWN');
  });

  it('classifies synthetic dataset as non-blocking with MIT license', () => {
    const ds = engine.classifyDatasetProvenance('governance-scenarios', 'synthetic');
    expect(ds.isBlocking).toBe(false);
    expect(ds.license).toBe('MIT');
  });

  it('runs full audit and passes clean dependency and dataset lists', () => {
    const deps = [
      engine.classifyDependencyLicense('typescript', 'Apache-2.0'),
      engine.classifyDependencyLicense('vitest', 'MIT'),
      engine.classifyDependencyLicense('uuid', 'MIT')
    ];
    const datasets = [
      engine.classifyDatasetProvenance('governance-scenarios', 'synthetic'),
      engine.classifyDatasetProvenance('single-agent-scenarios', 'synthetic')
    ];
    const report = engine.runAudit(deps, datasets);
    expect(report.isClean).toBe(true);
    expect(report.blockingIssueCount).toBe(0);
    expect(report.incompatibleLicenseCount).toBe(0);
  });
});
