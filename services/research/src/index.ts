export const researchService = {
  name: "research",
  framework: "FastAPI",
  health: {
    path: "/health",
    status: "healthy",
    dependencies: ["@logorythmus/sprint2-runtime", "@logorythmus/graph-runtime"]
  },
  routes: [
    "POST /research/drafts",
    "POST /research/projects/{projectId}/approve",
    "GET /research/projects/{projectId}",
    "PATCH /research/projects/{projectId}",
    "POST /research/projects/{projectId}/hypotheses",
    "POST /research/projects/{projectId}/tasks",
    "GET /research/projects/{projectId}/dashboard"
  ]
} as const;
