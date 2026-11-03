export const evidenceService = {
  name: "evidence",
  framework: "FastAPI",
  health: { path: "/health", status: "healthy", dependencies: ["@logorythmus/sprint2-runtime"] },
  routes: [
    "POST /research/projects/{projectId}/evidence",
    "POST /evidence/{evidenceId}/evaluate",
    "GET /evidence/{evidenceId}"
  ]
} as const;
