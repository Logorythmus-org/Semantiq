export type RuntimeAdapterKind =
  | "neo4j"
  | "postgresql"
  | "sqlite"
  | "memory"
  | "json"
  | "meilisearch"
  | "opensearch"
  | "future-graph-database";

export interface RuntimeAdapterDescriptor {
  readonly kind: RuntimeAdapterKind;
  readonly name: string;
  readonly storageIndependent: true;
  readonly productionReady: boolean;
}
