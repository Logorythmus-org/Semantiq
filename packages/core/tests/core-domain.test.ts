import { describe, expect, it } from "vitest";
import {
  GraphApplicationService,
  IdentityApplicationService,
  KnowledgeApplicationService,
  MemoryEventBus,
  PermissionApplicationService,
  QuestionApplicationService,
  WorkspaceApplicationService,
  createMemoryUnitOfWork,
  validateIdentity
} from "../src/index.js";
import type { PermissionGrant } from "../src/index.js";

const correlation = { correlationId: "test-correlation" };

describe("core domain implementation", () => {
  it("creates identity and workspace aggregates through application services", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const eventBus = new MemoryEventBus();
    const identityService = new IdentityApplicationService(unitOfWork, eventBus);
    const workspaceService = new WorkspaceApplicationService(unitOfWork, eventBus);

    await identityService.registerIdentity("identity:1", "Kaveh", "kaveh", correlation);
    await workspaceService.createWorkspace("workspace:1", "identity:1", "Core Workspace", correlation);

    const identity = await unitOfWork.identities.get("identity:1");
    const workspace = await unitOfWork.workspaces.get("workspace:1");

    expect(identity?.profile.displayName).toBe("Kaveh");
    expect(identity ? validateIdentity(identity).valid : false).toBe(true);
    expect(workspace?.semantic).toBe(true);
  });

  it("creates reusable knowledge objects and questions as graph nodes", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const eventBus = new MemoryEventBus();
    const knowledgeService = new KnowledgeApplicationService(unitOfWork, eventBus);
    const questionService = new QuestionApplicationService(unitOfWork, eventBus);

    await knowledgeService.createKnowledgeObject("knowledge:1", "workspace:1", "identity:1", "note", "First Note", correlation);
    await questionService.createQuestion("question:1", "knowledge:question:1", "workspace:1", "identity:1", "What is the core domain?", correlation);

    expect(await unitOfWork.knowledge.get("knowledge:1")).toBeDefined();
    expect(await unitOfWork.questions.get("question:1")).toBeDefined();
    expect(await unitOfWork.graph.getNode("knowledge:question:1")).toBeDefined();
  });

  it("relates graph nodes through storage-independent graph repository", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const eventBus = new MemoryEventBus();
    const knowledgeService = new KnowledgeApplicationService(unitOfWork, eventBus);
    const graphService = new GraphApplicationService(unitOfWork, eventBus);

    await knowledgeService.createKnowledgeObject("knowledge:a", "workspace:1", "identity:1", "question", "A", correlation);
    await knowledgeService.createKnowledgeObject("knowledge:b", "workspace:1", "identity:1", "answer", "B", correlation);
    await graphService.relate("relation:1", "knowledge:a", "knowledge:b", "answers", "identity:1", correlation);

    const traversal = await unitOfWork.graph.traverse({ startNodeId: "knowledge:a", maxDepth: 1 });
    expect(traversal.nodeIds).toContain("knowledge:b");
    expect(traversal.edgeIds).toContain("relation:1");
  });

  it("evaluates permissions deterministically and records events", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const eventBus = new MemoryEventBus();
    const permissions = new PermissionApplicationService(unitOfWork, eventBus);
    const grant: PermissionGrant = {
      id: "permission:1",
      subjectId: "identity:1",
      action: "read",
      resourceId: "workspace:1",
      scope: "workspace",
      attributes: {}
    };

    await permissions.grant(grant, correlation, "identity:owner");
    const decision = await permissions.authorize({
      subjectId: "identity:1",
      action: "read",
      resourceId: "workspace:1",
      context: {
        actorId: "identity:1",
        roles: [],
        capabilities: [],
        attributes: {},
        at: new Date().toISOString()
      }
    });

    expect(decision.allowed).toBe(true);
    expect((await unitOfWork.events.list()).map((event) => event.type)).toContain("PermissionGranted");
  });
});
