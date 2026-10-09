import { createHash } from "node:crypto";
import { canonicalJson } from "../../sandbox-contracts/src/index.js";
import { validateSemanticCoreResponse } from "./semantic-core.js";
import type { SemanticCoreInput } from "./semantic-core-types.js";
import { SemanticCoreQualificationError } from "./semantic-core-qualification-types.js";
import type {
  SemanticCoreSubjectConfiguration,
  SemanticCoreProviderMetadata,
  SemanticCoreSubjectObservation,
  SemanticCoreQualificationSubject,
  SemanticCoreFreeCapacity
} from "./semantic-core-qualification-types.js";

const base = "https://openrouter.ai/api/v1";
export const semanticCoreDigest = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");
const fail = (code: ConstructorParameters<typeof SemanticCoreQualificationError>[0]): never => {
  throw new SemanticCoreQualificationError(code);
};
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fail("PROVIDER_METADATA_MISMATCH");
  return value as Record<string, unknown>;
}
function safeId(value: unknown): string | undefined {
  return typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_./: -]{0,159}$/.test(value)
    ? value
    : undefined;
}
export function validateSemanticCoreSubjectConfiguration(
  config: SemanticCoreSubjectConfiguration
): void {
  if (
    config.provider !== "OpenRouter" ||
    !/^[a-z0-9-]+\/[a-z0-9.-]+:free$/.test(config.modelId) ||
    !safeId(config.providerName) ||
    !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(config.route) ||
    config.snapshotStatus !== "MUTABLE_ALIAS" ||
    config.temperature !== 0 ||
    config.maxTokens !== 128 ||
    config.responseFormat !== "STRICT_JSON_SCHEMA" ||
    (config.seed !== undefined && !Number.isSafeInteger(config.seed)) ||
    Object.keys(config).some(
      (key) =>
        ![
          "provider",
          "modelId",
          "providerName",
          "route",
          "snapshotStatus",
          "temperature",
          "maxTokens",
          "seed",
          "responseFormat"
        ].includes(key)
    )
  )
    fail("PREFLIGHT_FAILURE");
}
export function assertSemanticCoreFreeRoute(
  metadata: SemanticCoreProviderMetadata,
  config: SemanticCoreSubjectConfiguration
): void {
  validateSemanticCoreSubjectConfiguration(config);
  if (
    metadata.modelId !== config.modelId ||
    metadata.providerName !== config.providerName ||
    metadata.route !== config.route ||
    metadata.status !== 0 ||
    !safeId(metadata.canonicalSlug)
  )
    fail("PROVIDER_METADATA_MISMATCH");
  if (
    !Object.hasOwn(metadata.pricing, "prompt") ||
    !Object.hasOwn(metadata.pricing, "completion") ||
    Object.values(metadata.pricing).some(
      (price) => typeof price !== "string" || !/^0(?:\.0+)?$/.test(price)
    )
  )
    fail("ZERO_COST_POLICY_FAILURE");
  const required = [
    "temperature",
    "max_tokens",
    "response_format",
    "structured_outputs",
    ...(config.seed === undefined ? [] : ["seed"])
  ];
  if (required.some((parameter) => !metadata.supportedParameters.includes(parameter)))
    fail("PROVIDER_METADATA_MISMATCH");
}

