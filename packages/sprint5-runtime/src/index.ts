import { createHash } from "node:crypto";
import { LocalSprint4Runtime, type Sprint4JourneyResult } from "../../sprint4-runtime/src/index.js";

export type NodeType =
  | "Personal Node"
  | "Community Node"
  | "Organization Node"
  | "School Node"
  | "Research Node"
  | "Company Node"
  | "Local Test Node"
  | "Offline Exchange Node";
export type NodeState =
  | "Unregistered"
  | "Local Only"
  | "Pending Verification"
  | "Verified"
  | "Trusted"
  | "Restricted"
  | "Suspended"
  | "Revoked"
  | "Archived";
export type TrustState =
  | "Unknown"
  | "Invited"
  | "Pending"
  | "Verified"
  | "Trusted"
  | "Restricted"
  | "Distrusted"
  | "Revoked"
  | "Expired";
export type RemoteReferenceState =
  | "Unresolved"
  | "Available"
  | "Cached"
  | "Stale"
  | "Access Denied"
  | "Unavailable"
  | "Revoked"
  | "Deleted Remotely"
  | "Conflict Detected";
export type SyncState =
  | "Idle"
  | "Checking"
  | "Planning"
  | "Awaiting Approval"
  | "Synchronizing"
  | "Paused"
  | "Completed"
  | "Partially Completed"
  | "Conflict"
  | "Failed"
  | "Cancelled";
export type ConflictResolution =
  | "Keep local"
  | "Keep remote"
  | "Merge automatically"
  | "Merge manually"
  | "Fork"
  | "Preserve both"
  | "Convert to reference"
  | "Defer"
  | "Reject remote update";
export type FederationEventType =
  | "NodeIdentityCreated"
  | "NodeKeyRotated"
  | "NodeDiscovered"
  | "FederationInvitationCreated"
  | "FederationInvitationAccepted"
  | "TrustRequested"
  | "TrustGranted"
  | "TrustRestricted"
  | "TrustRevoked"
  | "FederationPolicyUpdated"
  | "FederationAgreementCreated"
  | "FederationAgreementRevoked"
  | "RemoteReferenceCreated"
  | "KnowledgeShareRequested"
  | "KnowledgeShared"
  | "ReplicationStarted"
  | "ReplicationCompleted"
  | "SynchronizationStarted"
  | "SynchronizationCompleted"
  | "SynchronizationFailed"
  | "ConflictDetected"
  | "ConflictResolved"
  | "FederatedSearchStarted"
  | "FederatedSearchCompleted"
  | "CollaborationSessionCreated"
  | "RemoteExecutionRequested"
  | "RemoteExecutionApproved"
  | "RemoteExecutionCompleted"
  | "RemoteObjectRevoked"
  | "NodeHealthChanged";

export interface NodeIdentity {
  readonly id: string;
  readonly name: string;
  readonly type: NodeType;
  readonly ownerIdentityId: string;
  readonly organizationIdentityId?: string;
  readonly publicKey: string;
  readonly keyVersion: number;
  readonly state: NodeState;
  readonly endpoints: readonly string[];
  readonly protocolVersions: readonly string[];
  readonly capabilities: readonly string[];
  readonly supportedObjectTypes: readonly string[];
  readonly authenticationMethods: readonly string[];
  readonly encryptionMethods: readonly string[];
  readonly policySummary: FederationPolicy;
  readonly jurisdiction: string;
  readonly locality: string;
  readonly online: boolean;
  readonly health: "healthy" | "degraded" | "offline" | "revoked";
  readonly lastVerifiedAt?: string;
  readonly auditHistory: readonly string[];
  readonly revoked: boolean;
}

export interface FederationPolicy {
  readonly discoverability: "private" | "invitation" | "directory";
  readonly searchVisibility: readonly string[];
  readonly objectSharing: readonly string[];
  readonly replication: readonly string[];
  readonly remoteEditing: false;
  readonly remoteComments: boolean;
  readonly remoteEvents: readonly string[];
  readonly remoteAgents: readonly string[];
  readonly dataRetentionDays: number;
  readonly personalData: "redact" | "deny" | "allow-with-approval";
  readonly sensitiveResearch: "deny" | "allow-with-review";
  readonly licensing: readonly string[];
  readonly exportRestrictions: readonly string[];
  readonly rateLimitPerMinute: number;
  readonly geographicRestrictions: readonly string[];
  readonly allowedNodeTypes: readonly NodeType[];
  readonly requiredTrustLevel: TrustState;
}

export interface ProtocolEnvelope<TPayload = unknown> {
  readonly messageId: string;
  readonly protocolVersion: "1.0.0";
  readonly messageType: string;
  readonly senderNodeId: string;
  readonly recipientNodeId: string;
  readonly timestamp: string;
  readonly expiration: string;
  readonly correlationId: string;
  readonly causationId: string;
  readonly nonce: string;
  readonly signature: {
    readonly algorithm: string;
    readonly keyVersion: number;
    readonly value: string;
  };
  readonly encryption: { readonly method: string; readonly required: boolean };
  readonly policyContext: string;
  readonly payloadSchemaVersion: string;
  readonly payload: TPayload;
  readonly trace: Readonly<Record<string, unknown>>;
}

export interface FederationInvitation {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetHint: string;
  readonly token: string;
  readonly mode:
    | "manual-endpoint"
    | "invitation-link"
    | "qr"
    | "lan"
    | "directory"
    | "offline-package"
    | "test-fixture";
  readonly expiresAt: string;
  readonly accepted: boolean;
  readonly auditId: string;
}

export interface TrustRelation {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly type: "research" | "community" | "organization" | "test" | "marketplace";
  readonly state: TrustState;
  readonly scope: readonly string[];
  readonly evidence: readonly string[];
  readonly confidence: number;
  readonly grantedCapabilities: readonly string[];
  readonly restrictions: readonly string[];
  readonly issuer: string;
  readonly createdAt: string;
  readonly expiresAt?: string;
  readonly reviewAt: string;
  readonly revocationHistory: readonly string[];
  readonly explanation: string;
}

