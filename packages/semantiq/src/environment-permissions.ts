/**
 * Environment and Permission Observation Model for SemantIQ Benchmarks (Prompt 8.4).
 * Models environment resource classes, permission states, scopes, drift detection, and secret redaction.
 */

export type ResourceClass =
  | "network"
  | "file_system"
  | "shell"
  | "browser"
  | "database"
  | "email"
  | "external_api"
  | "secrets"
  | "memory"
  | "device"
  | "process"
  | "package_manager"
  | "repository"
  | "human_approval";

export type PermissionState =
  | "unavailable"
  | "denied"
  | "read_only"
  | "write"
  | "execute"
  | "scoped"
  | "temporary"
  | "approval_required"
  | "conditionally_allowed"
  | "revoked";

export interface ResourceInstance {
  readonly id: string;
  readonly resourceClass: ResourceClass;
  readonly pathOrEndpoint: string;
  readonly isDeclaredInSpec: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface PermissionScope {
  readonly allowedPathsOrUrls: readonly string[];
  readonly maxSizeBytes?: number;
  readonly allowedCommands?: readonly string[];
  readonly timeLimitMs?: number;
}

export interface PermissionGrant {
  readonly id: string;
  readonly resourceId: string;
  readonly state: PermissionState;
  readonly scope: PermissionScope;
  readonly grantedAt: string;
  readonly expiresAt?: string;
  readonly requiresHumanApproval: boolean;
}

export interface PermissionDenial {
  readonly id: string;
  readonly resourceId: string;
  readonly requestedAction: string;
  readonly reason: string;
  readonly deniedAt: string;
}

export interface ApprovalCheckpoint {
  readonly id: string;
  readonly actionId: string;
  readonly requestedBy: string;
  readonly approvedBy?: string;
  readonly status: "pending" | "approved" | "rejected";
  readonly timestamp: string;
}

export interface PermissionExpiry {
  readonly grantId: string;
  readonly expiredAt: string;
  readonly isAutoRevoked: boolean;
}

export interface PermissionRevocation {
  readonly grantId: string;
  readonly revokedAt: string;
  readonly revokedBy: string;
  readonly reason: string;
}

export interface ContainmentBoundary {
  readonly id: string;
  readonly isSandboxed: boolean;
  readonly allowedDomainPatterns: readonly string[];
  readonly rootDirectory: string;
  readonly maxProcessMemoryMb: number;
}

export interface EnvironmentSnapshot {
  readonly snapshotId: string;
  readonly timestamp: string;
  readonly resources: readonly ResourceInstance[];
  readonly grants: readonly PermissionGrant[];
  readonly boundary: ContainmentBoundary;
}

export interface EnvironmentManifest {
  readonly manifestId: string;
  readonly version: string;
  readonly targetOS: string;
  readonly declaredResources: readonly ResourceInstance[];
  readonly initialGrants: readonly PermissionGrant[];
  readonly boundary: ContainmentBoundary;
}

export interface EnvironmentChangeRecord {
  readonly changeId: string;
  readonly timestamp: string;
  readonly previousSnapshotId: string;
  readonly currentSnapshotId: string;
  readonly addedResources: readonly string[];
  readonly removedResources: readonly string[];
  readonly modifiedGrants: readonly string[];
  readonly isDriftDetected: boolean;
}

/**
 * Secret Redaction Utility.
 * Replaces sensitive values, keys, and tokens with redacted placeholder strings.
 */
export function redactSecrets(input: string, secretsToRedact: readonly string[] = []): string {
  let output = input;
  // Redact explicit secret strings
  for (const secret of secretsToRedact) {
    if (secret && secret.length > 2) {
      output = output.replaceAll(secret, "[REDACTED_SECRET]");
    }
  }
  // Redact standard GitHub PATs and generic tokens
  output = output.replace(/(ghp_[A-Za-z0-9_]{36,40})/g, "[REDACTED_GITHUB_PAT]");
  output = output.replace(/(github_pat_[A-Za-z0-9_]{22,80})/g, "[REDACTED_GITHUB_PAT]");
  output = output.replace(/(Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*)/gi, "Bearer [REDACTED_TOKEN]");
  return output;
}

/**
 * Permission Evaluator.
 * Evaluates whether an action on a target resource is allowed under default-deny policy.
 */
export function evaluatePermission(
  grant: PermissionGrant | undefined,
  requestedAction: string,
  targetPathOrUrl: string,
  currentTimeIso: string
): { allowed: boolean; reason: string } {
  if (!grant) {
    return {
      allowed: false,
      reason: "DEFAULT DENY: No permission grant exists for target resource."
    };
  }

  if (grant.state === "denied" || grant.state === "revoked" || grant.state === "unavailable") {
    return { allowed: false, reason: `Permission state is '${grant.state}'.` };
  }

  if (grant.expiresAt && new Date(currentTimeIso) > new Date(grant.expiresAt)) {
    return { allowed: false, reason: "EXPIRED GRANT: Permission grant has expired." };
  }

  if (grant.state === "approval_required" && grant.requiresHumanApproval) {
    return {
      allowed: false,
      reason: "APPROVAL REQUIRED: Human operator approval checkpoint pending."
    };
  }

  if (
    grant.state === "read_only" &&
    (requestedAction === "write" || requestedAction === "execute" || requestedAction === "delete")
  ) {
    return {
      allowed: false,
      reason: `READ ONLY VIOLATION: Requested '${requestedAction}' on read-only resource.`
    };
  }

  // Scope path matching
  if (grant.scope.allowedPathsOrUrls.length > 0) {
    const isMatched = grant.scope.allowedPathsOrUrls.some((allowed) =>
      targetPathOrUrl.startsWith(allowed)
    );
    if (!isMatched) {
      return {
        allowed: false,
        reason: `SCOPE ESCAPE VIOLATION: Target '${targetPathOrUrl}' is outside allowed scope.`
      };
    }
  }

  return { allowed: true, reason: "Permission granted." };
}

/**
 * Permission Drift Detector.
 * Detects differences between initial manifest grants and runtime environment snapshot.
 */
export function detectPermissionDrift(
  manifest: EnvironmentManifest,
  snapshot: EnvironmentSnapshot
): EnvironmentChangeRecord {
  const manifestGrantMap = new Map(manifest.initialGrants.map((g) => [g.id, g]));
  const modifiedGrants: string[] = [];

  for (const snapGrant of snapshot.grants) {
    const orig = manifestGrantMap.get(snapGrant.id);
    if (!orig || orig.state !== snapGrant.state) {
      modifiedGrants.push(snapGrant.id);
    }
  }

  const manifestResSet = new Set(manifest.declaredResources.map((r) => r.id));
  const snapResSet = new Set(snapshot.resources.map((r) => r.id));

  const addedResources = snapshot.resources
    .filter((r) => !manifestResSet.has(r.id))
    .map((r) => r.id);
  const removedResources = manifest.declaredResources
    .filter((r) => !snapResSet.has(r.id))
    .map((r) => r.id);

  const isDriftDetected =
    modifiedGrants.length > 0 || addedResources.length > 0 || removedResources.length > 0;

  return {
    changeId: `change_${Date.now()}`,
    timestamp: new Date().toISOString(),
    previousSnapshotId: manifest.manifestId,
    currentSnapshotId: snapshot.snapshotId,
    addedResources,
    removedResources,
    modifiedGrants,
    isDriftDetected
  };
}
