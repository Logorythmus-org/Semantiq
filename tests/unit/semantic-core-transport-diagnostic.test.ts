import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { validateSemanticCoreQualificationRecord } from "../../packages/benchmark/src/semantic-core-qualification-record.js";
import {
  buildTransportCanary,
  runTransportCanary,
  sanitizeTransportError,
  TRANSPORT_STAGES
} from "../../packages/benchmark/src/semantic-core-transport-diagnostic.js";
import {
  semanticCoreDigest,
  parseSemanticCoreProviderResponse
} from "../../packages/benchmark/src/semantic-core-openrouter.js";
import { SEMANTIC_CORE_SELECTED_SUBJECT } from "../../packages/benchmark/src/semantic-core-quota-window.js";

const alias = SEMANTIC_CORE_SELECTED_SUBJECT.modelId;
const endpoint = {
  model_id: alias,
  provider_name: "Novita",
  tag: "novita/bf16",
  status: 0,
  pricing: { prompt: "0", completion: "0" },
  supported_parameters: ["temperature", "max_tokens", "response_format", "structured_outputs"]
};
function fixture(
  options: {
    status?: number;
    error?: unknown;
    content?: string;
    failMetadata?: boolean;
    multipleEndpoints?: boolean;
    cost?: number;
  } = {}
) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const http: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), ...(init ? { init } : {}) });
    let body: unknown;
    let status = 200;
    if (String(url).endsWith("/key"))
      body = {
        data: { label: "private", free_model_daily_requests: { used: 0, limit: 50, remaining: 50 } }
      };
    else if (String(url).endsWith("/models")) {
      body = {
        data: [
          {
            id: alias,
            canonical_slug: "apodex/apodex-1.1-mini-20261001",
            pricing: { prompt: "0", completion: "0" }
          }
        ]
      };
      if (options.failMetadata) {
        status = 401;
        body = { error: { code: 401, message: "secret" } };
      }
    } else if (String(url).endsWith("/providers"))
      body = { data: [{ name: "Novita", slug: "novita" }] };
    else if (String(url).endsWith("/endpoints"))
      body = { data: { endpoints: options.multipleEndpoints ? [endpoint, endpoint] : [endpoint] } };
    else {
      status = options.status ?? 200;
      body =
        status === 200
          ? {
              model: alias,
              provider: "Novita",
              choices: [{ message: { content: options.content ?? "OK" } }],
              usage: { prompt_tokens: 3, completion_tokens: 2, cost: options.cost ?? 0 }
            }
          : {
              error: options.error ?? {
                code: status,
                message: "private payload sk-or-v1-secret Authorization C:\\private\\file"
              }
            };
    }
    return new Response(JSON.stringify(body), {
      status,
      headers: { "set-cookie": "secret-cookie", Authorization: "secret" }
    });
  };
  return { calls, http };
}
describe("prospective 0.1.2 engineering transport boundary", () => {
  it("does not infer OpenRouter origin from generic HTTP 400", () => {
    expect(sanitizeTransportError(400, '{"error":{"code":400}}').classification).toBe(
      "UNKNOWN_PROVIDER_REJECTION"
    );
  });
  it("retains a typed rate-limit rejection embedded in HTTP 200", () => {
    expect(
      sanitizeTransportError(
        200,
        '{"error":{"code":429,"metadata":{"error_type":"rate_limit_exceeded"}}}'
      ).classification
    ).toBe("RATE_LIMIT_REJECTION");
  });
  it("canary artifacts cannot pass qualification record validation or provide S05 evidence", async () => {
    const result = await runTransportCanary("A", () => "secret", fixture().http);
    expect(validateSemanticCoreQualificationRecord(result)).toBe(false);
    expect(result).not.toHaveProperty("studyRuns");
    expect(result).not.toHaveProperty("attempts");
    expect(result).not.toHaveProperty("qualificationOutcome", "QUALIFIED_FOR_BM3_REVIEW");
  });
  it("retains only recognized upstream error type, parameter and unsupported-schema reason", () => {
    const safe = sanitizeTransportError(
      400,
      JSON.stringify({
        error: {
          code: 400,
          message: "Provider returned error",
          metadata: {
            provider_name: "Novita",
            raw: JSON.stringify({
              error: {
                message: "json_schema is not supported sk-or-secret C:\\private",
                type: "invalid_request_error",
                param: "response_format",
                extra: "Authorization"
              }
            })
          }
        }
      })
    );
    expect(safe).toMatchObject({
      classification: "UPSTREAM_PROVIDER_REJECTION",
      reason: "JSON_SCHEMA_UNSUPPORTED",
      parameter: "response_format",
      upstreamType: "invalid_request_error"
    });
    expect(JSON.stringify(safe)).not.toMatch(/secret|private|Authorization/);
  });
  it.each([400, 401, 402, 429, 503])("retains safe HTTP %s without raw payloads", (status) => {
    const safe = sanitizeTransportError(
      status,
      JSON.stringify({
        error: {
          code: status,
          message: "sk-or-v1-secret Authorization C:\\private\\file",
          metadata: { raw: "upstream-stack", cookies: "cookie" }
        }
      })
    );
    expect(safe.httpStatus).toBe(status);
    expect(JSON.stringify(safe)).not.toMatch(/secret|Authorization|private|stack|cookie/);
    if (status === 402) expect(safe.classification).toBe("UNKNOWN_PROVIDER_REJECTION");
  });
  it("leaves unparseable bodies unavailable with status intact", () => {
    expect(sanitizeTransportError(400, "not-json secret")).toMatchObject({
      httpStatus: 400,
      bodyState: "ERROR_BODY_UNAVAILABLE_OR_UNPARSED",
      classification: "UNKNOWN_PROVIDER_REJECTION"
    });
  });
  it("distinguishes supported upstream evidence", () => {
    expect(
      sanitizeTransportError(
        502,
        JSON.stringify({
          error: {
            code: 502,
            metadata: { provider_name: "Novita", provider_code: 400, raw: "secret" }
          }
        })
      ).classification
    ).toBe("UPSTREAM_PROVIDER_REJECTION");
  });
  it("recognizes explicit routing and schema evidence without retaining messages", () => {
    expect(
      sanitizeTransportError(
        404,
        JSON.stringify({
          error: { message: "No endpoints found for supplied routing preferences" }
        })
      ).classification
    ).toBe("OPENROUTER_ROUTING_REJECTION");
    expect(
      sanitizeTransportError(400, JSON.stringify({ error: { code: "invalid_json_schema" } }))
        .classification
    ).toBe("STRUCTURED_OUTPUT_REJECTION");
  });
  it("represents confirmed routing selector separately and rejects automatic tag conversion", () => {
    expect(() => buildTransportCanary("A", "novita/bf16")).toThrow("UNCONFIRMED_ROUTING_SELECTOR");
    expect(buildTransportCanary("A", "novita").provider).toMatchObject({
      only: ["novita"],
      order: ["novita"],
      allow_fallbacks: false
    });
  });
  it("distinguishes pre-generation metadata rejection from submitted POST", async () => {
    const mock = fixture({ failMetadata: true });
    const result = await runTransportCanary("A", () => "secret", mock.http);
    expect(result.audit.stages).toEqual(["PRE_GENERATION_METADATA"]);
    expect(result.audit.result).toMatchObject({ httpStatus: 401 });
    expect(mock.calls.some((call) => call.init?.method === "POST")).toBe(false);
  });
  it("records ordered stages, separate identities and zero-cost successful canary", async () => {
    const mock = fixture();
    const result = await runTransportCanary("A", () => "secret", mock.http);
    expect(result.success).toBe(true);
    expect(result.audit.stages).toEqual(TRANSPORT_STAGES);
    expect(result).toMatchObject({
      eligibleForQualification: false,
      scientificAuthority: "NONE",
      bmMaturityAuthority: "NONE",
      routing: { discoveryEndpointTag: "novita/bf16", providerRoutingSelector: "novita" }
    });
    expect(JSON.stringify(result)).not.toMatch(/secret|Authorization|cookie|private/);
  });
  it("fails closed when base slug could select another endpoint", async () => {
    const mock = fixture({ multipleEndpoints: true });
    expect((await runTransportCanary("A", () => "secret", mock.http)).success).toBe(false);
    expect(mock.calls.some((c) => c.init?.method === "POST")).toBe(false);
  });
  it("wire digest excludes credential and transport headers", async () => {
    const first = await runTransportCanary("A", () => "secret1", fixture().http);
    const second = await runTransportCanary("A", () => "secret2", fixture().http);
    expect(first.audit.wireRequestDigest).toBe(second.audit.wireRequestDigest);
    expect(first.audit.wireRequestDigest).toBe(
      semanticCoreDigest(buildTransportCanary("A", "novita"))
    );
  });
  it("simple strict schema succeeds independently of benchmark semantics", async () => {
    const body = buildTransportCanary("B", "novita");
    expect(JSON.stringify(body)).not.toMatch(/oneOf|"not"|oracle/);
    expect(
      (await runTransportCanary("B", () => "secret", fixture({ content: '{"token":"OK"}' }).http))
        .success
    ).toBe(true);
  });
  it("retains exact-schema rejection after POST without a replacement retry", async () => {
    const mock = fixture({ status: 400, error: { code: "invalid_json_schema" } });
    const result = await runTransportCanary("C", () => "secret", mock.http);
    expect(result.audit.result).toMatchObject({
      httpStatus: 400,
      classification: "STRUCTURED_OUTPUT_REJECTION"
    });
    expect(mock.calls.filter((call) => call.init?.method === "POST")).toHaveLength(1);
    expect(JSON.stringify(buildTransportCanary("C", "novita"))).toMatch(/oneOf/);
  });
  it.each(['{"token":"OK","extra":true}', '```json\n{"token":"OK"}\n```'])(
    "never repairs noncanonical output %s",
    async (content) => {
      expect(
        (await runTransportCanary("B", () => "secret", fixture({ content }).http)).success
      ).toBe(false);
    }
  );
  it("canonical local parser remains strict on extra fields", () => {
    const raw = JSON.stringify({
      model: alias,
      provider: "Novita",
      usage: { cost: 0, prompt_tokens: 1, completion_tokens: 1 },
      choices: [
        {
          message: {
            content:
              '{"schemaVersion":"0.1.0","caseId":"synthetic","status":"ABSTAIN","selectedOptionId":"x"}'
          }
        }
      ]
    });
    expect(parseSemanticCoreProviderResponse(raw, SEMANTIC_CORE_SELECTED_SUBJECT).status).toBe(
      "MALFORMED"
    );
  });
  it("a nonzero inference cost can never pass the engineering gate", async () => {
    expect(
      (await runTransportCanary("A", () => "secret", fixture({ cost: 0.01 }).http)).success
    ).toBe(false);
  });
  it("all failed 0.1.1 artifacts remain byte-identical to historical head", () => {
    expect(
      execFileSync(
        "git",
        [
          "-c",
          "core.fsmonitor=false",
          "diff",
          "6263f95475def9eafec9c89c2cec544fbb12fd0e",
          "--",
          "fixtures/semantic-core-qualification-0.1.1"
        ],
        { encoding: "utf8" }
      )
    ).toBe("");
    const baseline = "6263f95475def9eafec9c89c2cec544fbb12fd0e";
    const paths = execFileSync(
      "git",
      [
        "ls-tree",
        "-r",
        "--name-only",
        baseline,
        "--",
        "fixtures/semantic-core-qualification-0.1.1"
      ],
      { encoding: "utf8" }
    )
      .trim()
      .split(/\r?\n/);
    for (const path of paths)
      expect(
        readFileSync(path).equals(
          execFileSync("git", ["show", `${baseline}:${path}`], { maxBuffer: 10 * 1024 * 1024 })
        ),
        path
      ).toBe(true);
  });
});
