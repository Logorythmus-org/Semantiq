export const remoteExecutionService = {
  name: "remote-execution",
  framework: "FastAPI",
  health: { path: "/health", status: "healthy", dependencies: ["@tech-club/sprint5-runtime"] },
  routes: ["POST /remote-execution/requests", "POST /remote-execution/{requestId}/approve", "POST /remote-execution/{requestId}/execute", "POST /remote-execution/{requestId}/cancel"]
} as const;
