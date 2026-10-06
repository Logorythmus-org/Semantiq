import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { mkdtemp, readFile, writeFile, cp, rm, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import {
  prepareSemanticCoreLocalCondition,
  LOCAL_SUPERSEDED_CONDITION,
  LOCAL_REQUIRED_CHECKS
} from "../../packages/benchmark/src/semantic-core-local-condition.js";
import {
  executeSemanticCoreLocalRun,
  assertSemanticCoreExternalCollection,
  validateSemanticCoreLocalCheckpoint
} from "../../packages/benchmark/src/semantic-core-local-runner.js";
import { finalizeSemanticCoreLocalStudy } from "../../packages/benchmark/src/semantic-core-local-study.js";
import { SemanticCoreLocalTransport } from "../../packages/benchmark/src/semantic-core-local-transport.js";
import { parseSemanticCoreLocalArguments } from "../../packages/benchmark/src/semantic-core-local-cli.js";
import { semanticCoreDigest } from "../../packages/benchmark/src/semantic-core-openrouter.js";
import type { SemanticCoreLocalFrozenFile } from "../../packages/benchmark/src/semantic-core-local-condition.js";
import type { SemanticCoreLocalClock } from "../../packages/benchmark/src/semantic-core-local-runner.js";

const repositoryRoot = resolve(".");
const packRoot = join(repositoryRoot, "fixtures/benchmark-packs/semantic-core-pilot-0.1.0");
const source = { gitCommit: "a".repeat(40), gitTree: "b".repeat(40) };
let root: string;
let conditionFile: string;
let validationFile: string;
let frozen: SemanticCoreLocalFrozenFile;
let prepared: Awaited<ReturnType<typeof prepareSemanticCoreLocalCondition>>;
let ordinal = 0;
const directory = () => join(root, `collection-${ordinal++}`);
function clock() {
  let elapsed = 0;
  const start = Date.parse("2026-10-06T00:00:00Z");
  const waits: number[] = [];
  return {
    now: () => start + elapsed,
    monotonic: () => elapsed,
    sleep: async (ms: number) => {
      waits.push(ms);
      elapsed += ms;
    },
    advance: (ms: number) => {
      elapsed += ms;
    },
    waits
  } satisfies SemanticCoreLocalClock & { advance(ms: number): void; waits: number[] };
}
function fake(
  options: {
    remaining?: number;
    drift?: boolean;
    content?: (caseId: string, optionId: string, index: number) => unknown;
    failAt?: number;
    failEvery?: boolean;
    wrongModelAt?: number;
    costAt?: number;
    credentialLossAt?: number;
    credentialHook?: () => void;
  } = {}
) {
  let remaining = options.remaining ?? 50;
  const wires: Record<string, unknown>[] = [];
  const starts: number[] = [];
  let gets = 0;
  const http = async (url: string | URL | Request, init?: RequestInit) => {
    const path = String(url);
    if (init?.method === "POST") {
      const wire = JSON.parse(String(init.body));
      wires.push(wire);
      const input = JSON.parse(wire.messages[1].content);
      const index = wires.length - 1;
      if (options.credentialLossAt === index) throw new Error("CREDENTIAL_UNAVAILABLE");
      remaining--;
      if (options.failEvery || options.failAt === index)
        return new Response(
          JSON.stringify({
            error: {
              code: 400,
              message: "PRIVATE_ERROR_SENTINEL",
              metadata: { provider_name: "Novita" }
            }
          }),
          { status: 400 }
        );
      const content = options.content
        ? options.content(input.caseId, input.options[0].optionId, index)
        : JSON.stringify({
            schemaVersion: "0.1.0",
            caseId: input.caseId,
            status: "ANSWER",
            selectedOptionId: input.options[0].optionId
          });
      return new Response(
        JSON.stringify({
          model: options.wrongModelAt === index ? "another/model" : frozen.condition.subject.model,
          provider: "Novita",
          usage: {
            prompt_tokens: 10,
            completion_tokens: 10,
            cost: options.costAt === index ? 0.1 : 0
          },
          choices: [
            {
              finish_reason: "stop",
              message: {
                content,
                reasoning: "PRIVATE_REASONING_SENTINEL",
                reasoning_details: [{ text: "PRIVATE_REASONING_SENTINEL" }]
              }
            }
          ]
        }),
        { status: 200 }
      );
    }
    gets++;
    const metadata = frozen.condition.endpointProvenance.metadata;
    if (path.endsWith("/key"))
      return new Response(
        JSON.stringify({
          data: { free_model_daily_requests: { used: 50 - remaining, remaining, limit: 50 } }
        })
      );
    if (path.endsWith("/providers"))
      return new Response(JSON.stringify({ data: [{ name: "Novita", slug: "novita" }] }));
    if (path.endsWith("/endpoints"))
      return new Response(
        JSON.stringify({
          data: {
            endpoints: [
              {
                model_id: metadata.modelId,
                tag: metadata.discoveryEndpointTag,
                provider_name: options.drift ? "Other" : metadata.providerName,
                status: 0,
                pricing: metadata.pricing,
                supported_parameters: metadata.supportedParameters,
                max_completion_tokens: metadata.maxCompletionTokens
              }
            ]
          }
        })
      );
    return new Response(
      JSON.stringify({
        data: [
          {
            id: metadata.modelId,
            canonical_slug: metadata.canonicalSlug,
            pricing: metadata.pricing
          }
        ]
      })
    );
  };
  return {
    transport: new SemanticCoreLocalTransport(
      () => {
        options.credentialHook?.();
        return "TRANSPORT_ONLY_CREDENTIAL_SENTINEL";
      },
      http as typeof fetch
    ),
    wires,
    starts,
    get gets() {
      return gets;
    },
    reset: () => {
      remaining = 50;
    }
  };
}
const execute = (
  collection: string,
  run: number,
  provider = fake(),
  time = clock(),
  extras: Partial<Parameters<typeof executeSemanticCoreLocalRun>[0]> = {}
) =>
  executeSemanticCoreLocalRun({
    repositoryRoot,
    packRoot,
    conditionFile,
    validationFile,
    collection,
    run,
    authorizeLive: true,
    transport: provider.transport,
    evidenceOrigin: "SYNTHETIC_TEST",
    clock: time,
    sourceSnapshot: () => ({ source, status: "" }),
    ...extras
  });
const readLines = async (path: string) =>
  (await readFile(path, "utf8"))
    .trimEnd()
    .split("\n")
    .map((line) => JSON.parse(line));
beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "semantic-core-local-runner-"));
  prepared = await prepareSemanticCoreLocalCondition(repositoryRoot, packRoot, source);
  frozen = {
    freezeStatus: "ACTIVE_PROSPECTIVE_EMPIRICAL_CONDITION",
    empiricalAttempts: 0,
    qualificationOutcome: "INSUFFICIENT_EVIDENCE",
    supersedes: LOCAL_SUPERSEDED_CONDITION,
    condition: prepared.condition,
    conditionDigest: semanticCoreDigest(prepared.condition)
  };
  conditionFile = join(root, "condition.json");
  validationFile = join(root, "clearance.json");
  await writeFile(conditionFile, JSON.stringify(frozen));
  await writeFile(
    validationFile,
    JSON.stringify({
      source,
      pr: {
        headRefOid: source.gitCommit,
        baseRefName: "main",
        state: "OPEN",
        isDraft: true,
        statusCheckRollup: LOCAL_REQUIRED_CHECKS.map((name) => ({
          name,
          status: "COMPLETED",
          conclusion: "SUCCESS"
        }))
      }
    })
  );
});
afterAll(async () => {
  if (!resolve(root).startsWith(resolve(tmpdir()) + sep)) throw new Error("UNSAFE_TEST_CLEANUP");
  await rm(root, { recursive: true, force: true });
});

