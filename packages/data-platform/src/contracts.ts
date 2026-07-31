export type NodeKind =
  | "question"
  | "answer"
  | "project"
  | "repository"
  | "paper"
  | "evidence"
  | "experiment"
  | "game"
  | "narrative"
  | "workflow"
  | "agent"
  | "user"
  | "community"
  | "book"
  | "video"
  | "dataset"
  | "conversation"
  | "custom";

export type RelationshipType =
  | "supports"
  | "contradicts"
  | "extends"
  | "explains"
  | "depends_on"
  | "created_from"
  | "question_of"
  | "evidence_for"
  | "part_of"
  | "member_of"
  | "inspired_by"
  | "similar_to"
  | "duplicate_of"
  | "alternative_to"
  | "references"
  | "validated_by";

export type StorageEngineKind =
  | "primary-local"
  | "sqlite"
  | "duckdb"
  | "graph"
  | "vector"
  | "object"
  | "blob"
  | "cache"
  | "workspace"
  | "cloud";

export interface UniversalId {
  readonly stableId: string;
  readonly humanId: string;
  readonly semanticUri: string;
  readonly namespace: string;
  readonly version: string;
  readonly hash: string;
}

export interface DataMetadata {
  readonly title?: string;
  readonly summary?: string;
  readonly createdBy?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly language?: string;
  readonly provenance?: string;
  readonly tags: readonly string[];
}

export interface VersionRef {
  readonly version: string;
  readonly parentVersion?: string;
  readonly forkedFrom?: string;
  readonly snapshotId?: string;
  readonly changedAt: string;
  readonly changedBy?: string;
  readonly changeReason?: string;
}

export interface PermissionRef {
  readonly action: string;
  readonly scope: string;
  readonly subject?: string;
}

export interface SemanticNode<TData = unknown> {
  readonly id: UniversalId;
  readonly kind: NodeKind;
  readonly metadata: DataMetadata;
  readonly version: VersionRef;
  readonly permissions: readonly PermissionRef[];
  readonly semanticTags: readonly string[];
  readonly benchmarkResults: readonly string[];
  readonly agentNotes: readonly string[];
  readonly references: readonly string[];
  readonly data: TData;
  readonly deletedAt?: string;
}

export interface SemanticRelation<TData = unknown> {
  readonly id: UniversalId;
  readonly sourceId: string;
  readonly targetId: string;
  readonly type: RelationshipType;
  readonly confidence?: number;
  readonly weight?: number;
  readonly evidence: readonly string[];
  readonly creator?: string;
  readonly timestamp: string;
  readonly version: VersionRef;
  readonly permissions: readonly PermissionRef[];
  readonly data?: TData;
}

export interface VersionRecord<TPatch = unknown> {
  readonly objectId: string;
  readonly version: VersionRef;
  readonly hash: string;
  readonly patch?: TPatch;
  readonly auditId?: string;
}

export interface SearchQuery {
  readonly text?: string;
  readonly kind?: NodeKind;
  readonly tags?: readonly string[];
  readonly workspaceId?: string;
  readonly limit?: number;
}

export interface SearchResult {
  readonly nodeId: string;
  readonly score: number;
  readonly source: "keyword" | "semantic" | "graph" | "tag" | "time" | "benchmark" | "hybrid";
  readonly highlights: readonly string[];
}

export interface GraphQuery {
  readonly startNodeId?: string;
  readonly relationshipTypes?: readonly RelationshipType[];
  readonly depth: number;
  readonly limit: number;
}

export interface StorageEngine {
  readonly id: string;
  readonly kind: StorageEngineKind;
  readonly capabilities: readonly string[];
  health(): Promise<"healthy" | "degraded" | "unhealthy">;
}

export interface SemanticRepository {
  createNode<TData>(node: SemanticNode<TData>): Promise<void>;
  updateNode<TData>(node: SemanticNode<TData>): Promise<void>;
  deleteNode(nodeId: string): Promise<void>;
  restoreNode(nodeId: string, version?: string): Promise<void>;
  getNode<TData>(nodeId: string): Promise<SemanticNode<TData> | undefined>;
  createRelation<TData>(relation: SemanticRelation<TData>): Promise<void>;
  deleteRelation(relationId: string): Promise<void>;
  queryGraph(query: GraphQuery): Promise<readonly SemanticRelation[]>;
  search(query: SearchQuery): Promise<readonly SearchResult[]>;
  versionHistory(objectId: string): Promise<readonly VersionRecord[]>;
  compareVersions(objectId: string, fromVersion: string, toVersion: string): Promise<unknown>;
}

export interface VectorRecord {
  readonly id: string;
  readonly objectId: string;
  readonly model: string;
  readonly dimensions: number;
  readonly values: readonly number[];
  readonly createdAt: string;
  readonly permissionScope: string;
}

export interface VectorStore {
  upsert(record: VectorRecord): Promise<void>;
  query(objectId: string, limit: number): Promise<readonly SearchResult[]>;
}

export interface CacheEntry<TValue = unknown> {
  readonly key: string;
  readonly scope: string;
  readonly owner: string;
  readonly version: string;
  readonly expiresAt?: string;
  readonly value: TValue;
}

export interface CacheStore {
  set<TValue>(entry: CacheEntry<TValue>): Promise<void>;
  get<TValue>(key: string): Promise<CacheEntry<TValue> | undefined>;
  delete(key: string): Promise<void>;
}

export interface SyncChange<TPatch = unknown> {
  readonly id: string;
  readonly objectId: string;
  readonly baseVersion: string;
  readonly nextVersion: string;
  readonly actorId?: string;
  readonly deviceId?: string;
  readonly timestamp: string;
  readonly hash: string;
  readonly patch?: TPatch;
}

export interface SyncEngine {
  sync(changes: readonly SyncChange[]): Promise<readonly SyncConflict[]>;
}

export interface SyncConflict {
  readonly objectId: string;
  readonly localChangeId: string;
  readonly remoteChangeId: string;
  readonly reason: string;
}

export interface BackupManifest {
  readonly id: string;
  readonly createdAt: string;
  readonly encrypted: boolean;
  readonly compressed: boolean;
  readonly objectCount: number;
  readonly checksum: string;
}

export interface BackupEngine {
  backup(scope: string): Promise<BackupManifest>;
  restore(manifestId: string): Promise<void>;
}
