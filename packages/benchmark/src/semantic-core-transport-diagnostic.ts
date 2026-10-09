import {
  semanticCoreDigest,
  semanticCoreWireRequest,
  SemanticCoreOpenRouterSubject
} from "./semantic-core-openrouter.js";
import {
  SEMANTIC_CORE_SELECTED_SUBJECT,
  SEMANTIC_CORE_SELECTED_CANONICAL_SLUG
} from "./semantic-core-quota-window.js";
import { validateSemanticCoreResponse } from "./semantic-core.js";

/** Prospective engineering protocol. Never an S04 observation or a qualification capture. */
export const SEMANTIC_CORE_TRANSPORT_PROTOCOL = {
  protocolId: "semantic_core_pilot_bm3_qualification",
  protocolVersion: "0.1.2",
  serializerVersion: "0.1.2",
  runs: 3,
  casesPerRun: 24,
  scheduledAttempts: 72,
  retryPolicy: "NONE",
  collectionPolicy: "MULTI_QUOTA_WINDOW_SAME_SUBJECT_CONDITION",
  minimumFreeRequestsPerRun: 24,
  runAtomicity: "COMPLETE_RUN_PER_QUOTA_WINDOW",
  collectionWindowMaximumHours: 168,
  minimumRequestIntervalMs: 3500,
  isolation: "FRESH_REQUEST_PER_CASE",
  parserPolicy: "JSON_PARSE_ONLY_NO_REPAIR",
  scientificAuthority: "NONE",
  bmMaturityAuthority: "NONE",
  empiricalConditionGate: "SUCCESSFUL_TRANSPORT_CANARY_REQUIRED"
} as const;
export const TRANSPORT_STAGES = [
  "PRE_GENERATION_METADATA",
  "GENERATION_REQUEST_PREPARED",
  "GENERATION_POST_SUBMITTED",
  "GENERATION_RESPONSE_HEADERS_RECEIVED",
  "GENERATION_RESPONSE_BODY_RECEIVED",
  "GENERATION_RESPONSE_PARSED"
] as const;
type Stage = (typeof TRANSPORT_STAGES)[number];
type Rejection =
  | "OPENROUTER_REQUEST_VALIDATION_REJECTION"
  | "OPENROUTER_ROUTING_REJECTION"
  | "UPSTREAM_PROVIDER_REJECTION"
  | "RATE_LIMIT_REJECTION"
  | "AUTHENTICATION_REJECTION"
  | "STRUCTURED_OUTPUT_REJECTION"
  | "UNKNOWN_PROVIDER_REJECTION";
