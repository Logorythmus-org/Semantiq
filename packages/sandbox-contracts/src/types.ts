/**
 * @package @semantiq/sandbox-contracts
 * Universal Provider-Neutral Contract Type Definitions
 */

export type RuntimeType = "container" | "microvm" | "remote_managed" | "replay";
export type NetworkMode = "none" | "isolated_bridge" | "whitelisted_egress" | "full";

export type BehavioralStage =
  | "CONTEXT"
  | "INTERPRETATION"
  | "DECISION"
  | "ACTION"
  | "RESULT"
  | "CONSEQUENCE"
  | "RECOVERY";

export interface ImageSpec {
  readonly name: string;
  readonly tag?: string | undefined;
  readonly digest: string; // e.g. "sha256:..."
}

export interface ResourceLimits {
  readonly cpuLimitCores: number;
  readonly memoryLimitMebibytes: number;
  readonly diskLimitMebibytes: number;
  readonly maxProcessCount?: number | undefined;
  readonly maxExecutionTimeoutSeconds: number;
}

export interface SecurityProfile {
  readonly networkMode: NetworkMode;
  readonly whitelistedHosts?: readonly string[] | undefined;
  readonly readOnlyRootFilesystem: boolean;
  readonly unprivilegedUser?: string | undefined;
  readonly dropCapabilities?: readonly string[] | undefined;
}

export interface InitialFileEntry {
  readonly path: string;
  readonly contentBase64: string;
  readonly sha256: string;
  readonly mode?: string | undefined;
}

export interface EnvironmentSpec {
  readonly specVersion: string;
  readonly runtimeType: RuntimeType;
  readonly image: ImageSpec;
  readonly workingDirectory: string;
  readonly environmentVariables?: Readonly<Record<string, string>> | undefined;
  readonly resources: ResourceLimits;
  readonly security: SecurityProfile;
  readonly initialFilesystem?: readonly InitialFileEntry[] | undefined;
}

export interface ExecutionRequest {
  readonly requestId: string;
  readonly command: readonly string[];
  readonly stdinBase64?: string | undefined;
  readonly workingDirectory?: string | undefined;
  readonly envOverrides?: Readonly<Record<string, string>> | undefined;
  readonly timeoutMs: number;
  readonly captureStateDelta?: boolean | undefined;
}

export interface ExecutionResult {
  readonly requestId: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly stdoutTruncated: boolean;
  readonly stderrTruncated: boolean;
  readonly durationMs: number;
  readonly cpuTimeUserMs?: number | undefined;
  readonly cpuTimeSystemMs?: number | undefined;
  readonly peakMemoryBytes: number;
  readonly timedOut: boolean;
  readonly oomKilled: boolean;
}

export interface FileMutationCreated {
  readonly path: string;
  readonly sha256: string;
  readonly sizeBytes: number;
}

export interface FileMutationModified {
  readonly path: string;
  readonly preSha256: string;
  readonly postSha256: string;
  readonly diffUnified: string;
}

export interface SpawnedProcessInfo {
  readonly pid: number;
  readonly cmdline: string;
  readonly isAlive: boolean;
}

export interface StateDeltaMutations {
  readonly createdFiles: readonly FileMutationCreated[];
  readonly modifiedFiles: readonly FileMutationModified[];
  readonly deletedFiles: readonly string[];
  readonly spawnedProcesses?: readonly SpawnedProcessInfo[] | undefined;
}

export interface StateDelta {
  readonly deltaId: string;
  readonly fromCheckpoint: string;
  readonly toCheckpoint: string;
  readonly timestamp: string;
  readonly mutations: StateDeltaMutations;
}

export interface CheckpointMetadata {
  readonly checkpointId: string;
  readonly instanceId: string;
  readonly name?: string | undefined;
  readonly createdAt: string;
  readonly rootMerkleHash: string;
  readonly processStateCount: number;
  readonly parentCheckpointId: string | null;
  readonly memorySnapshotSizeMb?: number | undefined;
}

export type ReproducibilityTier =
  | "HERMETIC_DETERMINISTIC"
  | "ISOLATED_REPRODUCIBLE"
  | "BEST_EFFORT_TRANSIENT";

export interface SandboxProvenance {
  readonly provenanceId: string;
  readonly specHash: string;
  readonly providerId: string;
  readonly providerVersion: string;
  readonly adapterVersion: string;
  readonly imageDigest: string;
  readonly hostArchitecture: string;
  readonly deterministicSeed: string;
  readonly recordedAt: string;
  readonly reproducibilityTier: ReproducibilityTier;
}

export interface SandboxTerminationSummary {
  readonly instanceId: string;
  readonly providerId: string;
  readonly terminatedAt: string;
  readonly totalExecutionDurationMs: number;
  readonly peakMemoryBytesAllocated: number;
  readonly totalDiskBytesConsumed: number;
  readonly reclamationConfirmed: boolean;
  readonly orphanedProcessesPurged: number;
  readonly provenance: SandboxProvenance;
}

export interface SandboxCapabilities {
  readonly supportsSnapshots: boolean;
  readonly supportsFilesystemDiff: boolean;
  readonly supportsLiveStream: boolean;
  readonly supportsMicroVM: boolean;
  readonly supportsNetworkPolicy: boolean;
  readonly supportsResourceHardening: boolean;
  readonly maxExecutionTimeoutSeconds: number;
  readonly supportedArchitectures: readonly ("x86_64" | "aarch64")[];
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

export interface ProviderHealthStatus {
  readonly providerId: string;
  readonly isHealthy: boolean;
  readonly latencyMs: number;
  readonly details?: Readonly<Record<string, unknown>> | undefined;
}

export interface StreamChunkEvent {
  readonly stream: "stdout" | "stderr";
  readonly text: string;
  readonly timestamp: string;
}

export interface ProcessSpawnEvent {
  readonly pid: number;
  readonly cmdline: string;
  readonly timestamp: string;
}

export interface ProcessExitEvent {
  readonly pid: number;
  readonly exitCode: number;
  readonly timestamp: string;
}

export interface FilesystemMutationEvent {
  readonly action: "CREATE" | "MODIFY" | "DELETE";
  readonly path: string;
  readonly timestamp: string;
}

export interface NetworkConnectionEvent {
  readonly destinationHost: string;
  readonly destinationPort: number;
  readonly allowed: boolean;
  readonly timestamp: string;
}

export class SandboxRuntimeError extends Error {
  readonly code: string;
  readonly providerId: string;
  readonly isRetryable: boolean;

  constructor(code: string, message: string, providerId: string, isRetryable = false) {
    super(`[${providerId}] ${code}: ${message}`);
    this.name = "SandboxRuntimeError";
    this.code = code;
    this.providerId = providerId;
    this.isRetryable = isRetryable;
  }
}
