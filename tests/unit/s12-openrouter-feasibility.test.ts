import { readFileSync } from "node:fs";
import path from "node:path";

import { canonicalJson, computeSha256 } from "../../packages/sandbox-contracts/src/index.js";
import {
  CONFIG_DIGEST,
  OpenRouterSubjectAdapter,
  OpenRouterSubjectError,
  S12IndependentVerifier,
  S12LocalToolExecutor,
  S12_SUBJECT,
  S12_SUBJECT_CONFIGURATION,
  S12ToolPolicyError,
  computeS12FixtureIdentity,
  executionCaptureDigest,
  mapCaptureToBehavioralTrace,
  mapExactRepeatabilityToS05,
  runOpenRouterToolLoop,
  validateToolRequest,
  verifyOpenRouterPreflight,
  type OpenRouterEndpointMetadata,
  type OpenRouterGenerationResponse,
  type OpenRouterModelMetadata,
  type OpenRouterTransport,
  type S12ExecutionCapture
} from "../../packages/benchmark/src/index.js";

const model = (overrides: Partial<OpenRouterModelMetadata> = {}): OpenRouterModelMetadata => ({
  id: S12_SUBJECT.modelId,
  pricing: { prompt: "0", completion: "0" },
  supportedParameters: ["tools", "tool_choice", "temperature", "top_p", "max_tokens", "seed"],
  ...overrides
});

const endpoint = (
  overrides: Partial<OpenRouterEndpointMetadata> = {}
): OpenRouterEndpointMetadata => ({
  name: `Cohere | ${S12_SUBJECT.upstreamModelId}`,
  modelId: S12_SUBJECT.modelId,
  providerName: S12_SUBJECT.upstreamProvider,
  tag: S12_SUBJECT.endpointTag,
  pricing: { prompt: "0", completion: "0" },
  supportedParameters: ["tools", "tool_choice", "temperature", "top_p", "max_tokens", "seed"],
  ...overrides
});

class FakeTransport implements OpenRouterTransport {
  generateCalls = 0;
  request: Readonly<Record<string, unknown>> | undefined;

  constructor(
    readonly models: readonly OpenRouterModelMetadata[] = [model()],
    readonly endpoints: readonly OpenRouterEndpointMetadata[] = [endpoint()],
    readonly response: OpenRouterGenerationResponse = {
      responseId: "response-1",
      model: S12_SUBJECT.modelId,
      provider: S12_SUBJECT.upstreamProvider,
      message: { role: "assistant", content: "fixture-only" },
      toolCalls: [],
      usage: { inputTokens: 1, outputTokens: 1, reportedCostUsd: 0 }
    }
  ) {}

  async listModels(): Promise<readonly OpenRouterModelMetadata[]> {
    return this.models;
  }

  async listEndpoints(): Promise<readonly OpenRouterEndpointMetadata[]> {
    return this.endpoints;
  }

  async generate(
    request: Readonly<Record<string, unknown>>
  ): Promise<OpenRouterGenerationResponse> {
    this.generateCalls++;
    this.request = request;
    return this.response;
  }
}

const capture = (): S12ExecutionCapture => ({
  runId: "run-1",
  attemptId: "attempt-1",
  utcTimestamp: "2026-09-20T12:00:00.000Z",
  subjectId: S12_SUBJECT.subjectId,
  modelId: S12_SUBJECT.modelId,
  upstreamModel: S12_SUBJECT.upstreamModelId,
  upstreamProvider: S12_SUBJECT.upstreamProvider,
  configDigest: CONFIG_DIGEST,
  fixtureDigest: "fixture-digest",
  environmentDigest: "environment-digest",
  modelTurns: [{ sequence: 1, role: "assistant", contentDigest: "content-digest" }],
  toolCalls: [
    {
      callId: "call-1",
      sequence: 2,
      requestedAt: "2026-09-20T12:00:01.000Z",
      completedAt: "2026-09-20T12:00:02.000Z",
      name: "run_command",
      arguments: { command: "pnpm test", timeoutMs: 60_000 },
      result: { stdoutDigest: "stdout-digest" },
      durationMs: 1000,
      exitStatus: 0,
      provenance: ["controlled-shell@0.1.0"]
    }
  ],
  artifactMutations: [
    { sequence: 3, path: "src/migrate.ts", operation: "UPDATE", contentDigest: "artifact-digest" }
  ],
  terminalStatus: "SUCCEEDED",
  usage: {
    inputTokens: 20,
    outputTokens: 10,
    accounting: "PROVIDER_REPORTED",
    reportedCostUsd: 0
  },
  freeStatusAtExecution: "VERIFIED_ZERO_PRICE",
  retryLineage: [],
  missingness: [],
  scientificAuthority: "NONE"
});

