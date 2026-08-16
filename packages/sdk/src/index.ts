export type { Command, DomainEvent, Query, TechClubModule } from "@tech-club/core";

export const sdkFoundation = {
  languages: ["typescript", "python"],
  modules: ["identity", "workspace", "question", "knowledge", "graph", "semantiq", "research", "agent", "workflow", "asset", "registry", "marketplace", "events"],
  localRuntimeSupport: true,
  remoteApiSupport: true,
  errorModel: "TechClubSdkError",
  retryBehavior: "exponential-backoff-descriptor",
  pagination: "cursor-descriptor",
  streaming: "adapter-ready"
} as const;
