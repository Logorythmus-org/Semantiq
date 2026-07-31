export const searchService = {
  name: "search",
  framework: "FastAPI",
  health: {
    path: "/health",
    status: "healthy",
    dependencies: ["@tech-club/sprint1-runtime", "@tech-club/graph-runtime"]
  },
  routes: ["GET /search", "GET /workspaces/{workspaceId}/graph"]
} as const;
