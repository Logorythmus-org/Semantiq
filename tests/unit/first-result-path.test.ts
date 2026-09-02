import { spawnSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  createFirstResultArtifact,
  FIRST_RESULT_OUTPUT_PATH
} from "../../tools/automation/first-result.js";

const testOutputDirectory = `artifacts/first-result/test-${process.pid}`;
const commandOutputPath = `${testOutputDirectory}/command-result.json`;
const secondOutputPath = `${testOutputDirectory}/second-result.json`;

afterAll(() => {
  rmSync(resolve(testOutputDirectory), { recursive: true, force: true });
});

describe("canonical newcomer first-result path", () => {
  it("executes the public command and persists a bounded internal synthetic artifact", () => {
    const result = spawnSync(`pnpm first-result -- --output ${commandOutputPath}`, {
      cwd: process.cwd(),
      encoding: "utf8",
      shell: true
    });

    expect(result.status, result.stderr ?? result.error?.message).toBe(0);
    expect(result.stdout ?? "").toContain(commandOutputPath);

    const artifact = JSON.parse(readFileSync(resolve(commandOutputPath), "utf8"));
    expect(artifact.schemaVersion).toBe("1.0.0");
    expect(artifact.software).toEqual({
      name: "SemantIQ",
      releaseVersion: "0.1.0-alpha.2",
      maturity: "Public Alpha (Experimental)"
    });
    expect(artifact.evidenceClassification).toEqual({
      origin: "internal",
      input: "synthetic",
      replicationStatus: "not-independent-replication"
    });
    expect(artifact.result.sourceContract).toBe("BenchmarkReport");
    expect(artifact.result.payload.weightedScore).toBe(0.1);
    expect(artifact.limitations.join(" ")).toContain("not external replication");
    expect(artifact.limitations.join(" ")).toContain("Production scoring logic is not implemented");
  });

  it("writes byte-identical JSON for the same source and fixture", async () => {
    const first = await createFirstResultArtifact(commandOutputPath);
    const second = await createFirstResultArtifact(secondOutputPath);

    expect(first.outputPath).toBe(commandOutputPath);
    expect(second.outputPath).toBe(secondOutputPath);
    expect(readFileSync(resolve(commandOutputPath), "utf8")).toBe(
      readFileSync(resolve(secondOutputPath), "utf8")
    );
  });

  it("rejects output outside the ignored artifacts boundary", () => {
    const result = spawnSync("pnpm first-result -- --output README.md", {
      cwd: process.cwd(),
      encoding: "utf8",
      shell: true
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr ?? "").toContain(
      "must be a file below the repository artifacts directory"
    );
  });

  it("keeps the canonical generated path under the existing ignored artifact root", () => {
    expect(FIRST_RESULT_OUTPUT_PATH).toBe("artifacts/first-result/semantiq-result.json");
  });
});
