export const agentRuntimeService = {
  name: "agent-runtime",
  framework: "FastAPI",
  health: { path: "/health", status: "healthy", dependencies: ["@tech-club/sprint3-runtime", "@tech-club/agent-runtime"] },
  routes: ["POST /goals", "POST /goals/{goalId}/plan", "POST /agents", "GET /agents", "POST /tasks/{taskId}/delegate", "POST /memory", "GET /memory", "POST /reflection", "POST /learning", "POST /approvals/{approvalId}/grant"]
} as const;
