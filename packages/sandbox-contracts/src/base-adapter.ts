/**
 * @package @tech-club/sandbox-contracts
 * Base Abstract Classes for Sandbox Adapters & Instances
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
  StreamChunkEvent
} from './types.js';
import type {
  ISandboxProvider,
  ISandboxInstance,
  ISandboxObserver,
  SubscriptionHandle,
  SandboxStatus,
  FileEntry,
  WriteOptions
} from './interfaces.js';

export abstract class BaseSandboxAdapter implements ISandboxProvider {
  abstract readonly providerId: string;
  abstract readonly providerVersion: string;

  abstract getCapabilities(): Promise<SandboxCapabilities>;
  abstract healthCheck(): Promise<ProviderHealthStatus>;

  async validateEnvironmentSpec(spec: EnvironmentSpec): Promise<ValidationResult> {
    const errors: string[] = [];
    const caps = await this.getCapabilities();

    if (!spec.image || !spec.image.name) {
      errors.push('EnvironmentSpec must specify a valid image name.');
    }
    if (!spec.image.digest) {
      errors.push('EnvironmentSpec must specify an immutable image digest (sha256:...).');
    }
    if (spec.security.networkMode !== 'none' && !caps.supportsNetworkPolicy) {
      errors.push(`Provider '${this.providerId}' does not support custom network policies.`);
    }
    if (spec.resources.memoryLimitMebibytes < 32) {
      errors.push('Memory limit must be at least 32 MiB.');
    }
    return { isValid: errors.length === 0, errors };
  }

  abstract createSandbox(spec: EnvironmentSpec): Promise<ISandboxInstance>;
}

export abstract class BaseSandboxInstance implements ISandboxInstance {
  abstract readonly instanceId: string;
  abstract readonly providerId: string;
  abstract readonly spec: EnvironmentSpec;
  readonly createdAt: string = new Date().toISOString();

  protected observers: Set<ISandboxObserver> = new Set();
  protected isTerminated = false;

  async getStatus(): Promise<SandboxStatus> {
    return this.isTerminated ? 'TERMINATED' : 'READY';
  }

  attachObserver(observer: ISandboxObserver): Promise<SubscriptionHandle> {
    this.observers.add(observer);
    return Promise.resolve({
      unsubscribe: () => {
        this.observers.delete(observer);
      }
    });
  }

  protected notifyStdout(text: string): void {
    const event: StreamChunkEvent = { stream: 'stdout', text, timestamp: new Date().toISOString() };
    for (const observer of this.observers) {
      try {
        observer.onStdout(event);
      } catch {
        // Observers should not throw into runtime
      }
    }
  }

  protected notifyStderr(text: string): void {
    const event: StreamChunkEvent = { stream: 'stderr', text, timestamp: new Date().toISOString() };
    for (const observer of this.observers) {
      try {
        observer.onStderr(event);
      } catch {
        // Observers should not throw into runtime
      }
    }
  }

  abstract executeCommand(request: ExecutionRequest): Promise<ExecutionResult>;
  abstract writeFile(path: string, content: Uint8Array | string, options?: WriteOptions): Promise<void>;
  abstract readFile(path: string): Promise<Uint8Array>;
  abstract deleteFile(path: string): Promise<void>;
  abstract listFiles(path: string, recursive?: boolean): Promise<readonly FileEntry[]>;
  abstract captureStateDelta(sinceCheckpointId?: string): Promise<StateDelta>;
  abstract createCheckpoint(name?: string): Promise<CheckpointMetadata>;
  abstract restoreCheckpoint(checkpointId: string): Promise<void>;
  abstract terminate(): Promise<SandboxTerminationSummary>;
}
