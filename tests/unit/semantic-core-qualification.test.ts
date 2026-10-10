import { describe, expect, it, vi } from "vitest";
import { resolve } from "node:path";
import { mkdtemp, cp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  runSemanticCoreQualification,
  prepareSemanticCoreQualification,
  replaySemanticCoreQualification,
  semanticCoreDigest,
  serializeSemanticCorePrompt,
  semanticCoreWireRequest,
  parseSemanticCoreProviderResponse,
  assertSemanticCoreFreeRoute,
  SemanticCoreOpenRouterSubject,
  SEMANTIC_CORE_BENCHMARK_DEFINITION,
  EvidenceVerifier,
  EvidenceSystem
} from "../../packages/benchmark/src/index.js";
import {
  validateSemanticCoreQualificationRecord,
  semanticCoreCaptureDigest,
  SemanticCoreQualificationError
} from "../../packages/benchmark/src/index.js";
import type {
  SemanticCoreQualificationSubject,
  SemanticCoreSubjectConfiguration,
  SemanticCoreProviderMetadata
} from "../../packages/benchmark/src/index.js";

const packRoot = resolve("fixtures/benchmark-packs/semantic-core-pilot-0.1.0");
const source = { gitCommit: "a".repeat(40), gitTree: "b".repeat(40) };
// Deliberately fictitious route: test observations never count as live model evidence.
const config: SemanticCoreSubjectConfiguration = {
  provider: "OpenRouter",
  modelId: "test/fixture:free",
  providerName: "Fixture",
  route: "fixture/test",
  snapshotStatus: "MUTABLE_ALIAS",
  temperature: 0,
  maxTokens: 128,
  responseFormat: "STRICT_JSON_SCHEMA"
};
const metadata: SemanticCoreProviderMetadata = {
  modelId: config.modelId,
  canonicalSlug: "test/fixture-v1",
  providerName: config.providerName,
  route: config.route,
  status: 0,
  pricing: { prompt: "0", completion: "0" },
  supportedParameters: ["temperature", "max_tokens", "response_format", "structured_outputs"]
};
function subject(
  overrides: Partial<SemanticCoreQualificationSubject> = {}
): SemanticCoreQualificationSubject {
  return {
    evidenceOrigin: "SYNTHETIC_TEST",
    preflight: async () => metadata,
    observe: async (input) => ({
      status: "RESPONSE",
      response: {
        schemaVersion: "0.1.0",
        caseId: input.caseId,
        status: "ANSWER",
        selectedOptionId: input.options[0]!.optionId
      },
      modelId: config.modelId,
      providerName: config.providerName,
      rawResponseAvailability: "UNAVAILABLE",
      usage: { promptTokens: 1, completionTokens: 1, cost: 0 }
    }),
    ...overrides
  };
}
const execute = (adapter = subject()) =>
  runSemanticCoreQualification({
    packRoot,
    source,
    configuration: config,
    mode: "live",
    authorizeLive: true,
    subject: adapter
  });

