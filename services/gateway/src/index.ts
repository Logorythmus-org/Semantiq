export interface GatewayConfig {
  readonly port: number;
  readonly host: string;
}

export const gatewayService = {
  name: "api-gateway",
  health: "healthy",
  endpoint: "/health",
  routes: [
    "identity",
    "workspace",
    "question",
    "graph",
    "semantiq",
    "research",
    "community",
    "agent-runtime",
    "workflow-runtime",
    "search"
  ]
} as const;
