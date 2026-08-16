export const questionService = {
  name: "question",
  framework: "node-http",
  health: {
    path: "/health",
    status: "healthy",
    dependencies: ["@tech-club/config", "@tech-club/persistence"]
  },
  routes: [
    "POST /api/v1/questions",
    "GET /api/v1/questions",
    "GET /api/v1/questions/{questionId}",
    "GET /api/v1/questions/{questionId}/detail",
    "PATCH /api/v1/questions/{questionId}",
    "POST /api/v1/questions/{questionId}/archive",
    "POST /api/v1/questions/{questionId}/restore",
    "GET /api/v1/questions/{questionId}/revisions",
    "POST /api/v1/questions/{questionId}/relations",
    "GET /api/v1/questions/{questionId}/relations",
    "GET /api/v1/questions/{questionId}/graph",
    "PUT /api/v1/questions/{questionId}/semantic-structure",
    "GET /api/v1/questions/{questionId}/semantic-structure",
    "GET /api/v1/questions/{questionId}/semantic-structure/revisions",
    "POST /api/v1/questions/{questionId}/sources",
    "GET /api/v1/questions/{questionId}/sources",
    "POST /api/v1/questions/{questionId}/reports",
    "POST /api/v1/questions/{questionId}/moderation-cases",
    "GET /api/v1/questions/{questionId}/trust-signals"
  ]
} as const;
