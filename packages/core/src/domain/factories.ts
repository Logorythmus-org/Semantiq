import type {
  IdentityAggregate,
  KnowledgeObjectAggregate,
  QuestionAggregate,
  WorkspaceAggregate
} from "./models.js";

export const createIdentityAggregate = (
  id: string,
  displayName: string,
  handle: string,
  metadata: Readonly<Record<string, unknown>> = {}
): IdentityAggregate => {
  const now = new Date().toISOString();
  return {
    id,
    profile: { displayName, handle, metadata },
    credentialIds: [],
    workspaceMembershipIds: [],
    organizationIds: [],
    roles: [],
    permissions: [],
    capabilities: [],
    trustScore: 0,
    federationIdentityIds: [],
    verificationStatus: "unverified",
    audit: [],
    createdAt: now,
    updatedAt: now
  };
};

export const createWorkspaceAggregate = (id: string, ownerId: string, name: string): WorkspaceAggregate => {
  const now = new Date().toISOString();
  return {
    id,
    ownerId,
    name,
    projectIds: [],
    collectionIds: [],
    logicalFolderIds: [],
    knowledgeObjectIds: [],
    agentIds: [],
    settings: {},
    templateIds: [],
    historyIds: [],
    collaborators: [ownerId],
    semantic: true,
    createdAt: now,
    updatedAt: now
  };
};

export const createKnowledgeObjectAggregate = (
  id: string,
  workspaceId: string,
  ownerId: string,
  kind: string,
  title: string,
  metadata: Readonly<Record<string, unknown>> = {}
): KnowledgeObjectAggregate => {
  const now = new Date().toISOString();
  return {
    id,
    workspaceId,
    ownerId,
    kind,
    title,
    metadata,
    relations: [],
    version: "1.0.0",
    tags: [],
    historyIds: [],
    semantiqReportIds: [],
    permissions: [],
    commentIds: [],
    attachmentIds: [],
    timelineIds: [],
    graphLinkIds: [],
    createdAt: now,
    updatedAt: now
  };
};

export const createQuestionAggregate = (
  id: string,
  knowledgeObjectId: string,
  workspaceId: string,
  ownerId: string,
  text: string
): QuestionAggregate => {
  const now = new Date().toISOString();
  return {
    id,
    knowledgeObjectId,
    workspaceId,
    ownerId,
    text,
    profile: {
      intent: "explore",
      disciplines: [],
      assumptions: [],
      uncertainty: 1
    },
    relationIds: [],
    status: "draft",
    confidence: 0,
    benchmarkIds: [],
    metadata: {},
    version: "1.0.0",
    historyIds: [],
    createdAt: now,
    updatedAt: now
  };
};
