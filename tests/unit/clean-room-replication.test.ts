import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('SemantIQ Master Prompt 02 — Clean-Room Reproducibility', () => {
  it('validates that clean-room-replication-record.json exists and conforms to requirements', () => {
    const recordPath = path.join(process.cwd(), 'clean-room-replication-record.json');
    expect(fs.existsSync(recordPath)).toBe(true);

    const record = JSON.parse(fs.readFileSync(recordPath, 'utf-8'));
    expect(record.reproducibilityStatus).toBe('internal_clean_room_reproduction');
    expect(record.installationResult).toContain('PASSED');
    expect(record.boundaryResult).toContain('PASSED');
    expect(record.typecheckResult).toContain('PASSED');
    expect(record.testResult).toContain('PASSED');
    expect(record.deviations.length).toBe(0);
  });

  it('validates that INDEPENDENT_REPLICATION_GUIDE.md documents all clean-room commands', () => {
    const guidePath = path.join(process.cwd(), 'self-observation', 'INDEPENDENT_REPLICATION_GUIDE.md');
    expect(fs.existsSync(guidePath)).toBe(true);

    const content = fs.readFileSync(guidePath, 'utf-8');
    expect(content).toContain('pnpm install --frozen-lockfile');
    expect(content).toContain('boundary-validator.mjs');
    expect(content).toContain('pnpm typecheck');
    expect(content).toContain('pnpm test');
    expect(content).toContain('CHECKSUMS.sha256');
  });
});
