export const federatedSearchService = {
  name: "federated-search",
  framework: "FastAPI",
  health: { path: "/health", status: "healthy", dependencies: ["@tech-club/sprint5-runtime"] },
  routes: [
    "GET /federation/search",
    "GET /federation/results/{resultId}",
    "POST /federation/remote-references/{referenceId}/resolve"
  ]
} as const;
