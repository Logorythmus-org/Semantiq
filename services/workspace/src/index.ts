export const workspaceService = {
  name: "workspace",
  framework: "FastAPI",
  health: {
    path: "/health",
    status: "healthy",
    dependencies: ["@tech-club/sprint1-runtime", "local-storage"]
  },
  routes: [
    "POST /workspaces",
    "PATCH /workspaces/{workspaceId}",
    "POST /workspaces/{workspaceId}/archive",
    "POST /workspaces/{workspaceId}/restore",
    "POST /workspaces/{workspaceId}/export"
  ]
} as const;
