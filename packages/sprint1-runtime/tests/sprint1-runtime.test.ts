import { describe, expect, it } from "vitest";
import {
  LocalSprint1Runtime,
  sprint1AuthAdapters,
  sprint1Screens,
  sprint1StorageAdapters
} from "../src/index.js";

describe("Sprint 1 local-first knowledge application runtime", () => {
  it("creates an identity, authenticates a device, and logs out cleanly", async () => {
    const runtime = new LocalSprint1Runtime();
    const identity = await runtime.createIdentity({
      id: "identity:sprint1",
      displayName: "Sprint One",
      language: "en",
      timezone: "Europe/Berlin"
    });
    const session = await runtime.loginLocal(identity.id, "device:laptop");
    const loggedOut = await runtime.logout(session.id);

    expect(identity.offline).toBe(true);
    expect(identity.semanticWalletId).toBe("wallet:identity:sprint1");
    expect(session.encrypted).toBe(true);
    expect(session.remembered).toBe(true);
    expect(loggedOut.active).toBe(false);
  });

  it("creates workspace, knowledge, questions, graph relations, dashboard, search, and exports", async () => {
    const runtime = new LocalSprint1Runtime();
    const identity = await runtime.createIdentity({
      id: "identity:flow",
      displayName: "Flow User"
    });
    const workspace = await runtime.createWorkspace(
      identity.id,
      "Local Knowledge Lab",
      "research-template"
    );
    const note = await runtime.createKnowledge({
      workspaceId: workspace.id,
      ownerId: identity.id,
      kind: "note",
      title: "Evidence note",
      body: "Local-first evidence improves question work.",
      tags: ["evidence", "local-first"]
    });
    const question = await runtime.createQuestion({
      workspaceId: workspace.id,
      ownerId: identity.id,
      text: "How does local evidence improve questions?",
      tags: ["evidence"]
    });

    await runtime.relateQuestionToKnowledge(question.id, note.id);
    await runtime.bookmarkQuestion(question.id);
    const duplicate = await runtime.duplicateQuestion(question.id);
    const converted = await runtime.convertQuestionToKnowledge(question.id, "research-object");
    const graph = runtime.graphViewer(workspace.id, question.id);
    const dashboard = runtime.dashboard(workspace.id);
    const search = runtime.search(workspace.id, "local evidence");
    const exported = runtime.exportWorkspace(workspace.id, "markdown");
    const performance = runtime.measurePerformance(workspace.id);

    expect(duplicate.text).toBe(question.text);
    expect(converted.kind).toBe("research-object");
    expect(graph.nodes.map((node) => node.id)).toContain(question.id);
    expect(graph.edges.length).toBeGreaterThanOrEqual(2);
    expect(dashboard.workspaceStatistics.knowledgeCount).toBe(2);
    expect(dashboard.workspaceStatistics.questionCount).toBe(2);
    expect(dashboard.graphSummary.edges).toBeGreaterThanOrEqual(2);
    expect(search.map((result) => result.type)).toContain("question");
    expect(search.map((result) => result.type)).toContain("knowledge");
    expect(exported.format).toBe("markdown");
    expect(exported.markdown).toContain("Local Knowledge Lab");
    expect(performance.workspaceLoadingMs).toBeGreaterThanOrEqual(0);
    expect(performance.searchMs).toBeGreaterThanOrEqual(0);
    expect(performance.exportMs).toBeGreaterThanOrEqual(0);
  });

  it("declares required events, contracts, screens, storage adapters, and auth adapters", async () => {
    const runtime = new LocalSprint1Runtime();
    const identity = await runtime.createIdentity({
      id: "identity:contracts",
      displayName: "Contracts User"
    });
    const workspace = await runtime.createWorkspace(identity.id, "Contract Workspace");
    const question = await runtime.createQuestion({
      workspaceId: workspace.id,
      ownerId: identity.id,
      text: "What should Sprint 1 expose?",
      tags: ["contracts"]
    });
    await runtime.updateQuestion(question.id, { text: "What APIs should Sprint 1 expose?" });
    runtime.search(workspace.id, "Sprint");
    runtime.exportWorkspace(workspace.id);

    const eventTypes = runtime.eventsLog().map((event) => event.type);
    expect(eventTypes).toEqual(
      expect.arrayContaining([
        "IdentityCreated",
        "WorkspaceCreated",
        "QuestionCreated",
        "QuestionUpdated",
        "GraphUpdated",
        "WorkspaceExported",
        "SearchExecuted"
      ])
    );
    expect(Object.values(runtime.apiContracts())).toEqual(
      expect.arrayContaining([
        "POST /workspaces",
        "PATCH /questions/{questionId}",
        "GET /workspaces/{workspaceId}/graph"
      ])
    );
    expect(sprint1Screens).toEqual(
      expect.arrayContaining([
        "Welcome",
        "Identity Setup",
        "Workspace Dashboard",
        "Question Editor",
        "Knowledge Editor",
        "Graph Viewer",
        "Search",
        "Settings",
        "Export"
      ])
    );
    expect(sprint1StorageAdapters.map((adapter) => adapter.kind)).toEqual(
      expect.arrayContaining(["memory", "json", "sqlite", "postgresql", "neo4j"])
    );
    expect(sprint1AuthAdapters.map((adapter) => adapter.kind)).toEqual(
      expect.arrayContaining([
        "local-login",
        "device-auth",
        "oauth",
        "federated-identity",
        "recovery"
      ])
    );
  });
});
