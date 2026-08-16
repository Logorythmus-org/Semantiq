import { describe, expect, it } from "vitest";
import {
  LocalSprint3Runtime,
  sprint3ApiContracts,
  sprint3DefaultAgents,
  sprint3DefaultWorkflows,
  sprint3PromptRegistry,
  sprint3ToolAdapters
} from "../src/index.js";

describe("Sprint 3 Agent OS collaboration runtime", () => {
  it("runs the research goal to workflow, memory, reflection, and learning journey", async () => {
    const runtime = new LocalSprint3Runtime();
    const result = await runtime.runOperationalJourney({
      identityId: "identity:sprint3",
      displayName: "Sprint Three",
      workspaceName: "Agent OS Lab",
      rawQuestion: "How can evidence improve learning workflows?",
      evidenceTitle: "Workflow evidence",
      evidenceSource: "local://workflow-evidence"
    });

    expect(result.goal.state).toBe("Completed");
    expect(result.goal.taskTree.length).toBeGreaterThan(0);
    expect(result.plan.tasks.length).toBe(result.goal.taskTree.length);
    expect(result.workflow.state).toBe("completed");
    expect(result.executionStatus).toBe("completed");
    expect(result.agents).toHaveLength(16);
    expect(result.agents.every((agent) => agent.sandbox)).toBe(true);
    expect(result.approvals.map((approval) => approval.state)).toContain("granted");
    expect(result.collaboration.delegatedTaskIds).toHaveLength(result.plan.tasks.length);
    expect(result.memory.length).toBeGreaterThanOrEqual(7);
    expect(result.reflection.lessonsLearned.length).toBeGreaterThan(0);
    expect(result.learning.explanation).toContain("Learning derived");
    expect(result.runtimeStatus.health).toBe("healthy");
    expect(result.runtimeStatus.executionSuccess).toBe(1);
    expect(result.runtimeStatus.semantiqTrends.length).toBeGreaterThan(0);
  });

  it("emits required observable Agent OS events", async () => {
    const runtime = new LocalSprint3Runtime();
    const result = await runtime.runOperationalJourney({
      identityId: "identity:sprint3-events",
      displayName: "Events",
      workspaceName: "Events Workspace",
      rawQuestion: "What research workflow should validate evidence?",
      evidenceTitle: "Event evidence",
      evidenceSource: "local://event-evidence"
    });
    const eventTypes = result.events.map((event) => event.type);

    for (const required of [
      "GoalCreated",
      "GoalPlanned",
      "WorkflowCreated",
      "WorkflowStarted",
      "WorkflowCompleted",
      "AgentRegistered",
      "AgentStarted",
      "MemoryUpdated",
      "ReflectionCreated",
      "LearningCompleted",
      "ApprovalRequested",
      "ApprovalGranted"
    ] as const) {
      expect(eventTypes).toContain(required);
    }
    expect(result.events.every((event) => event.version === 1 && event.actorId && event.workspaceId && event.audit.localFirst === true)).toBe(true);
  });

  it("supports workflow controls, rejected approvals, tool gates, prompts, and contracts", async () => {
    const runtime = new LocalSprint3Runtime();
    const agent = await runtime.registerAgent("workspace:manual", "identity:manual", "Planner Agent", ["planning"]);
    const goal = await runtime.createGoal("workspace:manual", "identity:manual", {
      mission: "Plan a publication workflow",
      objectives: ["Prepare publication"],
      taskTree: ["Prepare publication draft", "Publish external communication"],
      milestones: ["Plan", "Publish"],
      dependencies: [],
      priority: "normal",
      risks: ["Publication requires approval"],
      resources: [],
      expectedOutput: "Publication plan",
      successCriteria: ["Approval gate works"]
    });
    const plan = await runtime.planGoal("workspace:manual", "identity:manual", goal.id);
    const workflow = await runtime.createWorkflow("workspace:manual", "identity:manual", plan.id);
    const waiting = await runtime.runWorkflow("workspace:manual", "identity:manual", workflow.id);
    const paused = runtime.pauseWorkflow("workspace:manual", "identity:manual", workflow.id);
    const resumed = runtime.resumeWorkflow("workspace:manual", "identity:manual", workflow.id);
    const approval = await runtime.requestApproval("workspace:manual", "identity:manual", "Publishing", "Publication needs approval.");
    const rejected = runtime.rejectApproval("workspace:manual", "identity:manual", approval.id);
    const tool = await runtime.runTool("workspace:manual", agent.id, goal.id, "Executing Dangerous Tools");

    expect(waiting).toBe("waiting-for-approval");
    expect(paused.state).toBe("paused");
    expect(resumed.state).toBe("ready");
    expect(rejected.state).toBe("rejected");
    expect(tool).toBe("waiting-for-approval");
    expect(runtime.discoverAgents("planning")[0]?.id).toBe(agent.id);
    expect(sprint3DefaultWorkflows).toContain("Research Summary");
    expect(sprint3DefaultAgents.map((item) => item.role)).toContain("Coordinator Agent");
    expect(sprint3PromptRegistry).toContain("workflow.v1");
    expect(sprint3ApiContracts).toContain("approveExecution()");
    expect(sprint3ToolAdapters).toContain("GitHub");
  });
});
