import { describe, it, expect } from "vitest";
import { IsolatedValidatorEngine } from "../../packages/semantiq/src/isolated-validator.js";

describe("Isolated Install, Build, and Test Validation (Prompt 11.11)", () => {
  const engine = new IsolatedValidatorEngine();

  const env = engine.buildEnvironment("v22.15.0", "pnpm", "11.7.0", "Windows 10.0.26200", "AMD64");

  it("builds a valid runtime environment record", () => {
    expect(env.nodeVersion).toBe("v22.15.0");
    expect(env.packageManager).toBe("pnpm");
    expect(env.packageManagerVersion).toBe("11.7.0");
    expect(env.os).toBe("Windows 10.0.26200");
    expect(env.architecture).toBe("AMD64");
  });

  it("evaluates a passing step correctly", () => {
    const step = engine.evaluateStep("typecheck", "pnpm typecheck", 0);
    expect(step.result).toBe("PASSED");
    expect(step.exitCode).toBe(0);
  });

  it("evaluates a failing step correctly", () => {
    const step = engine.evaluateStep("broken-cmd", "pnpm run nonexistent", 1);
    expect(step.result).toBe("FAILED");
  });

  it("builds a passing suite when all steps pass", () => {
    const steps = [
      engine.evaluateStep("install", "pnpm install --frozen-lockfile", 0),
      engine.evaluateStep("typecheck", "pnpm typecheck", 0),
      engine.evaluateStep("boundary", "node scripts/boundary-validator.mjs", 0),
      engine.evaluateStep("test", "pnpm test", 0)
    ];
    const suite = engine.buildSuite(env, steps);
    expect(suite.overallPassed).toBe(true);
    expect(suite.passedSteps).toBe(4);
    expect(suite.failedSteps).toBe(0);
  });
});
