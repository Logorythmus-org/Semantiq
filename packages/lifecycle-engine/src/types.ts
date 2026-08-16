/**
 * @package @semantiq/lifecycle-engine
 * Lifecycle State Machine Types
 */

import type {
  ExecutionRequest,
  ExecutionResult,
  StateDelta,
  CheckpointMetadata,
  SandboxTerminationSummary
} from "../../sandbox-contracts/src/index.js";

export type LifecycleState =
  | "UNINITIALIZED"
  | "CREATING"
  | "PREPARING"
  | "READY"
  | "EXECUTING"
  | "OBSERVING"
  | "COLLECTING"
  | "SNAPSHOTTING"
  | "RESTORING"
  | "RECOVERING"
  | "QUARANTINED"
  | "DESTROYING"
  | "DESTROYED"
  | "FAILED";

export interface StateTransitionEvent {
  readonly transitionId: string;
  readonly instanceId: string;
  readonly fromState: LifecycleState;
  readonly toState: LifecycleState;
  readonly reason?: string | undefined;
  readonly durationMs: number;
  readonly timestamp: string;
}

export interface ILifecycleController {
  readonly currentState: LifecycleState;
  readonly instanceId: string;

  prepare(): Promise<void>;
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
  collect(): Promise<StateDelta>;
  snapshot(name?: string | undefined): Promise<CheckpointMetadata>;
  restore(checkpointId: string): Promise<void>;
  recover(error: Error): Promise<void>;
  destroy(): Promise<SandboxTerminationSummary>;

  onTransition(callback: (event: StateTransitionEvent) => void): { unsubscribe: () => void };
}
