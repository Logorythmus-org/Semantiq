export const federationSyncService = {
  name: "federation-sync",
  framework: "FastAPI",
  health: { path: "/health", status: "healthy", dependencies: ["@tech-club/sprint5-runtime"] },
  routes: [
    "POST /sync/plans",
    "POST /sync/{syncId}/start",
    "POST /sync/{syncId}/pause",
    "POST /sync/{syncId}/resume",
    "POST /sync/{syncId}/cancel",
    "POST /conflicts/{conflictId}/resolve"
  ]
} as const;
