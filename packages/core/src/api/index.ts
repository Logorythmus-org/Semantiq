export const coreRestApi = {
  resources: ["identities", "workspaces", "knowledge-objects", "questions", "graph", "permissions", "events"],
  version: "0.0.0"
} as const;

export const coreMcpTools = [
  "core.identity.create",
  "core.workspace.create",
  "core.knowledge.create",
  "core.question.create",
  "core.graph.relate",
  "core.permission.authorize"
] as const;
