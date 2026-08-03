import { describe, it, expect } from 'vitest';
import { SemantIQCliEngine } from '../../packages/semantiq/src/cli.js';

describe('Independent Configuration and CLI (Prompt 11.5)', () => {
  const engine = new SemantIQCliEngine();

  it('returns version string independently', () => {
    const result = engine.executeCommand('version');
    expect(result.success).toBe(true);
    expect(result.output).toContain('SemantIQ Benchmarks v1.0.0');
  });

  it('returns help listing all commands independently', () => {
    const result = engine.executeCommand('help');
    expect(result.success).toBe(true);
    expect(result.output).toContain('doctor');
    expect(result.output).toContain('smoke');
    expect(result.output).toContain('benchmark');
  });

  it('runs doctor command and confirms environment validity', () => {
    const result = engine.executeCommand('doctor');
    expect(result.success).toBe(true);
    expect(result.output).toContain('DOCTOR PASSED');
  });

  it('runs smoke command and confirms core evaluation primitives', () => {
    const result = engine.executeCommand('smoke');
    expect(result.success).toBe(true);
    expect(result.output).toContain('SMOKE PASSED');
  });

  it('returns offline mode active in config', () => {
    const config = engine.getConfig();
    expect(config.isOfflineMode).toBe(true);
  });

  it('runs validate command and confirms boundary validator clean', () => {
    const result = engine.executeCommand('validate');
    expect(result.success).toBe(true);
    expect(result.output).toContain('VALIDATION CLEAN');
  });
});
