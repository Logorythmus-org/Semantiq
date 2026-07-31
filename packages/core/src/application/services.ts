import { createDomainEvent, type Correlation, type EventBus } from "../domain/events.js";
import { createRelation, type GraphRelationType } from "../domain/graph.js";
import { createKnowledgeObjectAggregate, createQuestionAggregate } from "../domain/factories.js";
import { evaluatePermissions, type AuthorizationDecision, type AuthorizationRequest, type PermissionGrant } from "../domain/permissions.js";
import type { CoreUnitOfWork } from "../contracts/repositories.js";

export class IdentityApplicationService {
  constructor(private readonly unitOfWork: CoreUnitOfWork, private readonly eventBus: EventBus) {}

  async registerIdentity(identityId: string, displayName: string, handle: string, correlation: Correlation): Promise<void> {
    const { createIdentityAggregate } = await import("../domain/factories.js");
    const identity = createIdentityAggregate(identityId, displayName, handle);
    await this.unitOfWork.identities.save(identity);
    await this.publish("IdentityCreated", { identityId }, correlation, identityId);
  }

  private async publish(type: "IdentityCreated", payload: unknown, correlation: Correlation, actorId?: string): Promise<void> {
    const event = createDomainEvent(type, payload, correlation, actorId);
    await this.unitOfWork.events.append(event);
    await this.eventBus.publish(event);
  }
}

export class WorkspaceApplicationService {
  constructor(private readonly unitOfWork: CoreUnitOfWork, private readonly eventBus: EventBus) {}

  async createWorkspace(workspaceId: string, ownerId: string, name: string, correlation: Correlation): Promise<void> {
    const { createWorkspaceAggregate } = await import("../domain/factories.js");
    const workspace = createWorkspaceAggregate(workspaceId, ownerId, name);
    await this.unitOfWork.workspaces.save(workspace);
    await this.publish("WorkspaceCreated", { workspaceId, ownerId }, correlation, ownerId);
  }

  private async publish(type: "WorkspaceCreated", payload: unknown, correlation: Correlation, actorId?: string): Promise<void> {
    const event = createDomainEvent(type, payload, correlation, actorId);
    await this.unitOfWork.events.append(event);
    await this.eventBus.publish(event);
  }
}

export class KnowledgeApplicationService {
  constructor(private readonly unitOfWork: CoreUnitOfWork, private readonly eventBus: EventBus) {}

  async createKnowledgeObject(
    knowledgeId: string,
    workspaceId: string,
    ownerId: string,
    kind: string,
    title: string,
    correlation: Correlation
  ): Promise<void> {
    const object = createKnowledgeObjectAggregate(knowledgeId, workspaceId, ownerId, kind, title);
    await this.unitOfWork.knowledge.save(object);
    await this.unitOfWork.graph.saveNode({
      id: object.id,
      labels: [object.kind],
      properties: { title: object.title, workspaceId: object.workspaceId },
      version: object.version,
      createdAt: object.createdAt
    });
    await this.publish("KnowledgeCreated", { knowledgeId, workspaceId }, correlation, ownerId);
  }

  private async publish(
    type: "KnowledgeCreated" | "KnowledgeUpdated",
    payload: unknown,
    correlation: Correlation,
    actorId?: string
  ): Promise<void> {
    const event = createDomainEvent(type, payload, correlation, actorId);
    await this.unitOfWork.events.append(event);
    await this.eventBus.publish(event);
  }
}

export class QuestionApplicationService {
  constructor(private readonly unitOfWork: CoreUnitOfWork, private readonly eventBus: EventBus) {}

  async createQuestion(questionId: string, knowledgeId: string, workspaceId: string, ownerId: string, text: string, correlation: Correlation): Promise<void> {
    const question = createQuestionAggregate(questionId, knowledgeId, workspaceId, ownerId, text);
    const knowledge = createKnowledgeObjectAggregate(knowledgeId, workspaceId, ownerId, "question", text);
    await this.unitOfWork.knowledge.save(knowledge);
    await this.unitOfWork.questions.save(question);
    await this.unitOfWork.graph.saveNode({
      id: knowledge.id,
      labels: ["question"],
      properties: { questionId, text },
      version: knowledge.version,
      createdAt: knowledge.createdAt
    });
    await this.publish("QuestionCreated", { questionId, knowledgeId }, correlation, ownerId);
  }

  async archiveQuestion(questionId: string, correlation: Correlation, actorId: string): Promise<void> {
    const question = await this.unitOfWork.questions.get(questionId);
    if (!question) {
      throw new Error(`Question not found: ${questionId}`);
    }
    const archived = { ...question, status: "archived" as const, archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await this.unitOfWork.questions.save(archived);
    await this.publish("QuestionArchived", { questionId }, correlation, actorId);
  }

  private async publish(
    type: "QuestionCreated" | "QuestionUpdated" | "QuestionArchived",
    payload: unknown,
    correlation: Correlation,
    actorId?: string
  ): Promise<void> {
    const event = createDomainEvent(type, payload, correlation, actorId);
    await this.unitOfWork.events.append(event);
    await this.eventBus.publish(event);
  }
}

export class GraphApplicationService {
  constructor(private readonly unitOfWork: CoreUnitOfWork, private readonly eventBus: EventBus) {}

  async relate(
    relationId: string,
    from: string,
    to: string,
    type: GraphRelationType,
    actorId: string,
    correlation: Correlation
  ): Promise<void> {
    const edge = createRelation(relationId, from, to, type, actorId);
    await this.unitOfWork.graph.saveEdge(edge);
    const relationEvent = createDomainEvent("RelationCreated", { relationId, from, to, type }, correlation, actorId);
    const graphEvent = createDomainEvent("GraphUpdated", { relationId }, correlation, actorId);
    await this.unitOfWork.events.append(relationEvent);
    await this.unitOfWork.events.append(graphEvent);
    await this.eventBus.publish(relationEvent);
    await this.eventBus.publish(graphEvent);
  }
}

export class PermissionApplicationService {
  constructor(private readonly unitOfWork: CoreUnitOfWork, private readonly eventBus: EventBus) {}

  async grant(grant: PermissionGrant, correlation: Correlation, actorId: string): Promise<void> {
    await this.unitOfWork.permissions.save(grant);
    const event = createDomainEvent("PermissionGranted", { permissionId: grant.id }, correlation, actorId);
    await this.unitOfWork.events.append(event);
    await this.eventBus.publish(event);
  }

  async revoke(permissionId: string, correlation: Correlation, actorId: string): Promise<void> {
    await this.unitOfWork.permissions.delete(permissionId);
    const event = createDomainEvent("PermissionRevoked", { permissionId }, correlation, actorId);
    await this.unitOfWork.events.append(event);
    await this.eventBus.publish(event);
  }

  async authorize(request: AuthorizationRequest): Promise<AuthorizationDecision> {
    const grants = await this.unitOfWork.permissions.list(request.subjectId, request.resourceId);
    return evaluatePermissions(request, grants);
  }
}
