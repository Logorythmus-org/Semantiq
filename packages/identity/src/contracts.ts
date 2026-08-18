export type IdentitySubjectKind =
  | "user"
  | "ai-agent"
  | "workspace"
  | "project"
  | "question"
  | "repository"
  | "knowledge-object"
  | "game"
  | "narrative"
  | "dataset"
  | "research"
  | "organization"
  | "community"
  | "wallet"
  | "plugin"
  | "workflow"
  | "benchmark";

export type Visibility =
  | "private"
  | "shared"
  | "team"
  | "organization"
  | "public"
  | "anonymous"
  | "temporary"
  | "encrypted";
export type VerificationStatus =
  | "unverified"
  | "self-verified"
  | "community-verified"
  | "provider-verified"
  | "organization-verified"
  | "revoked";
export type TrustLevel = "unknown" | "low" | "medium" | "high" | "verified";
export type PermissionAction =
  | "read"
  | "write"
  | "update"
  | "delete"
  | "execute"
  | "share"
  | "publish"
  | "export"
  | "clone"
  | "fork"
  | "merge"
  | "benchmark"
  | "review"
  | "admin";

export interface UniversalIdentity {
  readonly uuid: string;
  readonly semanticUri: string;
  readonly kind: IdentitySubjectKind;
  readonly version: string;
  readonly ownerId?: string;
  readonly visibility: Visibility;
  readonly trustLevel: TrustLevel;
  readonly verificationStatus: VerificationStatus;
  readonly createdAt: string;
  readonly auditHistory: readonly string[];
  readonly permissions: readonly PermissionGrant[];
  readonly relationships: readonly string[];
}

export interface SemanticIdentity {
  readonly identity: UniversalIdentity;
  readonly ownership: readonly string[];
  readonly contributions: readonly string[];
  readonly expertise: readonly string[];
  readonly activity: readonly string[];
  readonly benchmarkHistory: readonly string[];
  readonly agentHistory: readonly string[];
  readonly reputation: readonly ReputationEntry[];
}

export interface AuthenticationRequest {
  readonly provider: string;
  readonly method:
    | "local"
    | "oauth2"
    | "oidc"
    | "passkey"
    | "hardware-key"
    | "biometric"
    | "decentralized";
  readonly subjectHint?: string;
  readonly context: AuthorizationContext;
}

export interface AuthenticationResult {
  readonly authenticated: boolean;
  readonly identityId?: string;
  readonly credentialId?: string;
  readonly reason: string;
}

export interface AuthenticationProvider {
  authenticate(request: AuthenticationRequest): Promise<AuthenticationResult>;
}

export interface AuthorizationContext {
  readonly actorId?: string;
  readonly workspaceId?: string;
  readonly projectId?: string;
  readonly sessionId?: string;
  readonly capabilities: readonly string[];
  readonly attributes: Readonly<Record<string, unknown>>;
  readonly correlationId: string;
}

export interface AuthorizationRequest {
  readonly subjectId: string;
  readonly action: PermissionAction;
  readonly resourceId: string;
  readonly context: AuthorizationContext;
}

export interface AuthorizationDecision {
  readonly allowed: boolean;
  readonly reason: string;
  readonly matchedPolicies: readonly string[];
  readonly missingCapabilities: readonly string[];
  readonly riskSignals: readonly string[];
}

export interface AuthorizationEngine {
  authorize(request: AuthorizationRequest): Promise<AuthorizationDecision>;
}

export interface PermissionGrant {
  readonly id: string;
  readonly subjectId: string;
  readonly action: PermissionAction;
  readonly resourceId: string;
  readonly scope: string;
  readonly source:
    | "direct"
    | "role"
    | "policy"
    | "ownership"
    | "delegation"
    | "organization"
    | "community"
    | "temporary";
  readonly expiresAt?: string;
}

export interface PermissionEngine {
  grant(permission: PermissionGrant): Promise<void>;
  revoke(permissionId: string): Promise<void>;
  list(subjectId: string, resourceId?: string): Promise<readonly PermissionGrant[]>;
}

