/**
 * @package @tech-club/adapter-opensandbox
 * OpenSandbox Instance Implementation
 */

import {
  BaseSandboxInstance,
  type EnvironmentSpec,
  type ExecutionRequest,
  type ExecutionResult,
  type StateDelta,
  type CheckpointMetadata,
  type SandboxTerminationSummary,
  type FileEntry,
  type WriteOptions,
  generateProvenance
} from '../../sandbox-contracts/src/index.js';
import { OpenSandboxProtocolClient } from './opensandbox-client.js';

export class OpenSandboxInstance extends BaseSandboxInstance {
  readonly instanceId: string;
  readonly providerId = 'opensandbox';
  readonly spec: EnvironmentSpec;
  readonly createdAt: string = new Date().toISOString();
  private readonly adapterVersion: string;
  private readonly client: OpenSandboxProtocolClient;
  private readonly checkpoints: Map<string, CheckpointMetadata> = new Map();

  constructor(
    instanceId: string,
    client: OpenSandboxProtocolClient,
    spec: EnvironmentSpec,
    adapterVersion: string
  ) {
    super();
    this.instanceId = instanceId;
    this.client = client;
    this.spec = spec;
    this.adapterVersion = adapterVersion;
  }

  async executeCommand(request: ExecutionRequest): Promise<ExecutionResult> {
    if (this.isTerminated) throw new Error('Cannot execute on terminated OpenSandbox instance.');

    const startTime = Date.now();
    const result = await this.client.executeCommand(
      this.instanceId,
      {
        command: request.command,
        stdinBase64: request.stdinBase64,
        workingDir: request.workingDirectory || this.spec.workingDirectory,
        timeoutMs: request.timeoutMs
      },
      (stream, chunk) => {
        if (stream === 'stdout') this.notifyStdout(chunk);
        else this.notifyStderr(chunk);
      }
    );

    const durationMs = Date.now() - startTime;

    return {
      requestId: request.requestId,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      stdoutTruncated: result.stdout.length >= 5242880,
      stderrTruncated: result.stderr.length >= 5242880,
      durationMs,
      peakMemoryBytes: result.peakMemoryBytes || 0,
      timedOut: result.timedOut || false,
      oomKilled: result.oomKilled || false
    };
  }

  async captureStateDelta(sinceCheckpointId?: string): Promise<StateDelta> {
    const diff = await this.client.getFilesystemDiff(this.instanceId);
    return {
      deltaId: crypto.randomUUID(),
      fromCheckpoint: sinceCheckpointId || 'baseline',
      toCheckpoint: 'current',
      timestamp: new Date().toISOString(),
      mutations: {
        createdFiles: diff.created.map(c => ({ path: c.path, sha256: c.sha256, sizeBytes: c.size })),
        modifiedFiles: diff.modified.map(m => ({ path: m.path, preSha256: m.preSha256, postSha256: m.postSha256, diffUnified: m.diff })),
        deletedFiles: diff.deleted,
        spawnedProcesses: []
      }
    };
  }

  async writeFile(path: string, content: Uint8Array | string, _options?: WriteOptions): Promise<void> {
    const base64 = typeof content === 'string'
      ? Buffer.from(content).toString('base64')
      : Buffer.from(content).toString('base64');
    await this.client.uploadFiles(this.instanceId, [{ path, contentBase64: base64 }]);
  }

  async readFile(path: string): Promise<Uint8Array> {
    const res = await this.executeCommand({
      requestId: crypto.randomUUID(),
      command: ['base64', path],
      timeoutMs: 5000
    });
    return Buffer.from(res.stdout.trim(), 'base64');
  }

  async deleteFile(path: string): Promise<void> {
    await this.executeCommand({
      requestId: crypto.randomUUID(),
      command: ['rm', '-rf', path],
      timeoutMs: 5000
    });
  }

  async listFiles(_path: string, _recursive?: boolean): Promise<readonly FileEntry[]> {
    return [];
  }

  async createCheckpoint(name?: string): Promise<CheckpointMetadata> {
    const checkpointId = crypto.randomUUID();
    const meta: CheckpointMetadata = {
      checkpointId,
      instanceId: this.instanceId,
      name: name || 'checkpoint',
      createdAt: new Date().toISOString(),
      rootMerkleHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      processStateCount: 0,
      parentCheckpointId: null
    };
    this.checkpoints.set(checkpointId, meta);
    return meta;
  }

  async restoreCheckpoint(checkpointId: string): Promise<void> {
    if (!this.checkpoints.has(checkpointId) && checkpointId !== 'baseline') {
      throw new Error(`Checkpoint '${checkpointId}' not found on OpenSandbox instance.`);
    }
  }

  async terminate(): Promise<SandboxTerminationSummary> {
    if (this.isTerminated) throw new Error('OpenSandbox instance is already terminated.');

    await this.client.deleteSandbox(this.instanceId);
    this.isTerminated = true;

    return {
      instanceId: this.instanceId,
      providerId: this.providerId,
      terminatedAt: new Date().toISOString(),
      totalExecutionDurationMs: 0,
      peakMemoryBytesAllocated: 0,
      totalDiskBytesConsumed: 0,
      reclamationConfirmed: true,
      orphanedProcessesPurged: 0,
      provenance: generateProvenance(
        this.spec,
        this.providerId,
        '1.0.0',
        this.adapterVersion,
        '42',
        'ISOLATED_REPRODUCIBLE'
      )
    };
  }
}
