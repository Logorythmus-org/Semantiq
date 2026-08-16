import { describe, expect, it } from "vitest";
import {
  createAgent,
  createGoal,
  LocalAgentRuntime,
  type AgentMessage,
  type LearningRecord,
  type MemoryRecord,
  type ReflectionRecord,
  type ToolRequest
} from "../src/index.js";

describe("agent operating system runtime", () => {
  it("plans a goal, assigns agents, executes workflow, stores memory, reflects, learns, and benchmarks", async () => {
    const runtime = new LocalAgentRuntime();
    const planner = createAgent("agent:planner", "planner", ["planning"], ["filesystem"]);
    const tester = createAgent("agent:tester", "testing", ["testing"], ["terminal"]);
    const goal = createGoal("goal:1", "Validate the research runtime", "workspace:1", ["Plan validation", "Run tests", "Document results"]);

    await runtime.registerAgent(planner);
    await runtime.registerAgent(tester);
    await runtime.startAgent(planner.id);
    await runtime.startAgent(tester.id);
    await runtime.createGoal(goal);

    const plan = await runtime.planGoal(goal.id);
    const workflow = await runtime.createWorkflow(plan);
    const execution = await runtime.executeWorkflow(workflow.id);
    const memory: MemoryRecord = {
      id: "memory:1",
      kind: "execution",
      ownerId: planner.id,
      goalId: goal.id,
      content: "Workflow executed and benchmarked.",
      summary: "Execution complete",
      sourceIds: [execution.id],
      version: "1.0.0",
      portable: true
    };
    const reflection: ReflectionRecord = {
      id: "reflection:1",
      goalId: goal.id,
      executionReview: "Execution followed the deterministic workflow.",
      goalReview: "Goal was clear.",
      errorReview: [],
      improvementSuggestions: ["Add more task-level evidence."],
      benchmarkAnalysis: "Semantiq benchmark completed.",
      knowledgeExtracted: ["Agent runtime can execute simple workflows."],
      futureRecommendations: ["Add persistence adapter."],
      memoryUpdateIds: [memory.id]
    };
    const learning: LearningRecord = {
      id: "learning:1",
      goalId: goal.id,
      humanFeedbackIds: [],
      executionFeedbackIds: [execution.id],
      benchmarkIds: execution.benchmarkId ? [execution.benchmarkId] : [],
      workflowOptimization: ["Keep approval gates explicit."],
      knowledgeExtracted: reflection.knowledgeExtracted,
      recommendationUpdates: ["Prefer tested agents."],
      explanation: "Learning derived from execution and reflection."
    };

    await runtime.storeMemory(memory);
    await runtime.reflect(reflection);
    await runtime.learn(learning);

    expect(plan.tasks.length).toBe(3);
    expect(runtime.discoverAgents("testing")[0]?.id).toBe(tester.id);
    expect(execution.status).toBe("completed");
    expect(runtime.queryMemory(goal.id)[0]?.summary).toBe("Execution complete");
    expect(runtime.metrics().registeredAgents).toBe(2);
    expect(runtime.events().map((event) => event.type)).toContain("ExecutionBenchmarked");
  });

  it("requires human approval for privileged workflow nodes and tool calls", async () => {
    const runtime = new LocalAgentRuntime();
    const security = createAgent("agent:security", "security", ["security", "planning"], ["terminal"]);
    const goal = createGoal("goal:approval", "Publish external communication", "workspace:1", ["Publish external communication"]);
    await runtime.registerAgent(security);
    await runtime.createGoal(goal);

    const plan = await runtime.planGoal(goal.id);
    const workflow = await runtime.createWorkflow(plan);
    const execution = await runtime.executeWorkflow(workflow.id);
    const toolRequest: ToolRequest = {
      id: "tool:1",
      kind: "terminal",
      agentId: security.id,
      goalId: goal.id,
      input: { command: "publish" },
      permissionIds: [],
      approvalRequired: true
    };
    const toolResult = await runtime.runTool(toolRequest);

    expect(plan.tasks[0]?.approvalRequired).toBe(true);
    expect(execution.status).toBe("waiting-for-approval");
    expect(toolResult.status).toBe("waiting-for-approval");
  });

  it("supports observable multi-agent communication", async () => {
    const runtime = new LocalAgentRuntime();
    const planner = createAgent("agent:p", "planner", ["planning"], []);
    const researcher = createAgent("agent:r", "research", ["research"], []);
    const message: AgentMessage = {
      id: "message:1",
      fromAgentId: planner.id,
      toAgentId: researcher.id,
      type: "delegation",
      content: "Please collect evidence.",
      contextIds: ["goal:1"],
      createdAt: new Date().toISOString()
    };

    await runtime.registerAgent(planner);
    await runtime.registerAgent(researcher);
    await runtime.sendMessage(message);

    expect(runtime.metrics().registeredAgents).toBe(2);
  });
});
