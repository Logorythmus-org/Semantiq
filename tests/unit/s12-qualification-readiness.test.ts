import {
  CONFIG_DIGEST,
  OpenRouterHttpError,
  OpenRouterHttpTransport,
  OpenRouterSubjectAdapter,
  S12FinalStateVerifier,
  S12LocalToolExecutor,
  S12QualificationRunner,
  S12_SUBJECT,
  canonicalProviderTools,
  serializeOpenRouterTools,
  type OpenRouterEndpointMetadata,
  type OpenRouterGenerationResponse,
  type OpenRouterModelMetadata,
  type OpenRouterTransport,
  type S12Fetch,
  type S12VerifierRuntime
} from "../../packages/benchmark/src/index.js";

const supported = ["tools", "tool_choice", "temperature", "top_p", "max_tokens", "seed"];
const model = (pricing = { prompt: "0", completion: "0" }): OpenRouterModelMetadata => ({
  id: S12_SUBJECT.modelId,
  pricing,
  supportedParameters: supported
});
const endpoint = (): OpenRouterEndpointMetadata => ({
  name: `Cohere | ${S12_SUBJECT.upstreamModelId}`,
  modelId: S12_SUBJECT.modelId,
  providerName: "Cohere",
  tag: "cohere",
  pricing: { prompt: "0", completion: "0" },
  supportedParameters: supported
});

class ScriptedTransport implements OpenRouterTransport {
  generationCalls = 0;
  constructor(
    private readonly responses: readonly OpenRouterGenerationResponse[],
    private readonly currentModel: OpenRouterModelMetadata = model()
  ) {}
  async listModels() {
    return [this.currentModel];
  }
  async listEndpoints() {
    return [endpoint()];
  }
  async generate() {
    return this.responses[this.generationCalls++]!;
  }
}

const response = (
  overrides: Partial<OpenRouterGenerationResponse> = {}
): OpenRouterGenerationResponse => ({
  responseId: "response-1",
  model: S12_SUBJECT.modelId,
  provider: "Cohere",
  message: { role: "assistant", content: "complete" },
  toolCalls: [],
  usage: { inputTokens: 10, outputTokens: 5, reportedCostUsd: 0 },
  ...overrides
});

const executor = () =>
  new S12LocalToolExecutor({
    readFile: async () => "content",
    writeFile: async () => undefined,
    listFiles: async () => ["src"],
    runCommand: async () => ({ exitCode: 0, stdout: "ok", stderr: "" })
  });

const hooks = (criterion: "SATISFIED" | "NOT_SATISFIED" | "UNVERIFIABLE") => ({
  verifyFinalState: async () => ({
    criterion,
    verifierIntegrity: criterion === "UNVERIFIABLE" ? "FAILED" : "VERIFIED"
  }),
  evaluate: async () => ({ metric: 0.5, exactReplay: true }),
  packageEvidence: async () => ({
    packageId: "s12:dry",
    authority: "INTERNAL_CONSISTENCY_ONLY",
    digest: "a".repeat(64)
  })
});

