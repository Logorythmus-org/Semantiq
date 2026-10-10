import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  parseSemanticCoreLocalContent,
  replaySemanticCoreLocalContent,
  semanticCoreLocalWireRequest,
  SEMANTIC_CORE_LOCAL_RESPONSE_PROTOCOL,
  assertSemanticCoreCanaryDGate
} from "../../packages/benchmark/src/semantic-core-local-response.js";
import {
  SemanticCoreLocalTransport,
  runSemanticCoreCanaryD
} from "../../packages/benchmark/src/semantic-core-local-transport.js";
import { validateSemanticCoreQualificationRecord } from "../../packages/benchmark/src/semantic-core-qualification-record.js";
import type { SemanticCoreInput } from "../../packages/benchmark/src/semantic-core-types.js";

const input: SemanticCoreInput = {
  schemaVersion: "0.1.0",
  caseId: "local_synthetic",
  dimensionId: "meaning_context",
  target: "never-send-target",
  prompt: "Select one option.",
  context: "synthetic context",
  options: [{ optionId: "one", text: "one option" }],
  eligibleResponseStates: ["ANSWER", "ABSTAIN"]
};
const valid = JSON.stringify({
  schemaVersion: "0.1.0",
  caseId: input.caseId,
  status: "ANSWER",
  selectedOptionId: "one"
});
const alias = "apodex/apodex-1.1-mini:free";
function mock(content: unknown = '{"token":"OK"}', status = 200, embedded = false) {
  const requests: RequestInit[] = [];
  const http: typeof fetch = async (url, init) => {
    if (init) requests.push(init);
    let data: unknown;
    if (String(url).endsWith("/key"))
      data = { data: { free_model_daily_requests: { used: 0, limit: 50, remaining: 50 } } };
    else if (String(url).endsWith("/models"))
      data = {
        data: [
          {
            id: alias,
            canonical_slug: "apodex/apodex-1.1-mini-20261001",
            pricing: { prompt: "0", completion: "0" }
          }
        ]
      };
    else if (String(url).endsWith("/providers"))
      data = { data: [{ name: "Novita", slug: "novita" }] };
    else if (String(url).endsWith("/endpoints"))
      data = {
        data: {
          endpoints: [
            {
              model_id: alias,
              provider_name: "Novita",
              tag: "novita/bf16",
              status: 0,
              pricing: { prompt: "0", completion: "0", discount: 0 },
              supported_parameters: ["temperature", "max_tokens"],
              max_completion_tokens: 235929
            }
          ]
        }
      };
    else
      return new Response(
        JSON.stringify(
          status !== 200
            ? {
                error: {
                  code: status,
                  metadata: { provider_name: "Novita" },
                  message: "private arbitrary error"
                }
              }
            : {
                model: alias,
                provider: "Novita",
                usage: { cost: 0, prompt_tokens: 10, completion_tokens: 12 },
                ...(embedded ? { error: { code: 429 } } : {}),
                choices: [
                  {
                    finish_reason: "stop",
                    message: {
                      content,
                      reasoning: "MUST_NEVER_RETAIN_REASONING",
                      reasoning_details: [{ text: "MUST_NEVER_RETAIN_REASONING" }]
                    }
                  }
                ]
              }
        ),
        { status, headers: { Authorization: "MUST_NEVER_RETAIN_HEADER" } }
      );
    return new Response(JSON.stringify(data));
  };
  return {
    requests,
    transport: new SemanticCoreLocalTransport(() => "MUST_NEVER_RETAIN_CREDENTIAL", http)
  };
}
describe("0.1.3 provider-neutral canonical local response", () => {
  it("omits response_format, reasoning, tools, healing and alternative models", () => {
    const wire = semanticCoreLocalWireRequest(input);
    for (const key of ["response_format", "reasoning", "tools", "plugins", "models"])
      expect(wire).not.toHaveProperty(key);
    expect(wire.max_tokens).toBe(4096);
  });
  it("projects no oracle, evaluator, expected answer or previous result", () => {
    const augmented = {
      ...input,
      oracle: { selectedOptionId: "SECRET_ORACLE" },
      expectedOption: "SECRET_EXPECTED",
      score: 100,
      previousResult: "SECRET_PREVIOUS"
    };
    const raw = JSON.stringify(semanticCoreLocalWireRequest(augmented));
    expect(raw).not.toMatch(/SECRET_|never-send-target|oracle|previousResult|"score"/);
    expect(raw).toContain("No reasoning. No explanation. No markdown. No surrounding text.");
  });
  it("exact canonical JSON is RESPONSE and replays from retained bytes", () => {
    const evidence = parseSemanticCoreLocalContent(valid, input);
    expect(evidence.state).toBe("RESPONSE");
    expect(evidence.content).toBe(valid);
    expect(replaySemanticCoreLocalContent(evidence, input)).toEqual(evidence);
  });
  it.each([
    `Here is JSON: ${valid}`,
    `\`\`\`json\n${valid}\n\`\`\``,
    '{"schemaVersion":"0.1.0","caseId":"wrong","status":"ABSTAIN"}',
    '{"schemaVersion":"0.1.0","caseId":"local_synthetic","status":"ANSWER","selectedOptionId":"not_offered"}',
    '{"schemaVersion":"0.1.0","caseId":"local_synthetic","status":"ABSTAIN","explanation":"extra"}',
    "not JSON",
    " "
  ])("does not repair invalid subject content %s", (content) => {
    const evidence = parseSemanticCoreLocalContent(content, input);
    expect(evidence.state).toBe("MALFORMED");
    expect(evidence.content).toBe(content);
    expect(replaySemanticCoreLocalContent(evidence, input).state).toBe("MALFORMED");
  });
  it.each([null, undefined, ""])("empty content is MISSING %s", (content) => {
    const evidence = parseSemanticCoreLocalContent(content, input);
    expect(evidence.state).toBe("MISSING");
    expect(replaySemanticCoreLocalContent(evidence, input).state).toBe("MISSING");
  });
  it("content SHA is stable and binds exact content without whitespace transformations", () => {
    expect(parseSemanticCoreLocalContent(valid, input).contentSha256).toBe(
      parseSemanticCoreLocalContent(valid, input).contentSha256
    );
    expect(parseSemanticCoreLocalContent(valid + " ", input).contentSha256).not.toBe(
      parseSemanticCoreLocalContent(valid, input).contentSha256
    );
  });
  it("tampered retained content cannot replay", () => {
    const evidence = parseSemanticCoreLocalContent(valid, input);
    expect(() =>
      replaySemanticCoreLocalContent({ ...evidence, content: valid + " " }, input)
    ).toThrow("CONTENT_REPLAY_MISMATCH");
  });
  it("unsafe content and reasoning markers are withheld without extraction", () => {
    const evidence = parseSemanticCoreLocalContent(
      "<think>private reasoning</think>" + valid,
      input
    );
    expect(evidence.state).toBe("MALFORMED");
    expect(evidence.content).toBe(null);
    expect(evidence.replayAvailable).toBe(false);
    expect(() => replaySemanticCoreLocalContent(evidence, input)).toThrow(
      "CONTENT_REPLAY_UNAVAILABLE"
    );
  });
  it("HTTP 200 malformed JSON remains subject-format evidence rather than infrastructure error", async () => {
    const fixture = mock("Here is JSON: {} ");
    const evidence = await runSemanticCoreCanaryD(fixture.transport);
    expect(evidence).toMatchObject({
      httpStatus: 200,
      state: "MALFORMED",
      success: false,
      replayExact: true
    });
    expect(evidence).toHaveProperty("error", null);
  });
  it("HTTP errors remain provider/infrastructure errors", async () => {
    const evidence = await runSemanticCoreCanaryD(mock(null, 400).transport);
    expect(evidence).toMatchObject({
      httpStatus: 400,
      state: "PROVIDER_OR_TRANSPORT_ERROR",
      success: false
    });
    expect(evidence).not.toHaveProperty("contentEvidence");
  });
  it("embedded HTTP 200 errors cannot satisfy D", async () => {
    const evidence = await runSemanticCoreCanaryD(mock('{"token":"OK"}', 200, true).transport);
    expect(evidence).toMatchObject({
      httpStatus: 200,
      embeddedProviderError: true,
      success: false,
      state: "PROVIDER_OR_TRANSPORT_ERROR"
    });
  });
  it("D succeeds without provider structured-output capability and cannot qualify BM3", async () => {
    const fixture = mock();
    const evidence = await runSemanticCoreCanaryD(fixture.transport);
    expect(evidence.success).toBe(true);
    expect(evidence.replayExact).toBe(true);
    expect(evidence).toMatchObject({
      scientificAuthority: "NONE",
      bmMaturityAuthority: "NONE",
      eligibleForQualification: false
    });
    expect(validateSemanticCoreQualificationRecord(evidence)).toBe(false);
    expect(JSON.stringify(evidence)).not.toMatch(
      /MUST_NEVER_RETAIN|reasoning_details|Authorization/
    );
    expect(fixture.requests.filter((r) => r.method === "POST")).toHaveLength(1);
  });
  it("failed or absent D blocks the prospective benchmark gate", () => {
    expect(() => assertSemanticCoreCanaryDGate({})).toThrow("CANARY_D_SUCCESS_REQUIRED");
    expect(() =>
      assertSemanticCoreCanaryDGate({
        kind: "D",
        success: false,
        eligibleForQualification: false,
        replayExact: true
      })
    ).toThrow("CANARY_D_SUCCESS_REQUIRED");
  });
  it("the empirical schedule remains 3 x 24 with no replacement", () => {
    expect(SEMANTIC_CORE_LOCAL_RESPONSE_PROTOCOL).toMatchObject({
      runs: 3,
      casesPerRun: 24,
      scheduledAttempts: 72,
      retryPolicy: "NONE",
      parserPolicy: "JSON_PARSE_CANONICAL_SCHEMA_NO_REPAIR"
    });
  });
  it("all historical protocol captures including 0.1.2 are byte-immutable", () => {
    const baseline = "d08b983a059af3d68487230d8ec740e1df890e01";
    const paths = execFileSync(
      "git",
      [
        "ls-tree",
        "-r",
        "--name-only",
        baseline,
        "--",
        "fixtures/semantic-core-qualification-0.1.0",
        "fixtures/semantic-core-qualification-0.1.1",
        "fixtures/semantic-core-qualification-0.1.2"
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
