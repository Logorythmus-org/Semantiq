import { describe, expect, it } from "vitest";
import { LocalMvpRuntime, mvpScreens } from "../src/index.js";

describe("production MVP integration journey", () => {
  it("runs the required local-first MVP loop end to end", async () => {
    const runtime = new LocalMvpRuntime();
    const result = await runtime.runMvpJourney({
      identityId: "identity:mvp",
      displayName: "MVP User",
      workspaceId: "workspace:mvp",
      workspaceName: "MVP Alpha Workspace",
      questionId: "question:mvp",
      rawQuestion: "How can evidence improve learning"
    });

    expect(result.identityId).toBe("identity:mvp");
    expect(result.workspaceId).toBe("workspace:mvp");
    expect(result.improvedQuestion.endsWith("?")).toBe(true);
    expect(result.semantiqReportId).toContain("semantiq-report");
    expect(result.graphNodeId).toBe("node:question:mvp");
    expect(result.researchProjectId).toBe("research:mvp");
    expect(result.evidenceId).toBe("evidence:mvp");
    expect(result.goalId).toBe("goal:mvp");
    expect(result.workflowId).toContain("workflow");
    expect(result.communityId).toBe("community:mvp");
    expect(result.dashboard.workflowRuns).toBe(1);
    expect(result.exportPackage.formatVersion).toBe("mvp-alpha-1");
    expect(result.exportPackage.markdownSummary).toContain("MVP Alpha Workspace");
  });

  it("publishes all required MVP events as versioned observable events", async () => {
    const runtime = new LocalMvpRuntime();
    const result = await runtime.runMvpJourney({
      identityId: "identity:event",
      displayName: "Event User",
      workspaceId: "workspace:event",
      workspaceName: "Event Workspace",
      questionId: "question:event",
      rawQuestion: "What makes a local-first knowledge loop useful"
    });
    const eventTypes = result.events.map((event) => event.type);

    for (const required of [
      "UserCreated",
      "WorkspaceCreated",
      "QuestionCreated",
      "QuestionImproved",
      "SemantiqCompleted",
      "GraphUpdated",
      "ResearchProjectCreated",
      "EvidenceAdded",
      "CommunityCreated",
      "MemberJoined",
      "GoalCreated",
      "WorkflowStarted",
      "WorkflowCompleted",
      "AssetPublished",
      "DashboardUpdated"
    ] as const) {
      expect(eventTypes).toContain(required);
    }
    expect(result.events.every((event) => event.version === 1)).toBe(true);
  });

  it("declares functional MVP screens and health endpoints", () => {
    const runtime = new LocalMvpRuntime();
    const health = runtime.serviceHealth();

    expect(mvpScreens).toHaveLength(15);
    expect(health.map((item) => item.service)).toContain("dashboard");
    expect(health.every((item) => item.path === "/health")).toBe(true);
  });
});
