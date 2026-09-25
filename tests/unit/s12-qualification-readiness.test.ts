import {
  S12_CONFIG_DIGEST_10T,
  S12_CONFIG_DIGEST_20T,
  S12_EXECUTION_STRATA,
  S12_SUBJECT_CONFIGURATION,
  S12_TASK_INSTRUCTION_DIGEST,
  S12_TOOL_DECLARATIONS,
  SYSTEM_PROMPT_DIGEST,
  TOOL_DEFINITION_DIGEST,
  OpenRouterHttpError,
  OpenRouterHttpTransport,
  OpenRouterSubjectAdapter,
  S12FinalStateVerifier,
  S12CanonicalQualificationRunner,
  S12_FIXTURE_IDENTITY,
  S12LocalToolExecutor,
  S12QualificationRunner,
  S12ToolInstrumentationError,
  S12_SUBJECT,
  nodeToolOperations,
  localWireRequestDigest,
  serializeOpenRouterRequestBody,
  canonicalProviderTools,
  serializeOpenRouterTools,
  type OpenRouterEndpointMetadata,
  type OpenRouterGenerationResponse,
  type OpenRouterModelMetadata,
  type OpenRouterTransport,
  type S12Fetch,
  type S12VerifierRuntime
} from "../../packages/benchmark/src/index.js";
import { canonicalJson, computeSha256 } from "../../packages/sandbox-contracts/src/index.js";
import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

