import { describe, expect, it } from "vitest";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  OpenRouterSubjectAdapter,
  S12CommandDiagnosticSidecarBuilder,
  S12CanonicalQualificationRunner,
  S12ToolInstrumentationError,
  S12_FIXTURE_IDENTITY,
  S12LocalToolExecutor,
  S12QualificationRunner,
  S12_EXECUTION_STRATA,
  S12_SUBJECT,
  mapCaptureToBehavioralTrace,
  executionCaptureDigest,
  S12_CONFIG_DIGEST_10T,
  mapExactRepeatabilityToS05,
  type OpenRouterEndpointMetadata,
  type OpenRouterGenerationResponse,
  type OpenRouterModelMetadata,
  type OpenRouterTransport,
  type S12ExecutionCapture
} from "../../packages/benchmark/src/index.js";
import { canonicalJson, computeSha256 } from "../../packages/sandbox-contracts/src/index.js";

const previewLimit = 4096;
const association = { runId: "run-1", attemptId: "attempt-1", toolCallId: "call-1" };

const model: OpenRouterModelMetadata = {
  id: S12_SUBJECT.modelId,
  pricing: { prompt: "0", completion: "0" },
  supportedParameters: ["tools", "tool_choice", "temperature", "top_p", "max_tokens", "seed"]
};
const endpoint: OpenRouterEndpointMetadata = {
  name: `Cohere | ${S12_SUBJECT.upstreamModelId}`,
  modelId: S12_SUBJECT.modelId,
  providerName: S12_SUBJECT.upstreamProvider,
  tag: S12_SUBJECT.endpointTag,
  pricing: { prompt: "0", completion: "0" },
  supportedParameters: model.supportedParameters
};

const response = (toolCalls: OpenRouterGenerationResponse["toolCalls"] = []) => ({
  responseId: "response-1",
  model: S12_SUBJECT.modelId,
  provider: S12_SUBJECT.upstreamProvider,
  message: { role: "assistant", content: "done" } as const,
  toolCalls,
  usage: { inputTokens: 1, outputTokens: 1, reportedCostUsd: 0 }
});

class ScriptedTransport implements OpenRouterTransport {
  readonly requests: Readonly<Record<string, unknown>>[] = [];
  readonly wireDigests: string[] = [];
  private next = 0;

  constructor(private readonly responses: readonly OpenRouterGenerationResponse[]) {}

  async listModels(): Promise<readonly OpenRouterModelMetadata[]> {
    return [model];
  }

  async listEndpoints(): Promise<readonly OpenRouterEndpointMetadata[]> {
    return [endpoint];
  }

  async generate(
    request: Readonly<Record<string, unknown>>,
    _apiKey: string,
    _signal: AbortSignal,
    wireRequestPrepared?: (evidence: { readonly wireRequestDigest: string }) => void
  ): Promise<OpenRouterGenerationResponse> {
    this.requests.push(structuredClone(request));
    const wireRequestDigest = computeSha256(canonicalJson(request));
    this.wireDigests.push(wireRequestDigest);
    wireRequestPrepared?.({ wireRequestDigest });
    return this.responses[this.next++]!;
  }
}

function makeBuilder(
  overrides: ConstructorParameters<typeof S12CommandDiagnosticSidecarBuilder>[0] = {}
) {
  return new S12CommandDiagnosticSidecarBuilder({
    knownCredentialValues: ["runtime-secret-value"],
    ...overrides
  });
}

function fixtureCapture(
  events: readonly {
    sequence: number;
    timestamp: string;
    type: string;
    payload: Readonly<Record<string, unknown>>;
  }[]
): S12ExecutionCapture {
  const attempt = events.find((event) => event.type === "ATTEMPT_CREATED")!;
  const command = events.find((event) => event.type === "TOOL_EXECUTION_RESULT")!;
  const modelTurns = events
    .filter((event) => event.type === "MODEL_RESPONSE")
    .map((event) => ({
      sequence: event.sequence,
      role: "assistant" as const,
      contentDigest: String(event.payload["contentDigest"])
    }));
  return {
    runId: String(attempt.payload["runId"]),
    attemptId: String(attempt.payload["attemptId"]),
    utcTimestamp: events[0]?.timestamp ?? "2026-01-01T00:00:00Z",
    subjectId: S12_SUBJECT.subjectId,
    modelId: S12_SUBJECT.modelId,
    upstreamModel: S12_SUBJECT.upstreamModelId,
    upstreamProvider: S12_SUBJECT.upstreamProvider,
    configDigest: S12_CONFIG_DIGEST_10T,
    fixtureDigest: "fixture-digest",
    environmentDigest: "environment-digest",
    modelTurns,
    toolCalls: [
      {
        callId: String(command.payload["callId"]),
        sequence: command.sequence,
        requestedAt: command.timestamp,
        completedAt: command.timestamp,
        name: "run_command",
        arguments: { command: "pnpm test" },
        result: {
          status: command.payload["status"],
          ...(command.payload["result"] as Record<string, unknown>)
        },
        durationMs: Number(command.payload["durationMs"]),
        exitStatus: command.payload["exitStatus"] as number,
        provenance: command.payload["provenance"] as readonly string[]
      }
    ],
    artifactMutations: [],
    terminalStatus: "SUCCEEDED",
    usage: { inputTokens: 2, outputTokens: 2, accounting: "PROVIDER_REPORTED", reportedCostUsd: 0 },
    freeStatusAtExecution: "VERIFIED_ZERO_PRICE",
    retryLineage: [],
    missingness: [],
    scientificAuthority: "NONE"
  };
}

