import type { IdentityId, PermissionId, WorkspaceId } from "./identifiers.js";

export type PermissionAction =
  | "read"
  | "write"
  | "update"
  | "delete"
  | "execute"
  | "share"
  | "publish"
  | "export"
  | "review"
  | "admin";

export type PermissionScope =
  | "workspace"
  | "community"
  | "agent"
  | "workflow"
  | "repository"
  | "marketplace"
  | "federation"
  | "global";

export interface PermissionGrant {
  readonly id: PermissionId;
  readonly subjectId: IdentityId;
  readonly action: PermissionAction;
  readonly resourceId: string;
  readonly scope: PermissionScope;
  readonly role?: string;
  readonly attributes: Readonly<Record<string, unknown>>;
  readonly expiresAt?: string;
}

export interface AuthorizationContext {
  readonly actorId: IdentityId;
  readonly workspaceId?: WorkspaceId;
  readonly roles: readonly string[];
  readonly capabilities: readonly string[];
  readonly attributes: Readonly<Record<string, unknown>>;
  readonly at: string;
}

export interface AuthorizationRequest {
  readonly subjectId: IdentityId;
  readonly action: PermissionAction;
  readonly resourceId: string;
  readonly context: AuthorizationContext;
}

export interface AuthorizationDecision {
  readonly allowed: boolean;
  readonly reason: string;
  readonly matchedGrantIds: readonly PermissionId[];
  readonly missingCapabilities: readonly string[];
}

export const evaluatePermissions = (
  request: AuthorizationRequest,
  grants: readonly PermissionGrant[]
): AuthorizationDecision => {
  const now = Date.parse(request.context.at);
  const matching = grants.filter((grant) => {
    const notExpired = grant.expiresAt ? Date.parse(grant.expiresAt) > now : true;
    const roleMatches = grant.role ? request.context.roles.includes(grant.role) : true;
    return (
      notExpired &&
      roleMatches &&
      grant.subjectId === request.subjectId &&
      grant.resourceId === request.resourceId &&
      (grant.action === request.action || grant.action === "admin")
    );
  });

  if (matching.length === 0) {
    return {
      allowed: false,
      reason: "No matching deterministic permission grant",
      matchedGrantIds: [],
      missingCapabilities: [request.action]
    };
  }

  return {
    allowed: true,
    reason: "Permission granted by deterministic policy evaluation",
    matchedGrantIds: matching.map((grant) => grant.id),
    missingCapabilities: []
  };
};
