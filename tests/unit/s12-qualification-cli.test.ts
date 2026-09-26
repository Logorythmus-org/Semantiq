import { spawnSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  S12_CONFIG_DIGEST_10T,
  S12_CONFIG_DIGEST_20T,
  S12_EXECUTION_STRATA,
  s12ProspectiveConfigDigest
} from "../../packages/benchmark/src/s12-openrouter-feasibility.js";

const repoRoot = process.cwd();
const tsxCli = path.join(repoRoot, "node_modules/tsx/dist/cli.mjs");
const qualificationCli = path.join(repoRoot, "scripts/s12-qualification.ts");
const conditionPrefix = "S12_EXECUTION_CONDITION ";

function runCli(...args: string[]) {
  const env = { ...process.env };
  delete env["OPENROUTER_API_KEY"];
  return spawnSync(process.execPath, [tsxCli, qualificationCli, "--mode", "live", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env
  });
}

function visibleCondition(stderr: string) {
  const line = stderr.split(/\r?\n/).find((value) => value.startsWith(conditionPrefix));
  if (!line) throw new Error("CLI did not print its execution condition.");
  return JSON.parse(line.slice(conditionPrefix.length)) as Record<string, unknown>;
}

describe("S12 qualification CLI execution stratum", () => {
  it("defaults to the governed 10T condition and displays it before live authorization", () => {
    const result = runCli();
    expect(result.status).toBe(0);
    expect(visibleCondition(result.stderr)).toEqual({
      ...S12_EXECUTION_STRATA.S12_10_TURNS,
      configurationDigest: s12ProspectiveConfigDigest(S12_EXECUTION_STRATA.S12_10_TURNS)
    });
    expect(S12_CONFIG_DIGEST_10T).toBe(
      "ce76a75ceb128f2444cd3b89b9c763e29f747a4682f436185f17b4f5db7b4da7"
    );
    expect(JSON.parse(result.stdout)).toMatchObject({
      failure: "LIVE_AUTHORIZATION_REQUIRED",
      REAL_GENERATION_REQUESTS: 0
    });
  });

  it("accepts explicit 10T and resolves it to the same governed condition", () => {
    const result = runCli("--execution-stratum", "10t");
    expect(result.status).toBe(0);
    expect(visibleCondition(result.stderr)).toEqual({
      ...S12_EXECUTION_STRATA.S12_10_TURNS,
      configurationDigest: S12_CONFIG_DIGEST_10T
    });
  });

  it("accepts explicit 20T from the existing contract with its distinct digest", () => {
    const result = runCli("--execution-stratum", "20t");
    expect(result.status).toBe(0);
    const condition = visibleCondition(result.stderr);
    expect(condition).toEqual({
      ...S12_EXECUTION_STRATA.S12_20_TURNS,
      configurationDigest: s12ProspectiveConfigDigest(S12_EXECUTION_STRATA.S12_20_TURNS)
    });
    expect(condition).toMatchObject({
      maxModelTurns: 20,
      maxSubjectAttempts: 1,
      automaticSubjectRetries: 0,
      maxAttemptWallTimeMs: 1_800_000,
      routing: "FREE_ONLY"
    });
    expect(S12_CONFIG_DIGEST_20T).toBe(
      "cec57b0d6dc8d3c84ea3df97bab48e503f9801479b311ef7be631b55e0bdd972"
    );
  });

  it("rejects unsupported selectors before workspace, transport, or attempt setup", () => {
    const result = runCli("--authorize-live", "--execution-stratum", "30t");
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("Unsupported --execution-stratum value");
    expect(result.stderr).not.toContain(conditionPrefix);
    expect(result.stdout).toBe("");
  });

  it("rejects a missing selector value instead of applying the default", () => {
    const result = runCli("--authorize-live", "--execution-stratum");
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("--execution-stratum requires a value");
    expect(result.stderr).not.toContain(conditionPrefix);
    expect(result.stdout).toBe("");
  });

  it("rejects an empty equals-form selector value", () => {
    const result = runCli("--authorize-live", "--execution-stratum=");
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("--execution-stratum requires a value");
    expect(result.stderr).not.toContain(conditionPrefix);
    expect(result.stdout).toBe("");
  });

  it("rejects duplicate selectors as ambiguous", () => {
    const result = runCli(
      "--authorize-live",
      "--execution-stratum",
      "10t",
      "--execution-stratum",
      "20t"
    );
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("--execution-stratum may be provided only once");
    expect(result.stderr).not.toContain(conditionPrefix);
    expect(result.stdout).toBe("");
  });
});
