/**
 * @package @tech-club/evidence-normalizer
 * Five-Stage Evidence Normalization Engine
 */

import { computeSha256, computeSpecHash } from '../../sandbox-contracts/src/index.js';
import type {
  RawExecutionBundle,
  ObservationEvidence,
  IEvidenceNormalizer
} from './types.js';

export class EvidenceNormalizer implements IEvidenceNormalizer {
  private readonly ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

  private readonly defaultSecretPatterns: readonly RegExp[] = [
    /(?:sk-[a-zA-Z0-9]{48})/g,
    /(?:ghp_[a-zA-Z0-9]{36})/g,
    /(?:e2b_[a-zA-Z0-9]{40})/g,
    /(?:AIza[0-9A-Za-z-_]{35})/g,
    /(?:AWS_SECRET_ACCESS_KEY=[a-zA-Z0-9/+=]{40})/g
  ];

  sanitizeTerminalText(rawText: string): string {
    if (!rawText) return '';
    return rawText
      .replace(this.ansiRegex, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
  }

  redactSecrets(text: string, customPatterns?: readonly RegExp[]): string {
    if (!text) return '';
    let scrubbed = text;
    const patterns = customPatterns ? [...this.defaultSecretPatterns, ...customPatterns] : this.defaultSecretPatterns;

    for (const pattern of patterns) {
      scrubbed = scrubbed.replace(pattern, '[REDACTED_SECRET]');
    }
    return scrubbed;
  }

  async normalize(bundle: RawExecutionBundle): Promise<ObservationEvidence> {
    const evidenceId = crypto.randomUUID();
    const normalizedAt = new Date().toISOString();

    // 1. Sanitize & scrub streams
    const stdoutClean = this.redactSecrets(this.sanitizeTerminalText(bundle.result.stdout));
    const stderrClean = this.redactSecrets(this.sanitizeTerminalText(bundle.result.stderr));

    // 2. Reconcile Filesystem Mutations
    const filesCreated = (bundle.delta.mutations.createdFiles || []).map(f => ({
      path: f.path,
      sha256: f.sha256,
      sizeBytes: f.sizeBytes
    }));

    const filesModified = (bundle.delta.mutations.modifiedFiles || []).map(m => ({
      path: m.path,
      preSha256: m.preSha256,
      postSha256: m.postSha256,
      diffUnified: this.redactSecrets(m.diffUnified)
    }));

    const filesDeleted = bundle.delta.mutations.deletedFiles || [];
    const totalMutationsCount = filesCreated.length + filesModified.length + filesDeleted.length;

    // 3. Assemble Canonical Structure
    const evidencePayload = {
      evidenceId,
      taskId: (bundle.spec.environmentVariables as Record<string, string> | undefined)?.['SEMANTIQ_TASK_ID'] || 'unassigned_task',
      normalizedAt,
      context: {
        baseImageDigest: bundle.spec.image.digest,
        initialRootMerkleHash: 'sha256:initial',
        injectedToolCount: 0,
        environmentVariables: bundle.spec.environmentVariables || {}
      },
      interpretation: bundle.agentReasoningTrace ? {
        rawThoughtLog: this.redactSecrets(bundle.agentReasoningTrace)
      } : undefined,
      decision: {
        commandArray: bundle.request.command,
        workingDirectory: bundle.request.workingDirectory || bundle.spec.workingDirectory,
        injectedStdinLength: bundle.request.stdinBase64 ? bundle.request.stdinBase64.length : 0
      },
      action: {
        dispatchedAt: normalizedAt,
        timeoutConfiguredMs: bundle.request.timeoutMs
      },
      result: {
        exitCode: bundle.result.exitCode,
        stdoutSanitized: stdoutClean,
        stderrSanitized: stderrClean,
        stdoutTruncated: bundle.result.stdoutTruncated,
        stderrTruncated: bundle.result.stderrTruncated,
        executionDurationMs: bundle.result.durationMs,
        peakMemoryBytes: bundle.result.peakMemoryBytes,
        timedOut: bundle.result.timedOut,
        oomKilled: bundle.result.oomKilled
      },
      consequence: {
        filesCreated,
        filesModified,
        filesDeleted,
        totalMutationsCount,
        spawnedProcessCount: bundle.delta.mutations.spawnedProcesses?.length || 0
      },
      provenance: {
        providerId: bundle.providerId,
        providerVersion: bundle.providerVersion,
        specHash: computeSpecHash(bundle.spec),
        reproducibilityTier: 'ISOLATED_REPRODUCIBLE'
      }
    };

    // 4. Compute Evidence Digest
    const canonicalJson = JSON.stringify(evidencePayload, Object.keys(evidencePayload).sort());
    const evidenceDigest = `sha256:${computeSha256(canonicalJson)}`;

    return {
      ...evidencePayload,
      evidenceDigest
    };
  }
}
