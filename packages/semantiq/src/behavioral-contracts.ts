/**
 * Phase 8 Behavioral Domain Contracts for SemantIQ Benchmarks.
 * Represents single-agent behavioral observation across the 9-stage lifecycle:
 * Environment -> Permissions -> Context -> Interpretation -> Decision -> Action -> Result -> Consequence -> Recovery
 */

export type LifecycleStage =
  | "environment"
  | "permissions"
  | "context"
  | "interpretation"
  | "decision"
  | "action"
  | "result"
  | "consequence"
  | "recovery";

export interface EvidenceReference {
  readonly id: string;
  readonly uri: string;
  readonly hash: string;
  readonly mimeType: string;
  readonly description?: string;
}

export interface ResourceDescriptor {
  readonly id: string;
  readonly type: string;
  readonly pathOrUri: string;
  readonly isReadOnly: boolean;
}

export interface PermissionDescriptor {
  readonly id: string;
  readonly actionType: string;
  readonly targetResource: string;
  readonly isAllowed: boolean;
  readonly scope: string;
}

export interface EnvironmentDescriptor {
  readonly id: string;
  readonly os: string;
  readonly runtimeVersion: string;
  readonly resources: readonly ResourceDescriptor[];
  readonly permissions: readonly PermissionDescriptor[];
  readonly isSandboxed: boolean;
}

export interface MissionDescriptor {
  readonly id: string;
  readonly goalDescription: string;
  readonly targetConstraints: readonly string[];
  readonly maxStepsAllowed: number;
}

export interface ContextRecord {
  readonly id: string;
  readonly timestamp: string;
  readonly mission: MissionDescriptor;
  readonly environment: EnvironmentDescriptor;
  readonly priorHistoryLength: number;
}

export interface InterpretationRecord {
  readonly id: string;
  readonly timestamp: string;
  readonly contextId: string;
  readonly parsedIntent: string;
  readonly perceivedConstraints: readonly string[];
  readonly confidence: number;
}

export interface DecisionRecord {
  readonly id: string;
  readonly timestamp: string;
  readonly interpretationId: string;
  readonly chosenStrategy: string;
  readonly rejectedAlternatives: readonly string[];
  readonly justification: string;
}

export interface ActionRecord {
  readonly id: string;
  readonly timestamp: string;
  readonly decisionId: string;
  readonly verb: string;
  readonly target: string;
  readonly parameters: Readonly<Record<string, unknown>>;
}

export interface ResultRecord {
  readonly id: string;
  readonly timestamp: string;
  readonly actionId: string;
  readonly status: "success" | "failure" | "error" | "timeout";
  readonly exitCode: number;
  readonly outputSummary: string;
  readonly evidenceReferences: readonly EvidenceReference[];
}

export interface ConsequenceRecord {
  readonly id: string;
  readonly timestamp: string;
  readonly resultId: string;
  readonly stateChanged: boolean;
  readonly sideEffects: readonly string[];
  readonly riskLevel: "none" | "low" | "medium" | "high" | "critical";
}

export interface RecoveryRecord {
  readonly id: string;
  readonly timestamp: string;
  readonly consequenceId: string;
  readonly isRecovered: boolean;
  readonly recoveryActionTaken?: string;
  readonly remainingDegradation?: string;
}

export interface BehaviorEvent {
  readonly id: string;
  readonly runId: string;
  readonly stepNumber: number;
  readonly stage: LifecycleStage;
  readonly timestamp: string;
  readonly payload:
    | ContextRecord
    | InterpretationRecord
    | DecisionRecord
    | ActionRecord
    | ResultRecord
    | ConsequenceRecord
    | RecoveryRecord;
}

export interface BehaviorTrace {
  readonly id: string;
  readonly runId: string;
  readonly agentId: string;
  readonly startTime: string;
  readonly endTime?: string;
  readonly events: readonly BehaviorEvent[];
  readonly isComplete: boolean;
}

export interface BehaviorRun {
  readonly id: string;
  readonly missionId: string;
  readonly agentId: string;
  readonly traceId: string;
  readonly status: "running" | "completed" | "failed" | "aborted";
  readonly totalSteps: number;
  readonly createdAt: string;
}

export interface BehaviorProfile {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly verbWeights: Readonly<Record<string, number>>;
  readonly maxRiskTolerance: "none" | "low" | "medium" | "high";
}
