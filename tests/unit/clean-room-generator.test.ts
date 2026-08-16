import { describe, it, expect } from 'vitest';
import { CleanRoomGeneratorEngine } from '../../packages/semantiq/src/clean-room-generator.js';

const SOURCE_COMMIT = '4c17ba326581aacdd2318ad3837fd2a2ed3ee4f4';
const CANDIDATE_VERSION = '0.1.0-alpha.1';

describe('Clean-Room Candidate Generation (Prompt 11.10)', () => {
  const engine = new CleanRoomGeneratorEngine();

  it('builds valid provenance record for the candidate', () => {
    const prov = engine.buildProvenance(CANDIDATE_VERSION, SOURCE_COMMIT, '1.0.0', 48, 12);
    expect(prov.candidateVersion).toBe(CANDIDATE_VERSION);
    expect(prov.sourceCommit).toBe(SOURCE_COMMIT);
    expect(prov.isDeterministic).toBe(true);
    expect(prov.generatorVersion).toBe('11.10');
    expect(prov.totalIncludedFiles).toBe(48);
  });

  it('allows valid candidate-relative paths', () => {
    const result = engine.validateCandidatePath('packages/semantiq/src/index.ts');
    expect(result.isAllowed).toBe(true);
  });

  it('rejects .git artifact paths', () => {
    const result = engine.validateCandidatePath('.git/config');
    expect(result.isAllowed).toBe(false);
    expect(result.reason).toContain('git-artifact');
  });

  it('rejects secret file paths', () => {
    const result = engine.validateCandidatePath('.env.production');
    expect(result.isAllowed).toBe(false);
    expect(result.reason).toContain('secret-file');
  });

  it('rejects absolute paths', () => {
    const result = engine.validateCandidatePath('/home/user/project/src');
    expect(result.isAllowed).toBe(false);
    expect(result.reason).toBe('absolute-path');
  });

  it('audits clean candidate file list as passing', () => {
    const files = [
      'packages/semantiq/src/index.ts',
      'packages/semantiq/package.json',
      'LICENSE',
      'CITATION.cff',
      'products/semantiq/extraction-manifest.json'
    ];
    const report = engine.auditCandidateFiles(files);
    expect(report.isPassing).toBe(true);
    expect(report.gitArtifactCount).toBe(0);
    expect(report.secretFileCount).toBe(0);
  });
});
