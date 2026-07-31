import type { HealthCheck } from "../../shared/src/index.js";
import type { SqlClient } from "./client.js";

export async function checkDatabaseHealth(client: SqlClient): Promise<HealthCheck> {
  const started = performance.now();
  try {
    await client.query("SELECT 1");
    return {
      component: "postgresql",
      status: "healthy",
      message: "Database connection available",
      latencyMs: Math.round(performance.now() - started),
      checkedAt: new Date()
    };
  } catch {
    return {
      component: "postgresql",
      status: "unhealthy",
      message: "Database connection unavailable",
      latencyMs: Math.round(performance.now() - started),
      checkedAt: new Date()
    };
  }
}