describe("Semantic Core controlled qualification", () => {
  it("defaults to dry run, freezes 24 original digests and 53 prespecified studies, and never invokes transport", async () => {
    const observe = vi.fn();
    const preflight = vi.fn();
    const result = await runSemanticCoreQualification({
      packRoot,
      source,
      subject: subject({ observe, preflight })
    });
    expect(result.mode).toBe("DRY_RUN");
    expect(result.frozen?.cases).toHaveLength(24);
    expect(result.frozen?.studies).toHaveLength(53);
    expect(result.scheduledAttempts).toBe(72);
    expect(observe).not.toHaveBeenCalled();
    expect(preflight).not.toHaveBeenCalled();
  });
  it("requires both live authorization and selected configuration before transport", async () => {
    const preflight = vi.fn();
    await expect(
      runSemanticCoreQualification({
        packRoot,
        source,
        mode: "live",
        configuration: config,
        subject: subject({ preflight })
      })
    ).rejects.toMatchObject({ code: "PREFLIGHT_FAILURE" });
    expect(preflight).not.toHaveBeenCalled();
  });
  it("checks credentials only at HTTP boundary and fails before network", async () => {
    const http = vi.fn();
    await expect(
      new SemanticCoreOpenRouterSubject(() => undefined, http).preflight(config)
    ).rejects.toMatchObject({ code: "CREDENTIAL_UNAVAILABLE" });
    expect(http).not.toHaveBeenCalled();
  });
  it.each([
    { prompt: "0.01", completion: "0" },
    { completion: "0" },
    { prompt: "unknown", completion: "0" },
    { prompt: "0", completion: "0", request: "1" }
  ])("rejects paid/unknown/missing prices %j", (pricing) => {
    expect(() => assertSemanticCoreFreeRoute({ ...metadata, pricing }, config)).toThrow(
      "ZERO_COST_POLICY_FAILURE"
    );
  });
  it("rejects endpoint/model/parameter substitutions and paid fallbacks", () => {
    expect(() =>
      assertSemanticCoreFreeRoute({ ...metadata, modelId: "other/model:free" }, config)
    ).toThrow();
    expect(() =>
      assertSemanticCoreFreeRoute({ ...metadata, route: "other/test" }, config)
    ).toThrow();
    expect(() =>
      assertSemanticCoreFreeRoute({ ...metadata, supportedParameters: [] }, config)
    ).toThrow();
  });
  it("projects oracle-free prompts, requests no rationale/tools and enforces one zero-cost route", async () => {
    const plan = await prepareSemanticCoreQualification(packRoot, source, config);
    const item = plan.items[0]!;
    const prompt = serializeSemanticCorePrompt(item);
    expect(JSON.stringify(prompt)).not.toContain("oracle");
    expect(JSON.stringify(prompt)).not.toContain("NEW_SYNTHETIC_FIRST_PARTY_AI_AUTHORED");
    const request = semanticCoreWireRequest(item, config);
    expect(request).not.toHaveProperty("tools");
    expect(request).not.toHaveProperty("models");
    expect(request.provider).toMatchObject({
      only: [config.route],
      allow_fallbacks: false,
      require_parameters: true,
      max_price: { prompt: 0, completion: 0, request: 0 }
    });
    expect(semanticCoreDigest(prompt)).not.toBe(
      semanticCoreDigest(serializeSemanticCorePrompt({ ...item, prompt: "changed" }))
    );
  });
  it("uses JSON.parse only; rejects prose, wrong models, nonzero and absent cost", () => {
    const raw = (content: unknown, extra = {}) =>
      JSON.stringify({
        model: config.modelId,
        provider: config.providerName,
        usage: { prompt_tokens: 1, completion_tokens: 1, cost: 0 },
        choices: [{ message: { content } }],
        ...extra
      });
    expect(
      parseSemanticCoreProviderResponse(
        raw('{"schemaVersion":"0.1.0","caseId":"test","status":"ABSTAIN"}'),
        config
      ).status
    ).toBe("RESPONSE");
    expect(parseSemanticCoreProviderResponse(raw("```json\n{}\n```"), config).status).toBe(
      "MALFORMED"
    );
    expect(parseSemanticCoreProviderResponse(raw(null), config).status).toBe("MISSING");
    expect(parseSemanticCoreProviderResponse(raw("{}", { model: "other" }), config).error).toBe(
      "IDENTITY_SUBSTITUTION"
    );
    expect(
      parseSemanticCoreProviderResponse(
        raw("{}", { usage: { prompt_tokens: 1, completion_tokens: 1, cost: 1 } }),
        config
      ).error
    ).toBe("ZERO_COST_POLICY_FAILURE");
  });
  it(
    "accounts for all attempts, validates S04/S05/S09, replays exact metrics and never promotes synthetic evidence",
    { timeout: 30000 },
    async () => {
      const result = await execute();
      if (result.mode !== "LIVE") throw new Error("unexpected mode");
      expect(result.capture.attempts).toHaveLength(72);
      expect(result.capture.attempts.every((a) => a.replayExact)).toBe(true);
      expect(result.reliability).toHaveLength(53);
      expect(result.reliability[0]!.estimate.sample).toMatchObject({
        candidateObservations: 3,
        usedObservations: 3,
        candidatePairs: 3,
        usedPairs: 3
      });
      expect(result.reliability[48]!.estimate.value).toMatchObject({
        kind: "NUMERIC_RUN_TO_RUN_STABILITY",
        n: 3,
        sampleStandardDeviation: 0
      });
      expect(
        result.verifications.flatMap((v) => v.findings.filter((f) => f.severity === "ERROR"))
      ).toEqual([]);
      expect(result.regression.exact).toBe(true);
      expect(result.qualification.outcome).toBe("INSUFFICIENT_EVIDENCE");
      expect(result.qualification.proposesBM3).toBe(false);
      expect(validateSemanticCoreQualificationRecord(result.qualification)).toBe(true);
      expect(
        validateSemanticCoreQualificationRecord({
          ...result.qualification,
          scientificAuthority: "VALIDATED"
        })
      ).toBe(false);
      expect(
        validateSemanticCoreQualificationRecord({
          ...result.qualification,
          scientificMaturity: "VALIDATED"
        })
      ).toBe(false);
      expect(
        validateSemanticCoreQualificationRecord({
          ...result.qualification,
          outcome: "QUALIFIED_FOR_BM3_REVIEW"
        })
      ).toBe(false);
      const clockChanged = structuredClone(result.capture);
      Reflect.set(
        clockChanged.attempts[0]!.evaluatorExecution,
        "executedAt",
        "2099-01-01T00:00:00Z"
      );
      expect(semanticCoreCaptureDigest(clockChanged)).toBe(result.captureDigest);
      expect(result.nonPromotion.blockingGateIds).toEqual(
        expect.arrayContaining(["CALIBRATION", "VALIDITY"])
      );
      expect(SEMANTIC_CORE_BENCHMARK_DEFINITION).toMatchObject({
        scientificMaturity: "UNVALIDATED_PROXY",
        corePromotion: "NOT_PROMOTED"
      });
      const mutated = structuredClone(result.capture);
      Reflect.set(mutated.attempts[0]!.observation, "response", {
        schemaVersion: "0.1.0",
        caseId: mutated.attempts[0]!.caseId,
        status: "ABSTAIN"
      });
      expect((await replaySemanticCoreQualification(packRoot, mutated)).exact).toBe(false);
      expect(semanticCoreCaptureDigest(mutated)).not.toBe(result.captureDigest);
      Reflect.set(mutated.condition.evaluator, "evaluatorVersion", "9.0.0");
      await expect(replaySemanticCoreQualification(packRoot, mutated)).rejects.toThrow(
        "IDENTITY_SUBSTITUTION"
      );
      const pkg = structuredClone(result.packages[0]!);
      Reflect.set(pkg.artifacts[0]!, "observedContentDigest", {
        algorithm: "SHA_256",
        representation: "CANONICAL_JSON",
        value: "0".repeat(64)
      });
      expect(new EvidenceVerifier().verify(pkg).outcome).toBe("VERIFICATION_FAILED");
      expect(() =>
        new EvidenceSystem().createEvidencePackage({
          ...result.packages[0]!,
          limitations: ["api_key=sk-secret123"]
        })
      ).toThrow();
    }
  );
  it(
    "accounts for malformed, missing, abstaining, incorrect and provider-rejected outputs distinctly",
    { timeout: 30000 },
    async () => {
      let index = 0;
      const adapter = subject({
        observe: async (input) => {
          const common = {
            modelId: config.modelId,
            providerName: config.providerName,
            rawResponseAvailability: "UNAVAILABLE" as const,
            usage: { promptTokens: 1, completionTokens: 1, cost: 0 }
          };
          const kind = index++ % 5;
          if (kind === 0)
            return { ...common, status: "MALFORMED", error: "MALFORMED_SUBJECT_OUTPUT" };
          if (kind === 1) return { ...common, status: "MISSING", error: "MISSING_OUTPUT" };
          if (kind === 2) return { ...common, status: "ERROR", error: "PROVIDER_REJECTION" };
          return {
            ...common,
            status: "RESPONSE",
            response:
              kind === 3
                ? { schemaVersion: "0.1.0", caseId: input.caseId, status: "ABSTAIN" }
                : {
                    schemaVersion: "0.1.0",
                    caseId: input.caseId,
                    status: "ANSWER",
                    selectedOptionId: input.options[1]!.optionId
                  }
          };
        }
      });
      const result = await execute(adapter);
      if (result.mode !== "LIVE") throw new Error("unexpected mode");
      const counts = Object.values(result.capture.runs).flatMap((r) =>
        Object.values(r.stateCounts)
      );
      expect(counts.reduce((sum, n) => sum + n, 0)).toBe(72);
      expect(result.capture.attempts[0]!.evaluation.state).toBe("MALFORMED");
      expect(result.capture.attempts[1]!.evaluation.state).toBe("MISSING");
      expect(result.capture.attempts[2]!.evaluation.state).toBe("SUBJECT_ERROR");
      expect(result.capture.attempts[3]!.evaluation.state).toBe("ABSTAINED");
    }
  );
  it(
    "halts generation on identity substitution and retains all remaining scheduled terminals",
    { timeout: 30000 },
    async () => {
      const observe = vi.fn(async () => ({
        status: "ERROR" as const,
        error: "IDENTITY_SUBSTITUTION" as const,
        rawResponseAvailability: "UNAVAILABLE" as const
      }));
      const result = await execute(subject({ observe }));
      if (result.mode !== "LIVE") throw new Error("unexpected mode");
      expect(observe).toHaveBeenCalledTimes(1);
      expect(result.capture.attempts).toHaveLength(72);
      expect(result.qualification.outcome).toBe("NOT_QUALIFIED");
      expect(result.qualification.criticalFindings).toContain("IDENTITY_SUBSTITUTION");
    }
  );
  it("does not record provider exception text or secrets", async () => {
    const input = (await prepareSemanticCoreQualification(packRoot, source, config)).items[0]!;
    const http = vi.fn(async () => {
      throw new Error("Authorization: Bearer sensitive-untrusted-value");
    });
    await expect(
      new SemanticCoreOpenRouterSubject(() => "ephemeral-test-only", http).observe(input, config, {
        promptDigest: semanticCoreDigest(serializeSemanticCorePrompt(input))
      })
    ).rejects.toEqual(new SemanticCoreQualificationError("TRANSPORT_FAILURE"));
  });
  it("fails closed on original-byte and material manifest mutation before subject execution", async () => {
    const directory = await mkdtemp(resolve(tmpdir(), "semantic-core-qualification-test-"));
    try {
      await cp(packRoot, directory, { recursive: true });
      const manifestPath = resolve(directory, "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
        cases: { path: string }[];
        evaluator: { evaluatorVersion: string };
        limitations: string[];
      };
      const casePath = resolve(directory, manifest.cases[0]!.path);
      await writeFile(casePath, (await readFile(casePath, "utf8")) + "\n");
      await expect(prepareSemanticCoreQualification(directory, source, config)).rejects.toThrow(
        "IDENTITY_SUBSTITUTION"
      );
      await cp(packRoot, directory, { recursive: true });
      manifest.evaluator.evaluatorVersion = "9.0.0";
      await writeFile(manifestPath, JSON.stringify(manifest));
      await expect(prepareSemanticCoreQualification(directory, source, config)).rejects.toThrow(
        "IDENTITY_SUBSTITUTION"
      );
    } finally {
      // mkdtemp creates this test-owned directory; no repository or shared cache is removed.
      await rm(directory, { recursive: true, force: true });
    }
  });
  it("never retains unsupported or credential-shaped response properties", async () => {
    const input = (await prepareSemanticCoreQualification(packRoot, source, config)).items[0]!;
    const raw = JSON.stringify({
      model: config.modelId,
      provider: config.providerName,
      id: "sk-untrusted-provider-value",
      usage: { prompt_tokens: 1, completion_tokens: 1, cost: 0 },
      choices: [
        {
          message: {
            content: JSON.stringify({
              schemaVersion: "0.1.0",
              caseId: input.caseId,
              status: "ANSWER",
              selectedOptionId: "credential_shaped_unoffered_value",
              apiKey: "untrusted-value"
            })
          }
        }
      ]
    });
    const parsed = parseSemanticCoreProviderResponse(raw, config, input);
    expect(parsed.status).toBe("MALFORMED");
    expect(parsed).not.toHaveProperty("requestId");
    expect(JSON.stringify(parsed)).not.toContain("untrusted-value");
  });
  it(
    "preserves failures and exclusions with no replacement retry",
    { timeout: 30000 },
    async () => {
      const observe = vi.fn(async () => ({
        status: "ERROR" as const,
        error: "TIMEOUT" as const,
        rawResponseAvailability: "UNAVAILABLE" as const
      }));
      const result = await execute(subject({ observe }));
      if (result.mode !== "LIVE") throw new Error("unexpected mode");
      expect(observe).toHaveBeenCalledTimes(72);
      expect(result.capture.attempts.every((a) => a.evaluation.state === "SUBJECT_ERROR")).toBe(
        true
      );
      expect(result.reliability[0]!.estimate.sample).toMatchObject({
        candidateObservations: 3,
        excludedObservations: 3,
        candidatePairs: 3
      });
      expect(Math.abs(result.reliability[0]!.estimate.sample.usedPairs!)).toBe(0);
      expect(
        result.capture.runs.every((r) => r.metrics.every((m) => m.outcome.kind === "MISSING"))
      ).toBe(true);
      expect(result.qualification.outcome).toBe("INSUFFICIENT_EVIDENCE");
    }
  );
});
