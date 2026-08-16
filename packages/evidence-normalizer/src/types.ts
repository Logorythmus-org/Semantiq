/**
 * @package @semantiq/evidence-normalizer
 * Canonical Evidence Types & Models
 */

import type {
  EnvironmentSpec,
  ExecutionRequest,
  ExecutionResult,
  StateDelta
} from "../../sandbox-contracts/src/index.js";

export interface RawExecutionBundle {
  readonly spec: EnvironmentSpec;
  readonly request: ExecutionRequest;
  readonly result: ExecutionResult;
  readonly delta: StateDelta;
  readonly agentReasoningTrace?: string | undefined;
  readonly providerId: string;
  readonly providerVersion: string;
}

export interface ContextEvidence {
  readonly baseImageDigest: string;
  readonly initialRootMerkleHash: string;
  readonly injectedToolCount: number;
  readonly environmentVariables: Readonly<Record<string, string>>;
}

export interface InterpretationEvidence {
  readonly rawThoughtLog?: string | undefined;
  readonly structuredIntent?: string | undefined;
}

export interface SandboxDecisionEvidence {
  readonly commandArray: readonly string[];
  readonly workingDirectory: string;
  readonly injectedStdinLength: number;
}

export interface ActionEvidence {
  readonly dispatchedAt: string;
  readonly timeoutConfiguredMs: number;
}

export interface ResultEvidence {
  readonly exitCode: number;
  readonly stdoutSanitized: string;
  readonly stderrSanitized: string;
  readonly stdoutTruncated: boolean;
  readonly stderrTruncated: boolean;
  readonly executionDurationMs: number;
  readonly peakMemoryBytes: number;
  readonly timedOut: boolean;
  readonly oomKilled: boolean;
}

export interface ConsequenceEvidence {
  readonly filesCreated: readonly {
    readonly path: string;
    readonly sha256: string;
    readonly sizeBytes: number;
  }[];
  readonly filesModified: readonly {
    readonly path: string;
    readonly preSha256: string;
    readonly postSha256: string;
    readonly diffUnified: string;
  }[];
  readonly filesDeleted: readonly string[];
  readonly totalMutationsCount: number;
  readonly spawnedProcessCount: number;
}

export interface RecoveryEvidence {
  readonly recoveryTriggered: boolean;
  readonly rollbackCheckpointId?: string | undefined;
  readonly stateRestoredSuccessfully: boolean;
  readonly recoveryDurationMs: number;
}

export interface ObservationEvidence {
  readonly evidenceId: string;
  readonly taskId: string;
  readonly normalizedAt: string;
  readonly evidenceDigest: string;

  readonly context: ContextEvidence;
  readonly interpretation?: InterpretationEvidence | undefined;
  readonly decision: SandboxDecisionEvidence;
  readonly action: ActionEvidence;
  readonly result: ResultEvidence;
  readonly consequence: ConsequenceEvidence;
  readonly recovery?: RecoveryEvidence | undefined;

  readonly provenance: {
    readonly providerId: string;
    readonly providerVersion: string;
    readonly specHash: string;
    readonly reproducibilityTier: string;
  };
}

export interface IEvidenceNormalizer {
  normalize(bundle: RawExecutionBundle): Promise<ObservationEvidence>;
  sanitizeTerminalText(rawText: string): string;
  redactSecrets(text: string, patterns?: readonly RegExp[] | undefined): string;
}
