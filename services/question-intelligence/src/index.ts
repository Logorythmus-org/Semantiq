export const questionIntelligenceService = {
  name: "question-intelligence",
  framework: "FastAPI",
  health: { path: "/health", status: "healthy", dependencies: ["@tech-club/sprint2-runtime"] },
  routes: [
    "POST /question-intelligence/analyze",
    "POST /question-intelligence/intent",
    "POST /question-intelligence/ambiguity",
    "POST /question-intelligence/assumptions",
    "POST /question-intelligence/refinements",
    "POST /question-intelligence/tags",
    "POST /question-intelligence/duplicates",
    "POST /question-intelligence/relations",
    "POST /question-intelligence/suggestions/{suggestionId}/approve",
    "POST /question-intelligence/suggestions/{suggestionId}/reject"
  ]
} as const;