export interface CapabilityDescriptor {
  readonly id: string;
  readonly resourceKind: IdentitySubjectKind;
  readonly action: PermissionAction | string;
  readonly enabled: boolean;
  readonly reason: string;
}

export interface CapabilityEngine {
  capabilities(
    resourceId: string,
    context: AuthorizationContext
  ): Promise<readonly CapabilityDescriptor[]>;
}

export interface PolicyDefinition {
  readonly id: string;
  readonly scope:
    | "workspace"
    | "project"
    | "organization"
    | "community"
    | "security"
    | "plugin"
    | "ai"
    | "enterprise";
  readonly version: string;
  readonly effect:
    | "allow"
    | "deny"
    | "require-approval"
    | "require-stronger-auth"
    | "require-audit"
    | "require-human-review";
  readonly conditions: Readonly<Record<string, unknown>>;
}

export interface PolicyEngine {
  evaluate(request: AuthorizationRequest): Promise<AuthorizationDecision>;
  register(policy: PolicyDefinition): Promise<void>;
}

export interface WalletRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly identityIds: readonly string[];
  readonly assetIds: readonly string[];
  readonly credentialIds: readonly string[];
  readonly encrypted: boolean;
  readonly updatedAt: string;
}

export interface WalletAsset {
  readonly id: string;
  readonly ownerId: string;
  readonly type:
    | "semantic-asset"
    | "credential"
    | "certificate"
    | "achievement"
    | "benchmark-score"
    | "learning-record"
    | "project-contribution"
    | "publication"
    | "license"
    | "signature"
    | "blockchain-reference";
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly issuedAt: string;
  readonly revokedAt?: string;
}

export interface OwnershipRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly assetId: string;
  readonly mode: "single" | "shared" | "organization" | "community" | "delegated" | "inherited";
  readonly share?: number;
  readonly transferable: boolean;
  readonly revokedAt?: string;
}

export interface OwnershipRegistry {
  assign(record: OwnershipRecord): Promise<void>;
  transfer(assetId: string, fromOwnerId: string, toOwnerId: string): Promise<OwnershipRecord>;
  revoke(recordId: string): Promise<void>;
}

export interface TrustSignal {
  readonly id: string;
  readonly type:
    | "identity"
    | "contribution"
    | "knowledge"
    | "benchmark"
    | "research"
    | "organization";
  readonly confidence: number;
  readonly evidence: readonly string[];
  readonly explanation: string;
}

export interface TrustEvaluator {
  evaluate(identityId: string): Promise<readonly TrustSignal[]>;
}

export interface ReputationEntry {
  readonly id: string;
  readonly identityId: string;
  readonly source:
    | "contribution"
    | "review"
    | "research"
    | "project"
    | "question"
    | "collaboration"
    | "benchmark"
    | "teaching"
    | "mentoring"
    | "community";
  readonly evidence: readonly string[];
  readonly explanation: string;
  readonly createdAt: string;
}

export interface AuditRecord {
  readonly id: string;
  readonly timestamp: string;
  readonly actorId?: string;
  readonly action: string;
  readonly resourceId?: string;
  readonly result: "allowed" | "denied" | "failed" | "succeeded";
  readonly correlationId: string;
  readonly hash: string;
  readonly previousHash?: string;
}

export interface AuditLog {
  append(record: AuditRecord): Promise<void>;
  list(resourceId?: string): Promise<readonly AuditRecord[]>;
}

export interface EncryptionProvider {
  encrypt(data: Uint8Array, scope: string): Promise<Uint8Array>;
  decrypt(data: Uint8Array, scope: string): Promise<Uint8Array>;
}

export interface ComplianceRequest {
  readonly id: string;
  readonly type: "export" | "delete" | "consent" | "portability" | "ai-act-review";
  readonly subjectId: string;
  readonly status: "requested" | "reviewing" | "approved" | "completed" | "denied";
}
