import { describe, it, expect } from 'vitest';
import {
  BenchmarkExecutionReceiptIssuer,
  type VerifiableBenchmarkExecutionReceipt
} from '../../packages/sandbox-contracts/src/index.js';

describe('SemantIQ Sandbox Phase — Verifiable Benchmark Execution Receipt', () => {
  const issuer = new BenchmarkExecutionReceiptIssuer();

  const sampleParams = {
    identity: {
      receiptId: 'rcpt-eval-2026-001',
      receiptVersion: '1.0.0' as const,
      evaluationRunId: 'run-swe-django-42',
      benchmarkId: 'bench-swe-verified',
      scenarioId: 'scenario-django-fix'
    },
    provenance: {
      providerId: 'provider-docker-local',
      providerVersion: '24.0.7',
      runtimeType: 'container',
      environmentSpecHash: 'sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0',
      imageDigest: 'sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      isolationMechanism: 'OCI_CONTAINER_CGROUP',
      reproducibilityTier: 'HERMETIC_DETERMINISTIC' as const,
      deterministicSeed: 'seed-42'
    },
    model: {
      modelId: 'gemini-1.5-pro',
      modelProvider: 'Google DeepMind',
      agentFrameworkVersion: 'semantiq-agent-v1.4',
      temperature: 0.0,
      topP: 1.0
    },
    artifacts: {
      filesMerkleRoot: 'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      evidenceBundleDigest: 'sha256:9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
      artifacts: [
        {
          name: 'git-patch.diff',
          path: '/workspace/patch.diff',
          sha256: 'sha256:diff0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
          sizeBytes: 1420,
          mimeType: 'text/x-diff'
        }
      ]
    },
    observation: {
      behavioralChainHash: 'sha256:chain0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      eventCount: 24,
      outcome: 'PASSED' as const,
      score: 1.0,
      metrics: {
        testsPassed: 15,
        testsFailed: 0,
        wallClockDurationMs: 45000
      }
    },
    financial: {
      costLedgerDigest: 'sha256:ledger0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      totalGrossCostUsd: 0.084,
      totalNetCostUsd: 0.0,
      currency: 'USD' as const,
      sponsorAttribution: 'NSF AI Foundation'
    },
    compliance: {
      compliancePackageDigest: 'sha256:comp0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      complianceGrade: 'COMPLIANT_WITH_NOTICES' as const
    },
    issuerPublicKeyHex: '04abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  };

  it('issues a cryptographically sealed verifiable execution receipt', () => {
    const receipt = issuer.issueReceipt(sampleParams);

    expect(receipt.identity.receiptId).toBe('rcpt-eval-2026-001');
    expect(receipt.receiptDigestSha256).toHaveLength(64);
    expect(receipt.signatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
    expect(receipt.issuedAt).toBeDefined();
  });

  it('verifies a valid execution receipt successfully', () => {
    const receipt = issuer.issueReceipt(sampleParams);
    const result = issuer.verifyReceipt(receipt);

    expect(result.isValid).toBe(true);
    expect(result.isDigestValid).toBe(true);
    expect(result.isSignatureValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('detects tampering with receipt content and rejects invalid digest', () => {
    const receipt = issuer.issueReceipt(sampleParams);

    // Tamper with modelId
    const tamperedReceipt: VerifiableBenchmarkExecutionReceipt = {
      ...receipt,
      model: {
        ...receipt.model,
        modelId: 'tampered-model-id'
      }
    };

    const result = issuer.verifyReceipt(tamperedReceipt);
    expect(result.isValid).toBe(false);
    expect(result.isDigestValid).toBe(false);
    expect(result.errors.some(e => e.includes('Receipt digest mismatch'))).toBe(true);
  });

  it('exports formatted Markdown certificate for publication', () => {
    const receipt = issuer.issueReceipt(sampleParams);
    const markdown = issuer.exportReceiptMarkdown(receipt);

    expect(markdown).toContain('# Verifiable Benchmark Execution Receipt');
    expect(markdown).toContain('rcpt-eval-2026-001');
    expect(markdown).toContain('**Evaluation Outcome**: **PASSED** (Score: 1)');
    expect(markdown).toContain('Files Merkle Root');
    expect(markdown).toContain('Behavioral Chain Hash');
    expect(markdown).toContain('**Total Gross Spend**: $0.0840 USD');
    expect(markdown).toContain('NSF AI Foundation');
    expect(markdown).toContain('Digital Signature');
  });
});
