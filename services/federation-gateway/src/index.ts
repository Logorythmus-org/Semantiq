export const federationGatewayService = {
  name: "federation-gateway",
  framework: "FastAPI",
  health: { path: "/health", status: "healthy", dependencies: ["@tech-club/sprint5-runtime"] },
  routes: [
    "POST /federation/messages",
    "GET /federation/health",
    "POST /federation/invitations",
    "POST /federation/agreements"
  ]
} as const;
