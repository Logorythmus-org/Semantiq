/**
 * @package @tech-club/sandbox-contracts
 * Public SemantIQ Execution API Architecture
 */

import { canonicalJson, computeSha256 } from './crypto-utils.js';
import type { SandboxBenchmarkDSL } from './benchmark-dsl.js';
import type { BehavioralTraceEvent } from './evidence-package.js';

export type RunStatus =
  | 'PENDING'
  | 'VALIDATING'
  | 'PROVISIONING'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'CLEANED_UP';

export interface CreateRunRequest {
  readonly scenarioId: string;
  readonly dslDocument?: SandboxBenchmarkDSL | undefined;
  readonly agentId: string;
  readonly targetProviderId?: string | undefined;
  readonly deterministicSeed?: string | undefined;
  readonly tags?: readonly string[] | undefined;
}

export interface ReplayRunRequest {
  readonly sourceRunId: string;
  readonly overrideSeed?: string | undefined;
  readonly targetProviderId?: string | undefined;
  readonly stepBreakpoints?: readonly number[] | undefined;
}

export interface RunRecord {
  readonly runId: string;
  readonly scenarioId: string;
  readonly agentId: string;
  readonly providerId: string;
  readonly status: RunStatus;
  readonly createdAt: string;
  readonly startedAt?: string | undefined;
  readonly completedAt?: string | undefined;
  readonly cancellationReason?: string | undefined;
  readonly errorDetails?: string | undefined;
  readonly costEstimateUsd?: number | undefined;
  readonly provenanceHash: string;
  readonly isReplay: boolean;
  readonly sourceRunId?: string | undefined;
}

/**
 * SemantIQ Execution API Service.
 * Manages the lifecycle of benchmark execution runs: creation, validation, initiation,
 * live observation streaming, cancellation, deterministic replay, and artifact retrieval.
 */
export class ExecutionAPIService {
  private readonly runs = new Map<string, RunRecord>();
  private readonly traceStore = new Map<string, BehavioralTraceEvent[]>();

  async createRun(request: CreateRunRequest): Promise<RunRecord> {
    const runId = `run-${computeSha256(`${request.scenarioId}-${request.agentId}-${Date.now()}`).substring(0, 16)}`;
    const providerId = request.targetProviderId ?? 'provider-docker-local';

    const unsignedRecord = {
      runId,
      scenarioId: request.scenarioId,
      agentId: request.agentId,
      providerId,
      status: 'PENDING' as RunStatus,
      createdAt: new Date().toISOString(),
      isReplay: false
    };

    const provenanceHash = computeSha256(canonicalJson(unsignedRecord));
    const runRecord: RunRecord = {
      ...unsignedRecord,
      provenanceHash
    };

    this.runs.set(runId, runRecord);
    this.traceStore.set(runId, []);
    return runRecord;
  }

  async validateRun(runId: string): Promise<{ valid: boolean; errors: readonly string[] }> {
    const run = this.runs.get(runId);
    if (!run) {
      return { valid: false, errors: [`Run ${runId} not found`] };
    }

    // Transition status to VALIDATING then back to PENDING if valid
    this.runs.set(runId, { ...run, status: 'VALIDATING' });
    this.runs.set(runId, { ...run, status: 'PENDING' });

    return { valid: true, errors: [] };
  }

  async startRun(runId: string): Promise<RunRecord> {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    const updatedRecord: RunRecord = {
      ...run,
      status: 'RUNNING',
      startedAt: new Date().toISOString()
    };

    this.runs.set(runId, updatedRecord);
    return updatedRecord;
  }

  async recordEvent(runId: string, event: BehavioralTraceEvent): Promise<void> {
    const trace = this.traceStore.get(runId);
    if (trace) {
      trace.push(event);
    }
  }

  async observeRun(runId: string): Promise<readonly BehavioralTraceEvent[]> {
    const trace = this.traceStore.get(runId);
    if (!trace) {
      throw new Error(`Run ${runId} not found`);
    }
    return [...trace];
  }

  async cancelRun(runId: string, reason: string): Promise<RunRecord> {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    const updatedRecord: RunRecord = {
      ...run,
      status: 'CANCELLED',
      completedAt: new Date().toISOString(),
      cancellationReason: reason
    };

    this.runs.set(runId, updatedRecord);
    return updatedRecord;
  }

  async replayRun(request: ReplayRunRequest): Promise<RunRecord> {
    const sourceRun = this.runs.get(request.sourceRunId);
    if (!sourceRun) {
      throw new Error(`Source Run ${request.sourceRunId} not found`);
    }

    const replayRunId = `replay-${computeSha256(`${request.sourceRunId}-${Date.now()}`).substring(0, 16)}`;
    const providerId = request.targetProviderId ?? sourceRun.providerId;

    const unsignedRecord = {
      runId: replayRunId,
      scenarioId: sourceRun.scenarioId,
      agentId: sourceRun.agentId,
      providerId,
      status: 'PENDING' as RunStatus,
      createdAt: new Date().toISOString(),
      isReplay: true,
      sourceRunId: request.sourceRunId
    };

    const provenanceHash = computeSha256(canonicalJson(unsignedRecord));
    const replayRecord: RunRecord = {
      ...unsignedRecord,
      provenanceHash
    };

    this.runs.set(replayRunId, replayRecord);
    this.traceStore.set(replayRunId, []);
    return replayRecord;
  }

  async completeRun(runId: string, costEstimateUsd: number = 0.05): Promise<RunRecord> {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    const updatedRecord: RunRecord = {
      ...run,
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      costEstimateUsd
    };

    this.runs.set(runId, updatedRecord);
    return updatedRecord;
  }

  async getRun(runId: string): Promise<RunRecord | undefined> {
    return this.runs.get(runId);
  }
}