export interface FederationAgreement {
  readonly id: string;
  readonly nodeIds: readonly string[];
  readonly effectivePolicies: FederationPolicy;
  readonly allowedCapabilities: readonly string[];
  readonly allowedObjectTypes: readonly string[];
  readonly allowedWorkspaces: readonly string[];
  readonly allowedProjects: readonly string[];
  readonly retentionTerms: string;
  readonly auditRequirements: readonly string[];
  readonly expiresAt: string;
  readonly reviewSchedule: string;
  readonly version: string;
  readonly signatures: readonly string[];
  readonly revocationTerms: string;
  readonly approved: boolean;
  readonly conflictsResolved: readonly string[];
}

export interface RemoteReference {
  readonly id: string;
  readonly remoteNodeId: string;
  readonly remoteObjectId: string;
  readonly objectType: string;
  readonly title: string;
  readonly version: string;
  readonly integrityHash: string;
  readonly visibility: string;
  readonly accessState: RemoteReferenceState;
  readonly license: string;
  readonly provenance: string;
  readonly lastSynchronizedAt?: string;
  readonly cacheStatus: "none" | "metadata" | "snapshot";
  readonly resolutionEndpoint: string;
  readonly revoked: boolean;
}

export interface SharingPlan {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly recipientNodeIds: readonly string[];
  readonly objectIds: readonly string[];
  readonly mode:
    | "Reference only"
    | "Metadata only"
    | "Read-only snapshot"
    | "Replicated copy"
    | "Collaborative object"
    | "Time-limited access"
    | "Organization-only"
    | "Node-specific"
    | "Public federation listing";
  readonly personalDataDetected: boolean;
  readonly privateMetadataDetected: boolean;
  readonly licenseImplications: readonly string[];
  readonly retentionPolicy: string;
  readonly revocationCapabilities: readonly string[];
  readonly synchronizationBehavior: string;
  readonly estimatedPackageSizeKb: number;
  readonly integrity: string;
  readonly approved: boolean;
}

export interface ReplicationRecord {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly destinationNodeId: string;
  readonly sourceObjectId: string;
  readonly localObjectOrReferenceId: string;
  readonly mode:
    | "One-time snapshot"
    | "Manual refresh"
    | "Scheduled pull"
    | "Scheduled push"
    | "Event-driven update"
    | "Bidirectional collaboration"
    | "Offline package transfer";
  readonly policyId: string;
  readonly version: string;
  readonly integrity: string;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly status: "started" | "completed" | "failed";
  readonly errors: readonly string[];
  readonly conflictStatus: "none" | "detected" | "resolved";
  readonly auditHistory: readonly string[];
}

export interface SyncJob {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly state: SyncState;
  readonly versionVector: Readonly<Record<string, number>>;
  readonly checkpoints: readonly string[];
  readonly selectiveFields: readonly string[];
  readonly lowConnectivity: boolean;
  readonly errors: readonly string[];
}

export interface ConflictRecord {
  readonly id: string;
  readonly objectId: string;
  readonly localVersion: string;
  readonly remoteVersion: string;
  readonly changedFields: readonly string[];
  readonly semanticDifferences: readonly string[];
  readonly graphDifferences: readonly string[];
  readonly timeline: readonly string[];
  readonly authors: readonly string[];
  readonly policies: readonly string[];
  readonly licenseImplications: readonly string[];
  readonly recommendedAction: ConflictResolution;
  readonly confidence: number;
  readonly resolvedBy?: ConflictResolution;
}

export interface FederatedSearchResult {
  readonly sourceNodeId: string;
  readonly trustStatus: TrustState;
  readonly objectId: string;
  readonly objectType: string;
  readonly title: string;
  readonly summary: string;
  readonly semantiqSummary: number;
  readonly license: string;
  readonly version: string;
  readonly availability: RemoteReferenceState;
  readonly freshness: string;
  readonly accessRequirements: readonly string[];
  readonly remoteLatencyMs: number;
  readonly provenance: string;
}

export interface CollaborationSession {
  readonly id: string;
  readonly nodeIds: readonly string[];
  readonly workspaceIds: readonly string[];
  readonly participants: readonly string[];
  readonly roles: Readonly<Record<string, string>>;
  readonly permissions: readonly string[];
  readonly sharedObjectIds: readonly string[];
  readonly startedAt: string;
  readonly expiresAt: string;
  readonly policies: readonly string[];
  readonly activityHistory: readonly string[];
  readonly revocationHistory: readonly string[];
}

export interface RemoteExecutionRequest {
  readonly id: string;
  readonly requestingNodeId: string;
  readonly executingNodeId: string;
  readonly capability:
    | "remote-semantiq"
    | "metadata-extraction"
    | "remote-search"
    | "remote-validation"
    | "workflow-simulation";
  readonly inputSchema: string;
  readonly outputSchema: string;
  readonly permissionScope: readonly string[];
  readonly dataClassification: "public" | "metadata" | "restricted";
  readonly resourceLimits: Readonly<Record<string, number>>;
  readonly timeoutMs: number;
  readonly costEstimatePlaceholder: string;
  readonly auditRequirement: string;
  readonly approvalRequired: true;
  readonly resultHandlingPolicy: string;
  readonly approved: boolean;
}

export interface FederatedSemantiqReport {
  readonly id: string;
  readonly evaluatingNodeId: string;
  readonly inputObjectVersion: string;
  readonly profile: string;
  readonly provider: string;
  readonly confidence: number;
  readonly timestamp: string;
  readonly integrityHash: string;
  readonly visibility: "private" | "shared" | "public";
  readonly limitations: readonly string[];
  readonly score: number;
}

export interface OfflineFederationPackage {
  readonly id: string;
  readonly invitation?: FederationInvitation;
  readonly nodeMetadata: readonly NodeIdentity[];
  readonly agreementDraft?: FederationAgreement;
  readonly knowledgeObjects: readonly RemoteReference[];
  readonly graphSnapshot: readonly string[];
  readonly eventBatch: readonly FederationEvent[];
  readonly syncCheckpoint: readonly string[];
  readonly integrityManifest: string;
  readonly signatures: readonly string[];
  readonly importInstructions: string;
}

