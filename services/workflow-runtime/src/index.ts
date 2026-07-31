export const workflowRuntimeService = {
  name: "workflow-runtime",
  framework: "FastAPI",
  health: { path: "/health", status: "healthy", dependencies: ["@tech-club/sprint3-runtime", "@tech-club/workflow-runtime"] },
  routes: ["POST /workflows", "POST /workflows/{workflowId}/run", "POST /workflows/{workflowId}/pause", "POST /workflows/{workflowId}/resume", "POST /workflows/{workflowId}/cancel"]
} as const;