describe("S12 non-authoritative command diagnostic sidecar", () => {
  it("has a distinct versioned policy/schema and stable canonical association keys", () => {
    const builder = makeBuilder();
    builder.captureCompleted({ ...association, stdout: "ok", stderr: "" });
    const sidecar = builder.build()!;
    expect(sidecar).toMatchObject({
      artifactType: "S12_COMMAND_DIAGNOSTIC_SIDECAR",
      schemaVersion: "0.1.0",
      policyId: "S12_COMMAND_DIAGNOSTIC_POLICY",
      policyVersion: "0.1.0",
      authority: "NON_AUTHORITATIVE_OBSERVABILITY",
      records: [{ ...association, policyVersion: "0.1.0", schemaVersion: "0.1.0" }]
    });
  });

  it("hashes the complete decoded UTF-8 stream before projection", () => {
    const left = "x".repeat(previewLimit) + "left-tail";
    const right = "x".repeat(previewLimit) + "right-tail";
    const first = makeBuilder();
    const second = makeBuilder();
    first.captureCompleted({ ...association, stdout: left, stderr: "" });
    second.captureCompleted({ ...association, stdout: right, stderr: "" });
    const leftStream = first.build()!.records[0]!.stdout;
    const rightStream = second.build()!.records[0]!.stdout;
    expect(leftStream.preview).toBe(rightStream.preview);
    expect(leftStream.preview).toHaveLength(previewLimit);
    expect(leftStream.completeCapturedDecodedStreamDigest).toBe(
      computeSha256(Buffer.from(left, "utf8"))
    );
    expect(leftStream.completeCapturedDecodedStreamDigest).not.toBe(
      rightStream.completeCapturedDecodedStreamDigest
    );
    expect(leftStream.digestRepresentation).toBe("SHA256_UTF8_COMPLETE_DECODED_STRING");
  });

  it("redacts a secret spanning the projection boundary before truncation", () => {
    const secret = `SENSITIVE_${"z".repeat(80)}_END`;
    const raw = "p".repeat(previewLimit - 26) + `TOKEN=${secret}` + "tail";
    const builder = makeBuilder();
    builder.captureCompleted({ ...association, stdout: raw, stderr: "" });
    const preview = builder.build()!.records[0]!.stdout.preview!;
    expect(preview.length).toBeLessThanOrEqual(previewLimit);
    expect(preview).not.toContain("SENSITIVE_");
    expect(preview).toContain("TOKEN=[REDACTED]");
  });

  it("keeps the UTF-16 preview boundary valid when a surrogate pair crosses it", () => {
    const stream = "x".repeat(previewLimit - 1) + "😀" + "tail";
    const builder = makeBuilder();
    builder.captureCompleted({ ...association, stdout: stream, stderr: "" });
    const output = builder.build()!.records[0]!.stdout;
    expect(output.preview!.length).toBeLessThanOrEqual(previewLimit);
    const finalUnit = output.preview!.charCodeAt(output.preview!.length - 1);
    expect(finalUnit >= 0xd800 && finalUnit <= 0xdbff).toBe(false);
    expect(output.preview).toBe("x".repeat(previewLimit - 1));
    expect(output.completeCapturedDecodedStreamDigest).toBe(
      computeSha256(Buffer.from(stream, "utf8"))
    );
  });

  it("bounds oversized stdout and stderr independently", () => {
    const builder = makeBuilder();
    builder.captureCompleted({
      ...association,
      stdout: "o".repeat(previewLimit + 13),
      stderr: "e".repeat(previewLimit + 29)
    });
    const record = builder.build()!.records[0]!;
    expect(record.stdout.preview).toHaveLength(previewLimit);
    expect(record.stderr.preview).toHaveLength(previewLimit);
    expect(record.stdout.previewTruncated).toBe(true);
    expect(record.stderr.previewTruncated).toBe(true);
  });

  it("represents complete empty streams as EMPTY with the empty UTF-8 digest", () => {
    const builder = makeBuilder();
    builder.captureCompleted({ ...association, stdout: "", stderr: "" });
    const record = builder.build()!.records[0]!;
    expect(record.stdout).toMatchObject({
      status: "EMPTY",
      preview: "",
      previewTruncated: false,
      completeCapturedDecodedStreamDigest: computeSha256(Buffer.from("", "utf8"))
    });
    expect(record.stderr.status).toBe("EMPTY");
  });

  it("redacts bearer, authorization, known and credential-shaped values including escaped serialization", () => {
    const raw = [
      "Authorization: Basic basic-secret-value",
      "Bearer bearer.secret-value",
      "OPENROUTER_API_KEY=credential-shaped-secret",
      "runtime-secret-value",
      JSON.stringify({ api_key: "serialized-secret-value", path: "/tmp/private/file" })
    ].join("\n");
    const builder = makeBuilder({
      knownCredentialValues: ["runtime-secret-value", "serialized-secret-value"]
    });
    builder.captureCompleted({ ...association, stdout: raw, stderr: "" });
    const preview = builder.build()!.records[0]!.stdout.preview!;
    for (const secret of [
      "basic-secret-value",
      "bearer.secret-value",
      "credential-shaped-secret",
      "runtime-secret-value",
      "serialized-secret-value",
      "/tmp/private/file"
    ])
      expect(preview).not.toContain(secret);
    expect(preview).toContain("Authorization: [REDACTED]");
  });

  it("redacts POSIX, Windows, slash-form, UNC and escaped serialized paths", () => {
    const paths = [
      "/home/user/private/file",
      "/tmp/secret",
      "C:\\Users\\name\\secret.txt",
      "C:/Users/name/secret.txt",
      "\\\\server\\share\\private.txt",
      JSON.stringify(
        JSON.stringify({
          path: "C:\\Users\\serialized\\private.txt",
          other: "/home/serialized/private"
        })
      )
    ];
    const builder = makeBuilder();
    builder.captureCompleted({ ...association, stdout: paths.join("\n"), stderr: "" });
    const preview = builder.build()!.records[0]!.stdout.preview!;
    for (const privatePart of [
      "/home/user",
      "/tmp/secret",
      "Users\\name",
      "Users/name",
      "server\\share",
      "serialized\\private",
      "/home/serialized"
    ])
      expect(preview).not.toContain(privatePart);
    expect(preview.match(/\[REDACTED_HOST_PATH\]/g)?.length).toBeGreaterThanOrEqual(6);
  });

  it("marks a stream unavailable on redaction/projection failure without unredacted fallback", () => {
    const builder = makeBuilder({
      projector: () => {
        throw new Error("redaction failed");
      }
    });
    builder.captureCompleted({ ...association, stdout: "must-not-leak", stderr: "" });
    const record = builder.build()!.records[0]!;
    expect(record.stdout.status).toBe("UNAVAILABLE");
    expect(record.stdout.preview).toBeUndefined();
    expect(record.stdout.completeCapturedDecodedStreamDigest).toBeDefined();
    expect(record.stderr.status).toBe("EMPTY");
  });

  it("omits the optional artifact if sidecar construction fails", () => {
    const builder = makeBuilder({
      artifactFactory: () => {
        throw new Error("construction failed");
      }
    });
    builder.captureCompleted({ ...association, stdout: "safe", stderr: "" });
    expect(builder.build()).toBeUndefined();
  });

  it("keeps completed zero and nonzero command results canonical and diagnostic-free", async () => {
    for (const exitCode of [0, 7]) {
      const builder = makeBuilder();
      const executor = new S12LocalToolExecutor(
        {
          pathType: async () => "FILE",
          readFile: async () => "",
          writeFile: async () => undefined,
          listFiles: async () => [],
          runCommand: async () => ({ exitCode, stdout: "out", stderr: "err" })
        },
        (output) => builder.captureCompleted({ ...association, ...output })
      );
      const result = await executor.execute(
        "C:/workspace",
        { name: "run_command", arguments: { command: "pnpm test" } },
        undefined,
        association
      );
      expect(result).toEqual({
        status: "SUCCESS",
        result: {
          stdoutDigest: computeSha256(canonicalJson("out")),
          stderrDigest: computeSha256(canonicalJson("err"))
        },
        exitStatus: exitCode,
        provenance: ["s12-controlled-command@0.1.0"]
      });
      expect(result.result).not.toHaveProperty("diagnostic");
      expect(builder.build()!.records[0]!.stdout.status).toBe("AVAILABLE");
    }
  });

  it("records incomplete timeout, resource and instrumentation streams as unavailable", () => {
    const builder = makeBuilder();
    builder.recordUnavailable(association);
    const record = builder.build()!.records[0]!;
    expect(record.stdout).toEqual({ status: "UNAVAILABLE" });
    expect(record.stderr).toEqual({ status: "UNAVAILABLE" });
    expect(record.stdout).not.toHaveProperty("completeCapturedDecodedStreamDigest");
    expect(record.stderr).not.toHaveProperty("preview");
  });

  it("keeps timeout, resource and instrumentation classifications while withholding partial streams", async () => {
    const cases = [
      { code: "COMMAND_TIMEOUT" as const, terminalStatus: "TIMEOUT" as const },
      { code: "COMMAND_RESOURCE_LIMIT" as const, terminalStatus: "RESOURCE_LIMIT" as const },
      {
        code: "COMMAND_PROCESS_FAILURE" as const,
        terminalStatus: "INSTRUMENTATION_FAILURE" as const
      }
    ];
    for (const item of cases) {
      const transport = new ScriptedTransport([
        response([
          { id: association.toolCallId, name: "run_command", arguments: { command: "pnpm test" } }
        ])
      ]);
      const builder = makeBuilder();
      const executor = new S12LocalToolExecutor(
        {
          pathType: async () => "FILE",
          readFile: async () => "",
          writeFile: async () => undefined,
          listFiles: async () => [],
          runCommand: async () => {
            throw new S12ToolInstrumentationError(item.code, "partial Bearer incomplete-secret");
          }
        },
        (output) => builder.captureCompleted({ ...association, ...output })
      );
      const result = await new S12QualificationRunner(
        new OpenRouterSubjectAdapter(transport, () => "fake"),
        executor,
        {
          verifyFinalState: async () => ({}),
          evaluate: async () => ({}),
          packageEvidence: async () => ({})
        },
        () => "2026-01-01T00:00:00.000Z",
        () => "fixed-id",
        S12_EXECUTION_STRATA.S12_10_TURNS,
        () => 100,
        builder
      ).run({ workspaceRoot: "C:/workspace", fixtureDigest: "fixture", messages: [] });
      expect(result.terminalStatus).toBe(item.terminalStatus);
      const record = builder.build()!.records[0]!;
      expect(record.stdout).toEqual({ status: "UNAVAILABLE" });
      expect(record.stderr).toEqual({ status: "UNAVAILABLE" });
      expect(JSON.stringify(record)).not.toContain("incomplete-secret");
    }
  });

  it("keeps policy identity out of provider requests, canonical results, events and evaluator/S09 inputs", async () => {
    const runOnce = async (projectionFails: boolean) => {
      const transport = new ScriptedTransport([
        response([
          { id: association.toolCallId, name: "run_command", arguments: { command: "pnpm test" } }
        ]),
        response()
      ]);
      const builder = makeBuilder({
        ...(projectionFails
          ? {
              projector: () => {
                throw new Error("projection unavailable");
              }
            }
          : {})
      });
      const executor = new S12LocalToolExecutor(
        {
          pathType: async () => "FILE",
          readFile: async () => "",
          writeFile: async () => undefined,
          listFiles: async () => [],
          runCommand: async () => ({ exitCode: 0, stdout: "operator diagnostic", stderr: "" })
        },
        (output) => builder.captureCompleted({ ...association, ...output })
      );
      let evaluationInput: unknown;
      let packageInput: unknown;
      let nextId = 0;
      const result = await new S12QualificationRunner(
        new OpenRouterSubjectAdapter(transport, () => "fake-credential"),
        executor,
        {
          verifyFinalState: async () => ({ criterion: "SATISFIED" }),
          evaluate: async (events) => {
            evaluationInput = structuredClone(events);
            return { traceDigest: computeSha256(canonicalJson(events)) };
          },
          packageEvidence: async (input) => {
            packageInput = structuredClone(input);
            return { packageDigest: computeSha256(canonicalJson(input)) };
          }
        },
        () => "2026-01-01T00:00:00.000Z",
        () => `fixed-${++nextId}`,
        S12_EXECUTION_STRATA.S12_10_TURNS,
        () => 100,
        builder
      ).run({ workspaceRoot: "C:/workspace", fixtureDigest: "fixture", messages: [] });
      const sidecar = builder.build()!;
      return { result, transport, evaluationInput, packageInput, sidecar };
    };

    const available = await runOnce(false);
    const unavailable = await runOnce(true);
    expect(available.transport.requests).toEqual(unavailable.transport.requests);
    expect(available.transport.wireDigests).toEqual(unavailable.transport.wireDigests);
    expect(available.result).toEqual(unavailable.result);
    expect(available.evaluationInput).toEqual(unavailable.evaluationInput);
    expect(available.packageInput).toEqual(unavailable.packageInput);
    expect(canonicalJson(available.result.events)).not.toContain("operator diagnostic");
    expect(canonicalJson(available.result.events)).not.toContain("S12_COMMAND_DIAGNOSTIC_POLICY");
    expect(available.sidecar.records[0]!.stdout.status).toBe("AVAILABLE");
    expect(unavailable.sidecar.records[0]!.stdout.status).toBe("UNAVAILABLE");
    expect(unavailable.sidecar.records[0]!.stdout.preview).toBeUndefined();

    const captureA = fixtureCapture(available.result.events);
    const captureB = fixtureCapture(unavailable.result.events);
    const traceA = mapCaptureToBehavioralTrace(captureA);
    const traceB = mapCaptureToBehavioralTrace(captureB);
    expect(traceA).toEqual(traceB);
    expect(executionCaptureDigest(captureA)).toBe(executionCaptureDigest(captureB));
    expect(
      mapExactRepeatabilityToS05(
        [executionCaptureDigest(captureA), executionCaptureDigest(captureB)],
        ["capture:a", "capture:b"]
      )
    ).toEqual(
      mapExactRepeatabilityToS05(
        [executionCaptureDigest(captureB), executionCaptureDigest(captureA)],
        ["capture:b", "capture:a"]
      )
    );
  });

  it("returns diagnostics only as a sibling of canonical qualification and S09", async () => {
    const source = path.join(process.cwd(), "fixtures", "s12-lh-config-migration-feasibility");
    const parent = await mkdtemp(path.join(tmpdir(), "s12-diagnostic-sidecar-"));
    const target = path.join(parent, "fixture");
    try {
      await cp(source, target, { recursive: true });
      const taskInstruction = readFileSync(path.join(target, "TASK.md"), "utf8");
      const transport = new ScriptedTransport([
        response([
          { id: "canonical-call", name: "run_command", arguments: { command: "pnpm test" } }
        ]),
        response()
      ]);
      const secret = "KNOWN_DIAGNOSTIC_SECRET_12345";
      const output = await new S12CanonicalQualificationRunner(
        transport,
        async () => ({ stdout: `completed ${secret}`, stderr: "" }),
        { knownCredentialValues: [secret] }
      ).run({
        mode: "DRY_RUN",
        workspaceRoot: target,
        fixtureDigest: S12_FIXTURE_IDENTITY.fixtureDigest,
        environmentDigest: "e".repeat(64),
        implementationSha: "1".repeat(40),
        implementationTree: "2".repeat(40),
        configurationDigest: S12_CONFIG_DIGEST_10T,
        taskInstruction
      });
      expect(output.commandDiagnosticSidecar).toMatchObject({
        authority: "NON_AUTHORITATIVE_OBSERVABILITY",
        records: [{ toolCallId: "canonical-call", stdout: { status: "AVAILABLE" } }]
      });
      expect(output.commandDiagnosticSidecar?.records[0]?.stdout.preview).not.toContain(secret);
      expect(
        output.qualification.events.some((event) =>
          JSON.stringify(event).includes("S12_COMMAND_DIAGNOSTIC")
        )
      ).toBe(false);
      expect(output.s09).toBeDefined();
      expect(canonicalJson(output.s09)).not.toContain("completed");
      expect(canonicalJson(output.s09)).not.toContain("S12_COMMAND_DIAGNOSTIC");
      expect(
        output.qualification.events.find(
          (event) =>
            event.type === "TOOL_EXECUTION_RESULT" && event.payload["callId"] === "canonical-call"
        )?.payload["result"]
      ).toMatchObject({
        stdoutDigest: computeSha256(canonicalJson(`completed ${secret}`)),
        stderrDigest: computeSha256(canonicalJson(""))
      });
    } finally {
      await rm(parent, { recursive: true, force: true });
    }
  }, 120_000);
});
