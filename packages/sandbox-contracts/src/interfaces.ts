/**
 * @package @tech-club/sandbox-contracts
 * Universal Provider & Instance Interfaces
 */

import type {
  EnvironmentSpec,
  ExecutionRequest,
  ExecutionResult,
  StateDelta,
  CheckpointMetadata,
  SandboxTerminationSummary,
  SandboxCapabilities,
  ValidationResult,
  ProviderHealthStatus,
  StreamChunkEvent,
  ProcessSpawnEvent,
  ProcessExitEvent,
  FilesystemMutationEvent,
  NetworkConnectionEvent,
  SandboxRuntimeError
} from './types.js';

export interface SubscriptionHandle {
  readonly unsubscribe: () => void;
}

export interface WriteOptions {
  readonly mode?: string;
  readonly overwrite?: boolean;
}

export interface FileEntry {
  readonly path: string;
  readonly sizeBytes: number;
  readonly isDirectory: boolean;
  readonly sha256?: string;
}

export interface SandboxSummary {
  readonly instanceId: string;
  readonly providerId: string;
  readonly status: 'RUNNING' | 'PAUSED' | 'TERMINATED';
  readonly createdAt: string;
}

export type SandboxStatus = 'PROVISIONING' | 'READY' | 'EXECUTING' | 'OBSERVING' | 'CHECKPOINTING' | 'RESTORING' | 'QUARANTINED' | 'TERMINATED' | 'FAILED';

export interface QuarantineReport {
  readonly instanceId: string;
  readonly reason: string;
  readonly quarantinedAt: string;
  readonly openSockets: readonly string[];
  readonly processTreeSnapshot: readonly string[];
}

export interface ISandboxObserver {
  onStdout(event: StreamChunkEvent): void;
  onStderr(event: StreamChunkEvent): void;
  onProcessSpawn?(event: ProcessSpawnEvent): void;
  onProcessExit?(event: ProcessExitEvent): void;
  onFilesystemMutation?(event: FilesystemMutationEvent): void;
  onNetworkConnection?(event: NetworkConnectionEvent): void;
  onError?(error: SandboxRuntimeError): void;
}

export interface ISandboxInstance {
  readonly instanceId: string;
  readonly providerId: string;
  readonly spec: EnvironmentSpec;
  readonly createdAt: string;

  getStatus(): Promise<SandboxStatus>;

  // Execution Primitives
  executeCommand(request: ExecutionRequest): Promise<ExecutionResult>;
  sendSignal?(pid: number, signal: 'SIGINT' | 'SIGTERM' | 'SIGKILL'): Promise<void>;

  // Filesystem Operations
  writeFile(path: string, content: Uint8Array | string, options?: WriteOptions): Promise<void>;
  readFile(path: string): Promise<Uint8Array>;
  deleteFile(path: string): Promise<void>;
  listFiles(path: string, recursive?: boolean): Promise<readonly FileEntry[]>;

  // State & Observation
  captureStateDelta(sinceCheckpointId?: string): Promise<StateDelta>;
  createCheckpoint(name?: string): Promise<CheckpointMetadata>;
  restoreCheckpoint(checkpointId: string): Promise<void>;
  listCheckpoints?(): Promise<readonly CheckpointMetadata[]>;

  // Observer
  attachObserver(observer: ISandboxObserver): Promise<SubscriptionHandle>;

  // Quarantine & Teardown
  quarantine?(reason: string): Promise<QuarantineReport>;
  terminate(): Promise<SandboxTerminationSummary>;
}

export interface ISandboxProvider {
  readonly providerId: string;
  readonly providerVersion: string;

  getCapabilities(): Promise<SandboxCapabilities>;
  validateEnvironmentSpec(spec: EnvironmentSpec): Promise<ValidationResult>;
  createSandbox(spec: EnvironmentSpec): Promise<ISandboxInstance>;
  listActiveSandboxes?(): Promise<readonly SandboxSummary[]>;
  healthCheck(): Promise<ProviderHealthStatus>;
}
