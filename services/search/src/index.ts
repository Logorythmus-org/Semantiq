export const searchService = {
  name: "search",
  framework: "FastAPI",
  health: {
    path: "/health",
    status: "healthy",
    dependencies: ["@logorythmus/sprint1-runtime", "@logorythmus/graph-runtime"]
  },
  routes: ["GET /search", "GET /workspaces/{workspaceId}/graph"]
} as const;
