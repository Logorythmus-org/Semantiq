import { describe, expect, it } from "vitest";
import { EvidenceNormalizer } from "../../packages/evidence-normalizer/src/index.js";
import {
  canonicalJson,
  computeSha256,
  hashCanonical,
  SHARED_CANONICALIZATION_PROFILE,
  type EnvironmentSpec,
  type ExecutionRequest,
  type ExecutionResult,
  type StateDelta
} from "../../packages/sandbox-contracts/src/index.js";

/**
 * Bounded characterization for #192.
 *
 * The legacy normalizer's top-level-key JSON.stringify replacer
 * is exercised without changing production hashing semantics.
 * A future fix requires caller analysis and compatibility review.
 */
describe("evidence normalization digest preimage characterization (#192)", () => {
  const sample = (exitCode: number, environmentValue: string) => ({
    evidenceId: "fixed-fixture",
    normalizedAt: "2026-10-10T00:00:00.000Z",
    context: {
      environmentVariables: { TEST_VALUE: environmentValue }
    },
    result: {
      exitCode,
      timedOut: false
    },
    consequence: {
      filesCreated: [{ path: "out.txt", sha256: "sample" }]
    }
  });

  it("demonstrates that the legacy array replacer omits nested evidence changes", () => {
    const success = sample(0, "first");
    const failure = sample(1, "second");
    const legacyPreimage = (value: typeof success): string => {
      return JSON.stringify(value, Object.keys(value).sort());
    };

    expect(legacyPreimage(success)).toBe(legacyPreimage(failure));
    expect(legacyPreimage(success)).toContain('"result":{}');
    expect(legacyPreimage(success)).toContain('"context":{}');

    // Only a characterization, not a production normalizer repair.
    expect(canonicalJson(success)).not.toBe(canonicalJson(failure));
  });

  it("demonstrates that the shared canonical profile retains nested fields", () => {
    const success = sample(0, "first");
    const failure = sample(1, "second");

    const a = hashCanonical(success, { profile: SHARED_CANONICALIZATION_PROFILE });
    const b = hashCanonical(failure, { profile: SHARED_CANONICALIZATION_PROFILE });

    expect(a.canonicalization.profile).toBe("semantiq-canonical-json-v1");
    expect(a.canonicalUtf8).toContain('"exitCode":0');
    expect(b.canonicalUtf8).toContain('"exitCode":1');
    expect(a.sha256).not.toBe(b.sha256);
  });

  it("normalizes nested key order for otherwise equivalent objects", () => {
    const left = {
      result: { exitCode: 0, timedOut: false },
      context: { environmentVariables: { A: "a", B: "b" } }
    };
    const right = {
      context: { environmentVariables: { B: "b", A: "a" } },
      result: { timedOut: false, exitCode: 0 }
    };

    expect(canonicalJson(left)).toBe(canonicalJson(right));
    const hashLeft = hashCanonical(left, { profile: SHARED_CANONICALIZATION_PROFILE });
    const hashRight = hashCanonical(right, { profile: SHARED_CANONICALIZATION_PROFILE });

    expect(hashLeft.sha256).toBe(hashRight.sha256);
  });

  it("links the actual EvidenceNormalizer output to the omitted nested fields", async () => {
    const spec: EnvironmentSpec = {
      specVersion: "1.0.0",
      runtimeType: "container",
      image: { name: "fixture-image", digest: "sha256:fixture-image" },
      workingDirectory: "/workspace",
      environmentVariables: { SEMANTIQ_TASK_ID: "fixture-task" },
      resources: {
        cpuLimitCores: 1,
        memoryLimitMebibytes: 512,
        diskLimitMebibytes: 1024,
        maxExecutionTimeoutSeconds: 5
      },
      security: { networkMode: "none", readOnlyRootFilesystem: true }
    };
    const request: ExecutionRequest = {
      requestId: "fixture-request",
      command: ["true"],
      timeoutMs: 1000
    };
    const result: ExecutionResult = {
      requestId: "fixture-request",
      exitCode: 0,
      stdout: "",
      stderr: "",
      stdoutTruncated: false,
      stderrTruncated: false,
      durationMs: 1,
      peakMemoryBytes: 0,
      timedOut: false,
      oomKilled: false
    };
    const delta: StateDelta = {
      deltaId: "fixture-delta",
      fromCheckpoint: "before",
      toCheckpoint: "after",
      timestamp: "2026-10-10T00:00:00.000Z",
      mutations: { createdFiles: [], modifiedFiles: [], deletedFiles: [] }
    };
    const emitted = await new EvidenceNormalizer().normalize({
      spec,
      request,
      result,
      delta,
      providerId: "fixture",
      providerVersion: "1.0.0"
    });

    // Keep random envelope metadata exactly as emitted; mutate only the nested result.
    const { evidenceDigest, ...payload } = emitted;
    const changed = { ...payload, result: { ...payload.result, exitCode: 9 } };
    const legacyHash = (value: typeof payload): string =>
      computeSha256(JSON.stringify(value, Object.keys(value).sort()));

    expect(evidenceDigest).toBe(`sha256:${legacyHash(payload)}`);
    expect(legacyHash(changed)).toBe(legacyHash(payload));
    expect(canonicalJson(changed)).not.toBe(canonicalJson(payload));
  });
});
