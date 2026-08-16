export type ModuleId = string;
export type ModuleVersion = string;

export type SemantiqModule<TConfig = unknown> = TechClubModule<TConfig>;
export interface TechClubModule<TConfig = unknown> {
  readonly id: ModuleId;
  readonly version: ModuleVersion;
  configure(config: TConfig): void | Promise<void>;
  start(): void | Promise<void>;
  stop(): void | Promise<void>;
}

export interface Logger {
  info(message: string, context?: Readonly<Record<string, unknown>>): void;
  warn(message: string, context?: Readonly<Record<string, unknown>>): void;
  error(message: string, context?: Readonly<Record<string, unknown>>): void;
}

export type DomainEvent<TPayload = unknown> =
  import("./domain/events.js").CoreDomainEvent<TPayload>;

export * from "./domain/identifiers.js";
export * from "./domain/events.js";
export * from "./domain/permissions.js";
export * from "./domain/graph.js";
export * from "./domain/models.js";
export * from "./domain/factories.js";
export * from "./contracts/repositories.js";
export * from "./contracts/ports.js";
export * from "./contracts/storage-adapters.js";
export * from "./application/services.js";
export * from "./application/validation.js";
export * from "./application/serialization.js";
export * from "./infrastructure/memory.js";
export * from "./schemas/contracts.js";
export * from "./api/index.js";