const frozenTaskInstruction = readFileSync(
  path.join(process.cwd(), "fixtures", "s12-lh-config-migration-feasibility", "TASK.md"),
  "utf8"
);

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
  readonly requests: Readonly<Record<string, unknown>>[] = [];
  constructor(
    private readonly responses: readonly (OpenRouterGenerationResponse | Error)[],
    private readonly currentModel: OpenRouterModelMetadata = model()
  ) {}
  async listModels() {
    return [this.currentModel];
  }
  async listEndpoints() {
    return [endpoint()];
  }
  async generate(request: Readonly<Record<string, unknown>>) {
    this.requests.push(request);
    const value = this.responses[this.generationCalls++]!;
    if (value instanceof Error) throw value;
    return value;
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
    pathType: async (target) => (target.endsWith("src") ? "DIRECTORY" : "FILE"),
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

function containsValue(value: unknown, sentinel: string): boolean {
  if (typeof value === "string") return value.includes(sentinel);
  if (Array.isArray(value)) return value.some((item) => containsValue(item, sentinel));
  if (value !== null && typeof value === "object")
    return Object.values(value).some((item) => containsValue(item, sentinel));
  return false;
}

describe("S12 qualification readiness repair", () => {
  it("keeps untrusted absolute paths and synthetic credentials out of ordered capture", async () => {
    const hostPath = "C:\\Users\\Synthetic\\private\\SYNTHETIC_HOST_PATH_SENTINEL";
    const posixPath = "/tmp/SYNTHETIC_POSIX_PATH_SENTINEL";
    const credential = "SYNTHETIC_CREDENTIAL_SENTINEL_123456789";
    const authorization = "Authorization: Bearer SYNTHETIC_AUTH_SENTINEL_987654321";
    const transport = new ScriptedTransport([
      response({
        toolCalls: [
          { id: "bad-path", name: "read_file", arguments: { path: hostPath } },
          { id: "bad-posix", name: "read_file", arguments: { path: posixPath } },
          { id: "bad-command", name: "run_command", arguments: { command: authorization } },
          {
            id: "safe-write",
            name: "write_file",
            arguments: {
              path: "output.txt",
              content: credential,
              extra: { secret: "SYNTHETIC_EXTRA_FIELD_SENTINEL" }
            }
          }
        ]
      }),
      response()
    ]);
    let packagedInput: unknown;
    let serializedEvidence = "";
    let filesystemCalls = 0;
    const result = await new S12QualificationRunner(
      new OpenRouterSubjectAdapter(transport, () => "synthetic-transport-secret"),
      new S12LocalToolExecutor({
        pathType: async () => {
          filesystemCalls++;
          return "FILE";
        },
        readFile: async () => {
          filesystemCalls++;
          return "";
        },
        writeFile: async () => {
          filesystemCalls++;
        },
        listFiles: async () => {
          filesystemCalls++;
          return [];
        },
        runCommand: async () => ({ exitCode: 0, stdout: "", stderr: "" })
      }),
      {
        verifyFinalState: async () => ({ criterion: "SATISFIED" }),
        evaluate: async (events) => ({
          orderedCaptureDigest: computeSha256(canonicalJson(events))
        }),
        packageEvidence: async (input) => {
          packagedInput = input;
          serializedEvidence = canonicalJson(input);
          return { packageId: "synthetic" };
        }
      },
      () => "2026-09-21T00:00:00Z",
      () => "id"
    ).run({ workspaceRoot: "C:/fixture", fixtureDigest: "fixture", messages: [] });
    expect(result.terminalStatus).toBe("COMPLETED");
    for (const sentinel of [
      hostPath,
      "SYNTHETIC_HOST_PATH_SENTINEL",
      posixPath,
      credential,
      authorization,
      "SYNTHETIC_EXTRA_FIELD_SENTINEL"
    ]) {
      expect(containsValue(result.events, sentinel)).toBe(false);
      expect(containsValue(packagedInput, sentinel)).toBe(false);
      expect(containsValue(JSON.parse(serializedEvidence), sentinel)).toBe(false);
    }
    const safe = result.events.find(
      (event) => event.type === "TOOL_REQUESTED" && event.payload["callId"] === "safe-write"
    );
    expect(safe?.payload).toMatchObject({
      argumentCapture: "VALIDATED_REDACTED",
      arguments: { path: "output.txt", contentDigest: computeSha256(credential) }
    });
    expect(
      result.events.find(
        (event) => event.type === "TOOL_REQUESTED" && event.payload["callId"] === "bad-path"
      )?.payload["argumentCapture"]
    ).toBe("INVALID_REDACTED");
    expect(
      result.events.find(
        (event) => event.type === "TOOL_REQUESTED" && event.payload["callId"] === "bad-posix"
      )?.payload["argumentCapture"]
    ).toBe("INVALID_REDACTED");
    expect(filesystemCalls).toBe(1);
  });

  it("rejects Windows and POSIX absolute tool paths before filesystem execution", async () => {
    const windowsPath = "C:\\Users\\Synthetic\\CANONICAL_WINDOWS_PATH_SENTINEL";
    const posixPath = "/tmp/CANONICAL_POSIX_PATH_SENTINEL";
    const transport = new ScriptedTransport([
      response({
        toolCalls: [
          { id: "windows-call", name: "read_file", arguments: { path: windowsPath } },
          { id: "posix-call", name: "list_files", arguments: { path: posixPath } }
        ]
      }),
      response()
    ]);
    let filesystemCalls = 0;
    const blocked = async () => {
      filesystemCalls++;
      throw new Error("rejected path reached filesystem");
    };
    const result = await new S12QualificationRunner(
      new OpenRouterSubjectAdapter(transport, () => "synthetic-transport-secret"),
      new S12LocalToolExecutor({
        pathType: blocked,
        readFile: blocked,
        writeFile: blocked,
        listFiles: blocked,
        runCommand: async () => ({ exitCode: 0, stdout: "", stderr: "" })
      }),
      hooks("SATISFIED"),
      () => "2026-09-21T00:00:00Z",
      () => "id"
    ).run({ workspaceRoot: "C:/fixture", fixtureDigest: "fixture", messages: [] });
    expect(result.terminalStatus).toBe("COMPLETED");
    expect(result.attemptId).toBe("dry-attempt:id");
    expect(filesystemCalls).toBe(0);
    for (const callId of ["windows-call", "posix-call"]) {
      expect(
        result.events.find(
          (event) => event.type === "TOOL_REQUESTED" && event.payload["callId"] === callId
        )?.payload
      ).toMatchObject({ argumentCapture: "INVALID_REDACTED", arguments: { redacted: true } });
      expect(
        result.events.find(
          (event) => event.type === "TOOL_EXECUTION_RESULT" && event.payload["callId"] === callId
        )?.payload
      ).toMatchObject({
        status: "ERROR",
        error: { code: "PATH_OUTSIDE_WORKSPACE", recoverable: true }
      });
    }
    for (const sentinel of [
      windowsPath,
      posixPath,
      "CANONICAL_WINDOWS_PATH_SENTINEL",
      "CANONICAL_POSIX_PATH_SENTINEL"
    ])
      expect(containsValue(result.events, sentinel)).toBe(false);
  });

  it("binds the locally serialized wire body without authorization material", async () => {
    const request = {
      model: S12_SUBJECT.modelId,
      messages: [
        { role: "system", content: "frozen system" },
        {
          role: "assistant",
          content: "",
          toolCalls: [{ id: "call-1", name: "read_file", arguments: { path: "TASK.md" } }]
        }
      ],
      temperature: 1,
      top_p: 1,
      max_tokens: 8192,
      seed: 424242,
      tools: S12_TOOL_DECLARATIONS,
      tool_choice: "auto",
      provider: {
        only: ["cohere"],
        order: ["cohere"],
        allow_fallbacks: false,
        require_parameters: true,
        max_price: { prompt: 0, completion: 0 }
      }
    };
    const body = serializeOpenRouterRequestBody(request);
    const digest = localWireRequestDigest(body);
    const originalBody = structuredClone(body);
    const reverseObjectKeys = (value: unknown): unknown =>
      Array.isArray(value)
        ? value.map(reverseObjectKeys)
        : value !== null && typeof value === "object"
          ? Object.fromEntries(
              Object.entries(value)
                .reverse()
                .map(([key, nested]) => [key, reverseObjectKeys(nested)])
            )
          : value;
    const reorderedBody = reverseObjectKeys(body) as Record<string, unknown>;
    expect(JSON.stringify(reorderedBody)).not.toBe(JSON.stringify(body));
    expect(localWireRequestDigest(reorderedBody)).toBe(digest);
    expect(body).toEqual(originalBody);
    expect(localWireRequestDigest(serializeOpenRouterRequestBody(structuredClone(request)))).toBe(
      digest
    );
    expect(
      localWireRequestDigest(
        serializeOpenRouterRequestBody({
          ...request,
          messages: [...request.messages].reverse()
        })
      )
    ).not.toBe(digest);
    expect(
      localWireRequestDigest(serializeOpenRouterRequestBody({ ...request, model: "other/model" }))
    ).not.toBe(digest);
    expect(
      localWireRequestDigest(
        serializeOpenRouterRequestBody({
          ...request,
          messages: [{ role: "system", content: "changed" }]
        })
      )
    ).not.toBe(digest);
    expect(
      localWireRequestDigest(serializeOpenRouterRequestBody({ ...request, temperature: 0.5 }))
    ).not.toBe(digest);
    expect(
      localWireRequestDigest(serializeOpenRouterRequestBody({ ...request, tool_choice: "none" }))
    ).not.toBe(digest);
    expect(
      localWireRequestDigest(
        serializeOpenRouterRequestBody({
          ...request,
          provider: { ...request.provider, max_price: { prompt: 0, completion: 1 } }
        })
      )
    ).not.toBe(digest);
    const changedTools = serializeOpenRouterTools().map((tool, index) =>
      index === 0
        ? { ...tool, function: { ...tool.function, description: "changed provider schema" } }
        : tool
    );
    expect(localWireRequestDigest(serializeOpenRouterRequestBody(request, changedTools))).not.toBe(
      digest
    );
    expect(
      localWireRequestDigest(
        serializeOpenRouterRequestBody(request, [...serializeOpenRouterTools()].reverse())
      )
    ).not.toBe(digest);
    expect(canonicalJson(body)).not.toContain("Authorization");
    const wireDigests: string[] = [];
    const sentBodies: string[] = [];
    const fakeFetch: S12Fetch = async (_url, init) => {
      sentBodies.push(String(init["body"]));
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({
          id: "synthetic",
          model: S12_SUBJECT.modelId,
          provider: "Cohere",
          choices: [{ message: { role: "assistant", content: "done" } }],
          usage: {}
        })
      };
    };
    const transport = new OpenRouterHttpTransport(fakeFetch);
    for (const secret of ["synthetic-secret-one", "synthetic-secret-two"]) {
      await transport.generate(request, secret, new AbortController().signal, (evidence) =>
        wireDigests.push(evidence.wireRequestDigest)
      );
    }
    expect(wireDigests).toEqual([digest, digest]);
    expect(sentBodies).toEqual([JSON.stringify(body), JSON.stringify(body)]);
    expect(localWireRequestDigest(JSON.parse(sentBodies[0]!) as Record<string, unknown>)).toBe(
      digest
    );
    expect(sentBodies.join("")).not.toContain("synthetic-secret");
  });

  it("records the concrete HTTP body digest in ordered request evidence", async () => {
    let sentBody: Readonly<Record<string, unknown>> | undefined;
    const fakeFetch: S12Fetch = async (url, init) => {
      let data: unknown;
      if (url.endsWith("/endpoints")) {
        data = {
          data: {
            endpoints: [
              {
                name: `Cohere | ${S12_SUBJECT.upstreamModelId}`,
                provider_name: "Cohere",
                tag: "cohere",
                pricing: { prompt: "0", completion: "0" },
                supported_parameters: supported
              }
            ]
          }
        };
      } else if (url.endsWith("/models")) {
        data = {
          data: [
            {
              id: S12_SUBJECT.modelId,
              pricing: { prompt: "0", completion: "0" },
              supported_parameters: supported
            }
          ]
        };
      } else {
        sentBody = JSON.parse(String(init["body"])) as Record<string, unknown>;
        data = {
          id: "synthetic-response",
          model: S12_SUBJECT.modelId,
          provider: "Cohere",
          choices: [{ message: { role: "assistant", content: "done" } }],
          usage: {}
        };
      }
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => data };
    };
    const result = await new S12QualificationRunner(
      new OpenRouterSubjectAdapter(
        new OpenRouterHttpTransport(fakeFetch),
        () => "SYNTHETIC_AUTH_SECRET"
      ),
      executor(),
      hooks("SATISFIED"),
      () => "2026-09-21T00:00:00Z",
      () => "id"
    ).run({
      workspaceRoot: "C:/fixture",
      fixtureDigest: "fixture",
      messages: [{ role: "user", content: "synthetic task" }]
    });
    expect(result.terminalStatus).toBe("COMPLETED");
    const wire = result.events.find((event) => event.type === "WIRE_REQUEST_PREPARED");
    expect(wire?.payload).toMatchObject({
      modelRequestId: "model-request:1",
      attemptId: "dry-attempt:id",
      wireRequestDigest: localWireRequestDigest(sentBody!)
    });
    expect(canonicalJson(result.events)).not.toContain("SYNTHETIC_AUTH_SECRET");
  });
  it("returns bounded recoverable results for subject tool mistakes", async () => {
    const local = new S12LocalToolExecutor({
      pathType: async (target) => {
        if (target.endsWith("missing"))
          throw Object.assign(new Error("host private detail"), { code: "ENOENT" });
        return target.endsWith("folder") ? "DIRECTORY" : "FILE";
      },
      readFile: async () => "content",
      writeFile: async () => undefined,
      listFiles: async () => [],
      runCommand: async () => ({ exitCode: 0, stdout: "", stderr: "" })
    });
    const cases = [
      { name: "read_file", arguments: { path: "missing" }, code: "PATH_NOT_FOUND" },
      { name: "read_file", arguments: { path: "folder" }, code: "PATH_IS_DIRECTORY" },
      { name: "read_file", arguments: { path: "../secret" }, code: "PATH_OUTSIDE_WORKSPACE" },
      { name: "read_file", arguments: { path: "verifier/spec.json" }, code: "FORBIDDEN_PATH" },
      { name: "run_command", arguments: { command: "whoami" }, code: "COMMAND_NOT_ALLOWED" },
      { name: "read_file", arguments: {}, code: "INVALID_ARGUMENT" }
    ] as const;
    for (const item of cases) {
      const output = await local.execute("C:/fixture", item);
      expect(output).toMatchObject({
        status: "ERROR",
        error: { code: item.code, recoverable: true }
      });
      expect(JSON.stringify(output)).not.toContain("host private detail");
      expect(JSON.stringify(output)).not.toContain("C:/fixture");
    }
  });

  it("classifies canonical command exits, timeouts, spawn failures, and executor faults", async () => {
    const cases = [
      { fault: { code: 1, stdout: "failed tests", stderr: "" }, expected: "NONZERO" },
      {
        fault: { code: "ETIMEDOUT", killed: true, stdout: "secret-output", stderr: "" },
        expected: "COMMAND_TIMEOUT"
      },
      {
        fault: { code: "ENOENT", stdout: "", stderr: "private-path" },
        expected: "COMMAND_PROCESS_FAILURE"
      },
      {
        fault: { code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER", stdout: "", stderr: "" },
        expected: "COMMAND_RESOURCE_LIMIT"
      },
      {
        fault: { code: "ERR_UNKNOWN", stdout: "", stderr: "private-environment" },
        expected: "TOOL_RUNTIME_INTERNAL_ERROR"
      }
    ] as const;
    for (const item of cases) {
      const operations = nodeToolOperations(async () => {
        throw Object.assign(new Error("Bearer hidden-token C:/private"), item.fault);
      });
      if (item.expected === "NONZERO") {
        await expect(operations.runCommand("C:/fixture", "pnpm test", 10)).resolves.toMatchObject({
          exitCode: 1
        });
      } else {
        await expect(operations.runCommand("C:/fixture", "pnpm test", 10)).rejects.toMatchObject({
          code: item.expected
        });
      }
    }
  });

  it("keeps a launched numeric nonzero exit as a completed command result", async () => {
    const transport = new ScriptedTransport([
      response({
        toolCalls: [
          { id: "failed-tests", name: "run_command", arguments: { command: "pnpm test" } }
        ]
      }),
      response()
    ]);
    const result = await new S12QualificationRunner(
      new OpenRouterSubjectAdapter(transport, () => "fake"),
      new S12LocalToolExecutor(
        nodeToolOperations(async () => {
          throw Object.assign(new Error("tests failed"), {
            code: 1,
            stdout: "failed tests",
            stderr: ""
          });
        })
      ),
      hooks("NOT_SATISFIED"),
      () => "2026-09-21T00:00:00Z",
      () => "id"
    ).run({ workspaceRoot: "C:/fixture", fixtureDigest: "fixture", messages: [] });
    expect(result.terminalStatus).toBe("COMPLETED");
    expect(
      result.events.find((event) => event.type === "TOOL_EXECUTION_RESULT")?.payload
    ).toMatchObject({
      callId: "failed-tests",
      status: "SUCCESS",
      exitStatus: 1
    });
  });

  it("propagates timeout with call identity and no successful tool or evaluation", async () => {
    const transport = new ScriptedTransport([
      response({
        toolCalls: [
          {
            id: "timed-call",
            name: "run_command",
            arguments: { command: "pnpm test", timeoutMs: 10 }
          }
        ]
      })
    ]);
    const local = new S12LocalToolExecutor({
      pathType: async () => "FILE",
      readFile: async () => "",
      writeFile: async () => undefined,
      listFiles: async () => [],
      runCommand: async () => {
        throw new S12ToolInstrumentationError(
          "COMMAND_TIMEOUT",
          "Bearer secret-token C:/host/private"
        );
      }
    });
    let evaluated = false;
    const result = await new S12QualificationRunner(
      new OpenRouterSubjectAdapter(transport, () => "fake"),
      local,
      {
        verifyFinalState: async () => ({}),
        evaluate: async () => {
          evaluated = true;
          return {};
        },
        packageEvidence: async () => ({})
      },
      () => "2026-09-21T00:00:00Z",
      () => "id"
    ).run({ workspaceRoot: "C:/fixture", fixtureDigest: "fixture", messages: [] });
    expect(result).toMatchObject({
      terminalStatus: "TIMEOUT",
      attemptId: "dry-attempt:id",
      structuredFailure: { code: "COMMAND_TIMEOUT" }
    });
    expect(
      result.events.find((event) => event.type === "TOOL_EXECUTION_RESULT")?.payload
    ).toMatchObject({
      callId: "timed-call",
      status: "ERROR",
      exitStatus: "TIMED_OUT",
      error: { code: "COMMAND_TIMEOUT", recoverable: false }
    });
    expect(
      result.events.some(
        (event) => event.type === "TOOL_EXECUTION_RESULT" && event.payload["status"] === "SUCCESS"
      )
    ).toBe(false);
    expect(evaluated).toBe(false);
    expect(result.evidence).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain("secret-token");
    expect(JSON.stringify(result)).not.toContain("C:/host/private");
  });

  it("keeps unexpected executor failures terminal and typed", async () => {
    const transport = new ScriptedTransport([
      response({
        toolCalls: [{ id: "fault-call", name: "run_command", arguments: { command: "pnpm test" } }]
      })
    ]);
    const local = new S12LocalToolExecutor({
      pathType: async () => "FILE",
      readFile: async () => "",
      writeFile: async () => undefined,
      listFiles: async () => [],
      runCommand: async () => {
        throw new Error("private executor detail");
      }
    });
    const result = await new S12QualificationRunner(
      new OpenRouterSubjectAdapter(transport, () => "fake"),
      local,
      hooks("SATISFIED"),
      () => "2026-09-21T00:00:00Z",
      () => "id"
    ).run({ workspaceRoot: "C:/fixture", fixtureDigest: "fixture", messages: [] });
    expect(result).toMatchObject({
      terminalStatus: "INSTRUMENTATION_FAILURE",
      structuredFailure: { code: "TOOL_RUNTIME_INTERNAL_ERROR" }
    });
    expect(
      result.events.find((event) => event.type === "TOOL_EXECUTION_RESULT")?.payload
    ).toMatchObject({
      callId: "fault-call",
      status: "ERROR",
      error: { code: "TOOL_RUNTIME_INTERNAL_ERROR", recoverable: false }
    });
    expect(JSON.stringify(result)).not.toContain("private executor detail");
  });

  it("keeps recoverable validation errors visible to the next model turn", async () => {
    const transport = new ScriptedTransport([
      response({
        toolCalls: [{ id: "bad-command", name: "run_command", arguments: { command: "whoami" } }]
      }),
      response()
    ]);
    const result = await new S12QualificationRunner(
      new OpenRouterSubjectAdapter(transport, () => "fake"),
      executor(),
      hooks("SATISFIED"),
      () => "2026-09-21T00:00:00Z",
      () => "id"
    ).run({ workspaceRoot: "C:/fixture", fixtureDigest: "fixture", messages: [] });
    expect(result.terminalStatus).toBe("COMPLETED");
    expect(
      result.events.find((event) => event.type === "TOOL_EXECUTION_RESULT")?.payload
    ).toMatchObject({
      callId: "bad-command",
      status: "ERROR",
      error: { code: "COMMAND_NOT_ALLOWED", recoverable: true }
    });
    const messages = transport.requests[1]?.["messages"] as Array<{
      role: string;
      content: string;
    }>;
    expect(messages.find((message) => message.role === "tool")?.content).toContain(
      "COMMAND_NOT_ALLOWED"
    );
  });

  it("propagates spawn failure as instrumentation failure without a success event", async () => {
    const transport = new ScriptedTransport([
      response({
        toolCalls: [{ id: "spawn-call", name: "run_command", arguments: { command: "pnpm test" } }]
      })
    ]);
    const operations = nodeToolOperations(async () => {
      throw Object.assign(new Error("C:/secret/location"), {
        code: "ENOENT",
        stderr: "Bearer private"
      });
    });
    const result = await new S12QualificationRunner(
      new OpenRouterSubjectAdapter(transport, () => "fake"),
      new S12LocalToolExecutor(operations),
      hooks("SATISFIED"),
      () => "2026-09-21T00:00:00Z",
      () => "id"
    ).run({ workspaceRoot: "C:/fixture", fixtureDigest: "fixture", messages: [] });
    expect(result).toMatchObject({
      terminalStatus: "INSTRUMENTATION_FAILURE",
      structuredFailure: { code: "COMMAND_PROCESS_FAILURE" }
    });
    expect(
      result.events.find((event) => event.type === "TOOL_EXECUTION_RESULT")?.payload
    ).toMatchObject({
      callId: "spawn-call",
      status: "ERROR",
      error: { code: "COMMAND_PROCESS_FAILURE", recoverable: false }
    });
    expect(JSON.stringify(result)).not.toContain("Bearer private");
    expect(JSON.stringify(result)).not.toContain("C:/secret/location");
    expect(result.evaluation).toBeUndefined();
    expect(result.evidence).toBeUndefined();
  });
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
      configDigest: S12_CONFIG_DIGEST_10T
    });
    expect(result.events.map((event) => event.sequence)).toEqual(
      result.events.map((_, index) => index + 1)
    );
  });

  it.each([
    [S12_EXECUTION_STRATA.S12_10_TURNS, S12_CONFIG_DIGEST_10T],
    [S12_EXECUTION_STRATA.S12_20_TURNS, S12_CONFIG_DIGEST_20T]
  ] as const)("stops exactly at %s without a further generation", async (contract, digest) => {
    const continuing = response({
      toolCalls: [{ id: "call", name: "list_files", arguments: { path: "." } }]
    });
    const transport = new ScriptedTransport(
      Array.from({ length: contract.maxModelTurns }, () => continuing)
    );
    const result = await new S12QualificationRunner(
      new OpenRouterSubjectAdapter(transport, () => "fake"),
      executor(),
      hooks("SATISFIED"),
      () => "2026-09-21T00:00:00Z",
      () => "id",
      contract
    ).run({ workspaceRoot: "C:/fixture", fixtureDigest: "fixture", messages: [] });
    expect(transport.generationCalls).toBe(contract.maxModelTurns);
    expect(result.modelRequestCount).toBe(contract.maxModelTurns);
    expect(result.terminalStatus).toBe("RESOURCE_LIMIT");
    expect(result.structuredFailure?.code).toBe("MAX_MODEL_TURNS");
    expect(result.configDigest).toBe(digest);
    expect(result.events.filter((event) => event.type === "ATTEMPT_CREATED")).toHaveLength(1);
    expect(result.events.filter((event) => event.type === "GENERATION_INVOKED")).toHaveLength(
      contract.maxModelTurns
    );
    expect(result.events.some((event) => event.type === "EVALUATION_RESULT")).toBe(false);
    expect(result.events.some((event) => event.type === "EVIDENCE_RESULT")).toBe(false);
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

describe("S12 canonical temporary-fixture qualification", () => {
  const schema = `export interface SchemaV2Configuration { readonly schemaVersion: "2"; readonly project: { readonly id: string }; readonly services: readonly { readonly serviceId: string; readonly runtime: { readonly command: string }; readonly environment: Readonly<Record<string, string>> }[] }\nexport function isSchemaV2(value: unknown): value is SchemaV2Configuration { if (!value || typeof value !== "object") return false; const v=value as Record<string,unknown>; return v.schemaVersion === "2" && !!v.project && Array.isArray(v.services); }\n`;
  const migration = `import { isSchemaV1, type SchemaV1Configuration } from "./schema-v1.js"; import type { SchemaV2Configuration } from "./schema-v2.js"; export function migrateConfiguration(input: SchemaV1Configuration): SchemaV2Configuration { if (!isSchemaV1(input)) throw new Error("invalid v1 input"); return { schemaVersion:"2", project:{id:input.projectId}, services:input.services.map(service=>({serviceId:service.id,runtime:{command:service.command},environment:{...service.environment}})) }; }\n`;
  const cli = `import { readFile } from "node:fs/promises"; import { migrateConfiguration } from "./migrate.js"; try { const input=JSON.parse(await readFile(process.argv[2] ?? "", "utf8")); process.stdout.write(JSON.stringify(migrateConfiguration(input))+"\\n"); } catch (error) { process.stderr.write((error instanceof Error ? error.message : "invalid input")+"\\n"); process.exitCode=1; }\n`;

  async function workspace() {
    const temporaryRoot = path.join(process.cwd(), "tmp");
    await mkdir(temporaryRoot, { recursive: true });
    const parent = await mkdtemp(path.join(temporaryRoot, "s12-r2-"));
    const target = path.join(parent, "fixture");
    await cp(path.join(process.cwd(), "fixtures", "s12-lh-config-migration-feasibility"), target, {
      recursive: true
    });
    return { parent, target };
  }

  it("propagates canonical timeout, resource, and spawn faults through capture without evaluation", async () => {
    const cases = [
      {
        fault: { code: "ETIMEDOUT", killed: true, stdout: "synthetic-secret-output" },
        terminal: "TIMEOUT",
        code: "COMMAND_TIMEOUT"
      },
      {
        fault: { code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER", stderr: "synthetic-secret-output" },
        terminal: "RESOURCE_LIMIT",
        code: "COMMAND_RESOURCE_LIMIT"
      },
      {
        fault: { code: "ENOENT", stderr: "synthetic-private-path" },
        terminal: "INSTRUMENTATION_FAILURE",
        code: "COMMAND_PROCESS_FAILURE"
      }
    ] as const;
    for (const item of cases) {
      const transport = new ScriptedTransport([
        response({
          toolCalls: [
            {
              id: "canonical-command",
              name: "run_command",
              arguments: { command: "pnpm test", timeoutMs: 10 }
            }
          ]
        })
      ]);
      const output = await new S12CanonicalQualificationRunner(transport, async () => {
        throw Object.assign(new Error("synthetic-private-error"), item.fault);
      }).run({
        mode: "DRY_RUN",
        workspaceRoot: "C:/synthetic-fixture",
        fixtureDigest: S12_FIXTURE_IDENTITY.fixtureDigest,
        environmentDigest: "e".repeat(64),
        implementationSha: "1".repeat(40),
        implementationTree: "2".repeat(40),
        configurationDigest: S12_CONFIG_DIGEST_10T,
        taskInstruction: frozenTaskInstruction
      });
      expect(output.qualification).toMatchObject({
        terminalStatus: item.terminal,
        modelRequestCount: 1,
        attemptId: expect.any(String),
        structuredFailure: { code: item.code }
      });
      expect(
        output.qualification.events.find((event) => event.type === "TOOL_EXECUTION_RESULT")?.payload
      ).toMatchObject({
        callId: "canonical-command",
        status: "ERROR",
        error: { code: item.code, recoverable: false }
      });
      expect(
        output.qualification.events.some(
          (event) => event.type === "TOOL_EXECUTION_RESULT" && event.payload["status"] === "SUCCESS"
        )
      ).toBe(false);
      expect(output.qualification.evaluation).toBeUndefined();
      expect(output.qualification.evidence).toBeUndefined();
      expect(output.s05).toBeUndefined();
      expect(output.s09).toBeUndefined();
      expect(JSON.stringify(output)).not.toContain("synthetic-secret-output");
      expect(JSON.stringify(output)).not.toContain("synthetic-private-path");
    }
  });

  it("Case A mutates a real fixture and runs verifier, evaluator, S05, and S09", async () => {
    const temp = await workspace();
    try {
      const transport = new ScriptedTransport([
        response({
          toolCalls: [
            {
              id: "schema",
              name: "write_file",
              arguments: { path: "src/schema-v2.ts", content: schema }
            }
          ]
        }),
        response({
          toolCalls: [
            {
              id: "migration",
              name: "write_file",
              arguments: { path: "src/migrate.ts", content: migration }
            }
          ]
        }),
        response({
          toolCalls: [
            { id: "cli", name: "write_file", arguments: { path: "src/cli.ts", content: cli } }
          ]
        }),
        response()
      ]);
      const output = await new S12CanonicalQualificationRunner(transport).run({
        mode: "DRY_RUN",
        workspaceRoot: temp.target,
        fixtureDigest: "47dbb3c89b5a56d74710e80205a86a691be0fbb1301b2c3f9147a1af614cee63",
        environmentDigest: "e".repeat(64),
        implementationSha: "926c6eac5c3de3859efdbea357f7a671c62b0d61",
        implementationTree: "f9bddb617c31990df48dfd734f97161ff2d5abf9",
        configurationDigest: S12_CONFIG_DIGEST_10T,
        taskInstruction: frozenTaskInstruction
      });
      expect(output.qualification.terminalStatus).toBe("COMPLETED");
      expect(output.qualification.verification).toMatchObject({ criterion: "SATISFIED" });
      expect(output.evaluator).toEqual({
        evaluatorId: "LongHorizonTestingEngine.evaluateLongHorizonTrajectory",
        evaluatorVersion: "0.1.0"
      });
      expect(output.metric).toMatchObject({
        metricId: "long_horizon_resilience_index",
        metricVersion: "0.1.0"
      });
      expect(output.exactReplay).toBe(true);
      expect(output.s05?.current.scope).toBe("RELIABILITY_S05");
      expect(output.s09).toMatchObject({
        internalVerification: "VERIFIED_INTERNAL_CONSISTENCY",
        authority: "INTERNAL_CONSISTENCY_ONLY",
        scientificAuthority: "NONE"
      });
      const firstRequest = transport.requests[0]!;
      expect(firstRequest["messages"]).toEqual([
        { role: "system", content: S12_SUBJECT_CONFIGURATION.systemInstruction.value },
        { role: "user", content: frozenTaskInstruction }
      ]);
      expect(output).toMatchObject({
        systemInstructionDigest: SYSTEM_PROMPT_DIGEST,
        taskInstructionDigest: S12_TASK_INSTRUCTION_DIGEST,
        toolDefinitionDigest: TOOL_DEFINITION_DIGEST,
        initialMessageSequenceDigest: computeSha256(canonicalJson(firstRequest["messages"]))
      });
      expect(firstRequest["provider"]).toMatchObject({
        only: ["cohere"],
        order: ["cohere"],
        allow_fallbacks: false,
        require_parameters: true,
        max_price: { prompt: 0, completion: 0 }
      });
      expect(output.qualification.events.some((event) => event.type === "REQUEST_PREPARED")).toBe(
        true
      );
      expect(transport.generationCalls).toBe(4);
    } finally {
      await rm(temp.parent, { recursive: true, force: true });
    }
  }, 120_000);

  it("Case B preserves a real incomplete mutation as subject evidence", async () => {
    const temp = await workspace();
    try {
      const transport = new ScriptedTransport([
        response({
          toolCalls: [
            {
              id: "bad",
              name: "write_file",
              arguments: { path: "src/migrate.ts", content: "export const incomplete = true;\n" }
            }
          ]
        }),
        response()
      ]);
      const output = await new S12CanonicalQualificationRunner(transport).run({
        mode: "DRY_RUN",
        workspaceRoot: temp.target,
        fixtureDigest: "47dbb3c89b5a56d74710e80205a86a691be0fbb1301b2c3f9147a1af614cee63",
        environmentDigest: "e".repeat(64),
        implementationSha: "926c6eac5c3de3859efdbea357f7a671c62b0d61",
        implementationTree: "f9bddb617c31990df48dfd734f97161ff2d5abf9",
        configurationDigest: S12_CONFIG_DIGEST_10T,
        taskInstruction: frozenTaskInstruction
      });
      expect(output.qualification.terminalStatus).toBe("COMPLETED");
      expect(output.qualification.verification).toMatchObject({ criterion: "NOT_SATISFIED" });
      expect(output.metric).toBeDefined();
      expect(output.s05).toBeDefined();
      expect(output.s09?.internalVerification).toBe("VERIFIED_INTERNAL_CONSISTENCY");
    } finally {
      await rm(temp.parent, { recursive: true, force: true });
    }
  }, 120_000);

  it("rejects superseded fixture 0.1.0 before any subject request", async () => {
    const transport = new ScriptedTransport([response()]);
    const output = await new S12CanonicalQualificationRunner(transport).run({
      mode: "LIVE_QUALIFICATION",
      liveAuthorized: true,
      workspaceRoot: "C:/not-reached",
      fixtureDigest: "a53583cb69399dbf2038918b8ba70925699eefc0a8a0f1eea2a21c8c703710be",
      environmentDigest: "e".repeat(64),
      implementationSha: "926c6eac5c3de3859efdbea357f7a671c62b0d61",
      implementationTree: "f9bddb617c31990df48dfd734f97161ff2d5abf9",
      configurationDigest: S12_CONFIG_DIGEST_10T,
      taskInstruction: frozenTaskInstruction
    });
    expect(output.qualification).toMatchObject({
      terminalStatus: "PREFLIGHT_BLOCKED",
      modelRequestCount: 0,
      structuredFailure: { code: "FIXTURE_IDENTITY_DRIFT" }
    });
    expect(transport.generationCalls).toBe(0);
  });

  it("blocks task and configuration drift before attempt or generation", async () => {
    for (const drift of [
      { configurationDigest: S12_CONFIG_DIGEST_10T, taskInstruction: "changed task" },
      { configurationDigest: "0".repeat(64), taskInstruction: frozenTaskInstruction }
    ]) {
      const transport = new ScriptedTransport([response()]);
      const output = await new S12CanonicalQualificationRunner(transport).run({
        mode: "LIVE_QUALIFICATION",
        liveAuthorized: true,
        workspaceRoot: "C:/not-reached",
        fixtureDigest: "47dbb3c89b5a56d74710e80205a86a691be0fbb1301b2c3f9147a1af614cee63",
        environmentDigest: "e".repeat(64),
        implementationSha: "5473c687e82ce2cf5c125e4f7bbe4f750eb6a236",
        implementationTree: "7b90883405e4b085419c3f4489d6450bfccddf65",
        ...drift
      });
      expect(output.qualification.terminalStatus).toBe("PREFLIGHT_BLOCKED");
      expect(output.qualification.attemptId).toBeUndefined();
      expect(output.qualification.modelRequestCount).toBe(0);
      expect(transport.generationCalls).toBe(0);
    }
  });

  it("counts an invoked generation even when transport rejects", async () => {
    const transport = new ScriptedTransport([new Error("provider unavailable")]);
    const result = await new S12QualificationRunner(
      new OpenRouterSubjectAdapter(transport, () => "fake"),
      executor(),
      hooks("SATISFIED"),
      () => "2026-09-21T00:00:00Z",
      () => "id"
    ).run({
      workspaceRoot: "C:/fixture",
      fixtureDigest: "fixture",
      messages: [],
      mode: "LIVE_QUALIFICATION",
      liveAuthorized: true
    });
    expect(result).toMatchObject({
      terminalStatus: "INSTRUMENTATION_FAILURE",
      modelRequestCount: 1,
      runId: "run:id",
      attemptId: "attempt:id"
    });
    expect(transport.generationCalls).toBe(1);
  });

  it("distinguishes preservation, immutability, CLI, and build negative witnesses", async () => {
    const variants = [
      {
        name: "preserved data lost",
        expectedMilestone: "M3",
        schema,
        migration: `import { isSchemaV1, type SchemaV1Configuration } from "./schema-v1.js"; import type { SchemaV2Configuration } from "./schema-v2.js"; export function migrateConfiguration(input: SchemaV1Configuration): SchemaV2Configuration { if (!isSchemaV1(input)) throw new Error("invalid v1 input"); return { schemaVersion:"2", project:{id:input.projectId}, services:input.services.map(service=>({serviceId:service.id,runtime:{command:service.command},environment:{}})) }; }\n`,
        cli
      },
      {
        name: "original input mutated",
        expectedMilestone: "M3",
        schema,
        migration: `import { isSchemaV1, type SchemaV1Configuration } from "./schema-v1.js"; import type { SchemaV2Configuration } from "./schema-v2.js"; export function migrateConfiguration(input: SchemaV1Configuration): SchemaV2Configuration { if (!isSchemaV1(input)) throw new Error("invalid v1 input"); const services = input.services as { id:string; command:string; environment:Record<string,string> }[]; services.reverse(); return { schemaVersion:"2", project:{id:input.projectId}, services:services.map(service=>({serviceId:service.id,runtime:{command:service.command},environment:{...service.environment}})) }; }\n`,
        cli
      },
      {
        name: "CLI behavior incorrect",
        expectedMilestone: "M4",
        schema,
        migration,
        cli: `process.stdout.write("not canonical\\n");\n`
      },
      {
        name: "integration build fails",
        expectedMilestone: "M5",
        schema: `export interface SchemaV2Configuration { this is invalid syntax }\n`,
        migration,
        cli
      }
    ] as const;

    for (const variant of variants) {
      const temp = await workspace();
      try {
        const transport = new ScriptedTransport([
          response({
            toolCalls: [
              {
                id: "schema",
                name: "write_file",
                arguments: { path: "src/schema-v2.ts", content: variant.schema }
              }
            ]
          }),
          response({
            toolCalls: [
              {
                id: "migration",
                name: "write_file",
                arguments: { path: "src/migrate.ts", content: variant.migration }
              }
            ]
          }),
          response({
            toolCalls: [
              {
                id: "cli",
                name: "write_file",
                arguments: { path: "src/cli.ts", content: variant.cli }
              }
            ]
          }),
          response()
        ]);
        const output = await new S12CanonicalQualificationRunner(transport).run({
          mode: "DRY_RUN",
          workspaceRoot: temp.target,
          fixtureDigest: "47dbb3c89b5a56d74710e80205a86a691be0fbb1301b2c3f9147a1af614cee63",
          environmentDigest: "e".repeat(64),
          implementationSha: "926c6eac5c3de3859efdbea357f7a671c62b0d61",
          implementationTree: "f9bddb617c31990df48dfd734f97161ff2d5abf9",
          configurationDigest: S12_CONFIG_DIGEST_10T,
          taskInstruction: frozenTaskInstruction
        });
        const verification = output.qualification.verification as {
          milestones: readonly { milestoneId: string; outcome: string }[];
        };
        expect(
          verification.milestones.find((item) => item.milestoneId === variant.expectedMilestone),
          variant.name
        ).toMatchObject({ outcome: "NOT_SATISFIED" });
      } finally {
        await rm(temp.parent, { recursive: true, force: true });
      }
    }
  }, 240_000);
});
