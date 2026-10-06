import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, writeFile, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  executeSemanticCoreQuotaRun,
  validateSemanticCoreCheckpoint,
  prepareSemanticCoreQualification,
  SEMANTIC_CORE_SELECTED_SUBJECT,
  SEMANTIC_CORE_SELECTED_CANONICAL_SLUG,
  SEMANTIC_CORE_QUALIFICATION_PROTOCOL,
  SEMANTIC_CORE_QUOTA_WINDOW_PROTOCOL,
  semanticCoreDigest,
  semanticCoreCaptureDigest,
  validateSemanticCoreQualificationRecord,
  SemanticCoreOpenRouterSubject
} from "../../packages/benchmark/src/index.js";
import type {
  SemanticCoreQualificationSubject,
  SemanticCoreProviderMetadata,
  SemanticCoreRunCheckpoint
} from "../../packages/benchmark/src/index.js";

const packRoot = resolve("fixtures/benchmark-packs/semantic-core-pilot-0.1.0");
const source = { gitCommit: "a".repeat(40), gitTree: "b".repeat(40) };
const metadata: SemanticCoreProviderMetadata = {
  modelId: SEMANTIC_CORE_SELECTED_SUBJECT.modelId,
  canonicalSlug: SEMANTIC_CORE_SELECTED_CANONICAL_SLUG,
  providerName: "Novita",
  route: "novita/bf16",
  status: 0,
  pricing: { prompt: "0", completion: "0" },
  supportedParameters: ["temperature", "max_tokens", "response_format", "structured_outputs"]
};
function adapter(remaining = 50): SemanticCoreQualificationSubject {
  return {
    evidenceOrigin: "SYNTHETIC_TEST",
    preflight: async () => structuredClone(metadata),
    capacity: async () => ({
      observedAt: new Date().toISOString(),
      used: 50 - remaining,
      limit: 50,
      remaining
    }),
    observe: async (input) => {
      remaining--;
      return {
        status: "RESPONSE",
        response: { schemaVersion: "0.1.0", caseId: input.caseId, status: "ABSTAIN" },
        modelId: metadata.modelId,
        providerName: metadata.providerName,
        rawResponseAvailability: "UNAVAILABLE",
        usage: { promptTokens: 1, completionTokens: 1, cost: 0 }
      };
    }
  };
}
let root: string;
let staged: string;
let first: SemanticCoreRunCheckpoint;
let second: SemanticCoreRunCheckpoint;
const execute = (directory: string, run: number, subject = adapter(), resume = true) =>
  executeSemanticCoreQuotaRun({
    directory,
    resume,
    run,
    packRoot,
    source,
    subject,
    authorizeLive: true
  });
beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "semantic-core-windows-"));
  staged = join(root, "staged");
  const subject = adapter();
  await execute(staged, 1, subject, false);
  await execute(staged, 2, subject);
  first = JSON.parse(await readFile(join(staged, "run-1.json"), "utf8"));
  second = JSON.parse(await readFile(join(staged, "run-2.json"), "utf8"));
}, 30000);
afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("prospective complete-run quota-window protocol", () => {
  it("preserves the historical protocol and blocked zero-generation record", async () => {
    const record = JSON.parse(
      await readFile("fixtures/semantic-core-qualification-0.1.0/qualification-record.json", "utf8")
    );
    expect(record.protocol).toEqual(SEMANTIC_CORE_QUALIFICATION_PROTOCOL);
    expect(record.accountedAttempts).toBe(0);
    expect(record.outcome).toBe("INSUFFICIENT_EVIDENCE");
    expect(validateSemanticCoreQualificationRecord(record)).toBe(true);
    expect(SEMANTIC_CORE_QUOTA_WINDOW_PROTOCOL.protocolVersion).toBe("0.1.1");
    expect(SEMANTIC_CORE_QUOTA_WINDOW_PROTOCOL.scheduledAttempts).toBe(72);
  });
  it("supports two complete runs with fifty requests, then blocks run three with two", async () => {
    expect(first.capture.attempts).toHaveLength(24);
    expect(second.capture.attempts).toHaveLength(48);
    const subject = adapter(2);
    const observe = vi.spyOn(subject, "observe");
    const result = await execute(staged, 3, subject);
    expect(result.collectionState).toBe("AWAITING_NEXT_QUOTA_WINDOW");
    expect(result.accountedAttempts).toBe(48);
    expect(result.outcome).toBe("INSUFFICIENT_EVIDENCE");
    expect(observe).not.toHaveBeenCalled();
  });
  it("does not start a run with capacity below twenty-four", async () => {
    const subject = adapter(23);
    const observe = vi.spyOn(subject, "observe");
    const result = await execute(join(root, "low"), 1, subject, false);
    expect(result.accountedAttempts).toBe(0);
    expect(observe).not.toHaveBeenCalled();
  });
  it("fails closed when the authenticated quota counter is unavailable or inconsistent", async () => {
    const subject = adapter();
    subject.capacity = async () => ({
      observedAt: new Date().toISOString(),
      used: 1,
      limit: 50,
      remaining: 50
    });
    await expect(execute(join(root, "bad-quota"), 1, subject, false)).rejects.toThrow(
      "PREFLIGHT_FAILURE"
    );
  });
  it("requires exactly twenty-four terminals per completed run", async () => {
    const bad = structuredClone(first);
    bad.capture.attempts.pop();
    bad.captureDigest = semanticCoreCaptureDigest(bad.capture);
    await expect(validateSemanticCoreCheckpoint(packRoot, bad)).rejects.toThrow(
      "CAPTURE_INTEGRITY_FAILURE"
    );
  });
  it("rejects duplicate attempt identifiers", async () => {
    const bad = structuredClone(first);
    bad.capture.attempts[1] = {
      ...bad.capture.attempts[1]!,
      attemptId: bad.capture.attempts[0]!.attemptId
    };
    bad.captureDigest = semanticCoreCaptureDigest(bad.capture);
    await expect(validateSemanticCoreCheckpoint(packRoot, bad)).rejects.toThrow(
      "CAPTURE_INTEGRITY_FAILURE"
    );
  });
  it("cannot overwrite or silently repeat a completed run", async () => {
    const bytes = await readFile(join(staged, "run-2.json"));
    await expect(execute(staged, 2)).rejects.toThrow("CAPTURE_INTEGRITY_FAILURE");
    await expect(execute(staged, 1, adapter(), false)).rejects.toThrow();
    expect(await readFile(join(staged, "run-2.json"))).toEqual(bytes);
  });
  it("requires the exact condition digest", async () => {
    const bad = structuredClone(first);
    bad.conditionDigest = "0".repeat(64);
    await expect(validateSemanticCoreCheckpoint(packRoot, bad)).rejects.toThrow(
      "CAPTURE_INTEGRITY_FAILURE"
    );
  });
  it.each(["model", "provider", "canonical", "route", "pricing", "parameters"])(
    "rejects material provider substitution: %s",
    async (kind) => {
      const subject = adapter();
      subject.preflight = async () => {
        const m = structuredClone(metadata);
        return {
          ...m,
          ...(kind === "model"
            ? { modelId: "test/other:free" }
            : kind === "provider"
              ? { providerName: "Other" }
              : kind === "canonical"
                ? { canonicalSlug: "apodex/other" }
                : kind === "route"
                  ? { route: "novita/other" }
                  : kind === "pricing"
                    ? { pricing: { prompt: "0.01", completion: "0" } }
                    : { supportedParameters: [...m.supportedParameters, "seed"] })
        };
      };
      const observe = vi.spyOn(subject, "observe");
      await expect(execute(staged, 3, subject)).rejects.toThrow();
      expect(observe).not.toHaveBeenCalled();
    }
  );
  it.each(["packDigest", "prompts"])("rejects frozen input substitution: %s", async (field) => {
    const bad = structuredClone(first);
    if (field === "packDigest") bad.capture.condition.packDigest = "0".repeat(64);
    else bad.capture.condition.prompts[0]!.promptDigest = "0".repeat(64);
    bad.capture.conditionDigest = semanticCoreDigest(bad.capture.condition);
    bad.conditionDigest = bad.capture.conditionDigest;
    bad.captureDigest = semanticCoreCaptureDigest(bad.capture);
    await expect(validateSemanticCoreCheckpoint(packRoot, bad)).rejects.toThrow();
  });
  it("verifies previous capture digests and rejects corrupt journals without generation", async () => {
    const directory = join(root, "corrupt");
    await cp(staged, directory, { recursive: true });
    await writeFile(join(directory, "run-1.attempts.jsonl"), "{}\n");
    const subject = adapter();
    const observe = vi.spyOn(subject, "observe");
    await expect(execute(directory, 3, subject)).rejects.toThrow();
    expect(observe).not.toHaveBeenCalled();
  });
  it("rejects an interrupted journal rather than replacing requests", async () => {
    const directory = join(root, "partial");
    await cp(staged, directory, { recursive: true });
    await writeFile(join(directory, "run-3.attempts.jsonl"), "{}\n");
    await expect(execute(directory, 3)).rejects.toThrow("CAPTURE_INTEGRITY_FAILURE");
  });
  it("audit timestamps do not change condition or normalized capture identity", async () => {
    const changed = structuredClone(first.capture);
    changed.attempts[0] = {
      ...changed.attempts[0]!,
      evaluatorExecution: {
        ...changed.attempts[0]!.evaluatorExecution,
        executedAt: "2030-01-01T00:00:00Z"
      }
    };
    expect(semanticCoreCaptureDigest(changed)).toBe(first.captureDigest);
    const p = await prepareSemanticCoreQualification(
      packRoot,
      source,
      SEMANTIC_CORE_SELECTED_SUBJECT,
      "0.1.1"
    );
    expect(p.frozen.protocol.protocolVersion).toBe("0.1.1");
    expect(
      p.frozen.studies.every((s) => s.definition.variedDimensions.includes("TIME_WINDOW"))
    ).toBe(true);
  });
  it("quota reset permits the last complete run without changing identity or earlier bytes", async () => {
    const directory = join(root, "finished");
    await cp(staged, directory, { recursive: true });
    const paths = [
      "condition.json",
      "run-1.json",
      "run-2.json",
      "run-1.attempts.jsonl",
      "run-2.attempts.jsonl"
    ];
    const bytes = await Promise.all(paths.map((p) => readFile(join(directory, p))));
    const result = await execute(directory, 3, adapter(50));
    expect(result.collectionState).toBe("COMPLETE");
    expect(result.accountedAttempts).toBe(72);
    expect(result.result?.mode).toBe("LIVE");
    expect(result.result?.capture?.conditionDigest).toBe(first.conditionDigest);
    expect(result.outcome).toBe("INSUFFICIENT_EVIDENCE"); // Synthetic data cannot qualify.
    const final = JSON.parse(await readFile(join(directory, "qualification.json"), "utf8"));
    expect(validateSemanticCoreQualificationRecord(final.qualification)).toBe(true);
    expect(final.regression.exact).toBe(true);
    for (const [i, p] of paths.entries())
      expect(await readFile(join(directory, p))).toEqual(bytes[i]);
  }, 30000);
  it("transport failures remain terminal and are never retried", async () => {
    const subject = adapter();
    const observe = vi.fn(async () => {
      throw new Error("do not log this");
    });
    subject.observe = observe;
    const result = await execute(join(root, "errors"), 1, subject, false);
    expect(observe).toHaveBeenCalledTimes(24);
    expect(result.accountedAttempts).toBe(24);
    expect(result.outcome).toBe("INSUFFICIENT_EVIDENCE");
    expect(
      result.result?.capture?.attempts.every((a) => a.evaluation.state === "SUBJECT_ERROR")
    ).toBe(true);
  }, 30000);
  it("projects only request quota fields from authenticated account metadata", async () => {
    const http = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            data: {
              label: "never retain",
              usage_daily: 999,
              limit_remaining: 999,
              free_model_daily_requests: { used: 2, limit: 50, remaining: 48 }
            }
          })
        )
    );
    const subject = new SemanticCoreOpenRouterSubject(() => "transport-secret", http);
    const quota = await subject.capacity();
    expect(quota.remaining).toBe(48);
    expect(Object.keys(quota).sort()).toEqual(["limit", "observedAt", "remaining", "used"]);
  });
});
