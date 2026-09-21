import {
  CONFIG_DIGEST,
  OpenRouterHttpError,
  OpenRouterHttpTransport,
  OpenRouterSubjectAdapter,
  S12FinalStateVerifier,
  S12CanonicalQualificationRunner,
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
import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";

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
        messages: [{ role: "user", content: "frozen task" }]
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
        messages: [{ role: "user", content: "frozen task" }]
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
      messages: [{ role: "user", content: "must not execute" }]
    });
    expect(output.qualification).toMatchObject({
      terminalStatus: "PREFLIGHT_BLOCKED",
      modelRequestCount: 0,
      structuredFailure: { code: "FIXTURE_IDENTITY_DRIFT" }
    });
    expect(transport.generationCalls).toBe(0);
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
          response({ toolCalls: [{ id: "schema", name: "write_file", arguments: { path: "src/schema-v2.ts", content: variant.schema } }] }),
          response({ toolCalls: [{ id: "migration", name: "write_file", arguments: { path: "src/migrate.ts", content: variant.migration } }] }),
          response({ toolCalls: [{ id: "cli", name: "write_file", arguments: { path: "src/cli.ts", content: variant.cli } }] }),
          response()
        ]);
        const output = await new S12CanonicalQualificationRunner(transport).run({
          mode: "DRY_RUN",
          workspaceRoot: temp.target,
          fixtureDigest: "47dbb3c89b5a56d74710e80205a86a691be0fbb1301b2c3f9147a1af614cee63",
          environmentDigest: "e".repeat(64),
          implementationSha: "926c6eac5c3de3859efdbea357f7a671c62b0d61",
          implementationTree: "f9bddb617c31990df48dfd734f97161ff2d5abf9",
          messages: [{ role: "user", content: variant.name }]
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