/** Explicit projection: never serialize the caller's extra fields or an oracle. */
export function serializeSemanticCorePrompt(
  input: SemanticCoreInput
): readonly { role: "system" | "user"; content: string }[] {
  return [
    {
      role: "system",
      content:
        "Select one offered option using only the supplied prompt and context. Return only JSON matching the response schema. Do not provide reasoning. If unable to select, return ABSTAIN."
    },
    {
      role: "user",
      content: canonicalJson({
        schemaVersion: input.schemaVersion,
        caseId: input.caseId,
        prompt: input.prompt,
        context: input.context,
        options: input.options.map((option) => ({ optionId: option.optionId, text: option.text })),
        responseContract: {
          schemaVersion: "0.1.0",
          caseId: input.caseId,
          statuses: ["ANSWER", "ABSTAIN"],
          selectedOptionId: "Required for ANSWER; absent for ABSTAIN. Use an offered optionId."
        }
      })
    }
  ];
}
export function semanticCoreWireRequest(
  input: SemanticCoreInput,
  config: SemanticCoreSubjectConfiguration
): Record<string, unknown> {
  validateSemanticCoreSubjectConfiguration(config);
  return {
    model: config.modelId,
    messages: serializeSemanticCorePrompt(input),
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    ...(config.seed === undefined ? {} : { seed: config.seed }),
    stream: false,
    provider: {
      only: [config.route],
      order: [config.route],
      allow_fallbacks: false,
      require_parameters: true,
      max_price: { prompt: 0, completion: 0, request: 0, image: 0, audio: 0 }
    },
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "semantic_core_selection",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            schemaVersion: { const: "0.1.0" },
            caseId: { const: input.caseId },
            status: { enum: ["ANSWER", "ABSTAIN"] },
            selectedOptionId: { enum: input.options.map((o) => o.optionId) }
          },
          required: ["schemaVersion", "caseId", "status"],
          oneOf: [
            { properties: { status: { const: "ANSWER" } }, required: ["selectedOptionId"] },
            {
              properties: { status: { const: "ABSTAIN" } },
              not: { required: ["selectedOptionId"] }
            }
          ]
        }
      }
    }
  };
}

export function parseSemanticCoreProviderResponse(
  raw: string,
  config: SemanticCoreSubjectConfiguration,
  input?: SemanticCoreInput
): SemanticCoreSubjectObservation {
  const digest = createHash("sha256").update(raw).digest("hex");
  const common = { rawResponseDigest: digest, rawResponseAvailability: "UNAVAILABLE" as const };
  let parsed: Record<string, unknown>;
  try {
    parsed = object(JSON.parse(raw));
  } catch {
    return { ...common, status: "ERROR", error: "TRANSPORT_FAILURE" };
  }
  const modelId = safeId(parsed.model);
  const providerName = safeId(parsed.provider);
  if (modelId !== config.modelId || providerName !== config.providerName)
    return { ...common, status: "ERROR", error: "IDENTITY_SUBSTITUTION" };
  const provenance = {
    ...common,
    modelId,
    providerName,
    ...(typeof parsed.id === "string" && /^gen-[a-zA-Z0-9-]{1,100}$/.test(parsed.id)
      ? { requestId: parsed.id }
      : {})
  };
  const usage = parsed.usage as Record<string, unknown> | undefined;
  if (
    !usage ||
    usage.cost !== 0 ||
    !Number.isSafeInteger(usage.prompt_tokens) ||
    !Number.isSafeInteger(usage.completion_tokens) ||
    Number(usage.prompt_tokens) < 0 ||
    Number(usage.completion_tokens) < 0
  )
    return { ...provenance, status: "ERROR", error: "ZERO_COST_POLICY_FAILURE" };
  const bounded = {
    ...provenance,
    usage: {
      promptTokens: Number(usage.prompt_tokens),
      completionTokens: Number(usage.completion_tokens),
      cost: 0
    }
  };
  const choices = parsed.choices;
  if (!Array.isArray(choices) || choices.length !== 1)
    return { ...bounded, status: "MISSING", error: "MISSING_OUTPUT" };
  const content = choices[0]?.message?.content as unknown;
  if (content === null || content === undefined || content === "")
    return { ...bounded, status: "MISSING", error: "MISSING_OUTPUT" };
  if (typeof content !== "string" || content.length > 4096)
    return { ...bounded, status: "MALFORMED", error: "MALFORMED_SUBJECT_OUTPUT" };
  try {
    const response: unknown = JSON.parse(content);
    if (
      validateSemanticCoreResponse(response) &&
      (!input ||
        (response.caseId === input.caseId &&
          (response.status === "ABSTAIN" ||
            input.options.some((option) => option.optionId === response.selectedOptionId))))
    )
      return { ...bounded, status: "RESPONSE", response };
  } catch {
    /* No cleanup, inference, repair or provider re-execution. */
  }
  return { ...bounded, status: "MALFORMED", error: "MALFORMED_SUBJECT_OUTPUT" };
}

