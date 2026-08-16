import { describe, it, expect } from 'vitest';
import {
  SandboxArchitectureAuditEngine
} from '../../packages/sandbox-contracts/src/index.js';

describe('SemantIQ Sandbox Phase — Final Architecture Audit & Release Verification', () => {
  const engine = new SandboxArchitectureAuditEngine();

  it('executes 30-check architecture audit and certifies 100% compliance with zero leaks', () => {
    const report = engine.executeArchitectureAudit('1.0.0');

    expect(report.phase).toBe('SANDBOX_PHASE');
    expect(report.auditedVersion).toBe('1.0.0');
    expect(report.verdict).toBe('APPROVED_RELEASE_CANDIDATE');
    expect(report.checksTotal).toBe(30);
    expect(report.checksPassed).toBe(30);
    expect(report.architectureHealthScore).toBe(1.0);
    expect(report.couplingLeakageDetected).toBe(false);
    expect(report.auditorSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it('formats comprehensive Markdown architecture audit certificate', () => {
    const report = engine.executeArchitectureAudit('1.0.0');
    const markdown = engine.formatArchitectureAuditMarkdown(report);

    expect(markdown).toContain('# SemantIQ Sandbox Phase Final Architecture Audit & Release Decision');
    expect(markdown).toContain('APPROVED_RELEASE_CANDIDATE');
    expect(markdown).toContain('100.0%');
    expect(markdown).toContain('Mandatory 30-Check Architecture Matrix');
    expect(markdown).toContain('Provider neutrality');
    expect(markdown).toContain('No-fork / no-clone compliance');
    expect(markdown).toContain('Local-first viability');
    expect(markdown).toContain('Security boundaries');
    expect(markdown).toContain('Cost transparency');
    expect(markdown).toContain('Public limitation disclosure');
    expect(markdown).toContain('Auditor Cryptographic Signature');
  });
});
