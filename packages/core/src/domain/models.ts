import type { GraphEdge } from "./graph.js";
import type { IdentityId, KnowledgeId, ProjectId, QuestionId, WorkspaceId } from "./identifiers.js";
import type { PermissionGrant } from "./permissions.js";

export type VerificationStatus = "unverified" | "verified" | "revoked";
export type QuestionStatus = "draft" | "open" | "researching" | "answered" | "archived";

export interface AuditEntry {
  readonly id: string;
  readonly action: string;
  readonly actorId: IdentityId;
  readonly resourceId: string;
  readonly occurredAt: string;
  readonly hash: string;
  readonly previousHash?: string;
}

export interface IdentityAggregate {
  readonly id: IdentityId;
  readonly profile: {
    readonly displayName: string;
    readonly handle: string;
    readonly metadata: Readonly<Record<string, unknown>>;
  };
  readonly credentialIds: readonly string[];
  readonly workspaceMembershipIds: readonly WorkspaceId[];
  readonly organizationIds: readonly string[];
  readonly roles: readonly string[];
  readonly permissions: readonly PermissionGrant[];
  readonly capabilities: readonly string[];
  readonly trustScore: number;
  readonly walletLinkId?: string;
  readonly federationIdentityIds: readonly string[];
  readonly verificationStatus: VerificationStatus;
  readonly audit: readonly AuditEntry[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkspaceAggregate {
  readonly id: WorkspaceId;
  readonly ownerId: IdentityId;
  readonly name: string;
  readonly projectIds: readonly ProjectId[];
  readonly collectionIds: readonly string[];
  readonly logicalFolderIds: readonly string[];
  readonly knowledgeObjectIds: readonly KnowledgeId[];
  readonly agentIds: readonly string[];
  readonly settings: Readonly<Record<string, unknown>>;
  readonly templateIds: readonly string[];
  readonly historyIds: readonly string[];
  readonly collaborators: readonly IdentityId[];
  readonly semantic: true;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface KnowledgeObjectAggregate {
  readonly id: KnowledgeId;
  readonly workspaceId: WorkspaceId;
  readonly ownerId: IdentityId;
  readonly kind: string;
  readonly title: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly relations: readonly GraphEdge[];
  readonly version: string;
  readonly tags: readonly string[];
  readonly historyIds: readonly string[];
  readonly semantiqReportIds: readonly string[];
  readonly permissions: readonly PermissionGrant[];
  readonly commentIds: readonly string[];
  readonly attachmentIds: readonly string[];
  readonly timelineIds: readonly string[];
  readonly graphLinkIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface QuestionAggregate {
  readonly id: QuestionId;
  readonly knowledgeObjectId: KnowledgeId;
  readonly workspaceId: WorkspaceId;
  readonly ownerId: IdentityId;
  readonly text: string;
  readonly profile: {
    readonly intent: string;
    readonly disciplines: readonly string[];
    readonly assumptions: readonly string[];
    readonly uncertainty: number;
  };
  readonly relationIds: readonly string[];
  readonly status: QuestionStatus;
  readonly confidence: number;
  readonly benchmarkIds: readonly string[];
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly version: string;
  readonly historyIds: readonly string[];
  readonly archivedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