export interface FederationEvent {
  readonly eventId: string;
  readonly type: FederationEventType;
  readonly eventVersion: number;
  readonly timestamp: string;
  readonly sourceNodeId: string;
  readonly targetNodeId?: string;
  readonly actorId: string;
  readonly correlationId: string;
  readonly causationId: string;
  readonly policyContext: string;
  readonly payloadSchema: string;
  readonly signature: Readonly<Record<string, unknown>>;
  readonly audit: Readonly<Record<string, unknown>>;
  readonly payload: unknown;
}

export interface NetworkHealth {
  readonly connectedNodes: number;
  readonly pendingInvitations: number;
  readonly trustStates: Readonly<Record<string, TrustState>>;
  readonly protocolCompatibility: readonly string[];
  readonly endpointHealth: readonly string[];
  readonly latencyMs: number;
  readonly synchronizationStatus: readonly SyncState[];
  readonly failedMessages: number;
  readonly conflictCount: number;
  readonly replicationVolume: number;
  readonly securityAlerts: readonly string[];
  readonly policyConflicts: readonly string[];
  readonly remoteAgentRequests: number;
  readonly federatedSearchMs: number;
}

export interface Sprint5JourneyResult {
  readonly sprint4: Sprint4JourneyResult;
  readonly nodeA: NodeIdentity;
  readonly nodeB: NodeIdentity;
  readonly invitation: FederationInvitation;
  readonly trust: TrustRelation;
  readonly agreement: FederationAgreement;
  readonly remoteReference: RemoteReference;
  readonly sharingPlan: SharingPlan;
  readonly replication: ReplicationRecord;
  readonly sync: SyncJob;
  readonly conflict: ConflictRecord;
  readonly searchResults: readonly FederatedSearchResult[];
  readonly collaboration: CollaborationSession;
  readonly remoteExecution: RemoteExecutionRequest;
  readonly semantiqReports: readonly FederatedSemantiqReport[];
  readonly offlinePackage: OfflineFederationPackage;
  readonly health: NetworkHealth;
  readonly events: readonly FederationEvent[];
}

