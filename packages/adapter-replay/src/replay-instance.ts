/**
 * @package @tech-club/adapter-replay
 * Deterministic Replay Instance Implementation
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
  generateProvenance,
  computeSha256
} from "../../sandbox-contracts/src/index.js";

export interface RecordedTraceStep {
  readonly command: readonly string[];
  readonly result: Partial<ExecutionResult>;
  readonly delta?: Partial<StateDelta>;
}

export class DeterministicReplayInstance extends BaseSandboxInstance {
  readonly instanceId: string;
  readonly providerId = "replay";
  readonly spec: EnvironmentSpec;
  private readonly adapterVersion: string;
  private readonly traces: readonly RecordedTraceStep[];
  private currentStep = 0;
  private readonly inMemoryFiles: Map<string, Uint8Array> = new Map();
  private readonly checkpoints: Map<string, CheckpointMetadata> = new Map();

  constructor(
    instanceId: string,
    spec: EnvironmentSpec,
    adapterVersion: string,
    traces: readonly RecordedTraceStep[] = []
  ) {
    super();
    this.instanceId = instanceId;
    this.spec = spec;
    this.adapterVersion = adapterVersion;
    this.traces = traces;

    // Load initial files if provided in spec
    if (spec.initialFilesystem) {
      for (const entry of spec.initialFilesystem) {
        this.inMemoryFiles.set(entry.path, Buffer.from(entry.contentBase64, "base64"));
      }
    }
  }

  async executeCommand(request: ExecutionRequest): Promise<ExecutionResult> {
    if (this.isTerminated) throw new Error("Cannot execute on terminated replay instance.");

    // Look for matching recorded step or synthesize deterministic result
    const step = this.traces[this.currentStep];
    this.currentStep++;

    const stdout = step?.result?.stdout ?? `[REPLAY] Executed: ${request.command.join(" ")}\n`;
    const stderr = step?.result?.stderr ?? "";
    const exitCode = step?.result?.exitCode ?? 0;

    this.notifyStdout(stdout);
    if (stderr) this.notifyStderr(stderr);

    return {
      requestId: request.requestId,
      exitCode,
      stdout,
      stderr,
      stdoutTruncated: false,
      stderrTruncated: false,
      durationMs: step?.result?.durationMs ?? 5,
      peakMemoryBytes: step?.result?.peakMemoryBytes ?? 1048576,
      timedOut: step?.result?.timedOut ?? false,
      oomKilled: step?.result?.oomKilled ?? false
    };
  }

  async writeFile(
    path: string,
    content: Uint8Array | string,
    _options?: WriteOptions
  ): Promise<void> {
    const data = typeof content === "string" ? Buffer.from(content, "utf-8") : content;
    this.inMemoryFiles.set(path, data);
  }

  async readFile(path: string): Promise<Uint8Array> {
    const data = this.inMemoryFiles.get(path);
    if (!data) throw new Error(`File not found: ${path}`);
    return data;
  }

  async deleteFile(path: string): Promise<void> {
    this.inMemoryFiles.delete(path);
  }

  async listFiles(_path: string, _recursive?: boolean): Promise<readonly FileEntry[]> {
    const entries: FileEntry[] = [];
    for (const [filePath, data] of this.inMemoryFiles.entries()) {
      entries.push({
        path: filePath,
        sizeBytes: data.length,
        isDirectory: false,
        sha256: computeSha256(data)
      });
    }
    return entries;
  }

  async captureStateDelta(sinceCheckpointId?: string): Promise<StateDelta> {
    const createdFiles: any[] = [];
    for (const [path, data] of this.inMemoryFiles.entries()) {
      createdFiles.push({
        path,
        sha256: computeSha256(data),
        sizeBytes: data.length
      });
    }

    return {
      deltaId: crypto.randomUUID(),
      fromCheckpoint: sinceCheckpointId || "baseline",
      toCheckpoint: "current",
      timestamp: new Date().toISOString(),
      mutations: {
        createdFiles,
        modifiedFiles: [],
        deletedFiles: [],
        spawnedProcesses: []
      }
    };
  }

  async createCheckpoint(name?: string): Promise<CheckpointMetadata> {
    const checkpointId = crypto.randomUUID();
    const meta: CheckpointMetadata = {
      checkpointId,
      instanceId: this.instanceId,
      name: name || "checkpoint",
      createdAt: new Date().toISOString(),
      rootMerkleHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      processStateCount: 0,
      parentCheckpointId: null
    };
    this.checkpoints.set(checkpointId, meta);
    return meta;
  }

  async restoreCheckpoint(checkpointId: string): Promise<void> {
    if (!this.checkpoints.has(checkpointId) && checkpointId !== "baseline") {
      throw new Error(`Checkpoint '${checkpointId}' not found.`);
    }
  }

  async terminate(): Promise<SandboxTerminationSummary> {
    this.isTerminated = true;
    return {
      instanceId: this.instanceId,
      providerId: this.providerId,
      terminatedAt: new Date().toISOString(),
      totalExecutionDurationMs: 10,
      peakMemoryBytesAllocated: 1048576,
      totalDiskBytesConsumed: 512,
      reclamationConfirmed: true,
      orphanedProcessesPurged: 0,
      provenance: generateProvenance(
        this.spec,
        this.providerId,
        "1.0.0",
        this.adapterVersion,
        "42",
        "HERMETIC_DETERMINISTIC"
      )
    };
  }
}
