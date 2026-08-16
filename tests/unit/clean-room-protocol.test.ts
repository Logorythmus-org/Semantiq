// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { validateCleanRoomProtocol } from '../../scripts/clean-room-validator.mjs';

describe('Clean Room Protocol Verification', () => {
  it('rejects candidate directly inside parent workspace root', () => {
    const result = validateCleanRoomProtocol(process.cwd(), { isIsolatedCandidate: false });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Candidate directory must be an isolated workspace outside the parent monorepo root.');
  });

  it('rejects candidate inheriting parent .git directory', () => {
    const result = validateCleanRoomProtocol(process.cwd(), { isIsolatedCandidate: true, hasParentGit: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Candidate inherits parent .git directory or commit history.');
  });

  it('rejects publication when Phase 12 authorization is missing', () => {
    const result = validateCleanRoomProtocol(process.cwd(), { isIsolatedCandidate: true, hasParentGit: false, hasPhase12Authorization: false });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Phase 12 publication authorization artifact is missing.');
  });

  it('approves fully isolated, authorized candidate', () => {
    const result = validateCleanRoomProtocol(process.cwd(), { isIsolatedCandidate: true, hasParentGit: false, hasPhase12Authorization: true });
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});