const now = (): string => new Date().toISOString();
const id = (prefix: string): string =>
  `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
const sha = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

export const federationProtocolMessages = [
  "node.metadata",
  "protocol.negotiate",
  "capability.discovery",
  "auth.challenge",
  "trust.exchange",
  "policy.exchange",
  "knowledge.query",
  "object.request",
  "object.response",
  "replication.request",
  "replication.response",
  "event.subscription",
  "event.delivery",
  "sync.request",
  "sync.response",
  "conflict.report",
  "health.request",
  "health.response",
  "revocation.notice"
] as const;

export const federationAdminScreens = [
  "Federation Overview",
  "Node Identity Setup",
  "Known Nodes",
  "Node Discovery",
  "Invitation Creator",
  "Invitation Acceptance",
  "Trust Review",
  "Policy Negotiation",
  "Federation Agreement",
  "Shared Objects",
  "Remote Object Viewer",
  "Replication Planner",
  "Synchronization Center",
  "Conflict Resolution Center",
  "Federated Search",
  "Cross-Node Project View",
  "Remote Execution Approval",
  "Federated Semantiq Comparison",
  "Network Health Dashboard",
  "Federation Audit Timeline",
  "Revocation Center",
  "Offline Package Exchange"
] as const;

export const publicAlphaDeploymentProfile = {
  modes: [
    "single-machine multi-node test",
    "LAN federation",
    "two-node private internet federation",
    "Docker Compose alpha network",
    "offline package exchange",
    "CI federation test cluster"
  ],
  defaults: {
    openDiscovery: false,
    privateInvitations: true,
    tlsRequired: true,
    rateLimiting: true,
    backups: true,
    revocation: true
  }
} as const;

const defaultPolicy = (): FederationPolicy => ({
  discoverability: "invitation",
  searchVisibility: [
    "Questions",
    "Research projects",
    "Workflow templates",
    "Public Semantiq reports"
  ],
  objectSharing: ["Questions", "Research projects", "Evidence metadata", "Semantiq reports"],
  replication: ["Read-only snapshot", "Reference only"],
  remoteEditing: false,
  remoteComments: true,
  remoteEvents: [
    "RemoteQuestionPublished",
    "RemoteSemantiqReportAvailable",
    "RemoteNodeHealthChanged"
  ],
  remoteAgents: ["remote-semantiq", "remote-search", "remote-validation"],
  dataRetentionDays: 30,
  personalData: "redact",
  sensitiveResearch: "allow-with-review",
  licensing: ["MIT", "Research Use"],
  exportRestrictions: ["no-private-workspace-metadata"],
  rateLimitPerMinute: 60,
  geographicRestrictions: [],
  allowedNodeTypes: ["Personal Node", "Research Node", "Community Node", "Local Test Node"],
  requiredTrustLevel: "Verified"
});

export class LocalSprint5Runtime {
  private readonly sprint4 = new LocalSprint4Runtime();
  private readonly nodes = new Map<string, NodeIdentity>();
  private readonly invitations = new Map<string, FederationInvitation>();
  private readonly trusts = new Map<string, TrustRelation>();
  private readonly agreements = new Map<string, FederationAgreement>();
  private readonly references = new Map<string, RemoteReference>();
  private readonly replications = new Map<string, ReplicationRecord>();
  private readonly syncJobs = new Map<string, SyncJob>();
  private readonly conflicts = new Map<string, ConflictRecord>();
  private readonly collaborations = new Map<string, CollaborationSession>();
  private readonly remoteExecutions = new Map<string, RemoteExecutionRequest>();
  private readonly reports = new Map<string, FederatedSemantiqReport>();
  private readonly events: FederationEvent[] = [];
  private lastPlan: SharingPlan | undefined;

  async runCriticalFederationJourney(): Promise<Sprint5JourneyResult> {
    const sprint4 = await this.sprint4.runCriticalAssetLifecycle();
    const nodeA = await this.createNodeIdentity("identity:a", "node-a-personal", "Personal Node");
    const nodeB = await this.createNodeIdentity("identity:b", "node-b-research", "Research Node");
    const invitation = this.createInvitation(nodeA.id, "node-b-research", "invitation-link");
    const acceptedInvitation = this.acceptInvitation(nodeB.id, invitation.id);
    this.verifyNode(nodeA.id);
    this.verifyNode(nodeB.id);
    const trust = this.approveTrust(nodeA.id, nodeB.id, [
      "federated-search",
      "read-only-snapshot",
      "remote-semantiq"
    ]);
    const agreement = this.approveFederationAgreement(nodeA.id, nodeB.id, [
      "Question",
      "Research project",
      "Semantiq report"
    ]);
    const remoteReference = this.createRemoteReference(
      nodeB.id,
      nodeA.id,
      sprint4.asset.id,
      "Question",
      sprint4.asset.title
    );
    const sharingPlan = this.shareObject(
      nodeA.id,
      nodeB.id,
      sprint4.asset.id,
      "Read-only snapshot"
    );
    const replication = this.replicateObject(nodeA.id, nodeB.id, remoteReference.id);
    const collaboration = this.createCrossNodeProject(nodeA.id, nodeB.id, [remoteReference.id]);
    const sync = this.startSync(nodeA.id, nodeB.id, [remoteReference.id]);
    const conflict = this.detectConflict(remoteReference.id, "1.0.0-local", "1.0.0-remote");
    const resolved = this.resolveConflict(conflict.id, "Preserve both");
    const searchResults = this.searchFederation(nodeB.id, "workflow evidence");
    const remoteExecution = this.requestRemoteCapability(
      nodeB.id,
      nodeA.id,
      "remote-semantiq",
      remoteReference.id
    );
    this.approveRemoteExecution(remoteExecution.id);
    const semantiqReports = [
      this.executeRemoteCapability(remoteExecution.id),
      this.localEvaluateRemoteSnapshot(nodeB.id, remoteReference.id)
    ];
    this.revokeSharedObject(nodeA.id, remoteReference.id);
    const offlinePackage = this.createOfflinePackage(nodeA.id, nodeB.id);
    this.importOfflinePackage(nodeB.id, offlinePackage);
    const health = this.networkHealth();
    return {
      sprint4,
      nodeA: this.requireNode(nodeA.id),
      nodeB: this.requireNode(nodeB.id),
      invitation: acceptedInvitation,
      trust,
      agreement,
      remoteReference: this.requireReference(remoteReference.id),
      sharingPlan,
      replication,
      sync: this.requireSync(sync.id),
      conflict: resolved,
      searchResults,
      collaboration,
      remoteExecution: this.requireRemoteExecution(remoteExecution.id),
      semantiqReports,
      offlinePackage,
      health,
      events: this.events
    };
  }

  async createNodeIdentity(
    ownerIdentityId: string,
    name: string,
    type: NodeType
  ): Promise<NodeIdentity> {
    const node: NodeIdentity = {
      id: id("node"),
      name,
      type,
      ownerIdentityId,
      publicKey: `public-key:${name}`,
      keyVersion: 1,
      state: "Local Only",
      endpoints: [`https://${name}.local/federation`],
      protocolVersions: ["1.0.0"],
      capabilities: [
        "metadata",
        "federated-search",
        "remote-semantiq",
        "read-only-snapshot",
        "offline-package"
      ],
      supportedObjectTypes: [
        "Question",
        "Research project",
        "Evidence metadata",
        "Workflow template",
        "Semantiq report"
      ],
      authenticationMethods: ["signed-challenge"],
      encryptionMethods: ["tls", "payload-encryption-placeholder"],
      policySummary: defaultPolicy(),
      jurisdiction: "local-test",
      locality: "local",
      online: true,
      health: "healthy",
      auditHistory: [id("audit")],
      revoked: false
    };
    this.nodes.set(node.id, node);
    this.emit(
      "NodeIdentityCreated",
      node.id,
      undefined,
      ownerIdentityId,
      node.id,
      "node.identity",
      { nodeId: node.id }
    );
    return node;
  }

  rotateNodeKey(nodeId: string): NodeIdentity {
    const node = this.requireNode(nodeId);
    const updated = {
      ...node,
      keyVersion: node.keyVersion + 1,
      publicKey: `${node.publicKey}:rotated:${node.keyVersion + 1}`,
      auditHistory: [...node.auditHistory, id("audit")]
    };
    this.nodes.set(nodeId, updated);
    this.emit("NodeKeyRotated", nodeId, undefined, node.ownerIdentityId, nodeId, "node.key", {
      keyVersion: updated.keyVersion
    });
    return updated;
  }

  createEnvelope<TPayload>(
    senderNodeId: string,
    recipientNodeId: string,
    messageType: string,
    payload: TPayload
  ): ProtocolEnvelope<TPayload> {
    if (
      !federationProtocolMessages.includes(
        messageType as (typeof federationProtocolMessages)[number]
      )
    )
      throw new Error(`Unsupported message type: ${messageType}`);
    const sender = this.requireNode(senderNodeId);
    this.requireNode(recipientNodeId);
    return {
      messageId: id("message"),
      protocolVersion: "1.0.0",
      messageType,
      senderNodeId,
      recipientNodeId,
      timestamp: now(),
      expiration: new Date(Date.now() + 300000).toISOString(),
      correlationId: `corr:${senderNodeId}:${recipientNodeId}`,
      causationId: senderNodeId,
      nonce: id("nonce"),
      signature: {
        algorithm: "ed25519-placeholder",
        keyVersion: sender.keyVersion,
        value: sha(payload)
      },
      encryption: { method: "tls+payload-placeholder", required: true },
      policyContext: sender.policySummary.requiredTrustLevel,
      payloadSchemaVersion: "1.0.0",
      payload,
      trace: { transport: "adapter" }
    };
  }

  validateGatewayMessage(envelope: ProtocolEnvelope): boolean {
    if (envelope.protocolVersion !== "1.0.0") return false;
    if (
      !federationProtocolMessages.includes(
        envelope.messageType as (typeof federationProtocolMessages)[number]
      )
    )
      return false;
    if (new Date(envelope.expiration).getTime() < Date.now()) return false;
    if (!envelope.nonce || !envelope.signature.value) return false;
    this.requireNode(envelope.senderNodeId);
    this.requireNode(envelope.recipientNodeId);
    return true;
  }

  createInvitation(
    sourceNodeId: string,
    targetHint: string,
    mode: FederationInvitation["mode"]
  ): FederationInvitation {
    const source = this.requireNode(sourceNodeId);
    const invitation: FederationInvitation = {
      id: id("invitation"),
      sourceNodeId,
      targetHint,
      token: sha({ sourceNodeId, targetHint, at: now() }),
      mode,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      accepted: false,
      auditId: id("audit")
    };
    this.invitations.set(invitation.id, invitation);
    this.emit(
      "FederationInvitationCreated",
      sourceNodeId,
      undefined,
      source.ownerIdentityId,
      invitation.id,
      "invitation",
      { mode }
    );
    return invitation;
  }

  acceptInvitation(targetNodeId: string, invitationId: string): FederationInvitation {
    const target = this.requireNode(targetNodeId);
    const invitation = this.requireInvitation(invitationId);
    const accepted = { ...invitation, accepted: true };
    this.invitations.set(invitationId, accepted);
    this.emit(
      "FederationInvitationAccepted",
      invitation.sourceNodeId,
      targetNodeId,
      target.ownerIdentityId,
      invitationId,
      "invitation",
      { accepted: true }
    );
    return accepted;
  }

  verifyNode(nodeId: string): NodeIdentity {
    const node = this.requireNode(nodeId);
    const updated = {
      ...node,
      state: "Verified" as const,
      lastVerifiedAt: now(),
      auditHistory: [...node.auditHistory, id("audit")]
    };
    this.nodes.set(nodeId, updated);
    this.emit("NodeDiscovered", nodeId, undefined, node.ownerIdentityId, nodeId, "discovery", {
      state: updated.state
    });
    return updated;
  }

  approveTrust(
    sourceNodeId: string,
    targetNodeId: string,
    capabilities: readonly string[]
  ): TrustRelation {
    const source = this.requireNode(sourceNodeId);
    const target = this.requireNode(targetNodeId);
    const trust: TrustRelation = {
      id: id("trust"),
      sourceNodeId,
      targetNodeId,
      type: "research",
      state: "Trusted",
      scope: ["workspace:shared", "project:shared"],
      evidence: [source.publicKey, target.publicKey],
      confidence: 0.82,
      grantedCapabilities: capabilities,
      restrictions: ["no-remote-writes", "approval-required"],
      issuer: source.ownerIdentityId,
      createdAt: now(),
      reviewAt: new Date(Date.now() + 2592000000).toISOString(),
      revocationHistory: [],
      explanation: "Manual review approved limited research federation."
    };
    this.trusts.set(trust.id, trust);
    this.nodes.set(sourceNodeId, { ...source, state: "Trusted" });
    this.nodes.set(targetNodeId, { ...target, state: "Trusted" });
    this.emit(
      "TrustRequested",
      sourceNodeId,
      targetNodeId,
      source.ownerIdentityId,
      trust.id,
      "trust",
      { capabilities }
    );
    this.emit(
      "TrustGranted",
      sourceNodeId,
      targetNodeId,
      source.ownerIdentityId,
      trust.id,
      "trust",
      { trustId: trust.id }
    );
    return trust;
  }

  approveFederationAgreement(
    sourceNodeId: string,
    targetNodeId: string,
    objectTypes: readonly string[]
  ): FederationAgreement {
    const source = this.requireNode(sourceNodeId);
    const target = this.requireNode(targetNodeId);
    const conflicts =
      source.policySummary.dataRetentionDays !== target.policySummary.dataRetentionDays
        ? ["retention-days"]
        : [];
    const policy = {
      ...source.policySummary,
      objectSharing: source.policySummary.objectSharing.filter((item) =>
        target.policySummary.objectSharing.includes(item)
      )
    };
    const agreement: FederationAgreement = {
      id: id("agreement"),
      nodeIds: [sourceNodeId, targetNodeId],
      effectivePolicies: policy,
      allowedCapabilities: ["federated-search", "read-only-snapshot", "remote-semantiq"],
      allowedObjectTypes: objectTypes,
      allowedWorkspaces: ["workspace:shared"],
      allowedProjects: ["project:shared"],
      retentionTerms: `${Math.min(source.policySummary.dataRetentionDays, target.policySummary.dataRetentionDays)} days`,
      auditRequirements: ["all-events-versioned", "exportable-history"],
      expiresAt: new Date(Date.now() + 2592000000).toISOString(),
      reviewSchedule: "30 days",
      version: "1.0.0",
      signatures: [sha(source.publicKey), sha(target.publicKey)],
      revocationTerms: "Either node may revoke shared objects.",
      approved: true,
      conflictsResolved: conflicts.map((item) => `${item}:minimum-selected`)
    };
    this.agreements.set(agreement.id, agreement);
    this.emit(
      "FederationPolicyUpdated",
      sourceNodeId,
      targetNodeId,
      source.ownerIdentityId,
      agreement.id,
      "policy",
      { conflicts }
    );
    this.emit(
      "FederationAgreementCreated",
      sourceNodeId,
      targetNodeId,
      source.ownerIdentityId,
      agreement.id,
      "agreement",
      { agreementId: agreement.id }
    );
    return agreement;
  }

  createRemoteReference(
    localNodeId: string,
    remoteNodeId: string,
    remoteObjectId: string,
    objectType: string,
    title: string
  ): RemoteReference {
    const local = this.requireNode(localNodeId);
    const remote = this.requireNode(remoteNodeId);
    const reference: RemoteReference = {
      id: id("remote-reference"),
      remoteNodeId,
      remoteObjectId,
      objectType,
      title,
      version: "1.0.0",
      integrityHash: sha({ remoteNodeId, remoteObjectId }),
      visibility: "federated-metadata",
      accessState: "Available",
      license: "Research Use",
      provenance: remote.id,
      cacheStatus: "metadata",
      resolutionEndpoint: remote.endpoints[0] ?? "offline",
      revoked: false
    };
    this.references.set(reference.id, reference);
    this.emit(
      "RemoteReferenceCreated",
      remoteNodeId,
      localNodeId,
      local.ownerIdentityId,
      reference.id,
      "remote-reference",
      { remoteObjectId }
    );
    return reference;
  }

  shareObject(
    sourceNodeId: string,
    targetNodeId: string,
    objectId: string,
    mode: SharingPlan["mode"]
  ): SharingPlan {
    const source = this.requireNode(sourceNodeId);
    const plan: SharingPlan = {
      id: id("sharing-plan"),
      sourceNodeId,
      recipientNodeIds: [targetNodeId],
      objectIds: [objectId],
      mode,
      personalDataDetected: false,
      privateMetadataDetected: false,
      licenseImplications: ["Remote recipient must preserve license metadata."],
      retentionPolicy: "30 days",
      revocationCapabilities: ["remote-reference-revocation", "agreement-revocation"],
      synchronizationBehavior: "manual-sync-approved",
      estimatedPackageSizeKb: 128,
      integrity: sha({ objectId, mode }),
      approved: true
    };
    this.lastPlan = plan;
    this.emit(
      "KnowledgeShareRequested",
      sourceNodeId,
      targetNodeId,
      source.ownerIdentityId,
      plan.id,
      "sharing",
      { objectId, mode }
    );
    this.emit(
      "KnowledgeShared",
      sourceNodeId,
      targetNodeId,
      source.ownerIdentityId,
      plan.id,
      "sharing",
      { approved: true }
    );
    return plan;
  }

  replicateObject(
    sourceNodeId: string,
    destinationNodeId: string,
    remoteReferenceId: string
  ): ReplicationRecord {
    const reference = this.requireReference(remoteReferenceId);
    const source = this.requireNode(sourceNodeId);
    const record: ReplicationRecord = {
      id: id("replication"),
      sourceNodeId,
      destinationNodeId,
      sourceObjectId: reference.remoteObjectId,
      localObjectOrReferenceId: reference.id,
      mode: "One-time snapshot",
      policyId: this.lastPlan?.id ?? "policy:manual",
      version: reference.version,
      integrity: reference.integrityHash,
      startedAt: now(),
      completedAt: now(),
      status: "completed",
      errors: [],
      conflictStatus: "none",
      auditHistory: [id("audit")]
    };
    this.replications.set(record.id, record);
    this.references.set(remoteReferenceId, {
      ...reference,
      cacheStatus: "snapshot",
      accessState: "Cached",
      lastSynchronizedAt: now()
    });
    this.emit(
      "ReplicationStarted",
      sourceNodeId,
      destinationNodeId,
      source.ownerIdentityId,
      record.id,
      "replication",
      { remoteReferenceId }
    );
    this.emit(
      "ReplicationCompleted",
      sourceNodeId,
      destinationNodeId,
      source.ownerIdentityId,
      record.id,
      "replication",
      { status: record.status }
    );
    return record;
  }

  startSync(sourceNodeId: string, targetNodeId: string, objectIds: readonly string[]): SyncJob {
    const source = this.requireNode(sourceNodeId);
    const job: SyncJob = {
      id: id("sync"),
      sourceNodeId,
      targetNodeId,
      state: "Completed",
      versionVector: Object.fromEntries(objectIds.map((objectId, index) => [objectId, index + 1])),
      checkpoints: [id("checkpoint")],
      selectiveFields: ["title", "summary", "semantiq", "relations"],
      lowConnectivity: false,
      errors: []
    };
    this.syncJobs.set(job.id, job);
    this.emit(
      "SynchronizationStarted",
      sourceNodeId,
      targetNodeId,
      source.ownerIdentityId,
      job.id,
      "sync",
      { objectIds }
    );
    this.emit(
      "SynchronizationCompleted",
      sourceNodeId,
      targetNodeId,
      source.ownerIdentityId,
      job.id,
      "sync",
      { checkpoints: job.checkpoints }
    );
    return job;
  }

  detectConflict(objectId: string, localVersion: string, remoteVersion: string): ConflictRecord {
    const conflict: ConflictRecord = {
      id: id("conflict"),
      objectId,
      localVersion,
      remoteVersion,
      changedFields: ["summary"],
      semanticDifferences: ["Local and remote summaries diverged."],
      graphDifferences: ["Remote relation added."],
      timeline: [now()],
      authors: ["local", "remote"],
      policies: ["preserve-both"],
      licenseImplications: ["Retain original license on both versions."],
      recommendedAction: "Preserve both",
      confidence: 0.76
    };
    this.conflicts.set(conflict.id, conflict);
    const ref = this.references.get(objectId);
    if (ref) this.references.set(objectId, { ...ref, accessState: "Conflict Detected" });
    this.emit(
      "ConflictDetected",
      ref?.remoteNodeId ?? "local",
      undefined,
      "system",
      conflict.id,
      "conflict",
      { objectId }
    );
    return conflict;
  }

  resolveConflict(conflictId: string, resolution: ConflictResolution): ConflictRecord {
    const conflict = this.requireConflict(conflictId);
    const resolved = { ...conflict, resolvedBy: resolution };
    this.conflicts.set(conflictId, resolved);
    this.emit("ConflictResolved", "local", undefined, "system", conflictId, "conflict", {
      resolution
    });
    return resolved;
  }

  searchFederation(requestingNodeId: string, query: string): readonly FederatedSearchResult[] {
    const requester = this.requireNode(requestingNodeId);
    this.emit(
      "FederatedSearchStarted",
      requestingNodeId,
      undefined,
      requester.ownerIdentityId,
      query,
      "search",
      { query }
    );
    const results = [...this.references.values()]
      .filter(
        (reference) =>
          reference.title.toLowerCase().includes(query.split(/\s+/)[0]?.toLowerCase() ?? "") ||
          reference.objectType.toLowerCase().includes("question")
      )
      .map<FederatedSearchResult>((reference) => ({
        sourceNodeId: reference.remoteNodeId,
        trustStatus: this.trustFor(requestingNodeId, reference.remoteNodeId),
        objectId: reference.remoteObjectId,
        objectType: reference.objectType,
        title: reference.title,
        summary: `Remote ${reference.objectType} metadata`,
        semantiqSummary: 0.78,
        license: reference.license,
        version: reference.version,
        availability: reference.accessState,
        freshness: reference.lastSynchronizedAt ? "cached" : "fresh-metadata",
        accessRequirements: ["agreement", "trust"],
        remoteLatencyMs: 25,
        provenance: reference.provenance
      }));
    this.emit(
      "FederatedSearchCompleted",
      requestingNodeId,
      undefined,
      requester.ownerIdentityId,
      query,
      "search",
      { count: results.length }
    );
    return results;
  }

  createCrossNodeProject(
    nodeAId: string,
    nodeBId: string,
    sharedObjectIds: readonly string[]
  ): CollaborationSession {
    const nodeA = this.requireNode(nodeAId);
    const session: CollaborationSession = {
      id: id("collaboration"),
      nodeIds: [nodeAId, nodeBId],
      workspaceIds: ["workspace:a", "workspace:b"],
      participants: [nodeA.ownerIdentityId, this.requireNode(nodeBId).ownerIdentityId],
      roles: { [nodeAId]: "owner", [nodeBId]: "collaborator" },
      permissions: ["comment", "reference", "task-share"],
      sharedObjectIds,
      startedAt: now(),
      expiresAt: new Date(Date.now() + 1209600000).toISOString(),
      policies: ["read-only-snapshot", "remote-comments"],
      activityHistory: ["session-created"],
      revocationHistory: []
    };
    this.collaborations.set(session.id, session);
    this.emit(
      "CollaborationSessionCreated",
      nodeAId,
      nodeBId,
      nodeA.ownerIdentityId,
      session.id,
      "collaboration",
      { sharedObjectIds }
    );
    return session;
  }

  requestRemoteCapability(
    requestingNodeId: string,
    executingNodeId: string,
    capability: RemoteExecutionRequest["capability"],
    objectId: string
  ): RemoteExecutionRequest {
    const requester = this.requireNode(requestingNodeId);
    const request: RemoteExecutionRequest = {
      id: id("remote-execution"),
      requestingNodeId,
      executingNodeId,
      capability,
      inputSchema: `${capability}.input.v1`,
      outputSchema: `${capability}.output.v1`,
      permissionScope: ["metadata-only"],
      dataClassification: "metadata",
      resourceLimits: { timeoutMs: 30000, maxKb: 512 },
      timeoutMs: 30000,
      costEstimatePlaceholder: "none-local-alpha",
      auditRequirement: "full-event-log",
      approvalRequired: true,
      resultHandlingPolicy: "store-report-reference",
      approved: false
    };
    this.remoteExecutions.set(request.id, request);
    this.emit(
      "RemoteExecutionRequested",
      requestingNodeId,
      executingNodeId,
      requester.ownerIdentityId,
      request.id,
      "remote-execution",
      { capability, objectId }
    );
    return request;
  }

  approveRemoteExecution(requestId: string): RemoteExecutionRequest {
    const request = this.requireRemoteExecution(requestId);
    const approved = { ...request, approved: true };
    this.remoteExecutions.set(requestId, approved);
    this.emit(
      "RemoteExecutionApproved",
      request.requestingNodeId,
      request.executingNodeId,
      "human-review",
      requestId,
      "remote-execution",
      { approved: true }
    );
    return approved;
  }

  executeRemoteCapability(requestId: string): FederatedSemantiqReport {
    const request = this.requireRemoteExecution(requestId);
    if (!request.approved) throw new Error("Remote execution requires approval");
    const report = this.makeSemantiqReport(
      request.executingNodeId,
      "remote-object:approved",
      "shared"
    );
    this.emit(
      "RemoteExecutionCompleted",
      request.requestingNodeId,
      request.executingNodeId,
      "remote-runtime",
      requestId,
      "remote-execution",
      { reportId: report.id }
    );
    return report;
  }

  localEvaluateRemoteSnapshot(nodeId: string, referenceId: string): FederatedSemantiqReport {
    return this.makeSemantiqReport(nodeId, referenceId, "private");
  }

  revokeSharedObject(sourceNodeId: string, referenceId: string): RemoteReference {
    const reference = this.requireReference(referenceId);
    const updated = { ...reference, accessState: "Revoked" as const, revoked: true };
    this.references.set(referenceId, updated);
    this.emit(
      "RemoteObjectRevoked",
      sourceNodeId,
      reference.remoteNodeId,
      "owner",
      referenceId,
      "revocation",
      { referenceId }
    );
    return updated;
  }

  createOfflinePackage(sourceNodeId: string, targetNodeId: string): OfflineFederationPackage {
    const base = {
      id: id("offline-package"),
      nodeMetadata: [this.requireNode(sourceNodeId), this.requireNode(targetNodeId)],
      knowledgeObjects: [...this.references.values()],
      graphSnapshot: ["remote-reference-graph"],
      eventBatch: this.events.filter(
        (event) => event.sourceNodeId === sourceNodeId || event.targetNodeId === targetNodeId
      ),
      syncCheckpoint: [...this.syncJobs.values()].flatMap((job) => job.checkpoints),
      integrityManifest: sha(this.events),
      signatures: [sha(sourceNodeId), sha(targetNodeId)],
      importInstructions: "Validate package, review policy, approve import."
    };
    const invitation = [...this.invitations.values()][0];
    const agreementDraft = [...this.agreements.values()][0];
    return {
      ...base,
      ...(invitation ? { invitation } : {}),
      ...(agreementDraft ? { agreementDraft } : {})
    };
  }

  importOfflinePackage(targetNodeId: string, pkg: OfflineFederationPackage): void {
    this.requireNode(targetNodeId);
    if (pkg.integrityManifest.length === 0) throw new Error("Offline package integrity missing");
  }

  networkHealth(): NetworkHealth {
    return {
      connectedNodes: [...this.nodes.values()].filter((node) => node.online).length,
      pendingInvitations: [...this.invitations.values()].filter(
        (invitation) => !invitation.accepted
      ).length,
      trustStates: Object.fromEntries(
        [...this.trusts.values()].map((trust) => [trust.targetNodeId, trust.state])
      ),
      protocolCompatibility: ["1.0.0"],
      endpointHealth: [...this.nodes.values()].map((node) => `${node.name}:${node.health}`),
      latencyMs: 25,
      synchronizationStatus: [...this.syncJobs.values()].map((job) => job.state),
      failedMessages: 0,
      conflictCount: this.conflicts.size,
      replicationVolume: this.replications.size,
      securityAlerts: [],
      policyConflicts: [],
      remoteAgentRequests: this.remoteExecutions.size,
      federatedSearchMs: 25
    };
  }

  createNetworkTestHarness(): readonly NodeIdentity[] {
    const fixtures: readonly [string, NodeType][] = [
      ["node-a-personal", "Personal Node"],
      ["node-b-research", "Research Node"],
      ["node-c-community", "Community Node"],
      ["node-malicious-test", "Local Test Node"],
      ["node-offline-test", "Offline Exchange Node"]
    ];
    return fixtures.map(([name, type]) => {
      const node: NodeIdentity = {
        id: id("node"),
        name,
        type,
        ownerIdentityId: `identity:${name}`,
        publicKey: `public-key:${name}`,
        keyVersion: 1,
        state: name.includes("malicious") ? "Restricted" : "Local Only",
        endpoints: [`https://${name}.local/federation`],
        protocolVersions: ["1.0.0"],
        capabilities: ["metadata", "federated-search"],
        supportedObjectTypes: ["Question"],
        authenticationMethods: ["signed-challenge"],
        encryptionMethods: ["tls"],
        policySummary: defaultPolicy(),
        jurisdiction: "local-test",
        locality: "ci",
        online: !name.includes("offline"),
        health: name.includes("offline") ? "offline" : "healthy",
        auditHistory: [id("audit")],
        revoked: false
      };
      this.nodes.set(node.id, node);
      return node;
    });
  }

  simulateNetworkFault(
    fault:
      | "trust-rejection"
      | "policy-conflict"
      | "replay-attack"
      | "network-partition"
      | "malicious-payload"
  ): { readonly fault: string; readonly handled: true; readonly explanation: string } {
    return {
      fault,
      handled: true,
      explanation: `Deterministic harness handled ${fault} without blocking local work.`
    };
  }

  eventsLog(): readonly FederationEvent[] {
    return this.events;
  }

  private makeSemantiqReport(
    evaluatingNodeId: string,
    inputObjectVersion: string,
    visibility: FederatedSemantiqReport["visibility"]
  ): FederatedSemantiqReport {
    const report: FederatedSemantiqReport = {
      id: id("federated-semantiq"),
      evaluatingNodeId,
      inputObjectVersion,
      profile: "federated-question-v1",
      provider: "deterministic-local",
      confidence: 0.72,
      timestamp: now(),
      integrityHash: sha({ evaluatingNodeId, inputObjectVersion }),
      visibility,
      limitations: ["Do not average incompatible cross-node scores blindly."],
      score: 0.78
    };
    this.reports.set(report.id, report);
    return report;
  }

  private trustFor(sourceNodeId: string, targetNodeId: string): TrustState {
    return (
      [...this.trusts.values()].find(
        (trust) => trust.sourceNodeId === sourceNodeId || trust.targetNodeId === targetNodeId
      )?.state ?? "Unknown"
    );
  }

  private emit(
    type: FederationEventType,
    sourceNodeId: string,
    targetNodeId: string | undefined,
    actorId: string,
    causationId: string,
    policyContext: string,
    payload: unknown
  ): void {
    const event = {
      eventId: id("event"),
      type,
      eventVersion: 1,
      timestamp: now(),
      sourceNodeId,
      actorId,
      correlationId: `corr:${sourceNodeId}:${targetNodeId ?? "local"}`,
      causationId,
      policyContext,
      payloadSchema: `${type}.v1`,
      signature: { algorithm: "ed25519-placeholder", verified: true },
      audit: { localFirst: true, noOpenDiscovery: true, noUnrestrictedRemoteExecution: true },
      payload
    };
    this.events.push(targetNodeId ? { ...event, targetNodeId } : event);
  }

  private requireNode(nodeId: string): NodeIdentity {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);
    return node;
  }

  private requireInvitation(invitationId: string): FederationInvitation {
    const invitation = this.invitations.get(invitationId);
    if (!invitation) throw new Error(`Invitation not found: ${invitationId}`);
    return invitation;
  }

  private requireReference(referenceId: string): RemoteReference {
    const ref = this.references.get(referenceId);
    if (!ref) throw new Error(`Remote reference not found: ${referenceId}`);
    return ref;
  }

  private requireSync(syncId: string): SyncJob {
    const sync = this.syncJobs.get(syncId);
    if (!sync) throw new Error(`Sync not found: ${syncId}`);
    return sync;
  }

  private requireConflict(conflictId: string): ConflictRecord {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) throw new Error(`Conflict not found: ${conflictId}`);
    return conflict;
  }

  private requireRemoteExecution(requestId: string): RemoteExecutionRequest {
    const request = this.remoteExecutions.get(requestId);
    if (!request) throw new Error(`Remote execution not found: ${requestId}`);
    return request;
  }
}
