import fs from 'node:fs';
import path from 'node:path';

export function validateCleanRoomProtocol(cwd = process.cwd(), options = {}) {
  const errors = [];

  // Reject parent workspace root directly being published
  if (!options.isIsolatedCandidate) {
    errors.push('Candidate directory must be an isolated workspace outside the parent monorepo root.');
  }

  // Reject presence of parent .git directory
  if (options.hasParentGit) {
    errors.push('Candidate inherits parent .git directory or commit history.');
  }

  // Reject missing Phase 12 authorization
  if (!options.hasPhase12Authorization) {
    errors.push('Phase 12 publication authorization artifact is missing.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

if (process.argv[1] && process.argv[1].endsWith('clean-room-validator.mjs')) {
  const result = validateCleanRoomProtocol();
  if (!result.valid) {
    console.error('[CLEAN ROOM VALIDATION FAILED]:');
    result.errors.forEach((err) => console.error(` - ${err}`));
    process.exit(1);
  }
  console.log('[CLEAN ROOM VALIDATION PASSED]: Isolated candidate protocol is valid.');
}