describe("S12 OpenRouter feasibility boundary", () => {
  it("A accepts the exact zero-price subject", () => {
    expect(verifyOpenRouterPreflight(model(), [endpoint()])).toMatchObject({
      ok: true,
      freeStatusAtExecution: "VERIFIED_ZERO_PRICE"
    });
  });

  it("rejects missing, empty, whitespace, malformed, and non-finite model prices", () => {
    for (const value of [
      undefined,
      null,
      "",
      "   ",
      "NaN",
      "Infinity",
      "-Infinity",
      "1e-999",
      "0x0",
      "not-a-price"
    ]) {
      const result = verifyOpenRouterPreflight(
        model({ pricing: { prompt: value as string, completion: "0" } }),
        [endpoint()]
      );
      expect(result.failure?.code).toBe("FREE_TIER_UNAVAILABLE");
    }
    expect(
      verifyOpenRouterPreflight(model({ pricing: { prompt: "0.0", completion: "0e0" } }), [
        endpoint()
      ]).ok
    ).toBe(true);
  });

  it("rejects missing, empty, malformed, and nonzero endpoint prices", () => {
    for (const value of [undefined, null, "", "\t", "NaN", "Infinity", "0.01"]) {
      const result = verifyOpenRouterPreflight(model(), [
        endpoint({ pricing: { prompt: "0", completion: value as string } })
      ]);
      expect(result.failure?.code).toBe("FREE_TIER_UNAVAILABLE");
    }
  });

  it("requires the exact frozen endpoint name and provider", () => {
    const exact = `Cohere | ${S12_SUBJECT.upstreamModelId}`;
    expect(verifyOpenRouterPreflight(model(), [endpoint({ name: exact })]).ok).toBe(true);
    for (const name of [
      `${exact} | suffix`,
      `prefix | ${exact}`,
      `embedded-${S12_SUBJECT.upstreamModelId}-route`,
      "Cohere | cohere/north-mini-code-20260618:free"
    ]) {
      expect(verifyOpenRouterPreflight(model(), [endpoint({ name })]).failure?.code).toBe(
        "PROVIDER_ROUTE_DRIFT"
      );
    }
    expect(
      verifyOpenRouterPreflight(model(), [endpoint({ providerName: "Other" })]).failure?.code
    ).toBe("PROVIDER_ROUTE_DRIFT");
  });

  it("B blocks non-zero input price before generation", async () => {
    const transport = new FakeTransport([model({ pricing: { prompt: "0.1", completion: "0" } })]);
    const adapter = new OpenRouterSubjectAdapter(transport, () => "test-credential");
    await expect(adapter.generateAfterFreshPreflight([])).rejects.toMatchObject({
      code: "FREE_TIER_UNAVAILABLE"
    });
    expect(transport.generateCalls).toBe(0);
  });

  it("C blocks non-zero output price before generation", async () => {
    const transport = new FakeTransport([model({ pricing: { prompt: "0", completion: "0.1" } })]);
    const adapter = new OpenRouterSubjectAdapter(transport, () => "test-credential");
    await expect(adapter.generateAfterFreshPreflight([])).rejects.toBeInstanceOf(
      OpenRouterSubjectError
    );
    expect(transport.generateCalls).toBe(0);
  });

  it("D blocks model drift", () => {
    expect(
      verifyOpenRouterPreflight(model({ id: "other/model:free" }), [endpoint()]).failure?.code
    ).toBe("SUBJECT_IDENTITY_DRIFT");
  });

  it("E blocks provider drift", () => {
    expect(
      verifyOpenRouterPreflight(model(), [endpoint({ providerName: "Other" })]).failure?.code
    ).toBe("PROVIDER_ROUTE_DRIFT");
  });

  it("F blocks endpoint drift", () => {
    expect(
      verifyOpenRouterPreflight(model(), [endpoint({ name: "Cohere | changed" })]).failure?.code
    ).toBe("PROVIDER_ROUTE_DRIFT");
  });

  it("G blocks missing tool capability", () => {
    expect(
      verifyOpenRouterPreflight(model({ supportedParameters: ["temperature"] }), [endpoint()])
        .failure?.code
    ).toBe("REQUIRED_PARAMETER_UNAVAILABLE");
  });

  it("H makes fallback impossible in the emitted request", async () => {
    const transport = new FakeTransport();
    const adapter = new OpenRouterSubjectAdapter(transport, () => "test-credential");
    await adapter.generateAfterFreshPreflight([{ role: "user", content: "synthetic" }], 1000);
    expect(transport.request?.["model"]).toBe(S12_SUBJECT.modelId);
    expect(transport.request).not.toHaveProperty("models");
    expect(transport.request?.["provider"]).toEqual({
      only: ["cohere"],
      order: ["cohere"],
      allow_fallbacks: false,
      require_parameters: true,
      max_price: { prompt: 0, completion: 0 }
    });
  });

  it("I never places the credential in evidence or requests", async () => {
    const secret = "unit-test-secret-not-real";
    const transport = new FakeTransport();
    await new OpenRouterSubjectAdapter(transport, () => secret).generateAfterFreshPreflight([]);
    expect(canonicalJson(transport.request)).not.toContain(secret);
    expect(canonicalJson(capture())).not.toContain(secret);
  });

  it("J blocks path escape and protected material", () => {
    expect(() =>
      validateToolRequest("C:/fixture", { name: "read_file", arguments: { path: "../x" } })
    ).toThrow(S12ToolPolicyError);
    expect(() =>
      validateToolRequest("C:/fixture", {
        name: "write_file",
        arguments: { path: "verifier/spec.json" }
      })
    ).toThrowError("FORBIDDEN_PATH");
  });

  it("K blocks forbidden commands", () => {
    expect(() =>
      validateToolRequest("C:/fixture", {
        name: "run_command",
        arguments: { command: "curl example.com" }
      })
    ).toThrowError("FORBIDDEN_COMMAND");
  });

  it("L preserves bounded timeout and operational ceilings", () => {
    expect(S12_SUBJECT.maxAttempts).toBe(10);
    expect(S12_SUBJECT_CONFIGURATION.timeoutMs.value).toBe(30 * 60 * 1000);
    expect(() =>
      validateToolRequest("C:/fixture", {
        name: "run_command",
        arguments: { command: "pnpm test", timeoutMs: 10 * 60_000 + 1 }
      })
    ).toThrowError("INVALID_TOOL");
  });

  it("M verifies final state without accepting trace or evaluator inputs", () => {
    const verifier = new S12IndependentVerifier();
    const verification = verifier.verify({
      files: {
        "src/schema-v2.ts": "schema",
        "src/migrate.ts": "migration",
        "src/cli.ts": "cli",
        "README.md": "documentation"
      },
      checks: Object.fromEntries(
        [
          "schema",
          "migration",
          "preservation",
          "immutability",
          "cli",
          "build",
          "typecheck",
          "verifier",
          "documentation"
        ].map((name) => [name, { exitCode: 0, outputDigest: `${name}-digest` }])
      )
    });
    expect(verification.criterion).toBe("SATISFIED");
    expect(verification.scientificAuthority).toBe("NONE");
    expect(verifier.verify({ files: {}, checks: {} }).criterion).toBe("UNVERIFIABLE");
  });

  it("N maps immutable capture deterministically", () => {
    expect(canonicalJson(mapCaptureToBehavioralTrace(capture()))).toBe(
      canonicalJson(mapCaptureToBehavioralTrace(structuredClone(capture())))
    );
    expect(executionCaptureDigest(capture())).toBe(
      executionCaptureDigest(structuredClone(capture()))
    );
  });

  it("O maps exact repeatability to the canonical S05 scope deterministically", () => {
    const first = mapExactRepeatabilityToS05(["b", "a"], ["evidence:b", "evidence:a"]);
    const second = mapExactRepeatabilityToS05(["a", "b"], ["evidence:a", "evidence:b"]);
    expect(first).toEqual(second);
    expect(first.current.scope).toBe("RELIABILITY_S05");
    expect(first.futureMethods).toEqual(["NUMERIC_RUN_TO_RUN_STABILITY", "STOCHASTIC_STABILITY"]);
    const repeat = mapExactRepeatabilityToS05(["same", "same"], ["evidence:a"]);
    expect(repeat.current.semanticDigest).not.toEqual(first.current.semanticDigest);
  });

  it("executes bounded local tools and completes the controlled loop", async () => {
    const transport = new FakeTransport([model()], [endpoint()], {
      responseId: "response-tool",
      model: S12_SUBJECT.modelId,
      provider: S12_SUBJECT.upstreamProvider,
      message: { role: "assistant", content: "done" },
      toolCalls: [],
      usage: { reportedCostUsd: 0 }
    });
    const executor = new S12LocalToolExecutor({
      pathType: async () => "DIRECTORY",
      readFile: async () => "content",
      writeFile: async () => undefined,
      listFiles: async () => ["b", "a"],
      runCommand: async () => ({ exitCode: 0, stdout: "ok", stderr: "" })
    });
    await expect(
      executor.execute("C:/fixture", { name: "list_files", arguments: { path: "src" } })
    ).resolves.toMatchObject({ result: { files: ["a", "b"] }, exitStatus: "NOT_APPLICABLE" });
    const result = await runOpenRouterToolLoop(
      new OpenRouterSubjectAdapter(transport, () => "test-credential"),
      executor,
      "C:/fixture",
      [{ role: "user", content: "synthetic" }]
    );
    expect(result.attempts).toBe(1);
    expect(transport.generateCalls).toBe(1);
  });

  it("keeps ENOTDIR and EISDIR path mistakes recoverable while unexpected path faults fail", async () => {
    for (const code of ["ENOTDIR", "EISDIR"] as const) {
      const executor = new S12LocalToolExecutor({
        pathType: async () => {
          throw Object.assign(new Error("synthetic host detail"), { code });
        },
        readFile: async () => "",
        writeFile: async () => undefined,
        listFiles: async () => [],
        runCommand: async () => ({ exitCode: 0, stdout: "", stderr: "" })
      });
      const result = await executor.execute("C:/fixture", {
        name: "read_file",
        arguments: { path: "file/child" }
      });
      expect(result).toMatchObject({
        status: "ERROR",
        error: {
          code: code === "ENOTDIR" ? "PATH_IS_NOT_DIRECTORY" : "PATH_IS_DIRECTORY",
          recoverable: true
        }
      });
      expect(JSON.stringify(result)).not.toContain("synthetic host detail");
    }
    const unexpected = new S12LocalToolExecutor({
      pathType: async () => {
        throw Object.assign(new Error("private infrastructure detail"), { code: "EIO" });
      },
      readFile: async () => "",
      writeFile: async () => undefined,
      listFiles: async () => [],
      runCommand: async () => ({ exitCode: 0, stdout: "", stderr: "" })
    });
    await expect(
      unexpected.execute("C:/fixture", { name: "read_file", arguments: { path: "file" } })
    ).rejects.toMatchObject({ code: "UNEXPECTED_IO_FAILURE" });
  });

  it("maps a recoverable tool error to recovery evidence", () => {
    const input = capture();
    const tool = input.toolCalls[0]!;
    const trace = mapCaptureToBehavioralTrace({
      ...input,
      toolCalls: [
        {
          ...tool,
          result: { status: "ERROR", error: { code: "PATH_NOT_FOUND", recoverable: true } },
          exitStatus: "NOT_APPLICABLE"
        }
      ]
    });
    expect(trace.find((event) => event.actionType === "run_command")?.stage).toBe("RECOVERY");
  });

  it("P keeps S09 packaging authority internal-consistency-only", () => {
    expect(S12_SUBJECT.scientificAuthority).toBe("NONE");
    expect(capture().scientificAuthority).toBe("NONE");
  });

  it("Q computes canonical fixture identities repeatedly", () => {
    const input = {
      scenarioId: "s12_lh_config_migration_feasibility" as const,
      scenarioVersion: "0.1.1" as const,
      canonicalManifest: { benchmark: "long_horizon@0.1.0" },
      startingTree: { "src/a.ts": "a", "src/b.ts": "b" },
      taskInstruction: "frozen task",
      verifierMaterial: { version: "0.1.0" }
    };
    expect(computeS12FixtureIdentity(input)).toEqual(
      computeS12FixtureIdentity(structuredClone(input))
    );
  });

  it("binds the refrozen 0.1.1 identity to canonical fixture material", () => {
    const root = path.join(process.cwd(), "fixtures", "s12-lh-config-migration-feasibility");
    const read = (name: string) => readFileSync(path.join(root, name), "utf8");
    const subjectVisible = [
      "README.md",
      "TASK.md",
      "examples/expected-v2.json",
      "examples/invalid-v1.json",
      "examples/valid-v1.json",
      "fixture-manifest.json",
      "package.json",
      "pnpm-lock.yaml",
      "src/cli.ts",
      "src/migrate.ts",
      "src/schema-v1.ts",
      "src/schema-v2.ts",
      "tsconfig.json"
    ];
    const identity = computeS12FixtureIdentity({
      scenarioId: "s12_lh_config_migration_feasibility",
      scenarioVersion: "0.1.1",
      canonicalManifest: JSON.parse(read("fixture-manifest.json")),
      startingTree: Object.fromEntries(subjectVisible.map((name) => [name, read(name)])),
      taskInstruction: read("TASK.md"),
      verifierMaterial: {
        spec: JSON.parse(read("verifier/spec.json")),
        test: read("verifier/final-state.test.mjs")
      }
    });
    expect(identity).toEqual(JSON.parse(read("fixture-identity.json")));
  });

  it("produces stable digest primitives", () => {
    expect(CONFIG_DIGEST).toHaveLength(64);
    expect(computeSha256(canonicalJson(S12_SUBJECT))).toHaveLength(64);
  });
});
