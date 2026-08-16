import { describe, it, expect } from 'vitest';
import { ProviderTrustValidator } from '../../packages/sandbox-contracts/src/trust-verification.js';
import type {
  ProviderAttestation,
  SandboxCapabilities
} from '../../packages/sandbox-contracts/src/index.js';

describe('SemantIQ Sandbox Phase — Provider Trust and Verification', () => {
  const validator = new ProviderTrustValidator();

  const mockCapabilities: SandboxCapabilities = {
    supportsSnapshots: true,
    supportsFilesystemDiff: true,
    supportsLiveStream: true,
    supportsMicroVM: true,
    supportsNetworkPolicy: true,
    supportsResourceHardening: true,
    maxExecutionTimeoutSeconds: 3600,
    supportedArchitectures: ['x86_64', 'aarch64']
  };

  it('certifies valid provider attestation with passing TCK and signature', () => {
    const validAttestation: ProviderAttestation = {
      identity: {
        providerId: 'verified-provider-01',
        organization: 'SemantIQ Foundation',
        publicKeyHex: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        registeredAt: '2026-08-15T16:00:00Z'
      },
      declaredTrustTier: 'CRYPTOGRAPHICALLY_CERTIFIED',
      securityGrade: 'A_HARDENED_MICROVM',
      tckSummary: {
        tckSuiteVersion: '1.0.0',
        totalTests: 12,
        passedTests: 12,
        failedTests: 0,
        executedAt: '2026-08-15T16:00:00Z',
        tckEvidenceSha256: 'sha256:1111111111111111111111111111111111111111111111111111111111111111'
      },
      capabilities: mockCapabilities,
      signatureHex: '3045022100e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85502202b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    };

    const report = validator.verifyAttestation(validAttestation);
    expect(report.isValid).toBe(true);
    expect(report.assignedTrustTier).toBe('CRYPTOGRAPHICALLY_CERTIFIED');
    expect(report.securityGrade).toBe('A_HARDENED_MICROVM');
    expect(report.violations.length).toBe(0);
  });

  it('rejects attestation with failing TCK tests and unconfined security posture', () => {
    const invalidAttestation: ProviderAttestation = {
      identity: {
        providerId: 'rogue-provider',
        organization: 'Untrusted Entity',
        publicKeyHex: 'short',
        registeredAt: '2026-08-15T16:00:00Z'
      },
      declaredTrustTier: 'SELF_ATTESTED',
      securityGrade: 'F_UNCONFINED',
      tckSummary: {
        tckSuiteVersion: '1.0.0',
        totalTests: 10,
        passedTests: 7,
        failedTests: 3,
        executedAt: '2026-08-15T16:00:00Z',
        tckEvidenceSha256: 'sha256:0000000000000000000000000000000000000000000000000000000000000000'
      },
      capabilities: mockCapabilities,
      signatureHex: 'invalid'
    };

    const report = validator.verifyAttestation(invalidAttestation);
    expect(report.isValid).toBe(false);
    expect(report.assignedTrustTier).toBe('UNVERIFIED');
    expect(report.violations.some(v => v.includes('TCK conformance failed'))).toBe(true);
    expect(report.violations.some(v => v.includes('Unconfined security posture'))).toBe(true);
  });
});
