export const semantiqService = {
  name: "semantiq",
  framework: "FastAPI",
  health: { path: "/health", status: "healthy", dependencies: ["@tech-club/sprint2-runtime"] },
  routes: ["POST /semantiq/questions/evaluate", "GET /semantiq/reports/{reportId}", "GET /semantiq/questions/{questionId}/history", "POST /semantiq/reports/compare", "GET /semantiq/reports/{reportId}/explain"]
} as const;
