/**
 * @package @semantiq/lifecycle-engine
 * Canonical 8-Stage Execution Lifecycle Controller
 */

import {
  type ISandboxInstance,
  type ExecutionRequest,
  type ExecutionResult,
  type StateDelta,
  type CheckpointMetadata,
  type SandboxTerminationSummary
} from "../../sandbox-contracts/src/index.js";
import type { LifecycleState, StateTransitionEvent, ILifecycleController } from "./types.js";

export class LifecycleController implements ILifecycleController {
  private state: LifecycleState = "CREATING";
  readonly instanceId: string;
  private readonly instance: ISandboxInstance;
  private readonly transitionListeners: Set<(event: StateTransitionEvent) => void> = new Set();
  private lastStateChangeTime: number = Date.now();

  constructor(instance: ISandboxInstance) {
    this.instance = instance;
    this.instanceId = instance.instanceId;
    this.transitionTo("PREPARING", "Instance created; transitioning to prepare phase");
  }

  get currentState(): LifecycleState {
    return this.state;
  }

  private transitionTo(newState: LifecycleState, reason?: string): void {
    const fromState = this.state;
    const now = Date.now();
    const durationMs = now - this.lastStateChangeTime;
    this.lastStateChangeTime = now;
    this.state = newState;

    const event: StateTransitionEvent = {
      transitionId: crypto.randomUUID(),
      instanceId: this.instanceId,
      fromState,
      toState: newState,
      reason,
      durationMs,
      timestamp: new Date().toISOString()
    };

    for (const listener of this.transitionListeners) {
      try {
        listener(event);
      } catch {
        // Observers must not break FSM
      }
    }
  }

  async prepare(): Promise<void> {
    if (this.state !== "PREPARING" && this.state !== "CREATING") {
      throw new Error(`Cannot prepare from state '${this.state}'.`);
    }

    // Verify instance status
    const status = await this.instance.getStatus();
    if (status === "TERMINATED" || status === "FAILED") {
      this.transitionTo("FAILED", "Instance failed health verification during prepare");
      throw new Error("Instance is in unhealthy state during prepare.");
    }

    this.transitionTo("READY", "Preparation complete; sandbox ready for execution");
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    if (this.state !== "READY") {
      throw new Error(`Cannot execute from state '${this.state}'. Instance must be 'READY'.`);
    }

    this.transitionTo("EXECUTING", `Executing command: ${request.command.join(" ")}`);

    try {
      this.transitionTo("OBSERVING", "Process active; observing telemetry streams");
      const result = await this.withTimeout(
        this.instance.executeCommand(request),
        request.timeoutMs + 2000,
        "EXECUTE_TIMEOUT"
      );

      this.transitionTo("COLLECTING", "Process exited; gathering execution metrics");
      this.transitionTo("READY", "Execution completed successfully; returned to READY");
      return result;
    } catch (err: any) {
      this.transitionTo("FAILED", `Execution failed: ${err.message}`);
      await this.recover(err);
      throw err;
    }
  }

  async collect(): Promise<StateDelta> {
    if (this.state !== "READY" && this.state !== "COLLECTING") {
      throw new Error(`Cannot collect state delta from state '${this.state}'.`);
    }
    return this.instance.captureStateDelta();
  }

  async snapshot(name?: string): Promise<CheckpointMetadata> {
    if (this.state !== "READY") {
      throw new Error(`Cannot snapshot from state '${this.state}'.`);
    }
    this.transitionTo("SNAPSHOTTING", `Creating checkpoint '${name || "unnamed"}'`);
    try {
      const meta = await this.instance.createCheckpoint(name);
      this.transitionTo("READY", "Snapshot committed successfully");
      return meta;
    } catch (err: any) {
      this.transitionTo("FAILED", `Snapshot error: ${err.message}`);
      throw err;
    }
  }

  async restore(checkpointId: string): Promise<void> {
    if (this.state !== "READY" && this.state !== "RECOVERING") {
      throw new Error(`Cannot restore checkpoint from state '${this.state}'.`);
    }
    this.transitionTo("RESTORING", `Restoring checkpoint '${checkpointId}'`);
    try {
      await this.instance.restoreCheckpoint(checkpointId);
      this.transitionTo("READY", "Checkpoint restored successfully");
    } catch (err: any) {
      this.transitionTo("FAILED", `Restore failed: ${err.message}`);
      throw err;
    }
  }

  async recover(error: Error): Promise<void> {
    this.transitionTo("RECOVERING", `Initiating recovery for error: ${error.message}`);
    try {
      this.transitionTo("RESTORING", "Rolling back filesystem to baseline");
      await this.instance.restoreCheckpoint("baseline");
      this.transitionTo("READY", "State successfully restored to baseline");
    } catch {
      this.transitionTo("QUARANTINED", "Recovery failed; quarantining instance");
    }
  }

  async destroy(): Promise<SandboxTerminationSummary> {
    this.transitionTo("DESTROYING", "Initiating final resource reclamation");
    try {
      const summary = await this.instance.terminate();
      this.transitionTo("DESTROYED", "Resources purged and verified");
      return summary;
    } catch (err: any) {
      this.transitionTo("DESTROYED", `Forcefully unmounted despite error: ${err.message}`);
      throw err;
    }
  }

  onTransition(callback: (event: StateTransitionEvent) => void): { unsubscribe: () => void } {
    this.transitionListeners.add(callback);
    return {
      unsubscribe: () => {
        this.transitionListeners.delete(callback);
      }
    };
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorCode: string
  ): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms [${errorCode}]`)),
        timeoutMs
      );
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
  }
}
