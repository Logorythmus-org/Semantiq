import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Clean Install Smoke Verification", () => {
  it("verifies essential project manifests exist", () => {
    expect(existsSync("package.json")).toBe(true);
    expect(existsSync("pnpm-workspace.yaml")).toBe(true);
    expect(existsSync(".env.example")).toBe(true);
    expect(existsSync(".env.test.example")).toBe(true);
    expect(existsSync("README.md")).toBe(true);
    expect(existsSync("LICENSE")).toBe(true);
  });

  it("verifies package directories are configured", () => {
    expect(existsSync("packages/config/src/index.ts")).toBe(true);
    expect(existsSync("packages/shared/src/index.ts")).toBe(true);
    expect(existsSync("packages/semantiq/src/index.ts")).toBe(true);
    expect(existsSync("packages/diagnostics/src/index.ts")).toBe(true);
    expect(existsSync("packages/alpha-runtime/src/index.ts")).toBe(true);
  });
});
