export type IdentifierKind =
  | "uuid"
  | "ulid"
  | "semantic"
  | "persistent"
  | "federated"
  | "temporary"
  | "node"
  | "workspace"
  | "question"
  | "knowledge"
  | "identity";

export interface Identifier {
  readonly kind: IdentifierKind;
  readonly value: string;
}

export type IdentityId = string;
export type WorkspaceId = string;
export type ProjectId = string;
export type KnowledgeId = string;
export type QuestionId = string;
export type NodeId = string;
export type RelationId = string;
export type EventId = string;
export type PermissionId = string;

export const createUuid = (): Identifier => ({
  kind: "uuid",
  value: globalThis.crypto.randomUUID()
});

export const createUlid = (
  now: Date = new Date(),
  random: () => number = Math.random
): Identifier => ({
  kind: "ulid",
  value: `${now.getTime().toString(36).padStart(10, "0")}${Math.floor(
    random() * Number.MAX_SAFE_INTEGER
  )
    .toString(36)
    .padStart(11, "0")}`.toUpperCase()
});

export const createSemanticId = (namespace: string, localName: string): Identifier => ({
  kind: "semantic",
  value: `tc:${namespace}:${localName}`
});

export const createPersistentId = (authority: string, localName: string): Identifier => ({
  kind: "persistent",
  value: `pid:${authority}:${localName}`
});

export const createFederatedId = (nodeId: NodeId, localId: string): Identifier => ({
  kind: "federated",
  value: `fed:${nodeId}:${localId}`
});

export const createTemporaryId = (scope: string, localName: string): Identifier => ({
  kind: "temporary",
  value: `tmp:${scope}:${localName}`
});

export const assertIdentifier = (identifier: Identifier): void => {
  if (identifier.value.trim().length === 0) {
    throw new Error("Identifier value cannot be empty");
  }
};
