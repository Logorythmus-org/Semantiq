import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";

// This integration-style check launches Docker Compose through the health script. GitHub-hosted
// runners have completed that real probe in nearly 6 seconds, but under the full
// regression load Docker Compose can exceed 10 seconds. Keep a bounded subprocess
// timeout (30s) with a small margin for Vitest to report its result.
const HEALTH_SCRIPT_TIMEOUT_MS = 30_000;
const TEST_TIMEOUT_MS = 35_000;

describe("repository health script", () => {
  it(
    "runs without modifying data and reports required local checks",
    () => {
      const result = spawnSync(process.execPath, ["scripts/repository-health.mjs"], {
        cwd: process.cwd(),
        encoding: "utf8",
        timeout: HEALTH_SCRIPT_TIMEOUT_MS
      });

      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("package manifest");
      expect(result.stdout).toContain("config package");
      expect(result.stdout).toContain("docker compose config");
    },
    TEST_TIMEOUT_MS
  );
});
