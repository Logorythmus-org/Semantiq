export type StorageAdapterKind = "postgresql" | "neo4j" | "sqlite" | "memory" | "json" | "future";

export interface StorageAdapterDescriptor {
  readonly kind: StorageAdapterKind;
  readonly name: string;
  readonly version: string;
  readonly supportsTransactions: boolean;
  readonly supportsOffline: boolean;
  readonly migrationRequired: boolean;
}

export const memoryStorageAdapter: StorageAdapterDescriptor = {
  kind: "memory",
  name: "In-memory test adapter",
  version: "0.0.0",
  supportsTransactions: false,
  supportsOffline: true,
  migrationRequired: false
};
