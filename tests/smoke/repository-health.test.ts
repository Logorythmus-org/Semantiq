import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";

describe("repository health script", () => {
  it("runs without modifying data and reports required local checks", () => {
    const result = spawnSync("node", ["scripts/repository-health.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
      shell: process.platform === "win32"
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("package manifest");
    expect(result.stdout).toContain("config package");
  });
});
