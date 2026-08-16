export type * from "./contracts.js";
export {
  IdentityApplicationService,
  MemoryIdentityRepository,
  createIdentityAggregate,
  type IdentityAggregate,
  type IdentityRepository,
  type IdentityId,
  type VerificationStatus
} from "../../core/src/index.js";

import type {
  AuditLog,
  AuditRecord,
  AuthorizationDecision,
  AuthorizationEngine,
  AuthorizationRequest,
  PermissionEngine,
  PermissionGrant,
  PolicyDefinition,
  PolicyEngine
} from "./contracts.js";

export class LocalPermissionEngine implements PermissionEngine {
  private readonly permissions = new Map<string, PermissionGrant>();

  async grant(permission: PermissionGrant): Promise<void> {
    this.permissions.set(permission.id, permission);
  }

  async revoke(permissionId: string): Promise<void> {
    this.permissions.delete(permissionId);
  }

  async list(subjectId: string, resourceId?: string): Promise<readonly PermissionGrant[]> {
    return [...this.permissions.values()].filter(
      (permission) => permission.subjectId === subjectId && (!resourceId || permission.resourceId === resourceId)
    );
  }
}

export class LocalPolicyEngine implements PolicyEngine {
  private readonly policies = new Map<string, PolicyDefinition>();

  async register(policy: PolicyDefinition): Promise<void> {
    this.policies.set(policy.id, policy);
  }

  async evaluate(request: AuthorizationRequest): Promise<AuthorizationDecision> {
    const matched = [...this.policies.values()].filter((policy) => {
      const action = policy.conditions["action"];
      return !action || action === request.action;
    });
    const deny = matched.find((policy) => policy.effect === "deny");
    if (deny) {
      return {
        allowed: false,
        reason: `Denied by policy ${deny.id}`,
        matchedPolicies: matched.map((policy) => policy.id),
        missingCapabilities: [],
        riskSignals: []
      };
    }
    return {
      allowed: matched.some((policy) => policy.effect === "allow"),
      reason: matched.length ? "Evaluated by matching policies" : "No matching allow policy",
      matchedPolicies: matched.map((policy) => policy.id),
      missingCapabilities: [],
      riskSignals: []
    };
  }
}

export class LocalAuthorizationEngine implements AuthorizationEngine {
  constructor(
    private readonly permissions: PermissionEngine = new LocalPermissionEngine(),
    private readonly policies: PolicyEngine = new LocalPolicyEngine()
  ) {}

  async authorize(request: AuthorizationRequest): Promise<AuthorizationDecision> {
    const policyDecision = await this.policies.evaluate(request);
    if (policyDecision.allowed || policyDecision.matchedPolicies.length > 0) {
      return policyDecision;
    }

    const grants = await this.permissions.list(request.subjectId, request.resourceId);
    const grant = grants.find((permission) => permission.action === request.action || permission.action === "admin");
    return {
      allowed: Boolean(grant),
      reason: grant ? `Allowed by permission ${grant.id}` : "No matching permission grant",
      matchedPolicies: [],
      missingCapabilities: grant ? [] : [request.action],
      riskSignals: []
    };
  }
}

export class LocalAuditLog implements AuditLog {
  private readonly records: AuditRecord[] = [];

  async append(record: AuditRecord): Promise<void> {
    this.records.push(Object.freeze(record));
  }

  async list(resourceId?: string): Promise<readonly AuditRecord[]> {
    return this.records.filter((record) => !resourceId || record.resourceId === resourceId);
  }
}
