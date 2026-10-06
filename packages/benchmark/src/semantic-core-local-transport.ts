import { semanticCoreDigest } from "./semantic-core-openrouter.js";
import { sanitizeTransportError } from "./semantic-core-transport-diagnostic.js";
import {
  SEMANTIC_CORE_LOCAL_REQUEST_CONDITION as condition,
  semanticCoreLocalWireRequest,
  parseSemanticCoreLocalContent,
  replaySemanticCoreLocalContent
} from "./semantic-core-local-response.js";

const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
async function body(response: Response, maximum: number) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("BODY_UNAVAILABLE");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.byteLength;
    if (size > maximum) {
      await reader.cancel();
      throw new Error("BODY_LIMIT_EXCEEDED");
    }
    chunks.push(next.value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
export class SemanticCoreLocalTransport {
  constructor(
    private readonly credential: () => string | undefined = () => process.env.OPENROUTER_API_KEY,
    private readonly http: typeof fetch = fetch
  ) {}
  async request(
    path:
      | "/key"
      | "/models"
      | "/providers"
      | "/models/apodex/apodex-1.1-mini:free/endpoints"
      | "/chat/completions",
    wire?: ReturnType<typeof semanticCoreLocalWireRequest>,
    stage?: (stage: string) => void
  ) {
    const key = this.credential();
    if (!key) throw new Error("CREDENTIAL_UNAVAILABLE");
    let status: number | null = null;
    try {
      if (wire) stage?.("GENERATION_POST_SUBMITTED");
      const response = await this.http("https://openrouter.ai/api/v1" + path, {
        method: wire ? "POST" : "GET",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        ...(wire ? { body: JSON.stringify(wire) } : {}),
        redirect: "error",
        signal: AbortSignal.timeout(120000)
      });
      status = response.status;
      stage?.("GENERATION_RESPONSE_HEADERS_RECEIVED");
      const raw = await body(response, response.ok && path === "/models" ? 2097152 : 65536);
      stage?.("GENERATION_RESPONSE_BODY_RECEIVED");
      if (!response.ok)
        return {
          httpStatus: response.status,
          error: sanitizeTransportError(response.status, raw),
          data: null
        };
      const data = object(JSON.parse(raw));
      stage?.("GENERATION_RESPONSE_PARSED");
      return { httpStatus: response.status, error: null, data };
    } catch {
      return {
        httpStatus: status,
        error:
          status === null
            ? { classification: "TRANSPORT_FAILURE" }
            : sanitizeTransportError(status, ""),
        data: null
      };
    }
  }
  async capacity() {
    const response = await this.request("/key");
    if (response.error || !response.data) throw new Error("CAPACITY_PREFLIGHT_FAILURE");
    const quota = object(object(response.data.data).free_model_daily_requests);
    if (
      ![quota.used, quota.limit, quota.remaining].every(
        (v) => Number.isSafeInteger(v) && Number(v) >= 0
      ) ||
      Number(quota.used) + Number(quota.remaining) !== quota.limit
    )
      throw new Error("CAPACITY_PREFLIGHT_FAILURE");
    return {
      observedAt: new Date().toISOString(),
      used: Number(quota.used),
      limit: Number(quota.limit),
      remaining: Number(quota.remaining)
    };
  }
  async preflight() {
    const catalog = await this.request("/models");
    const routes = await this.request("/models/apodex/apodex-1.1-mini:free/endpoints");
    const providers = await this.request("/providers");
    if (catalog.error || routes.error || providers.error)
      throw new Error("METADATA_PREFLIGHT_FAILURE");
    const models = catalog.data?.data;
    const endpoints = object(routes.data?.data).endpoints;
    const providerList = providers.data?.data;
    const model = object(
      Array.isArray(models) ? models.find((m) => object(m).id === condition.model) : null
    );
    const endpoint = object(
      Array.isArray(endpoints) && endpoints.length === 1 ? endpoints[0] : null
    );
    const zeroPrices = (value: unknown) => {
      const prices = object(value);
      return (
        Object.hasOwn(prices, "prompt") &&
        Object.hasOwn(prices, "completion") &&
        Object.entries(prices)
          .filter(([key]) => key !== "discount")
          .every(([, price]) => typeof price === "string" && /^0(?:\.0+)?$/.test(price))
      );
    };
    const parameters = endpoint.supported_parameters;
    if (
      model.id !== condition.model ||
      model.canonical_slug !== condition.canonicalSlug ||
      endpoint.model_id !== condition.model ||
      endpoint.tag !== condition.discoveryEndpointTag ||
      endpoint.provider_name !== condition.providerName ||
      endpoint.status !== 0 ||
      !zeroPrices(model.pricing) ||
      !zeroPrices(endpoint.pricing) ||
      !Array.isArray(parameters) ||
      !["temperature", "max_tokens"].every((p) => parameters.includes(p)) ||
      !Number.isSafeInteger(endpoint.max_completion_tokens) ||
      Number(endpoint.max_completion_tokens) < condition.maxTokens ||
      !Array.isArray(providerList) ||
      !providerList.some((p) => object(p).name === "Novita" && object(p).slug === "novita")
    )
      throw new Error("SELECTED_FREE_ROUTE_CHANGED");
    return {
      modelId: model.id,
      canonicalSlug: model.canonical_slug,
      providerName: endpoint.provider_name,
      discoveryEndpointTag: endpoint.tag,
      providerRoutingSelector: "novita",
      pricing: Object.fromEntries(
        Object.entries(object(endpoint.pricing)).filter(([key]) => key !== "discount")
      ),
      supportedParameters: parameters
        .filter((p) => typeof p === "string" && /^[a-z_]{1,80}$/.test(p))
        .sort(),
      maxCompletionTokens: Number(endpoint.max_completion_tokens),
      status: 0
    };
  }
}
export async function runSemanticCoreCanaryD(transport = new SemanticCoreLocalTransport()) {
  const stages = ["PRE_GENERATION_METADATA"];
  const base = {
    kind: "D",
    purpose: "ENGINEERING_CONTENT_TRANSPORT_ONLY",
    scientificAuthority: "NONE",
    bmMaturityAuthority: "NONE",
    eligibleForQualification: false,
    condition
  };
  try {
    const quotaBefore = await transport.capacity();
    const metadata = await transport.preflight();
    if (quotaBefore.remaining < 1) throw new Error("INSUFFICIENT_FREE_REQUEST_CAPACITY");
    const wire = semanticCoreLocalWireRequest();
    const wireRequestDigest = semanticCoreDigest(wire);
    stages.push("GENERATION_REQUEST_PREPARED");
    const observed = await transport.request("/chat/completions", wire, (stage) =>
      stages.push(stage)
    );
    if (observed.error || !observed.data)
      return {
        ...base,
        stages,
        metadata,
        quotaBefore,
        quotaAfter: await transport.capacity().catch(() => null),
        wireRequestDigest,
        httpStatus: observed.httpStatus,
        error: observed.error,
        success: false,
        replayExact: false,
        state: "PROVIDER_OR_TRANSPORT_ERROR"
      };
    const data = observed.data;
    const choices = data.choices;
    const choice = object(Array.isArray(choices) && choices.length === 1 ? choices[0] : null);
    const message = object(choice.message);
    const usage = object(data.usage);
    const embedded =
      Object.hasOwn(data, "error") ||
      Object.hasOwn(choice, "error") ||
      choice.finish_reason === "error";
    const identityAccepted =
      (data.model === condition.model || data.model === condition.canonicalSlug) &&
      data.provider === condition.providerName;
    const usageAccepted =
      usage.cost === 0 &&
      [usage.prompt_tokens, usage.completion_tokens].every(
        (v) => Number.isSafeInteger(v) && Number(v) >= 0
      );
    // Only message.content enters the bounded capture. reasoning/reasoning_details are discarded.
    const local = parseSemanticCoreLocalContent(message.content);
    let replayExact = false;
    if (local.replayAvailable) {
      replaySemanticCoreLocalContent(local);
      replayExact = true;
    }
    const success =
      observed.httpStatus === 200 &&
      !embedded &&
      identityAccepted &&
      usageAccepted &&
      local.state === "RESPONSE" &&
      replayExact;
    const quotaAfter = await transport.capacity().catch(() => null);
    return {
      ...base,
      stages,
      metadata,
      quotaBefore,
      quotaAfter,
      wireRequestDigest,
      httpStatus: observed.httpStatus,
      modelAccepted: identityAccepted,
      providerAccepted: data.provider === condition.providerName,
      returnedModel:
        data.model === condition.model || data.model === condition.canonicalSlug
          ? String(data.model)
          : null,
      returnedProvider: data.provider === condition.providerName ? condition.providerName : null,
      usage: usageAccepted
        ? {
            promptTokens: Number(usage.prompt_tokens),
            completionTokens: Number(usage.completion_tokens),
            cost: 0
          }
        : null,
      embeddedProviderError: embedded,
      error: embedded
        ? sanitizeTransportError(
            observed.httpStatus,
            JSON.stringify({ error: data.error ?? choice.error })
          )
        : null,
      finishReason: ["stop", "length", "error", "content_filter"].includes(
        String(choice.finish_reason)
      )
        ? String(choice.finish_reason)
        : null,
      contentEvidence: local,
      replayExact,
      success,
      state: embedded ? "PROVIDER_OR_TRANSPORT_ERROR" : local.state
    };
  } catch {
    return {
      ...base,
      stages,
      success: false,
      replayExact: false,
      state: "PREFLIGHT_OR_TRANSPORT_ERROR"
    };
  }
}
