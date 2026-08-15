import { describe, it, expect } from 'vitest';
import {
  type EnvironmentSpec,
  type ExecutionRequest,
  type ExecutionResult,
  type StateDelta
} from '../../packages/sandbox-contracts/src/index.js';
import { EvidenceNormalizer } from '../../packages/evidence-normalizer/src/index.js';
import { DeterministicReplayAdapter } from '../../packages/adapter-replay/src/index.js';
import { SandboxTCK } from '../../packages/sandbox-tck/src/index.js';

describe('Sandbox Evidence Normalization & TCK Conformance', () => {
  const sampleSpec: EnvironmentSpec = {
    specVersion: '1.0.0',
    runtimeType: 'container',
    image: { name: 'python:3.11', digest: 'sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0' },
    workingDirectory: '/workspace',
    environmentVariables: { SEMANTIQ_TASK_ID: 'task-eval-42' },
    resources: { cpuLimitCores: 2, memoryLimitMebibytes: 2048, diskLimitMebibytes: 5120, maxExecutionTimeoutSeconds: 300 },
    security: { networkMode: 'none', readOnlyRootFilesystem: true }
  };

  const sampleRequest: ExecutionRequest = {
    requestId: 'req-01',
    command: ['python', '-c', 'print("Hello World")'],
    timeoutMs: 5000
  };

  const sampleResult: ExecutionResult = {
    requestId: 'req-01',
    exitCode: 0,
    stdout: '\u001b[32m[PASS]\u001b[0m Result with token ghp_123456789012345678901234567890123456\r\nDone.',
    stderr: '\u001b[33m[WARN]\u001b[0m Minor warning with sk-123456789012345678901234567890123456789012345678',
    stdoutTruncated: false,
    stderrTruncated: false,
    durationMs: 45,
    peakMemoryBytes: 15728640,
    timedOut: false,
    oomKilled: false
  };

  const sampleDelta: StateDelta = {
    deltaId: 'delta-01',
    fromCheckpoint: 'baseline',
    toCheckpoint: 'current',
    timestamp: new Date().toISOString(),
    mutations: {
      createdFiles: [{ path: '/workspace/output.json', sha256: 'abc123', sizeBytes: 256 }],
      modifiedFiles: [{ path: '/workspace/app.py', preSha256: '111', postSha256: '222', diffUnified: '--- a\n+++ b\n+sk-123456789012345678901234567890123456789012345678' }],
      deletedFiles: []
    }
  };

  describe('EvidenceNormalizer', () => {
    it('sanitizes ANSI escapes and redacts secrets across stdout, stderr, and diffs', async () => {
      const normalizer = new EvidenceNormalizer();
      const evidence = await normalizer.normalize({
        spec: sampleSpec,
        request: sampleRequest,
        result: sampleResult,
        delta: sampleDelta,
        agentReasoningTrace: 'I used sk-123456789012345678901234567890123456789012345678 to query the API.',
        providerId: 'local-oci',
        providerVersion: '1.0.0'
      });

      // Assert ANSI stripped
      expect(evidence.result.stdoutSanitized).not.toContain('\u001b[32m');
      expect(evidence.result.stdoutSanitized).toContain('[PASS] Result with token [REDACTED_SECRET]');
      expect(evidence.result.stderrSanitized).toContain('[WARN] Minor warning with [REDACTED_SECRET]');

      // Assert Diff secret scrubbed
      expect(evidence.consequence.filesModified[0]?.diffUnified).toContain('[REDACTED_SECRET]');

      // Assert Thought Log secret scrubbed
      expect(evidence.interpretation?.rawThoughtLog).toContain('[REDACTED_SECRET]');

      // Assert Behavioral Observation Chain Structure
      expect(evidence.context.baseImageDigest).toBe(sampleSpec.image.digest);
      expect(evidence.decision.commandArray).toEqual(sampleRequest.command);
      expect(evidence.result.exitCode).toBe(0);
      expect(evidence.consequence.totalMutationsCount).toBe(2);
      expect(evidence.evidenceDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
    });
  });

  describe('SandboxTCK Compliance Suite', () => {
    it('validates ISandboxProvider implementation against TCK criteria', async () => {
      const tck = new SandboxTCK();
      const replayAdapter = new DeterministicReplayAdapter();

      const report = await tck.runSuite(replayAdapter);
      expect(report.passed).toBe(true);
      expect(report.passedTests).toBe(4);
      expect(report.failedTests).toBe(0);
    });
  });
});
