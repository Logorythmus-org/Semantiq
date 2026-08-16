/**
 * @package @tech-club/adapter-replay
 * Deterministic Replay Adapter Implementation
 */

import {
  BaseSandboxAdapter,
  type EnvironmentSpec,
  type SandboxCapabilities,
  type ProviderHealthStatus,
  type ISandboxInstance
} from '../../sandbox-contracts/src/index.js';
import { DeterministicReplayInstance, type RecordedTraceStep } from './replay-instance.js';

export class DeterministicReplayAdapter extends BaseSandboxAdapter {
  readonly providerId = 'replay';
  readonly providerVersion = '1.0.0';
  private readonly traces: readonly RecordedTraceStep[];

  constructor(traces: readonly RecordedTraceStep[] = []) {
    super();
    this.traces = traces;
  }

  async getCapabilities(): Promise<SandboxCapabilities> {
    return {
      supportsSnapshots: true,
      supportsFilesystemDiff: true,
      supportsLiveStream: true,
      supportsMicroVM: false,
      supportsNetworkPolicy: true,
      supportsResourceHardening: true,
      maxExecutionTimeoutSeconds: 3600,
      supportedArchitectures: ['x86_64', 'aarch64']
    };
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    return {
      providerId: this.providerId,
      isHealthy: true,
      latencyMs: 0,
      details: { mode: 'deterministic-replay' }
    };
  }

  async createSandbox(spec: EnvironmentSpec): Promise<ISandboxInstance> {
    const validation = await this.validateEnvironmentSpec(spec);
    if (!validation.isValid) {
      throw new Error(`EnvironmentSpec validation failed: ${validation.errors.join(', ')}`);
    }

    const instanceId = `replay-${crypto.randomUUID()}`;
    return new DeterministicReplayInstance(instanceId, spec, this.providerVersion, this.traces);
  }
}