describe("dedicated 0.1.3 empirical runner, fake transport only", () => {
  it.each(["0.1.0", "0.1.1", "0.1.2"])(
    "protects every historical directory %s before transport",
    async (version) => {
      const provider = fake();
      const target = join(
        repositoryRoot,
        `fixtures/semantic-core-qualification-${version}/forbidden-live`
      );
      await expect(execute(target, 1, provider)).rejects.toThrow("PREFLIGHT_FAILURE");
      expect(provider.wires).toHaveLength(0);
      expect(provider.gets).toBe(0);
    }
  );
  it("rejects relative collections and source paths, including the primary checkout", async () => {
    for (const target of [
      "relative-live",
      repositoryRoot,
      join(repositoryRoot, "new-live"),
      resolve(repositoryRoot, "..", "outside-worktree-still-inside-repository")
    ])
      await expect(assertSemanticCoreExternalCollection(repositoryRoot, target)).rejects.toThrow(
        "PREFLIGHT_FAILURE"
      );
  });
  it("requires an exclusively new collection and never rewrites existing contents", async () => {
    const provider = fake();
    await expect(execute(root, 1, provider)).rejects.toThrow("CAPTURE_INTEGRITY_FAILURE");
    expect(provider.wires).toHaveLength(0);
  });
  it.each([
    "digest",
    "protocol",
    "source",
    "pack",
    "case",
    "prompt",
    "wire",
    "parser",
    "evaluator",
    "metric",
    "order",
    "subject",
    "superseded",
    "private-envelope"
  ])("rejects frozen %s substitution before any provider call", async (kind) => {
    const bad = structuredClone(frozen);
    if (kind === "digest") bad.conditionDigest = "0".repeat(64);
    else if (kind === "protocol")
      Object.assign(bad.condition.protocol, { protocolVersion: "0.1.1" });
    else if (kind === "source") bad.condition.source.gitCommit = "c".repeat(40);
    else if (kind === "pack") bad.condition.packDigest = "0".repeat(64);
    else if (kind === "case")
      Object.assign(bad.condition.cases[0]!.caseDigest, { value: "0".repeat(64) });
    else if (kind === "prompt") bad.condition.cases[0]!.promptDigest = "0".repeat(64);
    else if (kind === "wire") bad.condition.cases[0]!.wireRequestDigest = "0".repeat(64);
    else if (kind === "parser") Object.assign(bad.condition.protocol, { parserPolicy: "FUZZY" });
    else if (kind === "evaluator")
      Object.assign(bad.condition.evaluatorConfiguration, { configurationDigest: "0".repeat(64) });
    else if (kind === "metric")
      Object.assign(bad.condition.metrics[0]!, { metricVersion: "9.0.0" });
    else if (kind === "order") bad.condition.runOrder[0]!.caseIds.reverse();
    else if (kind === "subject") Object.assign(bad.condition.subject, { maxTokens: 128 });
    else if (kind === "private-envelope") Object.assign(bad, { credential: "PRIVATE_NOT_ALLOWED" });
    else Object.assign(bad, { freezeStatus: "SUPERSEDED_BEFORE_EMPIRICAL_COLLECTION" });
    if (kind !== "digest") bad.conditionDigest = semanticCoreDigest(bad.condition);
    const path = join(root, `wrong-${kind}.json`);
    await writeFile(path, JSON.stringify(bad));
    const provider = fake();
    await expect(
      execute(directory(), 1, provider, clock(), { conditionFile: path })
    ).rejects.toThrow("IDENTITY_SUBSTITUTION");
    expect(provider.wires).toHaveLength(0);
    expect(provider.gets).toBe(0);
  });
  it("rejects dirty source, later HEAD and missing/mismatched CI clearance", async () => {
    for (const snapshot of [
      { source, status: "?? dirty" },
      { source: { ...source, gitCommit: "c".repeat(40) }, status: "" }
    ])
      await expect(
        execute(directory(), 1, fake(), clock(), { sourceSnapshot: () => snapshot })
      ).rejects.toThrow("IDENTITY_SUBSTITUTION");
    const path = join(root, "wrong-clearance.json");
    await writeFile(path, JSON.stringify({ source, pr: { headRefOid: "c".repeat(40) } }));
    const provider = fake();
    await expect(
      execute(directory(), 1, provider, clock(), { validationFile: path })
    ).rejects.toThrow("IDENTITY_SUBSTITUTION");
    expect(provider.wires).toHaveLength(0);
  });
  it("disallows test source/clock bypasses for live-provider records", async () => {
    await expect(
      execute(directory(), 1, fake(), clock(), { evidenceOrigin: "LIVE_PROVIDER" })
    ).rejects.toThrow("PREFLIGHT_FAILURE");
  });
  it("requires fresh eligible routing and 24 free requests before starting", async () => {
    for (const provider of [fake({ remaining: 23 }), fake({ drift: true })]) {
      await expect(execute(directory(), 1, provider)).rejects.toThrow();
      expect(provider.wires).toHaveLength(0);
    }
  });
  it("runs exactly 24 fresh ordinary requests, preserves failures and paces starts", async () => {
    const provider = fake({
      failAt: 8,
      content: (caseId, optionId, index) => {
        const valid = JSON.stringify({
          schemaVersion: "0.1.0",
          caseId,
          status: "ANSWER",
          selectedOptionId: optionId
        });
        return index === 1
          ? "not JSON"
          : index === 2
            ? "Here is JSON: " + valid
            : index === 3
              ? "```json\n" + valid + "\n```"
              : index === 4
                ? ""
                : index === 5
                  ? null
                  : index === 6
                    ? JSON.stringify({ schemaVersion: "0.1.0", caseId: "wrong", status: "ABSTAIN" })
                    : index === 7
                      ? JSON.stringify({
                          schemaVersion: "0.1.0",
                          caseId,
                          status: "ANSWER",
                          selectedOptionId: "not-offered"
                        })
                      : valid;
      }
    });
    const time = clock();
    const collection = directory();
    const result = await execute(collection, 1, provider, time);
    expect(result.accountedAttempts).toBe(24);
    expect(result.qualificationOutcome).toBe("INSUFFICIENT_EVIDENCE");
    expect(provider.wires).toHaveLength(24);
    const records = await readLines(join(collection, "run-1.attempts.jsonl"));
    const attempts = records.map((entry) => entry.attempt);
    expect(attempts.slice(0, 9).map((a) => a.observation.status)).toEqual([
      "RESPONSE",
      "MALFORMED",
      "MALFORMED",
      "MALFORMED",
      "MISSING",
      "MISSING",
      "MALFORMED",
      "MALFORMED",
      "ERROR"
    ]);
    expect(attempts[8].transport.httpStatus).toBe(400);
    expect(attempts[8].transport.returnedProvider).toBe("Novita");
    expect(attempts[8].transport.error).toBe("PROVIDER_REJECTION");
    expect(attempts.every((a) => a.replayExact)).toBe(true);
    expect(time.waits).toHaveLength(23);
    expect(time.waits.every((ms) => ms >= 3500)).toBe(true);
    for (const [index, wire] of provider.wires.entries()) {
      for (const field of [
        "response_format",
        "reasoning",
        "include_reasoning",
        "tools",
        "models",
        "plugins"
      ])
        expect(wire).not.toHaveProperty(field);
      expect(wire).toMatchObject({
        model: frozen.condition.subject.model,
        temperature: 0,
        max_tokens: 4096,
        provider: {
          only: ["novita"],
          order: ["novita"],
          allow_fallbacks: false,
          require_parameters: true,
          max_price: { prompt: 0, completion: 0 }
        }
      });
      expect(wire.messages).toHaveLength(2);
      expect(JSON.stringify(wire)).not.toMatch(
        /"oracle"|"target"|"dimensionId"|previousResult|PRIVATE_/
      );
      expect(semanticCoreDigest(wire)).toBe(frozen.condition.cases[index]!.wireRequestDigest);
    }
    const bytes = (await readdir(collection)).map((name) => name);
    expect(bytes).not.toContain("qualification.json");
    const contents = (
      await Promise.all(bytes.map((name) => readFile(join(collection, name), "utf8")))
    ).join("\n");
    expect(contents).not.toMatch(
      /TRANSPORT_ONLY_CREDENTIAL_SENTINEL|PRIVATE_REASONING_SENTINEL|PRIVATE_ERROR_SENTINEL/
    );
    expect(JSON.parse(await readFile(join(collection, "condition.json"), "utf8"))).toEqual(frozen);
    await validateSemanticCoreLocalCheckpoint(
      collection,
      frozen.condition,
      frozen.conditionDigest,
      prepared.items,
      1,
      null
    );
  });
  it("paces from actual POST submission rather than the earlier synced intent", async () => {
    const time = clock();
    let credentialReads = 0;
    const provider = fake({
      credentialHook: () => {
        if (++credentialReads === 5) time.advance(2000);
      }
    });
    const collection = directory();
    await execute(collection, 1, provider, time);
    const lines = await readLines(join(collection, "run-1.attempts.jsonl"));
    expect(
      Date.parse(lines[0].attempt.requestStartedAt) - Date.parse(lines[0].attempt.requestIntentAt)
    ).toBe(2000);
    for (let i = 1; i < 24; i++)
      expect(
        Date.parse(lines[i].attempt.requestStartedAt) -
          Date.parse(lines[i - 1].attempt.requestStartedAt)
      ).toBeGreaterThanOrEqual(3500);
  });
  it.each(["wrongModelAt", "costAt"] as const)(
    "halts generation on %s but terminally accounts all 24 scheduled attempts",
    async (key) => {
      const provider = fake({ [key]: 2 });
      const collection = directory();
      await execute(collection, 1, provider);
      const lines = await readLines(join(collection, "run-1.attempts.jsonl"));
      expect(lines).toHaveLength(24);
      expect(provider.wires).toHaveLength(3);
      expect(lines.slice(2).every((entry) => entry.attempt.observation.status === "ERROR")).toBe(
        true
      );
      await expect(execute(collection, 2, fake())).rejects.toThrow("PREFLIGHT_FAILURE");
    }
  );
  it("retains synced terminal records and intents after a crash; partial resume is blocked", async () => {
    const collection = directory();
    const provider = fake();
    let terminal = 0;
    await expect(
      execute(collection, 1, provider, clock(), {
        onAttempt: async () => {
          if (++terminal === 5) throw new Error("synthetic crash");
        }
      })
    ).rejects.toThrow("synthetic crash");
    expect(await readLines(join(collection, "run-1.attempts.jsonl"))).toHaveLength(5);
    expect(provider.wires).toHaveLength(5);
    expect(await readdir(collection)).toContain("active.lock");
    const next = fake();
    await expect(execute(collection, 2, next)).rejects.toThrow("CAPTURE_INTEGRITY_FAILURE");
    expect(next.wires).toHaveLength(0);
  });
  it("enforces ordered runs, immutable checkpoints and exact journal linkage", async () => {
    const collection = directory();
    const provider = fake();
    const time = clock();
    await expect(execute(collection, 2, provider, time)).rejects.toThrow();
    expect(provider.wires).toHaveLength(0);
    await execute(collection, 1, provider, time);
    const original = await readFile(join(collection, "run-1.json"));
    await expect(execute(collection, 1, provider, time)).rejects.toThrow(
      "CAPTURE_INTEGRITY_FAILURE"
    );
    await expect(execute(collection, 3, provider, time)).rejects.toThrow(
      "CAPTURE_INTEGRITY_FAILURE"
    );
    const changed = directory();
    await cp(collection, changed, { recursive: true });
    await writeFile(join(changed, "run-1.attempts.jsonl"), "{}\n");
    await expect(execute(changed, 2, fake(), time)).rejects.toThrow("CAPTURE_INTEGRITY_FAILURE");
    expect(await readFile(join(collection, "run-1.json"))).toEqual(original);
  });
  it("rejects a later source edit after preflight without replacement or unaccounted slots", async () => {
    let count = 0;
    const collection = directory();
    const provider = fake();
    await execute(collection, 1, provider, clock(), {
      sourceSnapshot: () => ({ source, status: ++count > 5 ? " M changed" : "" })
    });
    expect(provider.wires.length).toBeLessThan(24);
    expect(await readLines(join(collection, "run-1.attempts.jsonl"))).toHaveLength(24);
  });
  it("requires all 72 attempts before S05/S09/final record and excludes Canary D", async () => {
    const wrong = new Map(
      prepared.items.map((item) => [
        item.caseId,
        item.options.find((option) => option.optionId !== item.oracle.selectedOptionId)!.optionId
      ])
    );
    const provider = fake({
      content: (caseId) =>
        JSON.stringify({
          schemaVersion: "0.1.0",
          caseId,
          status: "ANSWER",
          selectedOptionId: wrong.get(caseId)
        })
    });
    const time = clock();
    const collection = directory();
    for (const run of [1, 2, 3]) {
      provider.reset();
      if (run > 1) time.advance(24 * 3600000);
      const result = await execute(collection, run, provider, time);
      expect(result.accountedAttempts).toBe(run * 24);
      if (run < 3) expect(await readdir(collection)).not.toContain("qualification.json");
    }
    expect(provider.wires).toHaveLength(72);
    const final = JSON.parse(await readFile(join(collection, "qualification.json"), "utf8"));
    expect(final.capture.attempts).toHaveLength(72);
    expect(final.reliability).toHaveLength(53);
    expect(final.packages).toHaveLength(4);
    expect(
      final.capture.runs.flatMap((run: { metricExecutions: unknown[] }) => run.metricExecutions)
    ).toHaveLength(15);
    expect(
      final.capture.attempts.every(
        (a: { evaluation: { state: string } }) => a.evaluation.state === "INCORRECT"
      )
    ).toBe(true);
    expect(final.qualification.criticalFindings).toEqual([]);
    expect(
      final.reliability.every(
        (r: { estimate: { applicability: string } }) => r.estimate.applicability === "ESTIMATED"
      )
    ).toBe(true);
    expect(final.qualification.outcome).toBe("INSUFFICIENT_EVIDENCE");
    expect(final.regression.exact).toBe(true);
    expect(final.qualification.proposesBM3).toBe(false);
    expect(
      final.capture.attempts.some((a: { attemptId: string }) => a.attemptId.includes("canary"))
    ).toBe(false);
    expect(() =>
      finalizeSemanticCoreLocalStudy({
        ...final.capture,
        items: prepared.items,
        attempts: final.capture.attempts.slice(0, 48),
        runs: final.capture.runs.slice(0, 2),
        checkpoints: final.checkpoints,
        repositoryValidation: {
          sourceCommit: source.gitCommit,
          reportDigest: "a".repeat(64),
          status: "PASSED"
        },
        infrastructureFindings: []
      })
    ).toThrow("CAPTURE_INTEGRITY_FAILURE");
    await expect(execute(collection, 3, fake(), time)).rejects.toThrow("CAPTURE_INTEGRITY_FAILURE");
  });
  it.each([false, true])(
    "S05 excludes absent/malformed/provider observations without zero scores (provider=%s)",
    async (providerFailure) => {
      const provider = fake({ failEvery: providerFailure, content: () => "not JSON" });
      const time = clock();
      const collection = directory();
      for (const run of [1, 2, 3]) {
        provider.reset();
        if (run > 1) time.advance(24 * 3600000);
        await execute(collection, run, provider, time);
      }
      const final = JSON.parse(await readFile(join(collection, "qualification.json"), "utf8"));
      expect(provider.wires).toHaveLength(72);
      expect(
        final.capture.runs.every((run: { metrics: { outcome: { kind: string } }[] }) =>
          run.metrics.every((metric) => metric.outcome.kind === "MISSING")
        )
      ).toBe(true);
      expect(
        final.reliability.every(
          (study: { estimate: { applicability: string } }) =>
            study.estimate.applicability === "INSUFFICIENT_EVIDENCE"
        )
      ).toBe(true);
      expect(final.qualification.outcome).toBe(
        providerFailure ? "NOT_QUALIFIED" : "INSUFFICIENT_EVIDENCE"
      );
      expect(final.qualification.criticalFindings.includes("INFRASTRUCTURE_FAILURE")).toBe(
        providerFailure
      );
      expect(final.regression.exact).toBe(true);
    }
  );
  it("binds collection timing and prior checkpoint bytes before a fresh resume preflight", async () => {
    const provider = fake();
    const time = clock();
    const collection = directory();
    await execute(collection, 1, provider, time);
    const changed = directory();
    await cp(collection, changed, { recursive: true });
    const audit = JSON.parse(await readFile(join(changed, "collection.json"), "utf8"));
    audit.openedAt = new Date(Date.parse(audit.openedAt) - 86400000).toISOString();
    audit.deadline = new Date(Date.parse(audit.deadline) - 86400000).toISOString();
    await writeFile(join(changed, "collection.json"), JSON.stringify(audit));
    const next = fake();
    await expect(execute(changed, 2, next, time)).rejects.toThrow("CAPTURE_INTEGRITY_FAILURE");
    expect(next.gets).toBe(0);
    await execute(collection, 2, provider, time);
    const first = await readLines(join(collection, "run-1.attempts.jsonl"));
    const second = await readLines(join(collection, "run-2.attempts.jsonl"));
    expect(
      Date.parse(second[0].attempt.requestStartedAt) -
        Date.parse(first[23].attempt.requestStartedAt)
    ).toBeGreaterThanOrEqual(3500);
    const checkpoint = await readFile(join(collection, "run-2.json"));
    await expect(execute(collection, 3, provider, time)).rejects.toThrow(
      "INSUFFICIENT_FREE_REQUEST_CAPACITY"
    );
    expect(provider.wires).toHaveLength(48);
    expect(await readFile(join(collection, "run-2.json"))).toEqual(checkpoint);
  });
  it("rejects missing live CLI gates, wrong protocol and unknown routing overrides", () => {
    const args = [
      "--mode",
      "live",
      "--protocol",
      "0.1.3",
      "--authorize-live",
      "--run",
      "1",
      "--condition",
      conditionFile,
      "--collection",
      directory(),
      "--validation",
      validationFile
    ];
    expect(parseSemanticCoreLocalArguments(args).run).toBe(1);
    for (const flag of [
      "--authorize-live",
      "--run",
      "--condition",
      "--collection",
      "--validation",
      "--protocol",
      "--mode"
    ]) {
      const index = args.indexOf(flag);
      const copy = args.slice();
      copy.splice(index, flag === "--authorize-live" ? 1 : 2);
      expect(() => parseSemanticCoreLocalArguments(copy)).toThrow("PREFLIGHT_FAILURE");
    }
    expect(() => parseSemanticCoreLocalArguments([...args, "--model", "openrouter/free"])).toThrow(
      "PREFLIGHT_FAILURE"
    );
    expect(() =>
      parseSemanticCoreLocalArguments(args.map((value) => (value === "0.1.3" ? "0.1.1" : value)))
    ).toThrow("PREFLIGHT_FAILURE");
    expect(() =>
      parseSemanticCoreLocalArguments(
        args.map((value) => (value === args[args.indexOf("--collection") + 1] ? "relative" : value))
      )
    ).toThrow("PREFLIGHT_FAILURE");
  });
  it("historical CLI has no reachable live transport or historical writing path", () => {
    const result = execFileSync(
      process.execPath,
      ["--import", "tsx", "scripts/semantic-core-qualification.ts", "--mode", "dry"],
      { cwd: repositoryRoot, encoding: "utf8", maxBuffer: 1048576 }
    );
    expect(JSON.parse(result).mode).toBe("DRY_RUN");
    expect(() =>
      execFileSync(
        process.execPath,
        ["--import", "tsx", "scripts/semantic-core-qualification.ts", "--mode", "live"],
        { cwd: repositoryRoot, stdio: "pipe" }
      )
    ).toThrow();
  });
});
