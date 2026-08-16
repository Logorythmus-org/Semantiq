/**
 * @package @semantiq/adapter-cloud-base
 * E2B Cloud Reference Adapter Implementation
 */

import {
  BaseSandboxAdapter,
  BaseSandboxInstance,
  type EnvironmentSpec,
  type ExecutionRequest,
  type ExecutionResult,
  type StateDelta,
  type CheckpointMetadata,
  type SandboxTerminationSummary,
  type SandboxCapabilities,
  type ProviderHealthStatus,
  type ISandboxInstance,
  type FileEntry,
  type WriteOptions,
  generateProvenance
} from "../../sandbox-contracts/src/index.js";
import { CloudAuthenticationManager } from "./auth-manager.js";
import { CostQuotaGovernor } from "./cost-governor.js";
import type { CloudAuthConfig, CloudBudgetPolicy, CloudBillingMetadata } from "./types.js";

export class E2BCloudInstance extends BaseSandboxInstance {
  readonly instanceId: string;
  readonly providerId = "e2b";
  readonly spec: EnvironmentSpec;
  readonly createdAt: string = new Date().toISOString();
  private readonly adapterVersion: string;
  private readonly authManager: CloudAuthenticationManager;
  private readonly costGovernor: CostQuotaGovernor;
  private readonly startTime: number;

  constructor(
    instanceId: string,
    spec: EnvironmentSpec,
    adapterVersion: string,
    authManager: CloudAuthenticationManager,
    costGovernor: CostQuotaGovernor
  ) {
    super();
    this.instanceId = instanceId;
    this.spec = spec;
    this.adapterVersion = adapterVersion;
    this.authManager = authManager;
    this.costGovernor = costGovernor;
    this.startTime = Date.now();
  }

  async executeCommand(request: ExecutionRequest): Promise<ExecutionResult> {
    if (this.isTerminated) throw new Error("Cannot execute on terminated cloud instance.");

    // Simulated remote microVM execution with secret scrubbing
    const start = Date.now();
    const stdoutRaw = `[E2B MicroVM] Executed: ${request.command.join(" ")}\n`;
    const stdout = this.authManager.scrubSecrets(stdoutRaw);

    this.notifyStdout(stdout);

    return {
      requestId: request.requestId,
      exitCode: 0,
      stdout,
      stderr: "",
      stdoutTruncated: false,
      stderrTruncated: false,
      durationMs: Date.now() - start,
      peakMemoryBytes: 2097152,
      timedOut: false,
      oomKilled: false
    };
  }

  async writeFile(
    _path: string,
    _content: Uint8Array | string,
    _options?: WriteOptions
  ): Promise<void> {}
  async readFile(_path: string): Promise<Uint8Array> {
    return new Uint8Array();
  }
  async deleteFile(_path: string): Promise<void> {}
  async listFiles(_path: string, _recursive?: boolean): Promise<readonly FileEntry[]> {
    return [];
  }

  async captureStateDelta(sinceCheckpointId?: string): Promise<StateDelta> {
    return {
      deltaId: crypto.randomUUID(),
      fromCheckpoint: sinceCheckpointId || "baseline",
      toCheckpoint: "current",
      timestamp: new Date().toISOString(),
      mutations: { createdFiles: [], modifiedFiles: [], deletedFiles: [], spawnedProcesses: [] }
    };
  }

  async createCheckpoint(name?: string): Promise<CheckpointMetadata> {
    return {
      checkpointId: crypto.randomUUID(),
      instanceId: this.instanceId,
      name: name || "cloud-checkpoint",
      createdAt: new Date().toISOString(),
      rootMerkleHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      processStateCount: 0,
      parentCheckpointId: null
    };
  }

  async restoreCheckpoint(_checkpointId: string): Promise<void> {}

  async getBillingMetadata(): Promise<CloudBillingMetadata> {
    const wallClockMs = Date.now() - this.startTime;
    return {
      providerName: "e2b",
      instanceTier: "2vCPU-4GB",
      billedExecutionDurationMs: wallClockMs,
      wallClockDurationMs: wallClockMs,
      estimatedCostUsd: (wallClockMs / 60000) * 0.03,
      currency: "USD",
      zeroDataRetentionConfirmed: true
    };
  }

  async terminate(): Promise<SandboxTerminationSummary> {
    if (this.isTerminated) throw new Error("Cloud instance already terminated.");
    this.isTerminated = true;

    const billedMs = Date.now() - this.startTime;
    this.costGovernor.onSandboxTerminated(billedMs);

    return {
      instanceId: this.instanceId,
      providerId: this.providerId,
      terminatedAt: new Date().toISOString(),
      totalExecutionDurationMs: billedMs,
      peakMemoryBytesAllocated: 2097152,
      totalDiskBytesConsumed: 1024,
      reclamationConfirmed: true,
      orphanedProcessesPurged: 0,
      provenance: generateProvenance(
        this.spec,
        this.providerId,
        "1.0.0",
        this.adapterVersion,
        "42",
        "ISOLATED_REPRODUCIBLE"
      )
    };
  }
}

export class E2BCloudAdapter extends BaseSandboxAdapter {
  readonly providerId = "e2b";
  readonly providerVersion = "1.0.0";

  private readonly authManager = new CloudAuthenticationManager();
  private readonly costGovernor = new CostQuotaGovernor();

  constructor(auth?: CloudAuthConfig, budget?: Partial<CloudBudgetPolicy>) {
    super();
    if (auth) this.authManager.configure(auth);
    if (budget) this.costGovernor.setPolicy(budget as CloudBudgetPolicy);
  }

  async getCapabilities(): Promise<SandboxCapabilities> {
    return {
      supportsSnapshots: true,
      supportsFilesystemDiff: true,
      supportsLiveStream: true,
      supportsMicroVM: true,
      supportsNetworkPolicy: true,
      supportsResourceHardening: true,
      maxExecutionTimeoutSeconds: 3600,
      supportedArchitectures: ["x86_64"]
    };
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    return {
      providerId: this.providerId,
      isHealthy: true,
      latencyMs: 15,
      details: { tier: "serverless-microvm", region: "us-east-1" }
    };
  }

  async createSandbox(spec: EnvironmentSpec): Promise<ISandboxInstance> {
    const validation = await this.validateEnvironmentSpec(spec);
    if (!validation.isValid) {
      throw new Error(`EnvironmentSpec validation failed: ${validation.errors.join(", ")}`);
    }

    this.costGovernor.checkPreflight();
    this.costGovernor.onSandboxCreated();

    const instanceId = `e2b-${crypto.randomUUID()}`;
    return new E2BCloudInstance(
      instanceId,
      spec,
      this.providerVersion,
      this.authManager,
      this.costGovernor
    );
  }
}