/** Credential callback is invoked only here, immediately at the HTTP boundary. */
export class SemanticCoreOpenRouterSubject implements SemanticCoreQualificationSubject {
  readonly evidenceOrigin = "LIVE_PROVIDER" as const;
  constructor(
    private readonly credential: () => string | undefined = () => process.env.OPENROUTER_API_KEY,
    private readonly http: typeof fetch = fetch
  ) {}
  private async request(path: string, body?: unknown): Promise<string> {
    const key = this.credential();
    if (!key) return fail("CREDENTIAL_UNAVAILABLE");
    try {
      const response = await this.http(base + path, {
        method: body === undefined ? "GET" : "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(60000),
        redirect: "error"
      });
      if (!response.ok) return fail("PROVIDER_REJECTION");
      const reader = response.body?.getReader();
      if (!reader) return fail("TRANSPORT_FAILURE");
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        size += next.value.byteLength;
        if (size > 2 * 1024 * 1024) {
          await reader.cancel();
          return fail("TRANSPORT_FAILURE");
        }
        chunks.push(next.value);
      }
      return Buffer.concat(chunks).toString("utf8");
    } catch (error) {
      if (error instanceof SemanticCoreQualificationError) throw error;
      return fail(
        error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)
          ? "TIMEOUT"
          : "TRANSPORT_FAILURE"
      );
    }
  }
  async capacity(): Promise<SemanticCoreFreeCapacity> {
    const data = object(object(JSON.parse(await this.request("/key"))).data);
    const quota = object(data.free_model_daily_requests);
    const { used, limit, remaining } = quota;
    if (
      ![used, limit, remaining].every(
        (value) => Number.isSafeInteger(value) && Number(value) >= 0
      ) ||
      Number(used) + Number(remaining) !== limit
    )
      return fail("PREFLIGHT_FAILURE");
    return {
      observedAt: new Date().toISOString(),
      used: Number(used),
      limit: Number(limit),
      remaining: Number(remaining)
    };
  }
  async preflight(config: SemanticCoreSubjectConfiguration): Promise<SemanticCoreProviderMetadata> {
    validateSemanticCoreSubjectConfiguration(config);
    const catalog = object(JSON.parse(await this.request("/models")));
    if (!Array.isArray(catalog.data)) return fail("PROVIDER_METADATA_MISMATCH");
    const model = catalog.data.find((m: Record<string, unknown>) => m.id === config.modelId);
    if (!model || !safeId(model.canonical_slug)) return fail("PROVIDER_METADATA_MISMATCH");
    const modelPrices = object(model.pricing);
    if (
      !Object.hasOwn(modelPrices, "prompt") ||
      !Object.hasOwn(modelPrices, "completion") ||
      Object.values(modelPrices).some(
        (price) => typeof price !== "string" || !/^0(?:\.0+)?$/.test(price)
      )
    )
      return fail("ZERO_COST_POLICY_FAILURE");
    const data = object(
      object(JSON.parse(await this.request(`/models/${config.modelId}/endpoints`))).data
    );
    if (!Array.isArray(data.endpoints)) return fail("PROVIDER_METADATA_MISMATCH");
    const routes = data.endpoints.filter((e: Record<string, unknown>) => e.tag === config.route);
    if (routes.length !== 1) return fail("PROVIDER_METADATA_MISMATCH");
    const endpoint = object(routes[0]);
    if (
      !Array.isArray(endpoint.supported_parameters) ||
      endpoint.supported_parameters.some((p) => typeof p !== "string")
    )
      return fail("PROVIDER_METADATA_MISMATCH");
    const metadata: SemanticCoreProviderMetadata = {
      modelId: String(endpoint.model_id),
      canonicalSlug: model.canonical_slug,
      providerName: String(endpoint.provider_name),
      route: String(endpoint.tag),
      status: Number(endpoint.status),
      pricing: Object.fromEntries(
        Object.entries(object(endpoint.pricing)).filter(([key]) => key !== "discount")
      ) as Record<string, string>,
      supportedParameters: [...endpoint.supported_parameters].sort()
    };
    assertSemanticCoreFreeRoute(metadata, config);
    return metadata;
  }
  async observe(
    input: SemanticCoreInput,
    config: SemanticCoreSubjectConfiguration,
    context: { readonly promptDigest: string }
  ): Promise<SemanticCoreSubjectObservation> {
    if (semanticCoreDigest(serializeSemanticCorePrompt(input)) !== context.promptDigest)
      return fail("IDENTITY_SUBSTITUTION");
    return parseSemanticCoreProviderResponse(
      await this.request("/chat/completions", semanticCoreWireRequest(input, config)),
      config,
      input
    );
  }
}
