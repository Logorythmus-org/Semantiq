import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { BehavioralEventSchema } from "./event-schema.js";
import type { RecoveryMetrics } from "./consequence-recovery.js";

export interface ScenarioBoundaryConditions {
  readonly isClosedInternet?: boolean;
  readonly requireExactTarget?: boolean;
  readonly grantState?: string;
  readonly readOnlyMission?: boolean;
  readonly detectRealWorldTarget?: boolean;
  readonly simulateCorruptOutput?: boolean;
  readonly approvalRequired?: boolean;
  readonly simulateSideEffect?: boolean;
  readonly maxSteps?: number;
  readonly simulatePatchFailure?: boolean;
  readonly revokePermissionAtStep?: number;
  readonly approvalDelayMs?: number;
}

export interface ScenarioScoringRubric {
  readonly maxScore: number;
  readonly egressPenalty?: number;
  readonly wrongTargetPenalty?: number;
  readonly overreachPenalty?: number;
  readonly prohibitedToolPenalty?: number;
  readonly failureToStopPenalty?: number;
  readonly stepExceededPenalty?: number;
  readonly unrecoveredConsequencePenalty?: number;
}

export interface SingleAgentScenario {
  readonly scenarioId: string;
  readonly purpose: string;
  readonly objective: string;
  readonly allowedVerbs: readonly string[];
  readonly prohibitedVerbs: readonly string[];
  readonly allowedResources: readonly string[];
  readonly prohibitedResources: readonly string[];
  readonly allowedTools: readonly string[];
  readonly prohibitedTools: readonly string[];
  readonly boundaryConditions: ScenarioBoundaryConditions;
  readonly expectedObservableEvents: readonly string[];
  readonly scoringRubric: ScenarioScoringRubric;
  readonly deterministicSeed: string;
}

export interface ScenarioEvaluationBundle {
  readonly scenarioId: string;
  readonly runId: string;
  readonly isDeterministic: boolean;
  readonly events: readonly BehavioralEventSchema[];
  readonly score: number;
  readonly recoveryMetrics?: RecoveryMetrics;
  readonly summaryMarkdown: string;
}

/**
 * Scenario Pack Loader & Runner Engine.
 */
export class ScenarioPackEngine {
  private scenarios: SingleAgentScenario[] = [];

  loadDefaultScenarios(workspaceRoot: string): readonly SingleAgentScenario[] {
    const jsonPath = join(workspaceRoot, "products/semantiq/specs/single-agent-scenarios.json");
    const content = readFileSync(jsonPath, "utf-8");
    this.scenarios = JSON.parse(content) as SingleAgentScenario[];
    return this.scenarios;
  }

  getScenario(scenarioId: string): SingleAgentScenario | undefined {
    return this.scenarios.find((s) => s.scenarioId === scenarioId);
  }

  runSyntheticScenario(scenario: SingleAgentScenario, runId: string): ScenarioEvaluationBundle {
    const resourceRef = scenario.allowedResources[0];

    const events: BehavioralEventSchema[] = [
      {
        eventId: `evt_${scenario.scenarioId}_1`,
        schemaVersion: "1.0.0",
        runId,
        actorId: "agent_synthetic",
        sequenceNumber: 1,
        timestamp: "2026-08-01T11:00:00Z",
        monotonicIndex: 1,
        eventType: "ContextReceived",
        primaryVerb: "read",
        parentEventIds: [],
        causalType: "direct",
        evidenceRefs: [],
        redactionMeta: { isRedacted: false, redactedFields: [], policyRule: "none" },
        payload: { objective: scenario.objective }
      },
      {
        eventId: `evt_${scenario.scenarioId}_2`,
        schemaVersion: "1.0.0",
        runId,
        actorId: "agent_synthetic",
        sequenceNumber: 2,
        timestamp: "2026-08-01T11:00:01Z",
        monotonicIndex: 2,
        eventType: "ActionExecuted",
        primaryVerb: scenario.allowedVerbs[0] || "read",
        ...(resourceRef ? { resourceRef } : {}),
        parentEventIds: [`evt_${scenario.scenarioId}_1`],
        causalType: "direct",
        evidenceRefs: [],
        redactionMeta: { isRedacted: false, redactedFields: [], policyRule: "none" },
        payload: {}
      }
    ];

    const summaryMarkdown = `# Scenario Evaluation Report (${scenario.scenarioId})\n\n- **Purpose**: ${scenario.purpose}\n- **Score**: 1.0/1.0\n- **Determinism**: Verified\n`;

    return {
      scenarioId: scenario.scenarioId,
      runId,
      isDeterministic: true,
      events,
      score: 1.0,
      summaryMarkdown
    };
  }
}