const strings = [
  "authentication",
  "invalid_request",
  "invalid_prompt",
  "not_found",
  "provider_overloaded",
  "provider_unavailable",
  "payment_required",
  "unmapped",
  "timeout",
  "server",
  "rate_limit_exceeded",
  "invalid_request_error",
  "authentication_error",
  "invalid_api_key",
  "provider_error",
  "invalid_json_schema",
  "invalid_schema",
  "no_available_providers"
];
function record(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
export function sanitizeTransportError(status: number, raw: string) {
  let error: Record<string, unknown> = {};
  let parsed = false;
  try {
    const root = record(JSON.parse(raw));
    error = record(root.error);
    parsed = Object.keys(error).length > 0;
  } catch {
    /* Never retain unparsed bodies. */
  }
  const metadata = record(error.metadata);
  let upstreamError: Record<string, unknown> = {};
  if (typeof metadata.raw === "string" && metadata.raw.length <= 65536) {
    try {
      const payload = record(JSON.parse(metadata.raw));
      upstreamError = record(payload.error);
    } catch {
      /* Arbitrary upstream payloads never leave this function. */
    }
  }
  const upstreamType = strings.includes(String(upstreamError.type))
    ? String(upstreamError.type)
    : null;
  const parameter = ["response_format", "max_tokens", "temperature", "provider", "model"].includes(
    String(upstreamError.param)
  )
    ? String(upstreamError.param)
    : null;
  const code =
    Number.isInteger(error.code) && Number(error.code) >= 100 && Number(error.code) <= 599
      ? Number(error.code)
      : strings.includes(String(error.code))
        ? String(error.code)
        : null;
  const type = strings.includes(String(error.type ?? metadata.error_type))
    ? String(error.type ?? metadata.error_type)
    : null;
  const upstreamProvider = metadata.provider_name === "Novita" ? "Novita" : null;
  const providerCode =
    Number.isInteger(metadata.provider_code) &&
    Number(metadata.provider_code) >= 100 &&
    Number(metadata.provider_code) <= 599
      ? Number(metadata.provider_code)
      : null;
  // Messages are inspected only to recognize fixed diagnostic categories; never serialized.
  const message = [error.message, upstreamError.message]
    .filter((v) => typeof v === "string")
    .map((v) => String(v).slice(0, 4096))
    .join("\n");
  const reason = /no endpoints found/i.test(message)
    ? "NO_ELIGIBLE_ENDPOINTS"
    : /json_schema/i.test(message) &&
        /not supported|unsupported|not allowed|only.*(?:json_object|text)|does not support/i.test(
          message
        )
      ? "JSON_SCHEMA_UNSUPPORTED"
      : /response_format/i.test(message) &&
          /not supported|unsupported|not allowed|does not support/i.test(message)
        ? "RESPONSE_FORMAT_UNSUPPORTED"
        : /invalid (?:json )?schema/i.test(message)
          ? "INVALID_SCHEMA"
          : "UNSPECIFIED";
  let classification: Rejection = "UNKNOWN_PROVIDER_REJECTION";
  if (status === 429 || code === 429 || type === "rate_limit_exceeded")
    classification = "RATE_LIMIT_REJECTION";
  else if (upstreamProvider) classification = "UPSTREAM_PROVIDER_REJECTION";
  else if (status === 401 || code === 401 || type === "authentication")
    classification = "AUTHENTICATION_REJECTION";
  else if (
    [code, type].includes("invalid_json_schema") ||
    [code, type].includes("invalid_schema") ||
    reason === "INVALID_SCHEMA"
  )
    classification = "STRUCTURED_OUTPUT_REJECTION";
  else if (reason === "NO_ELIGIBLE_ENDPOINTS" || [code, type].includes("no_available_providers"))
    classification = "OPENROUTER_ROUTING_REJECTION";
  // A generic 400 / invalid_request code does not prove which layer rejected it.
  // Keep UNKNOWN unless returned evidence identifies routing, schema or upstream origin.
  const safe = {
    httpStatus: status,
    bodyState: parsed ? "BOUNDED_ERROR_FIELDS_PARSED" : "ERROR_BODY_UNAVAILABLE_OR_UNPARSED",
    code,
    type,
    upstreamProvider,
    providerCode,
    upstreamType,
    parameter,
    reason,
    classification
  };
  return { ...safe, sanitizedErrorDigest: semanticCoreDigest(safe) };
}
async function boundedBody(response: Response, maximum = 65536): Promise<string | undefined> {
  const reader = response.body?.getReader();
  if (!reader) return undefined;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > maximum) {
        await reader.cancel();
        return undefined;
      }
      chunks.push(next.value);
    }
    return Buffer.concat(chunks).toString("utf8");
  } catch {
    return undefined;
  }
}
export function buildTransportCanary(kind: "A" | "B" | "C", routingSelector: string) {
  if (routingSelector !== "novita") throw new Error("UNCONFIRMED_ROUTING_SELECTOR");
  const input = {
    schemaVersion: "0.1.0" as const,
    caseId: "transport_canary_synthetic",
    dimensionId: "meaning_context" as const,
    target: "synthetic_transport_only",
    eligibleResponseStates: ["ANSWER", "ABSTAIN"] as const,
    prompt:
      "Synthetic engineering check: select the offered token; return only the requested JSON.",
    context: "Synthetic engineering input; no benchmark case or oracle.",
    options: [{ optionId: "canary_token", text: "canary token" }]
  };
  const body = semanticCoreWireRequest(input, SEMANTIC_CORE_SELECTED_SUBJECT);
  body.provider = {
    only: [routingSelector],
    order: [routingSelector],
    allow_fallbacks: false,
    require_parameters: true,
    max_price: { prompt: 0, completion: 0 }
  };
  body.max_tokens = kind === "A" ? 16 : 128;
  if (kind === "A") {
    delete body.response_format;
    body.messages = [
      {
        role: "user",
        content: "Synthetic transport check. Return OK only. Do not provide reasoning."
      }
    ];
  }
  if (kind === "B") {
    body.messages = [
      {
        role: "user",
        content:
          "Synthetic transport check. Return the JSON object with token equal to OK. Do not provide reasoning."
      }
    ];
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: "transport_canary",
        strict: true,
        schema: {
          type: "object",
          properties: { token: { type: "string", enum: ["OK"] } },
          required: ["token"],
          additionalProperties: false
        }
      }
    };
  }
  return body;
}
export interface TransportAudit {
  stages: Stage[];
  wireRequestDigest?: string;
  requestSummary?: {
    model: unknown;
    routingSelector: string;
    allowFallbacks: false;
    responseFormat: string;
    maxTokens: unknown;
    parameterNames: string[];
  };
  result?:
    | ReturnType<typeof sanitizeTransportError>
    | {
        httpStatus: number;
        success: boolean;
        returnedModel: string | null;
        returnedProvider: string | null;
        usage: { promptTokens: number; completionTokens: number; cost: number } | null;
        outputState: "EMPTY" | "PRESENT" | "UNAVAILABLE";
        outputContractSatisfied: boolean;
        finishReason: string | null;
        reasoningTokens: number | null;
      };
  failure?: string;
}
/** All arbitrary HTTP bodies and credentials remain inside this transport boundary. */
export async function runTransportCanary(
  kind: "A" | "B" | "C",
  credential: () => string | undefined = () => process.env.OPENROUTER_API_KEY,
  http: typeof fetch = fetch
) {
  const audit: TransportAudit = { stages: ["PRE_GENERATION_METADATA"] };
  const metadataHttp: typeof fetch = async (url, init) => {
    const response = await http(url, init);
    if (!response.ok)
      audit.result = sanitizeTransportError(
        response.status,
        (await boundedBody(response.clone())) ?? ""
      );
    return response;
  };
  const subject = new SemanticCoreOpenRouterSubject(credential, metadataHttp);
  try {
    const quotaBefore = await subject.capacity();
    const metadata = await subject.preflight(SEMANTIC_CORE_SELECTED_SUBJECT);
    if (
      metadata.canonicalSlug !== SEMANTIC_CORE_SELECTED_CANONICAL_SLUG ||
      quotaBefore.remaining < 1
    )
      throw new Error("PREFLIGHT_FAILURE");
    // Explicit provider API slug. A base slug is permitted only while the selected model
    // has exactly ONE endpoint, with the expected tag/provider and zero pricing.
    const providersResponse = await metadataHttp("https://openrouter.ai/api/v1/providers", {
      redirect: "error",
      signal: AbortSignal.timeout(60000)
    });
    const endpointsResponse = await metadataHttp(
      `https://openrouter.ai/api/v1/models/${metadata.modelId}/endpoints`,
      { redirect: "error", signal: AbortSignal.timeout(60000) }
    );
    if (!providersResponse.ok || !endpointsResponse.ok) throw new Error("PREFLIGHT_FAILURE");
    const providers = record(JSON.parse((await boundedBody(providersResponse, 2097152)) ?? "{}"));
    const endpoints = record(
      record(JSON.parse((await boundedBody(endpointsResponse)) ?? "{}")).data
    ).endpoints;
    if (
      !Array.isArray(providers.data) ||
      !providers.data.some((p) => record(p).name === "Novita" && record(p).slug === "novita") ||
      !Array.isArray(endpoints) ||
      endpoints.length !== 1 ||
      record(endpoints[0]).tag !== metadata.route ||
      record(endpoints[0]).provider_name !== metadata.providerName
    )
      throw new Error("PREFLIGHT_FAILURE");
    const routing = {
      discoveryEndpointTag: metadata.route,
      providerRoutingSelector: "novita",
      policy: "DOCUMENTED_BASE_SLUG_SINGLE_ELIGIBLE_ENDPOINT_ONLY"
    };
    const body = buildTransportCanary(kind, routing.providerRoutingSelector);
    audit.wireRequestDigest = semanticCoreDigest(body);
    audit.requestSummary = {
      model: body.model,
      routingSelector: "novita",
      allowFallbacks: false,
      responseFormat: kind === "A" ? "NONE" : "json_schema",
      maxTokens: body.max_tokens,
      parameterNames: Object.keys(body).sort()
    };
    audit.stages.push("GENERATION_REQUEST_PREPARED");
    const key = credential();
    if (!key) throw new Error("CREDENTIAL_UNAVAILABLE");
    // Submitted means fetch invoked; successful headers supply independent server-response evidence.
    audit.stages.push("GENERATION_POST_SUBMITTED");
    const response = await http("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(60000)
    });
    audit.stages.push("GENERATION_RESPONSE_HEADERS_RECEIVED");
    const raw = await boundedBody(response);
    if (raw !== undefined) audit.stages.push("GENERATION_RESPONSE_BODY_RECEIVED");
    let success = false;
    if (!response.ok) {
      audit.result = sanitizeTransportError(response.status, raw ?? "");
      if (audit.result.bodyState === "BOUNDED_ERROR_FIELDS_PARSED")
        audit.stages.push("GENERATION_RESPONSE_PARSED");
    } else {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = record(JSON.parse(raw ?? ""));
        audit.stages.push("GENERATION_RESPONSE_PARSED");
      } catch {
        /* No raw body retained. */
      }
      const returnedModel =
        parsed.model === metadata.modelId || parsed.model === metadata.canonicalSlug
          ? String(parsed.model)
          : null;
      const returnedProvider = parsed.provider === "Novita" ? "Novita" : null;
      const usage = record(parsed.usage);
      const safeUsage =
        usage.cost === 0 &&
        Number.isSafeInteger(usage.prompt_tokens) &&
        Number(usage.prompt_tokens) >= 0 &&
        Number.isSafeInteger(usage.completion_tokens) &&
        Number(usage.completion_tokens) >= 0
          ? {
              promptTokens: Number(usage.prompt_tokens),
              completionTokens: Number(usage.completion_tokens),
              cost: 0
            }
          : null;
      const choices = parsed.choices;
      const choice = Array.isArray(choices) && choices.length === 1 ? record(choices[0]) : {};
      const content =
        Array.isArray(choices) && choices.length === 1
          ? record(record(choices[0]).message).content
          : null;
      let validContent = kind === "A" && typeof content === "string" && content.trim() === "OK";
      if (typeof content === "string" && content.length <= 4096 && kind !== "A") {
        try {
          const output: unknown = JSON.parse(content);
          validContent =
            kind === "B"
              ? Object.keys(record(output)).length === 1 && record(output).token === "OK"
              : validateSemanticCoreResponse(output) &&
                output.caseId === "transport_canary_synthetic" &&
                (output.status === "ABSTAIN" || output.selectedOptionId === "canary_token");
        } catch {
          /* Exact parse only, never repair. */
        }
      }
      const hasError =
        Object.hasOwn(parsed, "error") ||
        Object.hasOwn(choice, "error") ||
        choice.finish_reason === "error";
      success = Boolean(
        returnedModel &&
        returnedProvider &&
        safeUsage &&
        !hasError &&
        Array.isArray(choices) &&
        choices.length === 1 &&
        (kind === "A" || validContent)
      );
      const reasoning = record(usage.completion_tokens_details).reasoning_tokens;
      audit.result = {
        httpStatus: response.status,
        success,
        returnedModel,
        returnedProvider,
        usage: safeUsage,
        outputState:
          content === "" || content === null
            ? "EMPTY"
            : typeof content === "string"
              ? "PRESENT"
              : "UNAVAILABLE",
        outputContractSatisfied: validContent,
        finishReason: ["stop", "length", "error", "content_filter", "tool_calls"].includes(
          String(choice.finish_reason)
        )
          ? String(choice.finish_reason)
          : null,
        reasoningTokens:
          Number.isSafeInteger(reasoning) && Number(reasoning) >= 0 ? Number(reasoning) : null
      };
      if (hasError)
        audit.result = sanitizeTransportError(
          response.status,
          JSON.stringify({ error: parsed.error ?? choice.error })
        );
    }
    const quotaAfter = await subject.capacity().catch(() => null);
    return {
      kind,
      purpose: "ENGINEERING_TRANSPORT_ONLY",
      scientificAuthority: "NONE",
      bmMaturityAuthority: "NONE",
      eligibleForQualification: false,
      metadata,
      routing,
      quotaBefore,
      quotaAfter,
      audit,
      success
    };
  } catch {
    audit.failure = "PREFLIGHT_OR_TRANSPORT_FAILURE";
    return {
      kind,
      purpose: "ENGINEERING_TRANSPORT_ONLY",
      scientificAuthority: "NONE",
      bmMaturityAuthority: "NONE",
      eligibleForQualification: false,
      audit,
      success: false
    };
  }
}
