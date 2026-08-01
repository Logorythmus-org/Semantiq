import fs from 'node:fs';
import path from 'node:path';

export function evaluateReleaseGuard(cwd = process.cwd(), options = {}) {
  const freezePath = path.join(cwd, 'config', 'release-freeze.json');
  if (!fs.existsSync(freezePath)) {
    return {
      allowed: false,
      reason: 'Release freeze contract (config/release-freeze.json) is missing.',
    };
  }

  const freezeConfig = JSON.parse(fs.readFileSync(freezePath, 'utf-8'));
  if (freezeConfig.releaseFreezeActive && !options.overrideAuthorization) {
    return {
      allowed: false,
      reason: 'RELEASE FREEZE ACTIVE: Parent workspace publication is strictly forbidden. Local development only.',
    };
  }

  // Check if current directory is parent workspace root containing Tech Club packages
  const isParentRoot = fs.existsSync(path.join(cwd, 'packages', 'civilization-kernel')) ||
                       fs.existsSync(path.join(cwd, 'packages', 'wallet'));
  if (isParentRoot) {
    return {
      allowed: false,
      reason: 'PROHIBITED PATH: Cannot publish directly from parent workspace root containing internal platform packages.',
    };
  }

  // Check required seals
  for (const sealRelPath of freezeConfig.requiredSealsForPublication || []) {
    const sealFullPath = path.join(cwd, sealRelPath);
    if (!fs.existsSync(sealFullPath)) {
      return {
        allowed: false,
        reason: `MISSING REQUIRED SEAL: Publication blocked due to missing authorization artifact '${sealRelPath}'.`,
      };
    }
  }

  return { allowed: true, reason: 'Publication authorized.' };
}

if (process.argv[1] && process.argv[1].endsWith('release-guard.mjs')) {
  const result = evaluateReleaseGuard();
  if (!result.allowed) {
    console.error(`[RELEASE GUARD REJECTED]: ${result.reason}`);
    process.exit(1);
  }
  console.log(`[RELEASE GUARD APPROVED]: ${result.reason}`);
}
