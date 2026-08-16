import { describe, it, expect } from 'vitest';
import {
  EvidencePackageManager,
  BenchmarkExecutionReceiptIssuer,
  ExecutionCostCalculator,
  ComplianceAttributionCompiler,
  canonicalJson,
  computeSha256,
  type BehavioralTraceEvent,
  type EvaluationAssessmentEntry,
  type EnvironmentSpec
} from '../../packages/sandbox-contracts/src/index.js';

describe('SemantIQ Sandbox Phase — Portable Evidence Package', () => {
  const packageManager = new EvidencePackageManager();
  const receiptIssuer = new BenchmarkExecutionReceiptIssuer();
  const costCalc = new ExecutionCostCalculator();
  const complianceComp = new ComplianceAttributionCompiler();

  const sampleSpec: EnvironmentSpec = {
    specVersion: '1.0.0',
    runtimeType: 'container',
    image: {
      name: 'python:3.11-slim',
      digest: 'sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0'
    },
    workingDirectory: '/workspace',
    resources: {
      cpuLimitCores: 2,
      memoryLimitMebibytes: 2048,
      diskLimitMebibytes: 5120,
      maxExecutionTimeoutSeconds: 300
    },
    security: {
      networkMode: 'none',
      readOnlyRootFilesystem: true
    }
  };

  const createTraceEvent = (
    seq: number,
    stage: BehavioralTraceEvent['stage'],
    actionType: string | undefined,
    payload: Record<string, unknown>
  ): BehavioralTraceEvent => {
    const payloadDigest = computeSha256(canonicalJson(payload));
    return {
      eventId: `evt-${seq}-${stage.toLowerCase()}`,
      seq,
      stage,
      timestamp: '2026-08-15T12:00:00Z',
      agentId: 'agent-eval-01',
      actionType,
      payload,
      payloadDigest: `sha256:${payloadDigest}`
    };
  };

  const behavioralTrace: BehavioralTraceEvent[] = [
    createTraceEvent(0, 'CONTEXT', undefined, { prompt: 'Fix issue in django model' }),
    createTraceEvent(1, 'INTERPRETATION', undefined, { hypothesis: 'Null check missing in save()' }),
    createTraceEvent(2, 'DECISION', 'PLAN_EDITS', { targetFile: 'models.py', line: 42 }),
    createTraceEvent(3, 'ACTION', 'EXECUTE_COMMAND', { cmd: 'python -m pytest' }),
    createTraceEvent(4, 'RESULT', 'COMMAND_OUTPUT', { exitCode: 1, stderr: 'AssertionError' }),
    createTraceEvent(5, 'CONSEQUENCE', 'EVAL_OBSERVE', { failedTests: 1 }),
    createTraceEvent(6, 'RECOVERY', 'REVISE_DIFF', { retryCount: 1, action: 'add_exception_handler' })
  ];

  const evaluations: EvaluationAssessmentEntry[] = [
    {
      evaluatorId: 'pytest-deterministic',
      evaluatorType: 'DETERMINISTIC_ASSERTION',
      metricName: 'Unit Tests Pass Rate',
      score: 1.0,
      maxScore: 1.0,
      rationale: 'All 12 test assertions passed successfully after recovery.',
      passed: true
    }
  ];

  const artifacts = [
    {
      name: 'patch.diff',
      path: '/workspace/patch.diff',
      sha256: 'sha256:1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
      sizeBytes: 850,
      mimeType: 'text/x-diff'
    }
  ];

  const costLedger = costCalc.calculateLedger(
    'run-pkg-001',
    'bench-swe-verified',
    'scenario-django-fix',
    {
      inferenceRatePer1kTokens: { prompt: 0.003, completion: 0.015 },
      computeRatePerCoreSecond: 0.00005,
      computeRatePerGibSecond: 0.00001,
      coldBootSurcharge: 0.01,
      browserRatePerMinute: 0.02,
      gpuRatePerHour: 2.5,
      storageRatePerGbMonth: 0.1,
      egressRatePerGb: 0.08,
      mcpToolCallRate: 0.001,
      paidApiCallRate: 0.005,
      judgeRatePer1kTokens: 0.005
    },
    {
      modelId: 'gemini-1.5-pro',
      promptTokens: 5000,
      completionTokens: 1000,
      providerId: 'provider-docker-local',
      cpuCoreSeconds: 60,
      ramGibSeconds: 120,
      wallClockDurationMs: 30000,
      isColdBoot: true
    }
  );

  const compliancePkg = complianceComp.compilePackage(
    'bench-swe-verified',
    'scenario-django-fix',
    'provider-docker-local',
    [
      {
        component: 'django-source',
        spdxLicense: 'BSD-3-Clause',
        copyrightHolders: ['Django Software Foundation'],
        noticeText: 'Copyright (c) Django Software Foundation and individual contributors.'
      }
    ],
    {
      commercialUseAllowed: true,
      researchOnlyClause: false,
      patentRetaliationClause: false,
      redistributionPermitted: true
    }
  );

  const receipt = receiptIssuer.issueReceipt({
    identity: {
      receiptId: 'rcpt-pkg-001',
      receiptVersion: '1.0.0',
      evaluationRunId: 'run-pkg-001',
      benchmarkId: 'bench-swe-verified',
      scenarioId: 'scenario-django-fix'
    },
    provenance: {
      providerId: 'provider-docker-local',
      providerVersion: '24.0.7',
      runtimeType: 'container',
      environmentSpecHash: 'sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0',
      imageDigest: 'sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0',
      isolationMechanism: 'OCI_CONTAINER_CGROUP',
      reproducibilityTier: 'HERMETIC_DETERMINISTIC'
    },
    model: {
      modelId: 'gemini-1.5-pro',
      modelProvider: 'Google DeepMind'
    },
    artifacts: {
      filesMerkleRoot: 'sha256:merkle1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
      evidenceBundleDigest: 'sha256:evidence1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
      artifacts
    },
    observation: {
      behavioralChainHash: 'sha256:chain1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
      eventCount: behavioralTrace.length,
      outcome: 'PASSED',
      score: 1.0,
      metrics: { passRate: 1.0 }
    },
    financial: {
      costLedgerDigest: 'sha256:cost1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
      totalGrossCostUsd: costLedger.totalGrossCostUsd,
      totalNetCostUsd: costLedger.totalNetCostUsd,
      currency: 'USD'
    },
    compliance: {
      compliancePackageDigest: 'sha256:comp1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
      complianceGrade: 'COMPLIANT_WITH_NOTICES'
    },
    issuerPublicKeyHex: '04abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  });

  it('builds a complete portable evidence package with Merkle root and digital signature', () => {
    const pkg = packageManager.buildPackage({
      manifest: {
        packageId: 'pkg-swe-django-001',
        packageVersion: '1.0.0',
        evaluationRunId: 'run-pkg-001',
        benchmarkId: 'bench-swe-verified',
        scenarioId: 'scenario-django-fix',
        createdAt: '2026-08-15T12:00:00Z'
      },
      environment: {
        spec: sampleSpec,
        specHash: 'sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0'
      },
      behavioralTrace,
      artifacts,
      evaluations,
      financial: costLedger,
      compliance: compliancePkg,
      receipt
    });

    expect(pkg.manifest.packageId).toBe('pkg-swe-django-001');
    expect(pkg.packageMerkleRoot).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(pkg.packageSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it('validates pristine evidence package and flags recovery warnings without errors', () => {
    const pkg = packageManager.buildPackage({
      manifest: {
        packageId: 'pkg-swe-django-001',
        packageVersion: '1.0.0',
        evaluationRunId: 'run-pkg-001',
        benchmarkId: 'bench-swe-verified',
        scenarioId: 'scenario-django-fix',
        createdAt: '2026-08-15T12:00:00Z'
      },
      environment: {
        spec: sampleSpec,
        specHash: 'sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0'
      },
      behavioralTrace,
      artifacts,
      evaluations,
      financial: costLedger,
      compliance: compliancePkg,
      receipt
    });

    const result = packageManager.validatePackage(pkg);
    expect(result.isValid).toBe(true);
    expect(result.isMerkleValid).toBe(true);
    expect(result.isBehavioralTraceValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.warnings.some(w => w.includes('Behavioral trace contains recovery events'))).toBe(true);
  });

  it('detects sequence continuity breakage in behavioral trace', () => {
    const brokenTrace: BehavioralTraceEvent[] = [
      behavioralTrace[0]!,
      { ...behavioralTrace[1]!, seq: 0 } // Duplicate seq 0
    ];

    const pkg = packageManager.buildPackage({
      manifest: {
        packageId: 'pkg-broken-seq',
        packageVersion: '1.0.0',
        evaluationRunId: 'run-broken-001',
        benchmarkId: 'bench-swe-verified',
        scenarioId: 'scenario-django-fix',
        createdAt: '2026-08-15T12:00:00Z'
      },
      environment: {
        spec: sampleSpec,
        specHash: 'sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0'
      },
      behavioralTrace: brokenTrace,
      artifacts,
      evaluations,
      financial: costLedger,
      compliance: compliancePkg,
      receipt
    });

    const result = packageManager.validatePackage(pkg);
    expect(result.isValid).toBe(false);
    expect(result.isBehavioralTraceValid).toBe(false);
    expect(result.errors.some(e => e.includes('Sequence continuity broken'))).toBe(true);
  });

  it('exports structured Markdown overview of evidence package', () => {
    const pkg = packageManager.buildPackage({
      manifest: {
        packageId: 'pkg-swe-django-001',
        packageVersion: '1.0.0',
        evaluationRunId: 'run-pkg-001',
        benchmarkId: 'bench-swe-verified',
        scenarioId: 'scenario-django-fix',
        createdAt: '2026-08-15T12:00:00Z'
      },
      environment: {
        spec: sampleSpec,
        specHash: 'sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0'
      },
      behavioralTrace,
      artifacts,
      evaluations,
      financial: costLedger,
      compliance: compliancePkg,
      receipt
    });

    const markdown = packageManager.exportPackageSummaryMarkdown(pkg);
    expect(markdown).toContain('# Portable Evidence Package');
    expect(markdown).toContain('pkg-swe-django-001');
    expect(markdown).toContain('Observable Behavioral Chain Summary');
    expect(markdown).toContain('Unit Tests Pass Rate');
    expect(markdown).toContain('Package Signature');
  });
});