describe("S12 qualification readiness repair", () => {
  it("serializes frozen tools deterministically into OpenRouter function schemas", () => {
    expect(canonicalProviderTools()).toBe(canonicalProviderTools());
    expect(serializeOpenRouterTools()).toHaveLength(4);
    expect(serializeOpenRouterTools()[0]).toMatchObject({
      type: "function",
      function: { name: "read_file" }
    });
  });

  it("concrete transport sends the exact route and safely parses tool calls", async () => {
    const seen: Array<{ url: string; init: Readonly<Record<string, unknown>> }> = [];
    const fakeFetch: S12Fetch = async (url, init) => {
      seen.push({ url, init });
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({
          id: "request-1",
          model: S12_SUBJECT.modelId,
          provider: "Cohere",
          choices: [
            {
              message: {
                content: "",
                tool_calls: [
                  { id: "call-1", function: { name: "read_file", arguments: '{"path":"TASK.md"}' } }
                ]
              }
            }
          ],
          usage: { prompt_tokens: 4, completion_tokens: 2, cost: 0 }
        })
      };
    };
    const transport = new OpenRouterHttpTransport(fakeFetch);
    const secret = "test-secret-not-real";
    const result = await transport.generate(
      {
        model: S12_SUBJECT.modelId,
        messages: [],
        provider: { only: ["cohere"], allow_fallbacks: false }
      },
      secret,
      new AbortController().signal
    );
    expect(seen[0]?.url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(seen[0]?.init["method"]).toBe("POST");
    expect(JSON.stringify(seen[0]?.init["body"])).not.toContain(secret);
    expect(JSON.stringify(result)).not.toContain(secret);
    expect(result.toolCalls[0]).toMatchObject({
      name: "read_file",
      arguments: { path: "TASK.md" }
    });
  });

  it("reports HTTP and malformed-response failures without response secrets", async () => {
    const failing: S12Fetch = async () => ({
      ok: false,
      status: 503,
      headers: { get: () => null },
      json: async () => ({})
    });
    await expect(
      new OpenRouterHttpTransport(failing).generate({}, "secret", new AbortController().signal)
    ).rejects.toMatchObject({ code: "HTTP_ERROR", httpStatus: 503 });
    expect(
      new OpenRouterHttpError("HTTP_ERROR", 500, "OpenRouter returned HTTP 500.").message
    ).not.toContain("secret");
  });

  it("Case A completes the full dry pipeline for a successful fake subject", async () => {
    const transport = new ScriptedTransport([response()]);
    const result = await new S12QualificationRunner(
      new OpenRouterSubjectAdapter(transport, () => "fake"),
      executor(),
      hooks("SATISFIED"),
      () => "2026-09-21T00:00:00Z",
      () => "id"
    ).run({ workspaceRoot: "C:/fixture", fixtureDigest: "fixture", messages: [], mode: "DRY_RUN" });
    expect(result).toMatchObject({
      terminalStatus: "COMPLETED",
      modelRequestCount: 1,
      evaluation: { exactReplay: true },
      evidence: { authority: "INTERNAL_CONSISTENCY_ONLY" },
      configDigest: CONFIG_DIGEST
    });
    expect(result.events.map((event) => event.sequence)).toEqual(
      result.events.map((_, index) => index + 1)
    );
  });

  it("Case B preserves genuine subject failure while completing metric and evidence", async () => {
    const result = await new S12QualificationRunner(
      new OpenRouterSubjectAdapter(new ScriptedTransport([response()]), () => "fake"),
      executor(),
      hooks("NOT_SATISFIED"),
      () => "2026-09-21T00:00:00Z",
      () => "id"
    ).run({ workspaceRoot: "C:/fixture", fixtureDigest: "fixture", messages: [], mode: "DRY_RUN" });
    expect(result.terminalStatus).toBe("COMPLETED");
    expect(result.verification).toMatchObject({ criterion: "NOT_SATISFIED" });
    expect(result.evidence).toBeDefined();
  });

  it("Case C preserves verifier integrity failure as UNVERIFIABLE", async () => {
    const result = await new S12QualificationRunner(
      new OpenRouterSubjectAdapter(new ScriptedTransport([response()]), () => "fake"),
      executor(),
      hooks("UNVERIFIABLE"),
      () => "2026-09-21T00:00:00Z",
      () => "id"
    ).run({ workspaceRoot: "C:/fixture", fixtureDigest: "fixture", messages: [], mode: "DRY_RUN" });
    expect(result).toMatchObject({
      terminalStatus: "VERIFIER_FAILURE",
      structuredFailure: { code: "VERIFIER_FAILURE" }
    });
  });

  it("Case D blocks drift with zero generation transport calls", async () => {
    const transport = new ScriptedTransport([response()], model({ prompt: "1", completion: "0" }));
    const result = await new S12QualificationRunner(
      new OpenRouterSubjectAdapter(transport, () => "fake"),
      executor(),
      hooks("SATISFIED")
    ).run({ workspaceRoot: "C:/fixture", fixtureDigest: "fixture", messages: [], mode: "DRY_RUN" });
    expect(result).toMatchObject({ terminalStatus: "PREFLIGHT_BLOCKED", modelRequestCount: 0 });
    expect(transport.generationCalls).toBe(0);
  });

  it("fails closed when live mode lacks explicit authorization", async () => {
    const transport = new ScriptedTransport([response()]);
    const result = await new S12QualificationRunner(
      new OpenRouterSubjectAdapter(transport, () => "fake"),
      executor(),
      hooks("SATISFIED")
    ).run({
      workspaceRoot: "C:/fixture",
      fixtureDigest: "fixture",
      messages: [],
      mode: "LIVE_QUALIFICATION"
    });
    expect(result).toMatchObject({
      terminalStatus: "INSTRUMENTATION_FAILURE",
      modelRequestCount: 0
    });
    expect(transport.generationCalls).toBe(0);
  });

  it("independent verifier reports success, subject failure, and integrity failure distinctly", async () => {
    const runtime = (digest: string, exitCode: number): S12VerifierRuntime => ({
      verifierMaterialDigest: async () => digest,
      artifactExists: async () => true,
      execute: async (command) => ({
        command,
        exitCode,
        stdoutDigest: "a".repeat(64),
        stderrDigest: "b".repeat(64)
      })
    });
    const verifier = new S12FinalStateVerifier("trusted");
    await expect(verifier.verify(runtime("trusted", 0))).resolves.toMatchObject({
      criterion: "SATISFIED",
      verifierIntegrity: "VERIFIED"
    });
    await expect(verifier.verify(runtime("trusted", 1))).resolves.toMatchObject({
      criterion: "NOT_SATISFIED",
      verifierIntegrity: "VERIFIED"
    });
    await expect(verifier.verify(runtime("changed", 0))).resolves.toMatchObject({
      criterion: "UNVERIFIABLE",
      verifierIntegrity: "FAILED"
    });
  });
});
